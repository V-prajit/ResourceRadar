#!/bin/bash

# Check if Kafka is ready by attempting to list topics
check_kafka() {
  kafka-topics --bootstrap-server kafka:29092 --list > /dev/null 2>&1
  return $?
}

# Wait for Kafka to be ready
echo "Waiting for Kafka..."
RETRIES=30

# Initial check for Kafka
until check_kafka || [ $RETRIES -eq 0 ]; do
  # Only print status every 5 attempts to reduce noise
  if [ $((RETRIES % 5)) -eq 0 ]; then
    echo "Waiting for Kafka... (will continue application startup anyway)"
  fi
  RETRIES=$((RETRIES-1))
  sleep 5
done

if [ $RETRIES -eq 0 ]; then
  echo "Kafka not available, continuing without it. Will connect when available."
else
  echo "✅ Kafka connected successfully"
  
  # Create topics if needed
  for TOPIC in "cpu-metrics" "memory-metrics"
  do
    if ! kafka-topics --bootstrap-server kafka:29092 --list 2>/dev/null | grep -q "^$TOPIC$"; then
      echo "Creating Kafka topic: $TOPIC"
      kafka-topics --bootstrap-server kafka:29092 --create --topic $TOPIC \
        --partitions 1 --replication-factor 1 --if-not-exists > /dev/null
    fi
  done
fi

# Execute the command passed to this script
exec "$@"