require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { InfluxDB } = require('@influxdata/influxdb-client');

const fetchCpuUsage = require('./services/Cpu_stats.js');
const fetchMemoryUsage = require('./services/Memory_stats.js');

const app = express();
const port = 3000;

app.use(cors());

const token = 'F563snz6Ha80Y2pxMHU-6yVonlIrUs-JmhVPVJYY_e4VgwXWq34EtSx5MNES-Lubnz-D7-Kfa8Rlb3gH8aLmRQ==';
const org = 'server_stat';
const bucket = 'Server_Stats';
const client = new InfluxDB({ url: 'http://localhost:8086', token: token });

// Endpoint for CPU data
app.get('/api/data/cpu', async (req, res) => {
    const queryApi = client.getQueryApi(org);
    const fluxQuery = `from(bucket: "${bucket}") |> range(start: -1h) |> filter(fn: (r) => r._measurement == "cpu_usage")`;

    let results = [];
    queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            results.push(o);
        },
        error(error) {
            console.error(error);
            res.status(500).send('Error querying InfluxDB');
        },
        complete() {
            res.json(results);
        },
    });
});

// Endpoint for Memory data
app.get('/api/data/memory', async (req, res) => {
    const queryApi = client.getQueryApi(org);
    const fluxQuery = `from(bucket: "${bucket}") |> range(start: -1h) |> filter(fn: (r) => r._measurement == "memory_usage")`;

    let results = [];
    queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            results.push(o);
        },
        error(error) {
            console.error(error);
            res.status(500).send('Error querying InfluxDB');
        },
        complete() {
            res.json(results);
        },
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


setInterval(fetchCpuUsage, 1000);
setInterval(fetchMemoryUsage, 1000);