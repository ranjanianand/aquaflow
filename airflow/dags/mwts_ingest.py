"""Ingest raw gateway files into the readings database.

Runs the same code as `python ingest.py` — this DAG schedules and monitors it,
it does not reimplement it. Two copies of the cleaning rules would drift, and
the one that drifted would be the one nobody was testing.

Why Airflow rather than cron, now that there is something to schedule:

  * a failed run is visible, with logs, rather than silent in a mail spool
  * a missed window can be backfilled over an explicit date range
  * the reconciliation check can fail the task, so a run that quietly dropped
    rows shows red instead of green

The pipeline is idempotent — files already in processed_files are skipped — so
retries, catchup and a manually cleared task are all safe.
"""
from __future__ import annotations

import pendulum
from airflow.sdk import dag, task

# Mounted into the Airflow containers by docker-compose.
PIPELINE = "/opt/mwts/pipeline"
DATA = "/opt/mwts/data"
TAG_MAP = f"{DATA}/register-map/tag-map.json"


@dag(
    dag_id="mwts_ingest",
    # Hourly, matching the plants' publishing rate. Nothing new arrives between
    # runs, so a shorter schedule only adds load.
    schedule="@hourly",
    start_date=pendulum.datetime(2026, 8, 1, tz="UTC"),
    # Off deliberately. Turning it on against a start_date months back queues
    # hundreds of runs at once; backfill on purpose instead:
    #   airflow dags backfill mwts_ingest -s 2026-05-06 -e 2026-08-03
    catchup=False,
    # One run at a time. Two ingests racing over the same files both succeed
    # thanks to ON CONFLICT, but they contend on the same rows for no gain.
    max_active_runs=1,
    default_args={"retries": 2, "retry_delay": pendulum.duration(minutes=5)},
    tags=["mwts", "ingest"],
    doc_md=__doc__,
)
def mwts_ingest():

    @task
    def check_database() -> dict:
        """Fail fast if the schema is missing.

        Without this the ingest task fails deep inside a loop with a psycopg
        error, and the log has to be read to learn that setup_db.py was never
        run against this database.
        """
        import os
        import psycopg

        with psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=10) as c, \
                c.cursor() as cur:
            cur.execute("""
                SELECT count(*) FROM information_schema.tables
                 WHERE table_schema = 'public'
                   AND table_name IN ('readings','sensors','tag_map','processed_files')
            """)
            found = cur.fetchone()[0]
            if found < 4:
                raise RuntimeError(
                    f"schema incomplete ({found}/4 core tables). "
                    f"Run: python setup_db.py {TAG_MAP}")
            cur.execute("SELECT count(*) FROM sensors")
            sensors = cur.fetchone()[0]
            cur.execute("SELECT count(*) FROM readings")
            readings = cur.fetchone()[0]

        if sensors == 0:
            raise RuntimeError("no sensors — the register map has not been seeded")
        return {"sensors": sensors, "readings_before": readings}

    @task
    def ingest(before: dict) -> dict:
        """Load any new files. Returns the run's own counters."""
        import subprocess
        import sys

        result = subprocess.run(
            [sys.executable, f"{PIPELINE}/ingest.py", f"{DATA}/timeseries", TAG_MAP],
            capture_output=True, text=True, cwd=PIPELINE,
        )
        print(result.stdout)
        if result.stderr:
            print("--- stderr ---")
            print(result.stderr)
        if result.returncode != 0:
            raise RuntimeError(f"ingest exited {result.returncode}")
        return before

    @task
    def verify(before: dict) -> None:
        """Fail the run when reconciliation did not pass.

        Readings parsed minus readings loaded must equal the sum of logged
        drop reasons. When it does not, the pipeline lost rows somewhere it
        does not know about — the one failure no other check catches, and the
        reason this task exists rather than trusting a zero exit code.
        """
        import os
        import psycopg

        with psycopg.connect(os.environ["DATABASE_URL"]) as c, c.cursor() as cur:
            cur.execute("""
                SELECT readings_in, readings_out, reconciled, files_seen,
                       files_skipped, error
                  FROM ingest_runs
                 WHERE finished_at IS NOT NULL
                 ORDER BY finished_at DESC LIMIT 1
            """)
            row = cur.fetchone()
            cur.execute("SELECT count(*) FROM readings")
            after = cur.fetchone()[0]

        if row is None:
            raise RuntimeError("no completed ingest run recorded")

        r_in, r_out, reconciled, seen, skipped, error = row
        print(f"files seen {seen}, already loaded {skipped}")
        print(f"parsed {r_in}, loaded {r_out}")
        print(f"readings total {before['readings_before']:,} -> {after:,}")

        if error:
            raise RuntimeError(f"ingest recorded an error: {error}")

        # None means every file was already loaded, so nothing was checked.
        # That is a valid no-op, not a failure.
        if reconciled is False:
            raise RuntimeError(
                f"reconciliation failed: parsed {r_in}, loaded {r_out}, "
                "and the difference is not accounted for by logged drops")

        if skipped == seen:
            print("nothing new to load")

    verify(ingest(check_database()))


mwts_ingest()
