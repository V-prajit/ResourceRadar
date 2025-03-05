# ResourceRadar

A real-time server monitoring dashboard that provides comprehensive visualization of CPU and memory usage across multiple remote servers through an elegant and intuitive interface.

![Dashboard Screenshot](docs/dashboard_screenshot.png)
*Screenshot: ResourceRadar Dashboard with multiple servers being monitored*

![Detailed Metrics](docs/detailed_metrics.png)
*Screenshot: Detailed performance metrics with time-series graphs*

## Features

- **Real-time Monitoring**: Track CPU and memory usage on remote servers with automatic updates
- **Historical Data**: View historical performance through interactive time-series charts
- **Material UI Design**: Modern, responsive interface with dark/light mode support
- **Server Management**: Add, edit, and remove servers through an intuitive interface
- **SSH Authentication**: Secure connection to remote servers using standard SSH credentials
- **Multi-server Dashboard**: Monitor unlimited servers in a single dashboard view
- **Containerized Deployment**: Easy setup with Docker Compose
- **Time Range Selection**: View metrics over customizable time periods (1 minute to 30 days)
- **System Status Indicators**: Visual status indications for online/offline systems
- **Kafka Integration**: High-throughput message processing for metric collection

## Architecture

ResourceRadar utilizes a modern, scalable architecture:

- **React Frontend**: Material UI-based web interface for visualizing server data
- **Node.js Backend**: Express API server that connects to remote servers via SSH
- **Kafka**: Message broker for reliable, high-throughput metric processing
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
   git clone https://github.com/yourusername/ResourceRadar.git
   cd ResourceRadar
   ```

2. Start the application:
   ```bash
   docker-compose up -d
   ```

3. Access the web interface:
   - Open your browser and go to `http://localhost`
   - Note: Initial startup may take a minute while services initialize

## Adding Servers to Monitor

1. Once the dashboard loads, click the "Add Machine" button
2. Enter server details:
   - Host Name: A recognizable name for the server
   - Host IP: IP address or hostname
   - SSH Username: SSH username
   - SSH Password: SSH password
   - SSH Port: SSH port (default: 22)
3. Click "Save Machine" - the system will verify connectivity and begin monitoring

## Testing with Demo Servers

ResourceRadar includes a testing environment that creates multiple demo servers for demonstration:

1. Start ResourceRadar using the steps above
2. Set up the test environment:
   ```bash
   cd testing
   ./run-test-environment.sh
   ```
3. Generate interesting metrics patterns:
   ```bash
   ./stress-test-systems.sh
   ```
4. When finished, clean up the test environment:
   ```bash
   ./cleanup-test-environment.sh
   ```

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

*Made with ❤️ by [Prajit Viswanadha]*