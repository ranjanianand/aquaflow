"""Who is calling, and what they are allowed to see.

Credentials are Supabase's problem. This module answers three questions the
application does have to answer:

  * Is this token real?      — signature, expiry, audience
  * Who does it belong to?   — an app_users row, with a role
  * What may they see?       — a plant scope, enforced in the queries

The scope matters more than the role. A role stops somebody pressing a button;
a scope stops them reading data that is not theirs, and that is the failure
that actually leaks. So `plant_filter` returns SQL rather than a boolean —
every query that touches plant data takes it, and a query that forgets is a
query that returns nothing rather than everything.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any, Callable

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Supabase signs project tokens one of two ways, and which one is not a
# choice we make:
#
#   ES256 with an asymmetric key, verified against the public keys the project
#   publishes at /.well-known/jwks.json. This is what new projects do, and the
#   token carries a `kid` naming the key.
#
#   HS256 with a shared secret, for older projects and for local development
#   where there is no identity provider at all.
#
# Both are accepted. The token's own header decides, so a project that rotates
# to asymmetric keys keeps working without a code change — which is exactly the
# migration that broke this the first time.
JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
JWT_AUDIENCE = os.environ.get("SUPABASE_JWT_AUDIENCE", "authenticated")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")

#: Public keys, fetched once and cached. PyJWKClient handles the caching and
#: refetches when it meets a `kid` it does not know, which is what makes key
#: rotation a non-event.
_jwks: "jwt.PyJWKClient | None" = None


def _jwks_client() -> "jwt.PyJWKClient":
    global _jwks
    if _jwks is None:
        if not SUPABASE_URL:
            raise HTTPException(500, "SUPABASE_URL is not set")
        _jwks = jwt.PyJWKClient(
            SUPABASE_URL + "/auth/v1/.well-known/jwks.json", cache_keys=True)
    return _jwks

# Set only for local development against a stack with no identity provider.
# Never true in a deployed environment: it makes every request an administrator.
DEV_NO_AUTH = os.environ.get("DEV_NO_AUTH", "").lower() in ("1", "true", "yes")

_bearer = HTTPBearer(auto_error=False)

# Ordered weakest to strongest. A check is "at least this role".
ROLES = ("viewer", "operator", "manager", "admin")


@dataclass(frozen=True)
class Principal:
    """The caller, resolved."""
    user_id: str
    auth_id: str
    email: str
    name: str
    role: str
    #: Empty means every plant — a fleet role rather than a site one.
    plant_codes: tuple[str, ...] = field(default=())

    def at_least(self, role: str) -> bool:
        return ROLES.index(self.role) >= ROLES.index(role)

    @property
    def all_plants(self) -> bool:
        return not self.plant_codes


def check_configured() -> None:
    """Refuse to run unauthenticated by accident.

    Called at import time by the app. A missing secret in a deployed
    environment is not a warning — it is an API that would answer everyone.
    """
    if DEV_NO_AUTH:
        return
    # Either route is enough: a project URL gives public keys, a shared secret
    # gives HS256. With neither, every token would be unverifiable and the API
    # would answer nobody — or, worse, be tempted to answer everybody.
    if not JWT_SECRET and not SUPABASE_URL:
        raise RuntimeError(
            "Set SUPABASE_URL (asymmetric keys) or SUPABASE_JWT_SECRET "
            "(shared secret), or DEV_NO_AUTH=1 for local development only.")


def _decode(token: str) -> dict[str, Any]:
    # Defaults, stated so that turning one off is a visible decision.
    opts = {"require": ["exp", "sub"], "verify_exp": True,
            "verify_signature": True}
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "")

        # "none" is an algorithm a token can ask for. Refusing it explicitly
        # rather than relying on the library's default: this is the oldest
        # trick against a JWT verifier and the failure is total.
        if alg not in ("HS256", "ES256"):
            raise jwt.InvalidTokenError("unsupported algorithm")

        if alg == "ES256":
            key = _jwks_client().get_signing_key_from_jwt(token).key
            return jwt.decode(token, key, algorithms=["ES256"],
                              audience=JWT_AUDIENCE, options=opts)

        if not JWT_SECRET:
            raise jwt.InvalidTokenError("no shared secret configured")
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"],
                          audience=JWT_AUDIENCE, options=opts)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Your session has expired. Sign in again.")
    except jwt.InvalidTokenError:
        # Deliberately not saying which part failed. A caller probing the API
        # learns nothing from "bad signature" versus "wrong audience".
        raise HTTPException(401, "Not authenticated")


#: Injected by main.py so this module does not import the database layer and
#: create a cycle.
_lookup: Callable[[str, str], dict[str, Any] | None] | None = None


def set_user_lookup(fn: Callable[[str, str], dict[str, Any] | None]) -> None:
    global _lookup
    _lookup = fn


DEV_PRINCIPAL = Principal(
    user_id="dev", auth_id="dev", email="dev@localhost",
    name="Local Development", role="admin", plant_codes=(),
)


def current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Principal:
    """Resolve the caller, or refuse."""
    if DEV_NO_AUTH:
        return DEV_PRINCIPAL

    if creds is None or not creds.credentials:
        raise HTTPException(401, "Not authenticated")

    claims = _decode(creds.credentials)
    auth_id = str(claims.get("sub") or "")
    email = str(claims.get("email") or "")
    if not auth_id:
        raise HTTPException(401, "Not authenticated")

    if _lookup is None:                       # pragma: no cover - wiring error
        raise HTTPException(500, "user lookup is not configured")

    row = _lookup(auth_id, email)
    if row is None:
        # Authenticated by Supabase but unknown here. That is a real state —
        # somebody signed up and no administrator has granted them anything.
        raise HTTPException(403, "This account has not been granted access yet")
    if row["status"] != "active":
        raise HTTPException(403, "This account is not active")

    return Principal(
        user_id=str(row["user_id"]),
        auth_id=auth_id,
        email=row["email"],
        name=row["name"],
        role=row["role"],
        plant_codes=tuple(row["plant_codes"] or ()),
    )


def requires(role: str) -> Callable[..., Principal]:
    """Dependency factory: at least this role.

    Separate from authentication so the failure is honest — 401 means "we do
    not know who you are", 403 means "we do and you may not".
    """
    if role not in ROLES:                     # pragma: no cover - wiring error
        raise ValueError(f"unknown role {role!r}")

    def guard(user: Principal = Depends(current_user)) -> Principal:
        if not user.at_least(role):
            raise HTTPException(
                403, f"this action needs the {role} role or higher")
        return user

    return guard


def plant_filter(user: Principal, column: str = "s.plant_code") -> tuple[str, list]:
    """A WHERE fragment restricting a query to the caller's plants.

    Returns SQL and its parameters, rather than a list the caller might forget
    to apply. A fleet user gets a fragment that is always true, so every call
    site looks identical and there is no branch to get wrong.
    """
    if user.all_plants:
        return "TRUE", []
    return f"{column} = ANY(%s)", [list(user.plant_codes)]


def visible(user: Principal, plant_code: str | None) -> bool:
    """Whether the caller may see this plant. For single-row endpoints."""
    if user.all_plants:
        return True
    return plant_code in user.plant_codes
