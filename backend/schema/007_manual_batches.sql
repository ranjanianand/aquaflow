-- Bench sheet submissions.
--
-- A round of samples is one act: a technician draws a sample and records a
-- dozen measurements from it. Until now that act left no trace — the readings
-- landed individually and were grouped only by having identical entered_at
-- timestamps, which is a coincidence the database happened to preserve rather
-- than a fact it recorded.
--
-- Giving the submission its own row makes it addressable: it can be listed,
-- referred to in a conversation ("check submission 42"), and corrected as a
-- unit rather than reading by reading.

CREATE TABLE IF NOT EXISTS manual_batches (
    batch_id    bigserial   PRIMARY KEY,
    plant_code  text        NOT NULL REFERENCES plants(plant_code),
    -- When the sample was taken. Shared by every reading in the round, because
    -- they describe the same water.
    sample_ts   timestamptz NOT NULL,
    entered_by  text        NOT NULL,
    entered_at  timestamptz NOT NULL DEFAULT now(),
    note        text,

    CONSTRAINT manual_batch_by_not_blank CHECK (btrim(entered_by) <> '')
);

CREATE INDEX IF NOT EXISTS manual_batches_recent
    ON manual_batches (entered_at DESC);

-- Which submission a reading belongs to. Nullable: readings that arrived from
-- a gateway belong to no submission, and neither do the manual rows recorded
-- before this table existed that cannot be grouped with confidence.
--
-- No foreign key: readings is a hypertable, and a reference out of it
-- constrains chunk operations for no benefit the application needs.
ALTER TABLE readings ADD COLUMN IF NOT EXISTS batch_id bigint;

CREATE INDEX IF NOT EXISTS readings_batch
    ON readings (batch_id) WHERE batch_id IS NOT NULL;

-- ── Corrections ──────────────────────────────────────────────────────────
--
-- A mistyped lab result has to be correctable — the alternative is a wrong
-- number in a compliance record forever. But a value that can be changed with
-- no trace is worse than one that cannot be changed at all, so every edit is
-- recorded with what it was, what it became, and who decided.

CREATE TABLE IF NOT EXISTS manual_reading_edits (
    edit_id    bigserial        PRIMARY KEY,
    batch_id   bigint           NOT NULL REFERENCES manual_batches(batch_id),
    sensor_id  text             NOT NULL,
    ts         timestamptz      NOT NULL,
    old_value  double precision,
    new_value  double precision,
    edited_by  text             NOT NULL,
    edited_at  timestamptz      NOT NULL DEFAULT now(),
    reason     text,

    CONSTRAINT manual_edit_by_not_blank CHECK (btrim(edited_by) <> '')
);

CREATE INDEX IF NOT EXISTS manual_edits_batch
    ON manual_reading_edits (batch_id, edited_at DESC);

-- ── Backfill ─────────────────────────────────────────────────────────────
--
-- Readings entered before this table existed were written in one transaction
-- per round, so rows sharing an author, a sample time and an entered_at to the
-- microsecond were one submission. That is a safe grouping: two independent
-- submissions colliding on all three is not something the API could produce.

INSERT INTO manual_batches (plant_code, sample_ts, entered_by, entered_at, note)
SELECT s.plant_code, r.ts, r.entered_by, r.entered_at, min(r.note)
FROM readings r
JOIN sensors s USING (sensor_id)
WHERE r.source = 'manual' AND r.batch_id IS NULL AND r.entered_at IS NOT NULL
GROUP BY s.plant_code, r.ts, r.entered_by, r.entered_at
ON CONFLICT DO NOTHING;

UPDATE readings r
SET batch_id = b.batch_id
FROM manual_batches b
JOIN sensors s ON s.plant_code = b.plant_code
WHERE r.source = 'manual'
  AND r.batch_id IS NULL
  AND r.sensor_id = s.sensor_id
  AND r.ts = b.sample_ts
  AND r.entered_by = b.entered_by
  AND r.entered_at = b.entered_at;
