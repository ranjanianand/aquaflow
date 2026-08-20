"""Sign-up and sign-in, delegated to Supabase.

The browser never sees a Supabase key. It posts credentials here, this module
talks to Supabase, and what comes back is a JWT the rest of the API already
knows how to verify. One session path, and the identity provider stays a
deployment detail rather than something baked into the frontend bundle.

Locally there is no Supabase project, so DEV_LOGIN issues a token for any
account that exists in app_users without checking a password. That is a
development convenience and a complete authentication bypass — check_dev_login
refuses to let it run alongside a real Supabase configuration, because the one
way it becomes a disaster is somebody deploying with it still set.
"""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from typing import Any

import jwt
from fastapi import HTTPException

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")

DEV_LOGIN = os.environ.get("DEV_LOGIN", "").lower() in ("1", "true", "yes")

#: How long a locally minted token lasts. Short: it exists to exercise the
#: token path, not to be convenient.
DEV_TOKEN_TTL = 8 * 3600


def check_dev_login() -> None:
    """Refuse the one combination that would be a silent bypass in production."""
    if DEV_LOGIN and SUPABASE_URL:
        raise RuntimeError(
            "DEV_LOGIN is set alongside SUPABASE_URL. That would accept any "
            "password against a real project. Unset one.")


def configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_ANON_KEY)


def _post(path: str, body: dict[str, Any], *, key: str | None = None) -> dict:
    req = urllib.request.Request(
        SUPABASE_URL + path, data=json.dumps(body).encode(), method="POST",
        headers={"Content-Type": "application/json",
                 "apikey": key or SUPABASE_ANON_KEY,
                 "Authorization": "Bearer " + (key or SUPABASE_ANON_KEY)})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            detail = json.loads(raw or b"{}")
        except ValueError:
            detail = {}
        # Supabase distinguishes "wrong password" from "no such user". The API
        # does not pass that on: it tells an attacker which addresses are real.
        msg = detail.get("msg") or detail.get("error_description") or "sign-in failed"
        if e.code in (400, 401, 403):
            raise HTTPException(401, "Email or password is incorrect")
        raise HTTPException(502, "identity provider error: %s" % msg)
    except urllib.error.URLError as e:
        raise HTTPException(502, "Cannot reach the identity provider: %s" % e.reason)


def _dev_token(auth_id: str, email: str) -> str:
    return jwt.encode(
        {"sub": auth_id, "email": email, "aud": "authenticated",
         "iat": int(time.time()), "exp": int(time.time()) + DEV_TOKEN_TTL},
        JWT_SECRET, algorithm="HS256")


def sign_in(email: str, password: str) -> dict:
    """Exchange credentials for a token."""
    if DEV_LOGIN:
        # Caller resolves the account; a token is issued for whoever it is.
        return {"dev": True}
    if not configured():
        raise HTTPException(503, "Authentication is not configured on this server")

    data = _post("/auth/v1/token?grant_type=password",
                 {"email": email, "password": password})
    token = data.get("access_token")
    if not token:
        raise HTTPException(401, "Email or password is incorrect")
    return {"token": token,
            "auth_id": (data.get("user") or {}).get("id"),
            "expires_in": data.get("expires_in")}


def sign_up(email: str, password: str) -> dict:
    """Create an identity. Grants nothing on its own."""
    if DEV_LOGIN:
        return {"dev": True}
    if not configured():
        raise HTTPException(503, "Authentication is not configured on this server")

    data = _post("/auth/v1/signup", {"email": email, "password": password})
    user = data.get("user") or data
    auth_id = user.get("id")
    if not auth_id:
        raise HTTPException(400, "Could not create the account")
    return {"auth_id": auth_id,
            # Null when the project requires email confirmation, which is the
            # sensible setting: the account exists but cannot sign in yet.
            "token": data.get("access_token"),
            "needs_confirmation": data.get("access_token") is None}


def dev_token_for(auth_id: str, email: str) -> str:
    if not DEV_LOGIN:                     # pragma: no cover - wiring error
        raise HTTPException(500, "dev tokens are disabled")
    return _dev_token(auth_id, email)
