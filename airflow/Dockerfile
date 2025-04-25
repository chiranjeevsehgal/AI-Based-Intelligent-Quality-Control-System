# Using the Apache Airflow 2.10.5 image as the base
FROM apache/airflow:2.10.5

# Copying the python requirements file for the DAG into the container
COPY requirements.txt .

# Creating the monitor directory if not exists
RUN mkdir -p /opt/airflow/monitor

# Installing the python dependencies specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
