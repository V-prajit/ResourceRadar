#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${YELLOW}Docker is not running or you don't have permission. Please start Docker and try again.${NC}"
  exit 1
fi

# Set Docker Hub username
DOCKER_USERNAME="prajitviswanadha"
echo -e "${YELLOW}Using Docker Hub username: ${DOCKER_USERNAME}${NC}"

# Check if logged in to Docker Hub
echo -e "${YELLOW}Checking Docker Hub login...${NC}"
if ! docker info | grep -q "Username: $DOCKER_USERNAME"; then
  echo -e "${YELLOW}Logging in to Docker Hub...${NC}"
  docker login
fi

# Enable Docker BuildX for multi-architecture builds
echo -e "${YELLOW}Setting up Docker BuildX for multi-architecture builds...${NC}"
docker buildx create --name multiarch --use || true
docker buildx inspect --bootstrap

# Build and push multi-architecture images
echo -e "${YELLOW}Building and pushing multi-architecture images (amd64, arm64)...${NC}"

echo -e "${YELLOW}Building and pushing frontend image...${NC}"
docker buildx build --platform linux/amd64,linux/arm64 \
  -t $DOCKER_USERNAME/resourceradar-frontend:latest \
  -f ./frontend/Dockerfile ./frontend --push

echo -e "${YELLOW}Building and pushing backend image...${NC}"
docker buildx build --platform linux/amd64,linux/arm64 \
  -t $DOCKER_USERNAME/resourceradar-backend:latest \
  -f ./backend/Dockerfile ./backend --push

# Create docker-compose file for users
echo -e "${YELLOW}Creating docker-compose file for distribution...${NC}"
sed -e "s/\${DOCKER_USERNAME}/$DOCKER_USERNAME/g" \
    docker-compose-hub.yml > docker-compose-$DOCKER_USERNAME.yml

echo -e "${GREEN}Done! Images have been pushed to Docker Hub.${NC}"
echo -e "${GREEN}A customized docker-compose file has been created as docker-compose-$DOCKER_USERNAME.yml${NC}"
echo ""
echo -e "${YELLOW}Users can now run your application with:${NC}"
echo "  docker-compose -f docker-compose-$DOCKER_USERNAME.yml up -d"
echo ""
echo -e "${YELLOW}For more streamlined user experience, consider sharing:${NC}"
echo "  1. docker-compose-$DOCKER_USERNAME.yml (renamed to docker-compose.yml)"
echo "  2. nginx.conf"
echo "  3. init.sql"
echo "  4. setup-resourceradar.sh (configured with your username)"
echo ""
echo -e "${YELLOW}Or use automatic builds with GitHub Actions by:${NC}"
echo "  1. Setting up DOCKER_HUB_USERNAME and DOCKER_HUB_ACCESS_TOKEN secrets in GitHub"
echo "  2. Pushing changes to your main branch"