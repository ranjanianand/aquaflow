-- MWTS ingest schema, part 1 of 2 — tables, indexes and views.
--
-- Storage-engine agnostic: runs on stock PostgreSQL 14+ with no extensions.
-- Part 2 chooses how `readings` is stored and how aggregates are maintained:
--   002_timescaledb.sql      hypertable, compression, continuous aggregates
--   002_plain_postgres.sql   native monthly partitioning, materialized views
-- Run exactly one of them. Nothing in this file changes either way.
--
-- Three principles the layout enforces:
--   1. Every reading traces back to the object it came from.
--   2. The register map is versioned, so correcting a span does not silently
--      rewrite the meaning of history.
--   3. (sensor_id, ts) is the primary key, which makes re-ingest idempotent
--      for free via ON CONFLICT DO NOTHING.

-- ════════════════════════════════════════════════════════════════════════
-- REFERENCE — small, slow-changing, human-maintained
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS plants (
    plant_code   text PRIMARY KEY,             -- 'WTP-01'
    name         text        NOT NULL,         -- 'Chennai WTP-01'
    region       text,
    tenant_id    uuid        NOT NULL DEFAULT gen_random_uuid(),
    poll_seconds integer     NOT NULL DEFAULT 3600,  -- drives staleness + gap detection
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gateways (
    gateway_id  text PRIMARY KEY,              -- 'GW-4472-P01', the `gw` field
    plant_code  text NOT NULL REFERENCES plants,
    model       text,
    -- Count range is a property of the PLC/gateway, not of the parameter.
    -- Siemens 5530-27648; Allen-Bradley 6242-31208; raw 15-bit 0-32767.
    count_low   integer NOT NULL DEFAULT 5530,
    count_high  integer NOT NULL DEFAULT 27648,
    -- 'DA' -> 192 good / 64 uncertain / 0 bad.  'UA' -> 0 is GOOD (inverted).
    quality_family text NOT NULL DEFAULT 'DA'
        CHECK (quality_family IN ('DA', 'UA', 'NONE')),
    sends_scaled boolean NOT NULL DEFAULT false
);
COMMENT ON COLUMN gateways.count_low IS
    'Confirm with the plant. A wrong count range makes every value silently wrong.';

CREATE TABLE IF NOT EXISTS sensors (
    sensor_id   text PRIMARY KEY,
    plant_code  text NOT NULL REFERENCES plants,
    tag         text NOT NULL,                 -- 'TUR-1003', the `t` field
    parameter   text NOT NULL,
    unit        text NOT NULL,
    location    text NOT NULL,                 -- 'Sand Filter 1'
    stage       text NOT NULL
        CHECK (stage IN ('raw', 'treatment', 'filtered', 'final')),
    -- Instrumentation metadata. Not in any payload; ask the plant.
    -- Without last_calibrated, a step change in the data is unexplainable.
    make_model      text,
    installed_on    date,
    last_calibrated date,
    damping_seconds integer,
    redundant_tag   text,
    UNIQUE (plant_code, tag)
);

-- ── The register map, versioned ─────────────────────────────────────────
-- Type-2 slowly changing dimension. A recalibration or corrected span opens a
-- new row; readings join to the version valid at THEIR timestamp. Without
-- this, fixing one span rewrites the meaning of all history and yesterday's
-- screenshots stop matching the database with no record of why.
CREATE TABLE IF NOT EXISTS tag_map (
    tag         text        NOT NULL,
    plant_code  text        NOT NULL REFERENCES plants,
    sensor_id   text        NOT NULL REFERENCES sensors,
    span_low    double precision NOT NULL,
    span_high   double precision NOT NULL,
    count_low   integer     NOT NULL,
    count_high  integer     NOT NULL,
    valid_from  timestamptz NOT NULL DEFAULT '-infinity',
    valid_to    timestamptz,                   -- NULL = current version
    source      text,                          -- who supplied it, and when
    PRIMARY KEY (tag, plant_code, valid_from),
    CHECK (span_high > span_low),
    CHECK (count_high > count_low)
);
CREATE INDEX IF NOT EXISTS tag_map_current
    ON tag_map (plant_code, tag) WHERE valid_to IS NULL;

-- ── Alarm bands, resolved by stage ──────────────────────────────────────
-- A limit belongs to the sensor's stage, not the parameter. Turbidity of
-- 12.8 NTU is normal at an intake and a failure after a filter.
CREATE TABLE IF NOT EXISTS threshold_bands (
    parameter text NOT NULL,
    stage     text NOT NULL,
    warn_min  double precision NOT NULL,
    warn_max  double precision NOT NULL,
    crit_min  double precision NOT NULL,
    crit_max  double precision NOT NULL,
    source    text,                            -- which standard, which reviewer
    PRIMARY KEY (parameter, stage),
    CHECK (crit_min <= warn_min AND crit_max >= warn_max)
);

-- ════════════════════════════════════════════════════════════════════════
-- FACTS
-- ════════════════════════════════════════════════════════════════════════

-- Column order is deliberate: fixed-width first. Postgres pads for alignment,
-- and at 95 million rows the wrong order costs gigabytes.
--
-- Left as a plain table here. Part 2 turns it into a hypertable or a
-- partitioned table — both require (sensor_id, ts) to include the time column,
-- which the primary key already satisfies.
CREATE TABLE IF NOT EXISTS readings (
    ts           timestamptz      NOT NULL,
    value        double precision,
    raw_count    integer,                      -- keep it: settles disputes
    quality      smallint,                     -- NULL = gateway sent none
    sensor_id    text             NOT NULL REFERENCES sensors,
    status       text             NOT NULL
        CHECK (status IN ('normal', 'warning', 'critical')),
    source_file  text             NOT NULL,
    ingested_at  timestamptz      NOT NULL DEFAULT now(),
    PRIMARY KEY (sensor_id, ts)
);

COMMENT ON COLUMN readings.raw_count IS
    'The integer the gateway sent. Four bytes, and the difference between '
    '"we can prove what arrived" and "we think our conversion was right".';
COMMENT ON COLUMN readings.ingested_at IS
    'When we learned it. Distinct from ts (when it happened) — buffered replay '
    'after an outage makes these differ by days.';

-- Cross-sensor queries at one moment. The PK covers one-sensor-over-time.
CREATE INDEX IF NOT EXISTS readings_ts_sensor ON readings (ts DESC, sensor_id);

-- Readings we would not store. Not an error log — a data quality record, and
-- a rising bad_quality rate here is a failing instrument.
CREATE TABLE IF NOT EXISTS rejected_readings (
    ts          timestamptz NOT NULL,
    tag         text        NOT NULL,
    plant_code  text,
    raw_value   double precision,
    quality     smallint,
    reason      text        NOT NULL
        CHECK (reason IN ('unmapped_tag', 'bad_quality', 'uncertain_quality',
                          'sentinel', 'out_of_span', 'no_quality_field',
                          'unparseable')),
    source_file text        NOT NULL
);
CREATE INDEX IF NOT EXISTS rejected_ts ON rejected_readings (ts DESC);
CREATE INDEX IF NOT EXISTS rejected_reason ON rejected_readings (reason, ts DESC);

-- ── Current value per sensor ────────────────────────────────────────────
-- DISTINCT ON over the full history scans far more than it should, and the
-- dashboard asks for this on every page load. 250 rows, updated at ingest.
CREATE TABLE IF NOT EXISTS latest_readings (
    sensor_id  text PRIMARY KEY REFERENCES sensors,
    ts         timestamptz      NOT NULL,
    value      double precision,
    status     text             NOT NULL,
    quality    smallint,
    raw_count  integer
);

-- ── Derived alarms ──────────────────────────────────────────────────────
-- One row per EVENT, not per reading. A sensor breaching for six hours is one
-- alert, not 360 — otherwise the alert list is never empty and nobody reads it.
CREATE TABLE IF NOT EXISTS alerts (
    alert_id        bigserial PRIMARY KEY,
    sensor_id       text        NOT NULL REFERENCES sensors,
    plant_code      text        NOT NULL REFERENCES plants,
    severity        text        NOT NULL CHECK (severity IN ('warning', 'critical')),
    opened_at       timestamptz NOT NULL,
    closed_at       timestamptz,               -- NULL = still active
    peak_value      double precision NOT NULL,
    limit_breached  double precision NOT NULL,
    reading_count   integer     NOT NULL DEFAULT 1,
    acknowledged_at timestamptz,
    acknowledged_by text
);
CREATE INDEX IF NOT EXISTS alerts_open
    ON alerts (plant_code, severity) WHERE closed_at IS NULL;

-- ════════════════════════════════════════════════════════════════════════
-- INGEST BOOKKEEPING
-- ════════════════════════════════════════════════════════════════════════

-- Idempotency. Checked before parsing, written in the same transaction as the
-- rows. Re-delivering a file is then a no-op rather than a duplicate.
CREATE TABLE IF NOT EXISTS processed_files (
    object_key   text PRIMARY KEY,
    etag         text,
    plant_code   text,
    gateway_id   text,
    seq          bigint,                       -- gaps here mean lost files
    readings_in  integer NOT NULL,
    readings_out integer NOT NULL,
    processed_at timestamptz NOT NULL DEFAULT now(),
    run_id       uuid
);
CREATE INDEX IF NOT EXISTS processed_files_seq ON processed_files (gateway_id, seq);

-- Reconciliation. If readings_in - readings_out != sum of rejections, the
-- pipeline lost data somewhere it does not know about. Fail the run.
CREATE TABLE IF NOT EXISTS ingest_runs (
    run_id        uuid PRIMARY KEY,
    started_at    timestamptz NOT NULL DEFAULT now(),
    finished_at   timestamptz,
    files_seen    integer NOT NULL DEFAULT 0,
    files_skipped integer NOT NULL DEFAULT 0,  -- already processed
    readings_in   integer NOT NULL DEFAULT 0,
    readings_out  integer NOT NULL DEFAULT 0,
    rejections    jsonb   NOT NULL DEFAULT '{}',
    reconciled    boolean,
    error         text
);

-- ── Completeness — the failure with no error ────────────────────────────
-- A gateway that quietly stops publishing raises nothing. Nothing fails,
-- nothing logs; the dashboard just gets old. This is how you see it.
CREATE OR REPLACE VIEW plant_completeness AS
SELECT p.plant_code,
       date_trunc('day', r.ts)          AS day,
       count(DISTINCT r.ts)             AS polls_received,
       86400 / p.poll_seconds           AS polls_expected,
       round(100.0 * count(DISTINCT r.ts) / (86400 / p.poll_seconds), 1) AS pct
FROM plants p
JOIN sensors s USING (plant_code)
JOIN readings r USING (sensor_id)
GROUP BY p.plant_code, date_trunc('day', r.ts), p.poll_seconds;

-- Current state, joined to everything the dashboard needs in one query.
CREATE OR REPLACE VIEW sensor_current AS
SELECT s.sensor_id, s.plant_code, s.tag, s.parameter, s.unit,
       s.location, s.stage,
       l.ts, l.value, l.status, l.quality, l.raw_count,
       b.warn_min, b.warn_max, b.crit_min, b.crit_max,
       EXTRACT(EPOCH FROM (now() - l.ts))::int AS age_seconds,
       p.poll_seconds
FROM sensors s
JOIN plants  p USING (plant_code)
LEFT JOIN latest_readings l USING (sensor_id)
LEFT JOIN threshold_bands b ON b.parameter = s.parameter AND b.stage = s.stage;

-- ════════════════════════════════════════════════════════════════════════
-- TENANT ISOLATION
-- ════════════════════════════════════════════════════════════════════════
-- Enforced in the data layer, not in each handler. One forgotten WHERE clause
-- is otherwise one utility reading another's operational record.
--
-- Not enabled here: superusers bypass RLS anyway, and enabling it before the
-- API exists would only hide the fact that it is untested. Enable together
-- with the API role, and test it as a release gate.
--
--   ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY readings_tenant ON readings USING (
--       sensor_id IN (SELECT s.sensor_id FROM sensors s JOIN plants p USING (plant_code)
--                     WHERE p.tenant_id = current_setting('app.tenant_id', true)::uuid));

DO $$ BEGIN
    CREATE ROLE mwts_ingest NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE ROLE mwts_api NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT INSERT, UPDATE, SELECT ON ALL TABLES IN SCHEMA public TO mwts_ingest;
GRANT SELECT                  ON ALL TABLES IN SCHEMA public TO mwts_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mwts_ingest;
