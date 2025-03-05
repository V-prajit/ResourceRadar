#!/bin/bash

# Start test systems using docker-compose
echo "Starting test environment with 10 systems..."
cd "$(dirname "$0")"
docker-compose -f docker-compose-test.yml up -d

# Wait for systems to start up
echo "Waiting for systems to start up..."
sleep 10

# Define the ResourceRadar backend URL
BACKEND_URL="http://localhost:3001"

# Function to add a system to ResourceRadar
add_system() {
    local name=$1
    local host=$2
    local port=$3
    local username=$4
    local password=$5

    echo "Adding system: $name"
    
    curl -X POST \
        -H "Content-Type: application/json" \
        -d "{\"Name\":\"$name\",\"Host\":\"$host\",\"Port\":\"$port\",\"Username\":\"$username\",\"Password\":\"$password\"}" \
        $BACKEND_URL/sshverify
}

# Add each test system to ResourceRadar
add_system "test-system-1" "localhost" "2201" "root" "password"
add_system "test-system-2" "localhost" "2202" "root" "password"
add_system "test-system-3" "localhost" "2203" "root" "password"
add_system "test-system-4" "localhost" "2204" "root" "password"
add_system "test-system-5" "localhost" "2205" "root" "password"
add_system "test-system-6" "localhost" "2206" "root" "password"
add_system "test-system-7" "localhost" "2207" "root" "password"
add_system "test-system-8" "localhost" "2208" "root" "password"
add_system "test-system-9" "localhost" "2209" "root" "password"
add_system "test-system-10" "localhost" "2210" "root" "password"

echo "All test systems have been added to ResourceRadar."
echo "Open http://localhost:3000 to view the dashboard."