# ResourceRadar Test Environment

This directory contains scripts and configuration to create a test environment with multiple systems for ResourceRadar.

## Overview

The test environment sets up 10 Docker containers that simulate different systems with various resource constraints. Each container runs an SSH server that ResourceRadar can connect to for monitoring.

## Requirements

- Docker and Docker Compose installed
- ResourceRadar application running via the main docker-compose.yml
- curl installed for the setup and cleanup scripts

## Usage Instructions

### 1. Start ResourceRadar

First, make sure ResourceRadar is running with the main docker-compose file:

```bash
cd /Users/prajit/Desktop/projects/ResourceRadar
docker-compose up -d
```

Wait for all services to start (including backend, frontend, database, Kafka, etc.)

### 2. Run the test environment

From the testing directory, run:

```bash
cd /Users/prajit/Desktop/projects/ResourceRadar/testing
chmod +x *.sh  # Make scripts executable if needed
./run-test-environment.sh
```

This script will:
- Create a Docker network shared with the main ResourceRadar application
- Start 10 Docker containers with SSH servers and resource limits
- Add all the test systems to ResourceRadar using the proper addresses

### 3. Generate interesting metrics (optional)

To make your dashboard more visually appealing with varying metrics:

```bash
./stress-test-systems.sh
```

This will create different CPU and memory loads on the test systems, making your graphs more dynamic and interesting for screenshots.

### 4. View your test environment

Access the ResourceRadar dashboard at http://localhost to see all 10 systems being monitored.

### 5. Clean up when finished

When you're done with the test environment:

```bash
./cleanup-test-environment.sh
```

This will:
- Remove all test systems from ResourceRadar
- Shut down the test containers
- Clean up the shared network if not needed anymore

## Configuration

- Each test system has different resource constraints (CPU and memory limits)
- All systems use the username "root" and password "password" for SSH access
- SSH ports are mapped from 2201-2210 on your host to port 22 in each container
- The test containers are connected to the main ResourceRadar network for proper communication