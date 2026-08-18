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

# Supabase signs project JWTs with this. Without it the API cannot verify
# anything, and starting up in that state would mean serving every request
# unauthenticated — so it refuses instead. See check_configured().
JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")
JWT_AUDIENCE = os.environ.get("SUPABASE_JWT_AUDIENCE", "authenticated")

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
    if not JWT_SECRET:
        raise RuntimeError(
            "SUPABASE_JWT_SECRET is not set. Set it, or set DEV_NO_AUTH=1 for "
            "local development only.")


def _decode(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(
            token, JWT_SECRET, algorithms=["HS256"], audience=JWT_AUDIENCE,
            # Defaults, stated so that turning one off is a visible decision.
            options={"require": ["exp", "sub"], "verify_exp": True,
                     "verify_signature": True},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "session expired")
    except jwt.InvalidTokenError:
        # Deliberately not saying which part failed. A caller probing the API
        # learns nothing from "bad signature" versus "wrong audience".
        raise HTTPException(401, "not authenticated")


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
        raise HTTPException(401, "not authenticated")

    claims = _decode(creds.credentials)
    auth_id = str(claims.get("sub") or "")
    email = str(claims.get("email") or "")
    if not auth_id:
        raise HTTPException(401, "not authenticated")

    if _lookup is None:                       # pragma: no cover - wiring error
        raise HTTPException(500, "user lookup is not configured")

    row = _lookup(auth_id, email)
    if row is None:
        # Authenticated by Supabase but unknown here. That is a real state —
        # somebody signed up and no administrator has granted them anything.
        raise HTTPException(403, "this account has not been granted access")
    if row["status"] != "active":
        raise HTTPException(403, "this account is not active")

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
