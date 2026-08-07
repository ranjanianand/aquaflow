-- MWTS ingest schema, part 2 of 2 — plain PostgreSQL storage and aggregates.
--
-- Run AFTER 001_schema.sql, INSTEAD of 002_timescaledb.sql, when the server
-- has no TimescaleDB extension. Railway's stock Postgres is one such case.
--
-- What is lost against the TimescaleDB version:
--   * compression        7x measured on real data (34 MB -> 4.7 MB)
--   * automatic refresh  the aggregates below must be refreshed by the caller
--   * chunk pruning      partition pruning does the same job, coarser
--
-- What is kept: identical table definitions, identical queries. Nothing in
-- the API or the pipeline changes.

-- ════════════════════════════════════════════════════════════════════════
-- PARTITIONING
-- ════════════════════════════════════════════════════════════════════════
-- Postgres cannot convert a populated table to a partitioned one in place, so
-- `readings` is rebuilt. Safe here because part 2 runs before any data is
-- loaded; if it ever runs against a populated database it will refuse rather
-- than silently drop rows.

DO $$
DECLARE n bigint;
BEGIN
    SELECT count(*) INTO n FROM readings;
    IF n > 0 THEN
        RAISE EXCEPTION
            'readings already holds % rows — partitioning it here would drop '
            'them. Dump, run this on an empty database, then reload.', n;
    END IF;
END $$;

DROP TABLE IF EXISTS readings CASCADE;

CREATE TABLE readings (
    ts           timestamptz      NOT NULL,
    value        double precision,
    raw_count    integer,
    quality      smallint,
    sensor_id    text             NOT NULL REFERENCES sensors,
    status       text             NOT NULL
        CHECK (status IN ('normal', 'warning', 'critical')),
    source_file  text             NOT NULL,
    ingested_at  timestamptz      NOT NULL DEFAULT now(),
    PRIMARY KEY (sensor_id, ts)
) PARTITION BY RANGE (ts);

CREATE INDEX readings_ts_sensor ON readings (ts DESC, sensor_id);

-- A DEFAULT partition catches anything outside the months created below.
-- Without it an insert for an unexpected date fails outright — and a gateway
-- with a wrong clock is a data quality problem, not a reason to reject the
-- whole file.
CREATE TABLE readings_default PARTITION OF readings DEFAULT;

-- Monthly partitions either side of today. Extend with add_month_partition()
-- from a scheduled job; rows outside the range still land in DEFAULT, so a
-- missed run degrades performance rather than losing data.
CREATE OR REPLACE FUNCTION add_month_partition(target date)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    from_ts date := date_trunc('month', target)::date;
    to_ts   date := (date_trunc('month', target) + INTERVAL '1 month')::date;
    name    text := format('readings_%s', to_char(from_ts, 'YYYY_MM'));
BEGIN
    IF to_regclass(name) IS NOT NULL THEN
        RETURN;
    END IF;
    EXECUTE format(
        'CREATE TABLE %I PARTITION OF readings FOR VALUES FROM (%L) TO (%L)',
        name, from_ts, to_ts);
END $$;

DO $$
DECLARE m int;
BEGIN
    FOR m IN -14 .. 3 LOOP
        PERFORM add_month_partition((now() + make_interval(months => m))::date);
    END LOOP;
END $$;

-- Rejections are far sparser; one table is fine.
CREATE INDEX IF NOT EXISTS rejected_ts_idx ON rejected_readings (ts DESC);

-- ════════════════════════════════════════════════════════════════════════
-- AGGREGATES
-- ════════════════════════════════════════════════════════════════════════
-- Plain materialized views. The unique index on each is what allows
-- REFRESH ... CONCURRENTLY, which matters because a plain REFRESH takes an
-- ACCESS EXCLUSIVE lock and the dashboard reads these on every page load.
--
-- Refreshed by ingest.py after a load, not on a timer: there is no point
-- recomputing when nothing new has arrived.

CREATE MATERIALIZED VIEW IF NOT EXISTS readings_hourly AS
SELECT sensor_id,
       date_trunc('hour', ts) AS bucket,
       avg(value) AS avg_value,
       min(value) AS min_value,
       max(value) AS max_value,
       count(*)   AS n,
       count(*) FILTER (WHERE status = 'critical') AS n_critical,
       count(*) FILTER (WHERE status = 'warning')  AS n_warning
FROM readings
GROUP BY sensor_id, date_trunc('hour', ts);

CREATE UNIQUE INDEX IF NOT EXISTS readings_hourly_pk
    ON readings_hourly (sensor_id, bucket);

CREATE MATERIALIZED VIEW IF NOT EXISTS readings_daily AS
SELECT sensor_id,
       date_trunc('day', ts) AS bucket,
       avg(value) AS avg_value,
       min(value) AS min_value,
       max(value) AS max_value,
       count(*)   AS n
FROM readings
GROUP BY sensor_id, date_trunc('day', ts);

CREATE UNIQUE INDEX IF NOT EXISTS readings_daily_pk
    ON readings_daily (sensor_id, bucket);

-- Called by the pipeline after each load. CONCURRENTLY so readers are never
-- blocked; it needs the unique indexes above.
CREATE OR REPLACE FUNCTION refresh_aggregates()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY readings_hourly;
    REFRESH MATERIALIZED VIEW CONCURRENTLY readings_daily;
EXCEPTION WHEN OTHERS THEN
    -- CONCURRENTLY fails on a view that has never been populated. Fall back
    -- once so the very first ingest does not error.
    REFRESH MATERIALIZED VIEW readings_hourly;
    REFRESH MATERIALIZED VIEW readings_daily;
END $$;

-- No compression and no retention policy. Both are TimescaleDB features.
-- Expect roughly 320 bytes per reading here against 44 compressed — about
-- 28 GB per year for ten plants rather than 4 GB. Size the disk for that, or
-- use the TimescaleDB image.
