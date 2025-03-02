require('dotenv').config();
const { Point } = require('@influxdata/influxdb-client')

const fetchMemoryUsage = (sshClient, system, writeApi) => {
    return new Promise((resolve, reject) => {
        // Try a more generic command that should work on most Linux systems
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
                
                const point = new Point('memory_usage')
                    .tag('name', system.name)
                    .floatField('usage', memoryUsage);

                writeApi.writePoint(point);
                resolve();
            });
            
            stream.on('close', () => {
                if (!dataReceived) {
                    console.error(`No memory data received for ${system.name}`);
                    // Write a 0 value so we know we tried
                    const point = new Point('memory_usage')
                        .tag('name', system.name)
                        .floatField('usage', 0);
                    writeApi.writePoint(point);
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