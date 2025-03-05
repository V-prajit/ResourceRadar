require('dotenv').config();
const { sendMetric } = require('../kafka/producer');

const fetchMemoryUsage = (sshClient, system, writeApi) => {
    return new Promise((resolve, reject) => {
        sshClient.exec("free -m | grep Mem | awk '{print $3}'", (err, stream) => {
            if (err) {
                console.error(`SSH Command Execution Error for ${system.name} memory:`, err);
                reject(err);
                return;
            }

            let dataReceived = false;
            stream.on("data", (data) => {
                dataReceived = true;
                const output = data.toString().trim();
                console.log(`Raw memory data for ${system.name}: "${output}"`);
                
                let memoryUsage = parseFloat(output);
                
                if (isNaN(memoryUsage)) {
                    console.error(`Invalid memory usage value for ${system.name}: "${output}"`);
                    memoryUsage = 0;
                }
                
                console.log(`Processed memory usage for ${system.name}: ${memoryUsage}MB`);
                
                sendMetric('memory-metrics', {
                    name: system.name,
                    value: memoryUsage,
                    timestamp: new Date().toISOString()
                });
                resolve();
            });
            
            stream.on('close', () => {
                if (!dataReceived) {
                    console.error(`No memory data received for ${system.name}`);
                    sendMetric('memory-metrics', {
                        name: system.name,
                        value: 0,
                        timestamp: new Date().toISOString()
                    });
                    resolve();
                }
            });
            
            stream.stderr.on("data", (data) => {
                console.error(`SSH STDERR for ${system.name} memory:`, data.toString());
            });
        });
    });
};

module.exports = fetchMemoryUsage;