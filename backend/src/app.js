require('dotenv').config();
const { InfluxDB } = require('@influxdata/influxdb-client');
const WebSocket = require('ws');


const fetchCpuUsage = require('./services/Cpu_stats.js');
const fetchMemoryUsage = require('./services/Memory_stats.js');

setInterval(fetchCpuUsage, 1000);
setInterval(fetchMemoryUsage, 1000);