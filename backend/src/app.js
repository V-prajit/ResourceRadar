require('dotenv').config();


const fetchCpuUsage = require('./system_stats/Cpu_stats.js');
const fetchMemoryUsage = require('./system_stats/Memory_stats.js');

setInterval(fetchCpuUsage, 1000);
setInterval(fetchMemoryUsage, 1000);