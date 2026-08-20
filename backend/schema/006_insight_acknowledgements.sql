-- Acknowledgements of insights.
--
-- Append-only. A record of who acknowledged what and when is only worth having
-- if it cannot be quietly rewritten, so an acknowledgement is inserted rather
-- than updated and the current state is the most recent row per insight. That
-- also keeps the history when the same insight is acknowledged again on a later
-- shift, which is the case an operator actually asks about: "who saw this, and
-- when did they see it".
--
-- Deliberately not a general audit table. `ingest_runs` already records what
-- the pipeline did; this records what a person did, and conflating the two
-- would make both harder to read.

CREATE TABLE IF NOT EXISTS insight_acknowledgements (
    ack_id          bigserial   PRIMARY KEY,
    -- Whatever identifies the insight to the screen that raised it. Today
    -- those ids come from a fixture; when insights are generated from
    -- readings the ids change and old rows become history, not corruption.
    insight_id      text        NOT NULL,
    acknowledged_by text        NOT NULL,
    acknowledged_at timestamptz NOT NULL DEFAULT now(),
    note            text,

    CONSTRAINT insight_ack_by_not_blank CHECK (btrim(acknowledged_by) <> ''),
    CONSTRAINT insight_ack_id_not_blank CHECK (btrim(insight_id) <> '')
);

-- The read is always "latest per insight", so order the index that way.
CREATE INDEX IF NOT EXISTS insight_ack_latest
    ON insight_acknowledgements (insight_id, acknowledged_at DESC);
