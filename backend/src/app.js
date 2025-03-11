require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const express_port = 3001;
const cors = require('cors');
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };
app.use(cors(corsOptions));
const db_model = require('./API/postgres_connect.js');
app.use(express.json())
const VerifyDetails = require('./API/ssh_verification.js');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const SendGraphData = require('./API/graph_query.js')
const { InfluxDB } = require('@influxdata/influxdb-client');
const {monitorAllSystems, SendResources, deleteInfluxData} = require('./SSH_Client.js')
const { startConsumer } = require('./kafka/consumer');

const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io',
    allowEIO3: true,
    transports: ['websocket', 'polling']
  });

startConsumer()
    .then(() => console.log('Kafka consumer started'))
    .catch(err => console.error ('Failed to Start kafka consumer: ', err));

app.get('/', (req, res) => {
    db_model.getMachines()
    .then(response => {
        res.status(200).send(response);
    })
    .catch(error => {
        res.status(500).send(error);
    })
})

app.post('/sshverify', async(req, res) => {
    const formData = req.body;
    try{
        const check_result = await VerifyDetails(formData);
        await db_model.createMachine(formData);
        res.status(200).send({ verified: check_result });
    } catch (error){
        console.error('SSH verification failed:', error.message);
        res.status(500).send({ 
            verified: false, 
            error: 'SSH verification failed', 
            details: error.message 
        });
    }
});


app.get('/resourceusage', async (req, res) => {
    try {
        const allSystemUsage = await SendResources();
        res.json(allSystemUsage);
    }
    catch (error){
        console.error('Error', error);
        res.status(500).send("Server Error");
    }
});

app.post('/api/data/graph',async (req, res) => {
    const { host, timeFrame} = req.body;
    try{
        const data = await SendGraphData(host, timeFrame);
        res.status(200).json(data);
    } catch(error){
        console.error("Error retreiveing data:", error);
        res.status(500).send('Error retreiveing data')
    }
    
})

app.delete('/api/machine/:name', async (req, res) => {
    const { name } = req.params;
    try {
        console.log(`DELETE request received for machine: ${name}`);
        const machine = await db_model.getMachineDetails(name);
        
        if (!machine) {
          console.log(`Machine not found: ${name}`);
          return res.status(404).json({ error: 'Machine not found' });
        }
        
        console.log(`Deleting machine from PostgreSQL: ${name}`);
        await db_model.deleteMachine(name);
        
        console.log(`Deleting machine data from InfluxDB: ${name}`);
        try {
            await deleteInfluxData(name);
            console.log(`Successfully deleted InfluxDB data for: ${name}`);
        } catch (influxError) {
            console.error(`Error deleting from InfluxDB: ${influxError.message}`);
            // Continue even if InfluxDB deletion fails
        }
    
        // Always respond with success if PostgreSQL deletion worked
        res.status(200).json({ message: `Machine ${name} deleted successfully from PostgreSQL and InfluxDB` });
      } catch (error) {
        console.error('Error during machine deletion:', error);
        res.status(500).json({ error: error.message });
      }
});

// Add a utility endpoint to delete orphaned InfluxDB data
app.delete('/api/cleanup-influxdb', async (req, res) => {
    try {
        const systems = await db_model.getMachines();
        const validNames = systems.map(s => s.name);
        
        // Get all machine names from InfluxDB
        const client = new InfluxDB({ url: 'http://influxdb:8086/', token: process.env.INFLUX_TOKEN });
        const queryApi = client.getQueryApi(process.env.INFLUX_ORG);
        
        const query = `
        import "influxdata/influxdb/schema"
        schema.tagValues(bucket: "${process.env.INFLUX_BUCKET}", tag: "name")
        `;
        
        let influxNames = [];
        await queryApi.queryRows(query, {
            next(row, tableMeta) {
                const o = tableMeta.toObject(row);
                influxNames.push(o._value);
            },
            error(error) {
                console.error(`Error fetching InfluxDB names: ${error}`);
            },
            complete() {
                console.log(`Found ${influxNames.length} names in InfluxDB`);
            }
        });
        
        // Find orphaned names (in InfluxDB but not in PostgreSQL)
        const orphanedNames = influxNames.filter(name => !validNames.includes(name));
        console.log(`Found ${orphanedNames.length} orphaned names: ${orphanedNames.join(', ')}`);
        
        // Delete each orphaned name
        for (const name of orphanedNames) {
            try {
                await deleteInfluxData(name);
                console.log(`Deleted orphaned data for: ${name}`);
            } catch (error) {
                console.error(`Failed to delete orphaned data for ${name}: ${error.message}`);
            }
        }
        
        res.status(200).json({ 
            message: `InfluxDB cleanup completed`,
            deletedNames: orphanedNames
        });
    } catch (error) {
        console.error('Error during InfluxDB cleanup:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/machine/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const existingMachine = await db_model.getMachineDetails(name);
    
    if (!existingMachine) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    
    try {
      const formData = { ...req.body, Name: name };
      await VerifyDetails(formData);
    } catch (sshError) {
      return res.status(400).json({ error: 'SSH verification failed with new credentials', details: sshError.message });
    }
    
    const updatedMachine = await db_model.updateMachine(name, req.body);
    
    res.status(200).json({ 
      message: `Machine ${name} updated successfully`, 
      machine: updatedMachine 
    });
  } catch (error) {
    console.error('Error during machine update:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set up Socket.IO connection events
io.on('connection', (socket) => {
    console.log('A client connected');
    
    // Send initial resource data to the client on connection
    SendResources().then(data => {
        socket.emit('resourceData', data);
    });
    
    // Handle graph data requests
    socket.on('getGraphData', async (data) => {
        try {
            const graphData = await SendGraphData(data.host, data.timeFrame);
            socket.emit('graphData', graphData);
        } catch (error) {
            console.error("Error retrieving graph data:", error);
            socket.emit('error', { message: 'Error retrieving graph data' });
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});

// Monitor systems and broadcast updates
const monitorAndBroadcast = async () => {
    await monitorAllSystems();
    const resourceData = await SendResources();
    io.emit('resourceData', resourceData);
};

// Set up interval for monitoring and broadcasting
setInterval(monitorAndBroadcast, 1000);

// Use server.listen instead of app.listen for Socket.IO
server.listen(express_port, '0.0.0.0', () => {
    console.log(`Server running with WebSockets on port ${express_port}.`);
    console.log(`Server is listening on all network interfaces (0.0.0.0).`);
});
