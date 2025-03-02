require('dotenv').config();
const { Point } = require('@influxdata/influxdb-client')

const fetchCpuUsage = (sshClient, system, writeApi) => {
    return new Promise((resolve, reject) => {
        // Try a more generic command that should work across Linux distros
        sshClient.exec("cat /proc/stat | grep '^cpu ' | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'", (err, stream) => {
            if (err) {
                console.error(`SSH Command Execution Error for ${system.name}:`, err);
                reject(err);
                return;
           } 
            
            let dataReceived = false;
            stream.on("data", (data) => {
                dataReceived = true;
                const output = data.toString().trim();
                console.log(`Raw CPU data for ${system.name}: "${output}"`);
                
                // Parse the output to a float and fix to 1 decimal place
                let cpuUsage = parseFloat(output);
                
                if (isNaN(cpuUsage)) {
                    console.error(`Invalid CPU usage value for ${system.name}: "${output}"`);
                    cpuUsage = 0; // Default to 0 if we can't parse
                } else {
                    cpuUsage = cpuUsage.toFixed(1);
                }
                
                console.log(`Processed CPU usage for ${system.name}: ${cpuUsage}`);
                
                const point = new Point('cpu_usage')
                    .tag('name', system.name)
                    .floatField('usage', cpuUsage);

                writeApi.writePoint(point);
                resolve();
            });

            stream.on('close', () => {
                if (!dataReceived) {
                    console.error(`No CPU data received for ${system.name}`);
                    // Write a 0 value so we know we tried
                    const point = new Point('cpu_usage')
                        .tag('name', system.name)
                        .floatField('usage', 0);
                    writeApi.writePoint(point);
                    resolve();
                }
            });

            stream.stderr.on("data", (data) => {
                console.error(`SSH STDERR for ${system.name} CPU:`, data.toString());
            })
        });
    });
};

module.exports = fetchCpuUsage;
