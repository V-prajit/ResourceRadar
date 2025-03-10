FROM node:16

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Install Kafka CLI tools for health checks and topic creation
RUN apt-get update && \
    apt-get install -y --no-install-recommends wget ca-certificates gnupg && \
    wget -qO - https://packages.confluent.io/deb/7.0/archive.key | apt-key add - && \
    echo "deb [arch=amd64] https://packages.confluent.io/deb/7.0 stable main" >> /etc/apt/sources.list.d/confluent.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends confluent-community-2.13 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy wait-for-kafka script
COPY wait-for-kafka.sh /usr/local/bin/wait-for-kafka.sh
RUN chmod +x /usr/local/bin/wait-for-kafka.sh

# Set the entrypoint to use our wait script
ENTRYPOINT ["wait-for-kafka.sh"]
CMD ["node", "src/app.js"]