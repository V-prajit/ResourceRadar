#!/bin/bash

# Script to build, tag and publish Docker images for ResourceRadar

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${YELLOW}Docker is not running or you don't have permission. Please start Docker and try again.${NC}"
  exit 1
fi

# Get Docker Hub username
read -p "Enter your Docker Hub username: " DOCKER_USERNAME

# Check if logged in to Docker Hub
echo -e "${YELLOW}Checking Docker Hub login...${NC}"
if ! docker info | grep -q "Username: $DOCKER_USERNAME"; then
  echo -e "${YELLOW}Logging in to Docker Hub...${NC}"
  docker login
fi

# Build images from docker-compose file
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build

# Tag images with Docker Hub username
echo -e "${YELLOW}Tagging images...${NC}"
docker tag resourceradar_frontend $DOCKER_USERNAME/resourceradar-frontend:latest
docker tag resourceradar_backend $DOCKER_USERNAME/resourceradar-backend:latest

# Push images to Docker Hub
echo -e "${YELLOW}Pushing images to Docker Hub...${NC}"
docker push $DOCKER_USERNAME/resourceradar-frontend:latest
docker push $DOCKER_USERNAME/resourceradar-backend:latest

# Create docker-compose file for users
echo -e "${YELLOW}Creating docker-compose file for distribution...${NC}"
sed -e "s|image: prajitviswanadha/resourceradar-backend:latest|image: $DOCKER_USERNAME/resourceradar-backend:latest|g" \
    -e "s|image: prajitviswanadha/resourceradar-frontend:latest|image: $DOCKER_USERNAME/resourceradar-frontend:latest|g" \
    docker-compose-hub.yml > docker-compose-$DOCKER_USERNAME.yml

echo -e "${GREEN}Done! Images have been pushed to Docker Hub.${NC}"
echo -e "${GREEN}A customized docker-compose file has been created as docker-compose-$DOCKER_USERNAME.yml${NC}"
echo ""
echo -e "${YELLOW}Users can now run your application with:${NC}"
echo "  docker-compose -f docker-compose-$DOCKER_USERNAME.yml up -d"
echo ""
echo -e "${YELLOW}Make sure to share the docker-compose file, nginx.conf, and init.sql with your users.${NC}"