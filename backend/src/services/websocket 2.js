const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let cpu_use = 0;
const SETCPUDATA = (CpuUsage) => {
    if (cpu_use != CpuUsage)
        cpu_use = CpuUsage;
        broadcastUsage();
}

let memUsage = 0;
const SetMemoryData = (memoryUsage) => {
    if (memUsage != memoryUsage){
        memUsage = memoryUsage;
        broadcastUsage();
    }
}

const broadcastUsage = () => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ cpuUsage: cpu_use, memoryUsage: memUsage }));
      }
    });
};


module.exports = { SETCPUDATA, SetMemoryData};
