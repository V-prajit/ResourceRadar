#\!/bin/bash

# Skip Kafka verification for now
echo "Starting backend with direct command"
docker-compose exec backend node src/app.js
