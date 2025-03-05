#!/bin/bash

# This script shuts down all test systems and removes them from ResourceRadar

# Setup color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}ResourceRadar Test Environment Cleanup${NC}"
echo "======================================"

# Function to remove a system from ResourceRadar
remove_system() {
    local name=$1
    
    echo "Removing system: $name"
    
    curl -s -X DELETE "http://localhost:3001/api/machine/${name}" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "  ✓ System removed successfully"
    else
        echo "  ✗ Failed to remove system"
    fi
}

# Step 1: Remove test systems from ResourceRadar
echo -e "${YELLOW}Step 1: Removing test systems from ResourceRadar...${NC}"

# Check if the ResourceRadar backend is running
if ! curl -s http://localhost:3001 &>/dev/null; then
    echo -e "${RED}ResourceRadar backend is not running at http://localhost:3001${NC}"
    echo "Skipping system removal step"
else
    # Remove each test system from ResourceRadar with a small delay between each
    for i in {1..10}; do
        remove_system "test-system-$i"
        echo -e "  Waiting a moment before removing next system..."
        sleep 1  # Add a small delay to avoid overwhelming the backend
    done
fi

# Step 2: Shut down test containers
echo -e "${YELLOW}Step 2: Shutting down test systems...${NC}"
cd "$(dirname "$0")"
docker-compose -f docker-compose-test.yml down
echo "Test systems shut down"

# Step 3: Remove network if it's no longer needed
echo -e "${YELLOW}Step 3: Checking for other containers on the network...${NC}"
if [ -z "$(docker ps -q --filter network=resourceradar-network)" ]; then
    echo "No other containers using the network. Removing network..."
    docker network rm resourceradar-network
    echo "Network removed"
else
    echo "Other containers are still using the network. Keeping network."
fi

echo -e "${GREEN}Test environment cleanup complete.${NC}"