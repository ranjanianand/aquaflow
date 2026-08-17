-- Manual readings.
--
-- Not everything a plant measures comes from an instrument. Lab samples — COD,
-- BOD, coliforms, jar tests — are taken by hand, often daily, and until now
-- there was nowhere to record them. They sit alongside sensor readings in the
-- same table deliberately: a trend chart should show them together, and an
-- alarm limit applies whether a number came from a probe or a technician.
--
-- What must never be lost is which is which.

-- Where a reading came from. Existing rows are all automatic, which is true.
ALTER TABLE readings
    ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'file'
        CHECK (source IN ('file', 'manual'));

-- Who entered it, and when they entered it — distinct from when the sample was
-- taken. A technician recording Tuesday's result on Thursday is normal, and
-- both timestamps matter: ts orders the trend, entered_at explains the delay.
ALTER TABLE readings ADD COLUMN IF NOT EXISTS entered_by text;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS entered_at timestamptz;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS note text;

-- A manual reading has an author; an automatic one has a file. Neither should
-- ever be missing its own provenance.
ALTER TABLE readings DROP CONSTRAINT IF EXISTS readings_provenance;
ALTER TABLE readings ADD CONSTRAINT readings_provenance CHECK (
    (source = 'file'   AND source_file IS NOT NULL) OR
    (source = 'manual' AND entered_by  IS NOT NULL)
);

-- source_file cannot be NOT NULL any more: a hand-entered reading has no file.
ALTER TABLE readings ALTER COLUMN source_file DROP NOT NULL;

CREATE INDEX IF NOT EXISTS readings_manual
    ON readings (ts DESC) WHERE source = 'manual';

-- ── Sensors that only ever receive manual entry ──────────────────────────
-- A lab parameter has no tag, no gateway and no instrument span. It is still a
-- sensor as far as the rest of the system is concerned — it has a plant, a
-- parameter, a unit and a stage, which is everything a chart or an alarm needs.
ALTER TABLE sensors
    ADD COLUMN IF NOT EXISTS manual_entry boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN sensors.manual_entry IS
    'True for lab parameters and hand-read meters. These never appear in a '
    'gateway file, so a missing reading is a missed sample rather than a '
    'communications fault — commStatus must not mark them offline.';
