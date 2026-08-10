-- Tags are not all analogue.
--
-- The pipeline was built assuming every value is a 4-20 mA reading scaled from
-- counts. A real PLC carries three kinds of number and they cannot share one
-- conversion:
--
--   analog   4-20 mA, 5530-27648 -> engineering units. What we had.
--   digital  a bit. Pump running, valve open, fault present. 0 or 1, and
--            scaling it produces a number that means nothing.
--   counter  a lifetime total that only increases — kWh, run hours, start
--            counts. Exceeds 65535 within days, so span scaling breaks
--            outright. The useful figure is the DIFFERENCE between two
--            readings, not the reading.
--
-- Without this column a pump-run bit becomes 4.7 pH and an energy totaliser
-- becomes garbage, and both look like plausible numbers.

ALTER TABLE tag_map
    ADD COLUMN IF NOT EXISTS data_type text NOT NULL DEFAULT 'analog'
        CHECK (data_type IN ('analog', 'digital', 'counter'));

ALTER TABLE sensors
    ADD COLUMN IF NOT EXISTS data_type text NOT NULL DEFAULT 'analog'
        CHECK (data_type IN ('analog', 'digital', 'counter'));

COMMENT ON COLUMN tag_map.data_type IS
    'analog | digital | counter. Ask the plant for this alongside the span — '
    'an integrator supplying a register map will know it, and getting it wrong '
    'is silent.';

-- Consumption from a counter.
--
-- A kWh meter reports a lifetime total. Energy used in an hour is the
-- difference between consecutive readings, which is a query rather than
-- something to store: keeping the raw total means a missed poll costs nothing,
-- and the difference is still correct across the gap.
--
-- The GREATEST(0, ...) guard handles rollover and meter replacement. A 32-bit
-- counter wraps at 4,294,967,295; treating that as a huge negative would
-- otherwise show a plant generating power.
CREATE OR REPLACE VIEW counter_deltas AS
SELECT sensor_id,
       ts,
       value                                             AS total,
       GREATEST(0, value - lag(value) OVER w)            AS delta,
       ts - lag(ts) OVER w                               AS interval
FROM readings r
WHERE EXISTS (SELECT 1 FROM sensors s
               WHERE s.sensor_id = r.sensor_id AND s.data_type = 'counter')
WINDOW w AS (PARTITION BY sensor_id ORDER BY ts);

-- The original CHECK constraints assumed every tag was analogue.
--
--   CHECK (span_high > span_low)
--   CHECK (count_high > count_low)
--
-- Both are true of a 4-20 mA input and meaningless otherwise: a digital has no
-- span, and a counter is never scaled. Left as they were, the map cannot hold
-- an energy meter at all.
ALTER TABLE tag_map DROP CONSTRAINT IF EXISTS tag_map_check;
ALTER TABLE tag_map DROP CONSTRAINT IF EXISTS tag_map_check1;

ALTER TABLE tag_map ADD CONSTRAINT tag_map_analog_span
    CHECK (data_type <> 'analog' OR span_high > span_low);
ALTER TABLE tag_map ADD CONSTRAINT tag_map_analog_counts
    CHECK (data_type <> 'analog' OR count_high > count_low);
