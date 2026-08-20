# -*- coding: utf-8 -*-
"""What the security layer must guarantee.

Run against a live API:

    SUPABASE_JWT_SECRET=<same value the API has> python tests/test_auth.py

Not a unit test suite. These are the properties that matter when the thing is
on the internet, checked against the running service — a mock would prove the
mock is right.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid

import jwt
import psycopg

API = os.environ.get("API", "http://localhost:8081/api")
SECRET = os.environ.get("SUPABASE_JWT_SECRET",
                        "local-dev-only-not-a-real-secret-0123456789")
DSN = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:%s@localhost:5432/MWTS" % os.environ.get("PGPASSWORD", ""))

PASS = FAIL = 0


def check(name: str, got, want) -> None:
    global PASS, FAIL
    ok = got == want
    PASS, FAIL = PASS + int(ok), FAIL + int(not ok)
    # Truncated: a leaked-sensors failure otherwise prints the whole payload,
    # which buries the twenty other results.
    detail = ""
    if not ok:
        g, w = repr(got), repr(want)
        detail = "got %s, wanted %s" % (g[:90] + ("..." if len(g) > 90 else ""),
                                        w[:60] + ("..." if len(w) > 60 else ""))
    print("  %s %-52s %s" % ("PASS" if ok else "FAIL", name, detail))


def token(auth_id: str, email: str, *, exp_in: int = 3600,
          secret: str = SECRET, aud: str = "authenticated") -> str:
    return jwt.encode(
        {"sub": auth_id, "email": email, "aud": aud,
         "exp": int(time.time()) + exp_in, "iat": int(time.time())},
        secret, algorithm="HS256")


def call(path: str, tok: str | None = None, method: str = "GET",
         body: dict | None = None) -> tuple[int, object]:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    if tok:
        req.add_header("Authorization", "Bearer " + tok)
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw or b"{}")
        except ValueError:
            return e.code, raw[:120]


# ── fixtures ─────────────────────────────────────────────────────────────
def seed(role: str, plants: list[str]) -> tuple[str, str]:
    """An app_users row with a known role and plant scope."""
    auth_id, email = str(uuid.uuid4()), "t-%s@example.test" % uuid.uuid4().hex[:8]
    with psycopg.connect(DSN, autocommit=True) as c, c.cursor() as cur:
        cur.execute("""INSERT INTO app_users
                         (auth_id, email, name, role, status, plant_codes)
                       VALUES (%s, %s, %s, %s, 'active', %s)""",
                    (auth_id, email, "Test " + role, role, plants))
    return auth_id, email


def cleanup() -> None:
    with psycopg.connect(DSN, autocommit=True) as c, c.cursor() as cur:
        cur.execute("DELETE FROM app_users WHERE email LIKE 't-%@example.test'")


READS = ["/plants", "/kpis", "/sensors", "/alerts", "/insights?days=7",
         "/manual/sensors", "/manual/batches", "/gateways", "/equipment",
         "/energy", "/knowledge", "/kpis/live"]
WRITES = [
    ("POST", "/manual/readings", {"sensorId": "x", "value": 1, "enteredBy": "t"}),
    ("POST", "/manual/readings/batch", {"enteredBy": "t", "readings": [{"sensorId": "x", "value": 1}]}),
    ("POST", "/insights/acknowledgements", {"insightId": "x", "acknowledgedBy": "t"}),
    ("PATCH", "/manual/batches/1", {"editedBy": "t", "readings": [{"sensorId": "x", "value": 1}]}),
]

print("\n1. No token reaches nothing")
for p in READS:
    check("GET %s" % p, call(p)[0], 401)
for m, p, b in WRITES:
    check("%s %s" % (m, p), call(p, None, m, b)[0], 401)
check("GET /users", call("/users")[0], 401)
check("GET /audit", call("/audit")[0], 401)
check("GET /health is open", call("/health")[0], 200)
check("GET /upload/shape is open", call("/upload/shape")[0], 200)

print("\n2. A token must be genuine")
aid, mail = seed("admin", [])
check("valid token works", call("/plants", token(aid, mail))[0], 200)
check("wrong signing key", call("/plants", token(aid, mail, secret="not-the-secret"))[0], 401)
check("expired token", call("/plants", token(aid, mail, exp_in=-60))[0], 401)
check("wrong audience", call("/plants", token(aid, mail, aud="anon"))[0], 401)
check("not a token at all", call("/plants", "garbage.garbage.garbage")[0], 401)
# Algorithm confusion: a token asking to be trusted with no signature.
none_tok = jwt.encode({"sub": aid, "email": mail, "aud": "authenticated",
                       "exp": int(time.time()) + 60}, "", algorithm="none")
check("alg=none rejected", call("/plants", none_tok)[0], 401)

print("\n3. Authenticated by Supabase is not authorised here")
check("unknown account", call("/plants", token(str(uuid.uuid4()), "nobody@example.test"))[0], 403)
with psycopg.connect(DSN, autocommit=True) as c, c.cursor() as cur:
    cur.execute("UPDATE app_users SET status='inactive' WHERE auth_id=%s", (aid,))
check("deactivated account", call("/plants", token(aid, mail))[0], 403)
with psycopg.connect(DSN, autocommit=True) as c, c.cursor() as cur:
    cur.execute("UPDATE app_users SET status='active' WHERE auth_id=%s", (aid,))

print("\n4. Roles gate the writes")
v_id, v_mail = seed("viewer", [])
o_id, o_mail = seed("operator", [])
m_id, m_mail = seed("manager", [])
viewer, operator, manager, admin = (token(v_id, v_mail), token(o_id, o_mail),
                                    token(m_id, m_mail), token(aid, mail))

check("viewer cannot record a reading",
      call("/manual/readings", viewer, "POST",
           {"sensorId": "x", "value": 1, "enteredBy": "t"})[0], 403)
check("viewer cannot upload", call("/upload/readings", viewer, "POST", {})[0], 403)
check("operator may record (404 = past the guard)",
      call("/manual/readings", operator, "POST",
           {"sensorId": "nope", "value": 1, "enteredBy": "t"})[0], 404)
check("operator cannot correct a submission",
      call("/manual/batches/1", operator, "PATCH",
           {"editedBy": "t", "readings": [{"sensorId": "x", "value": 1}]})[0], 403)
check("manager may correct (404 = past the guard)",
      call("/manual/batches/999999", manager, "PATCH",
           {"editedBy": "t", "readings": [{"sensorId": "x", "value": 1}]})[0], 404)
check("viewer may acknowledge",
      call("/insights/acknowledgements", viewer, "POST",
           {"insightId": "test:x", "acknowledgedBy": "t"})[0], 201)
check("viewer cannot list users", call("/users", viewer)[0], 403)
check("manager cannot list users", call("/users", manager)[0], 403)
check("admin can list users", call("/users", admin)[0], 200)
check("manager cannot read the audit log", call("/audit", manager)[0], 403)

print("\n5. Plant scope — the leak that matters")
chennai_id, chennai_mail = seed("operator", ["WTP-01"])
chennai = token(chennai_id, chennai_mail)
code, plants = call("/plants", chennai)
names = sorted(p["name"] for p in plants) if isinstance(plants, list) else []
check("scoped user sees one plant", len(names), 1)
check("and it is theirs", names[:1], ["Chennai WTP-01"])
code, allp = call("/plants", admin)
check("fleet user sees all six", len(allp) if isinstance(allp, list) else 0, 6)

code, sensors = call("/sensors", chennai)
foreign = ([s for s in sensors if s.get("plantId") != "plant-1"]
           if isinstance(sensors, list) else ["unreadable"])
check("no other plant's sensors leak", foreign, [])

code, alerts = call("/alerts", chennai)
foreign = ([a for a in alerts if a.get("plantId") != "plant-1"]
           if isinstance(alerts, list) else ["unreadable"])
check("no other plant's alarms leak", foreign, [])

code, ins = call("/insights?days=30", chennai)
bad = ([s for s in ins.get("sensors", []) if s.get("plantId") != "plant-1"]
       if isinstance(ins, dict) else ["unreadable"])
check("insights stay in scope", bad, [])

code, batches = call("/manual/batches", chennai)
bad = ([b for b in batches if b.get("plantId") != "plant-1"]
       if isinstance(batches, list) else ["unreadable"])
check("submissions stay in scope", bad, [])

cleanup()
print("\n%d passed, %d failed" % (PASS, FAIL))
sys.exit(1 if FAIL else 0)
