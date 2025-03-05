#!/bin/bash

# This script creates varying CPU and memory loads on test containers
# to make the monitoring data more interesting

# Setup color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}ResourceRadar Test Systems - Stress Test${NC}"
echo "========================================="

# Function to run a CPU load command on a container
stress_cpu() {
    local container=$1
    local duration=$2
    local intensity=${3:-1}  # default to 1 cpu worker
    
    echo -e "${YELLOW}Stressing CPU on $container for $duration seconds (intensity: $intensity)${NC}"
    docker exec $container bash -c "apt-get update -qq && apt-get install -y -qq stress-ng && stress-ng --cpu $intensity --timeout ${duration}s &" 
}

# Function to run a memory load command on a container
stress_memory() {
    local container=$1
    local size=$2  # in MB
    local duration=$3
    
    echo -e "${YELLOW}Stressing memory on $container (${size}MB) for $duration seconds${NC}"
    docker exec $container bash -c "apt-get update -qq && apt-get install -y -qq stress-ng && stress-ng --vm 1 --vm-bytes ${size}M --timeout ${duration}s &"
}

# Check if test containers are running
echo "Checking if test containers are running..."
if ! docker ps | grep resourceradar-test-1 > /dev/null; then
    echo "Test containers are not running. Please run ./run-test-environment.sh first."
    exit 1
fi

# Apply different stress levels to different containers
echo "Starting stress tests on containers..."

# Create more diverse and realistic workload patterns

# === Web Server ===
# Scenario: Web server handling multiple requests with periodic spikes
echo "Applying diverse stress patterns..."
echo "Server 1: web-prod-01 - Production web server with traffic spikes"
stress_cpu "resourceradar-test-1" 100 1 &  # moderate CPU load initially
(sleep 60 && stress_memory "resourceradar-test-1" 40 240) &  # memory usage
(sleep 120 && stress_cpu "resourceradar-test-1" 120 2) &  # CPU increases after 2 min
(sleep 240 && stress_cpu "resourceradar-test-1" 60 3) &  # CPU spike after 4 min
(sleep 300 && stress_memory "resourceradar-test-1" 80 60) &  # memory spike after 5 min

# === Database Server ===
# Scenario: PostgreSQL database with query loads
echo "Server 2: postgres-main - Database server with periodic query loads"
stress_memory "resourceradar-test-2" 60 300 &  # consistent memory usage
(sleep 90 && stress_cpu "resourceradar-test-2" 60 2) &  # CPU spike during query
(sleep 180 && stress_cpu "resourceradar-test-2" 90 3) &  # larger CPU spike
(sleep 270 && stress_memory "resourceradar-test-2" 90 120) &  # memory spike

# === Redis Cache Server ===
# Scenario: Redis instance with memory fluctuations
echo "Server 3: redis-cache-01 - Redis with memory fluctuations"
stress_cpu "resourceradar-test-3" 400 0.5 &  # low constant CPU
(sleep 60 && stress_memory "resourceradar-test-3" 70 60) &  # memory spike
(sleep 180 && stress_memory "resourceradar-test-3" 85 60) &  # another memory spike
(sleep 300 && stress_memory "resourceradar-test-3" 90 60) &  # another memory spike

# === API Backend ===
# Scenario: Backend API server under moderate load
echo "Server 4: api-backend-prod - API server handling requests"
stress_cpu "resourceradar-test-4" 240 1 &  # moderate CPU load
stress_memory "resourceradar-test-4" 30 240 &  # moderate memory
(sleep 120 && stress_cpu "resourceradar-test-4" 60 2) &  # CPU spike
(sleep 180 && stress_memory "resourceradar-test-4" 70 60) &  # memory spike

# === Payment Processing Worker ===
# Scenario: Worker processing payment batches
echo "Server 5: worker-payments - Payment processing worker"
stress_cpu "resourceradar-test-5" 60 0.5 &  # low initial CPU
(sleep 60 && stress_cpu "resourceradar-test-5" 240 3) &  # high CPU for batch job
(sleep 60 && stress_memory "resourceradar-test-5" 40 240) &  # moderate memory

# === Memcached Session Store ===
# Scenario: Session caching with fluctuating memory usage
echo "Server 6: memcached-session - Session cache server"
stress_cpu "resourceradar-test-6" 300 0.3 &  # very low CPU
stress_memory "resourceradar-test-6" 20 60 &  # low initial memory
(sleep 60 && stress_memory "resourceradar-test-6" 60 90) &  # memory increases
(sleep 150 && stress_memory "resourceradar-test-6" 40 60) &  # memory decreases
(sleep 210 && stress_memory "resourceradar-test-6" 75 90) &  # memory spikes again

# === Elasticsearch Search Server ===
# Scenario: Search indexing and lookup operations
echo "Server 7: search-elastic - Elasticsearch search server"
stress_cpu "resourceradar-test-7" 240 0.2 &  # low base CPU
(sleep 180 && stress_cpu "resourceradar-test-7" 60 1.5) &  # indexing operations
(sleep 180 && stress_memory "resourceradar-test-7" 60 120) &  # memory increase during indexing

# === Nginx Frontend ===
# Scenario: Web server handling frontend traffic
echo "Server 8: frontend-nginx - Nginx serving frontend assets"
stress_cpu "resourceradar-test-8" 60 0.8 &  # normal CPU
stress_memory "resourceradar-test-8" 20 60 &  # normal memory
(sleep 120 && stress_cpu "resourceradar-test-8" 180 2.5) &  # CPU spike during traffic surge
(sleep 150 && stress_memory "resourceradar-test-8" 70 150) &  # memory also increases

# === Kafka Message Broker ===
# Scenario: Message broker handling streams of events
echo "Server 9: kafka-broker-1 - Kafka message broker"
stress_cpu "resourceradar-test-9" 90 0.7 &  # initial moderate CPU
(sleep 90 && stress_memory "resourceradar-test-9" 80 120) &  # memory increases with messages
(sleep 180 && stress_cpu "resourceradar-test-9" 90 1.5) &  # CPU increases with processing
(sleep 270 && stress_memory "resourceradar-test-9" 90 90) &  # memory spikes with backlog

# === Data Warehouse Server ===
# Scenario: Data analytics processing with heavy ETL jobs
echo "Server 10: data-warehouse - Analytics data warehouse"
stress_cpu "resourceradar-test-10" 60 0.5 &  # starts normal
(sleep 60 && stress_memory "resourceradar-test-10" 40 60) &  # initial memory
(sleep 120 && stress_cpu "resourceradar-test-10" 300 3) &  # heavy CPU for ETL job
(sleep 150 && stress_memory "resourceradar-test-10" 95 270) &  # memory spike during analysis

echo -e "${GREEN}Stress tests started. The system metrics will fluctuate over the next few minutes.${NC}"
echo "This makes the dashboard more visually interesting for screenshots."
echo "Allow 1-2 minutes for the metrics to start showing the stress effects."