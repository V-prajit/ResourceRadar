#!/bin/bash

# This script sets up a test environment for ResourceRadar with 10 test systems

# Setup color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}ResourceRadar Test Environment Setup${NC}"
echo "======================================"

# Step 1: Create a shared Docker network if it doesn't exist
echo -e "${YELLOW}Step 1: Creating shared Docker network...${NC}"
if ! docker network inspect resourceradar-network &>/dev/null; then
    docker network create resourceradar-network
    echo "Network created"
else
    echo "Network already exists"
fi

# Step 2: Start test systems
echo -e "${YELLOW}Step 2: Starting test systems...${NC}"
cd "$(dirname "$0")"
docker-compose -f docker-compose-test.yml up -d
echo "Test systems started"

# Step 3: Wait for systems to start
echo -e "${YELLOW}Step 3: Waiting for systems to initialize...${NC}"
sleep 10
echo "Systems initialized"

# Step 4: Add systems to ResourceRadar
echo -e "${YELLOW}Step 4: Adding systems to ResourceRadar...${NC}"

# Check if the ResourceRadar backend is running
echo "Checking ResourceRadar backend..."
if ! curl -s http://localhost:3001 &>/dev/null; then
    echo -e "${RED}ResourceRadar backend is not running at http://localhost:3001${NC}"
    echo "Is the main Docker Compose environment running? Run cd .. && docker-compose up -d first."
    exit 1
fi

# Function to add a system to ResourceRadar
add_system() {
    local name=$1
    local host=$2
    local port=$3
    local username=$4
    local password=$5

    echo "Adding system: $name"
    
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"Name\":\"$name\",\"Host\":\"$host\",\"Port\":\"$port\",\"Username\":\"$username\",\"Password\":\"$password\"}" \
        http://localhost:3001/sshverify > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "  ✓ System added successfully"
    else
        echo "  ✗ Failed to add system"
    fi
}

# Add each test system using host.docker.internal which is accessible 
# from within the backend container but maps to localhost
add_system "test-system-1" "host.docker.internal" "2201" "root" "password"
add_system "test-system-2" "host.docker.internal" "2202" "root" "password"
add_system "test-system-3" "host.docker.internal" "2203" "root" "password"
add_system "test-system-4" "host.docker.internal" "2204" "root" "password"
add_system "test-system-5" "host.docker.internal" "2205" "root" "password"
add_system "test-system-6" "host.docker.internal" "2206" "root" "password"
add_system "test-system-7" "host.docker.internal" "2207" "root" "password"
add_system "test-system-8" "host.docker.internal" "2208" "root" "password"
add_system "test-system-9" "host.docker.internal" "2209" "root" "password"
add_system "test-system-10" "host.docker.internal" "2210" "root" "password"

echo -e "${GREEN}All test systems have been added to ResourceRadar.${NC}"
echo -e "Access the dashboard at http://localhost to view all systems"
echo -e "${YELLOW}To create varying CPU and memory loads, run: ./stress-test-systems.sh${NC}"
echo -e "${YELLOW}When finished, run: ./cleanup-test-environment.sh${NC}"