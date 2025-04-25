from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import os
import json
from kafka import KafkaProducer

# Kafka configuration
KAFKA_BROKER = "kafka:9092"
KAFKA_TOPIC = "folder-monitor"

# Folder to monitor
MONITOR_DIR = "/opt/airflow/monitor"
LAST_RUN_FILE = "/tmp/airflow_last_run.txt"



def check_new_files():
    """
    Check for new files in the folder since the last DAG run and send metadata to Kafka.
    """
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BROKER,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )

    # Get the list of files in the directory
    files = set(os.listdir(MONITOR_DIR))

     # Read previous file state
    if os.path.exists(LAST_RUN_FILE):
        with open(LAST_RUN_FILE, "r") as f:
            previous_files = set(f.read().splitlines())
    else:
        previous_files = set()

    # Identify new files
    new_files = files - previous_files

    # Log and send new files to Kafka
    for file in new_files:
        file_path = os.path.join(MONITOR_DIR, file)
        metadata = {
            "file_name": file,
            "file_path": file_path,
            "windows_path": file_path.replace("/mnt/c", "C:"),
            "file_size": os.path.getsize(file_path),  # File size in bytes
            "created_at": datetime.fromtimestamp(os.path.getctime(file_path)).isoformat(),
            "modified_at": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
        }
        print(f"📂 New file detected: {metadata}")

        # Send to Kafka
        producer.send(KAFKA_TOPIC, value=metadata)

         # Save the current file state for the next run
    with open(LAST_RUN_FILE, "w") as f:
        f.write("\n".join(files))

default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "start_date": datetime(2024, 4, 2),
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

dag = DAG(
    "folder_monitor",
    default_args=default_args,
    schedule_interval="* * * * *",  # Runs every minute
    catchup=False,
)

task = PythonOperator(
    task_id="check_new_files",
    python_callable=check_new_files,
    dag=dag,
)