# Airflow with the pipeline's own dependencies available to the DAG.
#
# The DAG shells out to ingest.py rather than importing it, so the scheduler
# needs psycopg — but not the API's web stack.
FROM apache/airflow:3.0.3-python3.12

COPY requirements.txt /tmp/airflow-req.txt
RUN pip install --no-cache-dir -r /tmp/airflow-req.txt
