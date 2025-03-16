#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}ResourceRadar Setup Script${NC}"
echo -e "${GREEN}===================================${NC}"

echo -e "${YELLOW}Downloading configuration files to current directory...${NC}"

echo "Downloading nginx.conf..."
curl -sSL -o nginx.conf "https://raw.githubusercontent.com/V-prajit/ResourceRadar/refs/heads/main/nginx.conf"

echo "Downloading init.sql..."
curl -sSL -o init.sql "https://raw.githubusercontent.com/V-prajit/ResourceRadar/refs/heads/main/init.sql"

echo "Downloading docker-compose.yml..."
curl -sSL -o docker-compose.yml "https://raw.githubusercontent.com/V-prajit/ResourceRadar/refs/heads/main/docker-compose-hub.yml"

echo -e "${GREEN}All files downloaded and configured.${NC}"
echo ""
echo -e "${YELLOW}Would you like to start ResourceRadar now? (y/n)${NC}"
read -p "" START_NOW

# Determine which docker compose command is available, prioritizing the modern 'docker compose'
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}Error: Neither 'docker compose' nor 'docker-compose' is available on this system.${NC}"
    exit 1
fi

if [[ $START_NOW =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Starting ResourceRadar...${NC}"
    $DOCKER_COMPOSE up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}ResourceRadar is now running!${NC}"
        echo -e "Access the dashboard at ${YELLOW}http://localhost${NC}"
    else
        echo -e "${RED}There was an error starting ResourceRadar.${NC}"
        echo "Check the logs with '$DOCKER_COMPOSE logs' for more information."
    fi
else
    echo -e "${YELLOW}You can start ResourceRadar later with '$DOCKER_COMPOSE up -d'${NC}"
fi

echo ""
echo -e "${GREEN}Useful commands:${NC}"
echo -e "  ${YELLOW}$DOCKER_COMPOSE ps${NC}         - Check service status"
echo -e "  ${YELLOW}$DOCKER_COMPOSE logs -f${NC}    - Follow logs"
echo -e "  ${YELLOW}$DOCKER_COMPOSE down${NC}       - Stop all services"
echo -e "  ${YELLOW}$DOCKER_COMPOSE up -d${NC}      - Start all services"
