# Server Status Monitor

A real-time server monitoring application that allows you to track CPU and memory usage across multiple remote servers through a clean web interface.

## Features

- **Real-time Monitoring**: Track CPU and memory usage on remote servers
- **Historical Data**: View historical performance through interactive charts
- **Server Management**: Add, monitor, and remove servers easily
- **SSH Authentication**: Secure connection to remote servers
- **Containerized Deployment**: Easy setup with Docker Compose

## Architecture

The application consists of these key components:

- **React Frontend**: Web interface for visualizing server data
- **Node.js Backend**: Express API server that connects to remote servers via SSH
- **PostgreSQL**: Stores server connection information
- **InfluxDB**: Time-series database for storing performance metrics
- **Docker**: Container orchestration for easy deployment

## Prerequisites

- Docker and Docker Compose
- SSH access to remote servers you want to monitor
- Git (for cloning the repository)

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/username/server_status.git
   cd server_status
   ```

2. Configure environment variables (or use defaults in docker-compose.yml):
   ```bash
   # Optional: Modify docker-compose.yml to update any credentials
   ```

3. Start the application:
   ```bash
   docker-compose up -d
   ```

4. Access the web interface:
   - Open your browser and go to `http://localhost:80`

## Adding a New Server

1. Navigate to "Add New Server" in the web interface
2. Enter server details:
   - Name: A friendly name for the server
   - Host: IP address or hostname
   - Username: SSH username
   - Password: SSH password
   - Port: SSH port (default: 22)
3. Click "Add Server" - the system will verify connectivity and begin monitoring

## Development Setup

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Database Setup (Manual)

If you need to manually set up the database:

1. PostgreSQL:
```sql
CREATE TABLE IF NOT EXISTS machines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    host VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. InfluxDB:
   - Create a bucket named "Server_Stats"
   - Generate an admin token

## Environment Variables

### Backend
```
INFLUX_TOKEN=your_influxdb_token
INFLUX_ORG=server_stat
INFLUX_BUCKET=Server_Stats
PGUSER=postgres
PGHOST=postgres
PGDATABASE=sshinfo
PGPASSWORD=your_postgres_password
PGPORT=5432
```

### Frontend
```
REACT_APP_API_URL=http://localhost:3001
```

## Docker Configuration

The application is containerized using Docker with the following services:

- **influxdb**: Time-series database for metrics storage
- **postgres**: Relational database for server credentials
- **backend**: Node.js API server
- **frontend**: React application served via Nginx

### Customizing Docker Setup

To modify ports or configurations:

1. Edit the `docker-compose.yml` file
2. Update the corresponding environment variables
3. Rebuild the containers: `docker-compose up -d --build`

## Security Considerations

- SSH credentials are stored in PostgreSQL - ensure database security
- Use environment variables instead of hardcoding secrets
- Consider using SSH keys instead of passwords for production environments
- Restrict access to the monitoring application

## Troubleshooting

- **Connection Issues**: Check SSH credentials and network connectivity
- **Missing Data**: Verify InfluxDB connection and token validity
- **Container Errors**: Check logs with `docker-compose logs [service_name]`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
