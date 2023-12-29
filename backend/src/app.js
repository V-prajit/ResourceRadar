require('dotenv').config();
const express = require('express');
const app = express();
const express_port = 3001;
const cors = require('cors');
const corsOptions = {
    origin: 'http://localhost:3000', // Replace with your React app's URL
};
app.use(cors(corsOptions));
const db_model = require('./API/postgres_connect.js')
app.use(express.json())


app.get('/', (req, res) => {
    db_model.getMachines()
    .then(response => {
        res.status(200).send(response);
    })
    .catch(error => {
        res.status(500).send(error);
    })
})

app.post('/machines', (req, res) => {
    machineData = req.body;
    db_model.createMachine(machineData)
    .then(response => {
        res.status(200).send(response);
    })
    .catch(error => {
        res.status(500).send(error);
    })
})

const fetchCpuUsage = require('./system_stats/Cpu_stats.js');
const fetchMemoryUsage = require('./system_stats/Memory_stats.js');

setInterval(fetchCpuUsage, 1000);
setInterval(fetchMemoryUsage, 1000);

app.listen(express_port, () => {
    console.log(`App running on port ${express_port}.`);
  })