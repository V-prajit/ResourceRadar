#!/bin/bash

# Check if Kafka is ready by attempting to list topics
check_kafka() {
  echo "Checking Kafka availability..."
  kafka-topics --bootstrap-server kafka:29092 --list > /dev/null 2>&1
  return $?
}

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
RETRIES=30
until check_kafka || [ $RETRIES -eq 0 ]; do
  echo "Waiting for Kafka, $((RETRIES--)) remaining attempts..."
  sleep 5
done

if [ $RETRIES -eq 0 ]; then
  echo "Failed to connect to Kafka after multiple attempts"
  exit 1
fi

echo "Kafka is ready!"

# Create required topics if they don't exist
echo "Creating required topics if they don't exist..."
for TOPIC in "cpu-metrics" "memory-metrics"
do
  if ! kafka-topics --bootstrap-server kafka:29092 --list | grep -q "^$TOPIC$"; then
    echo "Creating topic: $TOPIC"
    kafka-topics --bootstrap-server kafka:29092 --create --topic $TOPIC \
      --partitions 1 --replication-factor 1 --if-not-exists
  else
    echo "Topic $TOPIC already exists"
  fi
done

echo "Kafka is fully configured and ready for use!"

# Execute the command passed to this script
exec "$@"