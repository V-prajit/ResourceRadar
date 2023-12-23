require('dotenv').config();

const fetchCpuUsage = require('./services/Cpu_stats.js');
const fetchMemoryUsage = require('./services/Memory_stats.js');

setInterval(fetchCpuUsage, 1000);
setInterval(fetchMemoryUsage, 1000);