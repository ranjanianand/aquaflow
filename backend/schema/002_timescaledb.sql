-- MWTS ingest schema, part 2 of 2 — TimescaleDB storage and aggregates.
--
-- Run AFTER 001_schema.sql and BEFORE any data is loaded. create_hypertable
-- on a populated table needs migrate_data => true, which locks the table for
-- the duration.
--
-- Alternative: 002_plain_postgres.sql, for a stock Postgres image.

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ════════════════════════════════════════════════════════════════════════
-- HYPERTABLES
-- ════════════════════════════════════════════════════════════════════════

-- Chunk interval should hold a working set that fits comfortably in memory.
-- One plant at hourly polling is ~9k rows/week, so 7 days is generous; too
-- small creates planning overhead across thousands of chunks.
SELECT create_hypertable('readings', by_range('ts', INTERVAL '7 days'),
                         if_not_exists => TRUE);

-- Rejections are far sparser — a wider chunk avoids thousands of tiny ones.
SELECT create_hypertable('rejected_readings', by_range('ts', INTERVAL '30 days'),
                         if_not_exists => TRUE);

-- ════════════════════════════════════════════════════════════════════════
-- CONTINUOUS AGGREGATES — the dashboard must never scan raw readings
-- ════════════════════════════════════════════════════════════════════════
-- min/max alongside avg: an average alone hides the excursion the operator is
-- looking for. A five-minute spike vanishes into an hourly mean.

CREATE MATERIALIZED VIEW IF NOT EXISTS readings_hourly
WITH (timescaledb.continuous) AS
SELECT sensor_id,
       time_bucket(INTERVAL '1 hour', ts) AS bucket,
       avg(value) AS avg_value,
       min(value) AS min_value,
       max(value) AS max_value,
       count(*)   AS n,
       count(*) FILTER (WHERE status = 'critical') AS n_critical,
       count(*) FILTER (WHERE status = 'warning')  AS n_warning
FROM readings
GROUP BY sensor_id, bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW IF NOT EXISTS readings_daily
WITH (timescaledb.continuous) AS
SELECT sensor_id,
       time_bucket(INTERVAL '1 day', ts) AS bucket,
       avg(value) AS avg_value,
       min(value) AS min_value,
       max(value) AS max_value,
       count(*)   AS n
FROM readings
GROUP BY sensor_id, bucket
WITH NO DATA;

-- Refresh policies. start_offset must exceed the largest expected late
-- arrival: a gateway that buffers through a three-day outage and replays
-- would otherwise never have those buckets recomputed.
SELECT add_continuous_aggregate_policy('readings_hourly',
    start_offset      => INTERVAL '7 days',
    end_offset        => INTERVAL '1 hour',
    schedule_interval => INTERVAL '30 minutes',
    if_not_exists     => TRUE);

SELECT add_continuous_aggregate_policy('readings_daily',
    start_offset      => INTERVAL '30 days',
    end_offset        => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists     => TRUE);

-- ════════════════════════════════════════════════════════════════════════
-- COMPRESSION
-- ════════════════════════════════════════════════════════════════════════
-- Expect 10-20x. segmentby groups rows for the same sensor together, which is
-- also the dominant query pattern; orderby matches the index direction.

ALTER TABLE readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'sensor_id',
    timescaledb.compress_orderby   = 'ts DESC'
);

SELECT add_compression_policy('readings', INTERVAL '30 days',
                              if_not_exists => TRUE);

-- No retention policy. Only add one once the Parquet archive is verified —
-- dropping a chunk is not recoverable from the database.
--
--   SELECT add_retention_policy('readings', INTERVAL '18 months');
