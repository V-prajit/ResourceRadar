require('dotenv').config();
const { sendMetric } = require('../kafka/producer');

const fetchCpuUsage = (sshClient, system) => {
    return new Promise((resolve, reject) => {
        sshClient.exec("top -b -d 0.5 -n 3 | grep '%Cpu'", (err, stream) => {
            if (err) {
                console.error(`SSH Command Execution Error for ${system.name}:`, err);
                reject(err);
                return;
            }
            
            let dataReceived = false;
            let output = '';
            
            stream.on("data", (data) => {
                dataReceived = true;
                output += data.toString();
                
                // Process each line as it comes in
                const lines = output.split('\n').filter(line => line.includes('%Cpu'));
                
                // Only process the last reading which should be the most accurate
                if (lines.length >= 2) {
                    const lastLine = lines[lines.length - 1];
                    
                    let cpuUsage = 0;
                    if (lastLine.includes('us') && lastLine.includes('sy')) {
                        // Format: "%Cpu(s):  5.9 us,  2.4 sy, ..."
                        const userMatch = lastLine.match(/(\d+\.\d+)\s+us/);
                        const sysMatch = lastLine.match(/(\d+\.\d+)\s+sy/);
                        
                        if (userMatch && sysMatch) {
                            const userCpu = parseFloat(userMatch[1]);
                            const sysCpu = parseFloat(sysMatch[1]);
                            cpuUsage = userCpu + sysCpu;
                        }
                    } else {
                        // Alternative format: "%Cpu(s): 12.3 "
                        const match = lastLine.match(/%Cpu\(s\):\s+(\d+\.\d+)/);
                        if (match) {
                            cpuUsage = parseFloat(match[1]);
                        }
                    }
                    
                    console.log(`Processed CPU usage for ${system.name}: ${cpuUsage}`);
                    
                    sendMetric('cpu-metrics', {
                        name: system.name,
                        value: cpuUsage,
                        timestamp: new Date().toISOString()
                    });
                }
            });

            stream.on('close', () => {
                if (!dataReceived) {
                    console.error(`No CPU data received for ${system.name}`);
                    sendMetric('cpu-metrics', {
                        name: system.name,
                        value: 0,
                        timestamp: new Date().toISOString()
                    });
                }
                resolve();
            });

            stream.stderr.on("data", (data) => {
                console.error(`SSH STDERR for ${system.name} CPU:`, data.toString());
            });
        });
    });
};

module.exports = fetchCpuUsage;
