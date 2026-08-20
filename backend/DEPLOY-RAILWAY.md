# Deploying to Railway

Three services in one Railway project. Order matters — the API needs the
database, and the frontend needs the API's URL **at build time**.

```
Postgres  ──▶  API (FastAPI)  ──▶  Dashboard (Next.js)
```

---

## 1. Database

Railway's stock Postgres has **no TimescaleDB**. Pick one:

**With TimescaleDB** — keeps compression (7× measured) and the continuous
aggregates. In Railway: **New → Docker Image**

```
timescale/timescaledb:latest-pg17
```

Set variables:

| Variable | Value |
|---|---|
| `POSTGRES_PASSWORD` | generate a new one — do not reuse a local password |
| `POSTGRES_DB` | `MWTS` |
| `POSTGRES_USER` | `postgres` |

Add a **volume** mounted at `/var/lib/postgresql/data`, or the database is
wiped on every redeploy.

**Without TimescaleDB** — Railway's Postgres plugin. `setup_db.py` detects the
missing extension and applies `002_plain_postgres.sql` instead. Expect ~320
bytes per reading rather than 44, so about 28 GB per year for ten plants
against 4 GB.

---

## 2. API

**New → GitHub Repo**, root directory `pipeline/`. It builds from
`pipeline/Dockerfile`.

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` — Railway resolves the reference |
| `CORS_ORIGINS` | the dashboard's public URL, set after step 3 |

`PORT` is injected by Railway; the Dockerfile already honours it.

Health check is `/health`, already configured in `railway.json`.

### Load the data

The API image includes `setup_db.py` and `ingest.py`. From the Railway shell,
or locally against the public database URL:

```bash
export DATABASE_URL='<the Postgres public URL>'
python setup_db.py ../Raw_data_PLC/register-map/tag-map.json
python ingest.py ../Raw_data_PLC/timeseries
```

Roughly five minutes for 2,160 files. Safe to re-run: files already loaded are
skipped, and a second run inserts nothing.

Confirm before moving on:

```bash
curl https://<api>.up.railway.app/health
# {"ok":true,"readings":111970}
```

---

## 3. Dashboard

**New → GitHub Repo**, root directory `git/aquaflow/`.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<api>.up.railway.app` |

**Set this before the first build.** Next.js inlines `NEXT_PUBLIC_*` into the
JavaScript bundle at build time — setting it afterwards changes nothing,
because the browser still calls whatever was compiled in. The Dockerfile fails
the build if it is missing rather than shipping a page that cannot reach its
API.

Changing it later requires a **rebuild**, not a restart.

Then go back to the API service and set `CORS_ORIGINS` to the dashboard's URL.
Without it every request is blocked by the browser and the dashboard shows
"Cannot reach the readings API" while the API itself looks healthy.

---

## Order of operations

1. Database up, volume attached
2. API deployed, `DATABASE_URL` set
3. Data loaded, `/health` returns 111,970
4. Dashboard deployed with `NEXT_PUBLIC_API_URL`
5. `CORS_ORIGINS` set on the API → redeploy the API

---

## Before this is public

**The API has no authentication.** Every endpoint is an unauthenticated read of
the whole database. That is acceptable on localhost and not acceptable on a
public URL. Options, cheapest first:

- Railway private networking, so only the dashboard can reach the API — but
  the dashboard's fetches run in the **browser**, so this needs the calls
  proxied through a Next.js route handler first
- A shared API key checked by middleware
- Real auth tied to the existing login

**The database password.** Generate a new one in Railway. Do not carry over a
local password that has been pasted into a chat, a terminal, or a config file.

---

## Things that will look like other problems

| Symptom | Cause |
|---|---|
| Container starts, health check fails, no requests arrive | Bound to a fixed port instead of `$PORT` |
| Dashboard loads, every panel says "Cannot reach the readings API" | `NEXT_PUBLIC_API_URL` set after the build, or `CORS_ORIGINS` unset |
| Data vanishes after a redeploy | No volume on the database service |
| Charts empty but sensors listed | Aggregates not refreshed — `ingest.py` does this automatically now |
| Every sensor reads "offline" | Correct. The data ends 2026-08-03; `commStatus` is judged against wall-clock time |

That last one is not a bug. The dashboard reports data age honestly, and the
loaded readings are historical.
