const fetchCpuUsage = require('./Cpu_stats.js');
const fetchMemoryUsage = require('./Memory_stats.js');

setInterval(fetchCpuUsage, 1000);
setInterval(fetchMemoryUsage, 1000);
