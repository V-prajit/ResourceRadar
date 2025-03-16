require('dotenv').config();
const { sendMetric } = require('../kafka/producer');

const fetchCpuUsage = (sshClient, system) => {
    return new Promise((resolve, reject) => {
        //detect OS type
        sshClient.exec("uname", (err, stream) => {
            if (err) {
                console.error(`SSH Command Error detecting OS for ${system.name}:`, err);
                reject(err);
                return;
            }
            
            let osType = '';
            
            stream.on("data", (data) => {
                osType = data.toString().trim().toLowerCase();
                console.log(`Detected OS type for ${system.name}: ${osType}`);
                
                let cpuCommand;
                if (osType === 'darwin') {
                    // macOS command
                    cpuCommand = "top -l 1 -n 0 -s 0 | grep 'CPU usage' | tail -1 | awk '{print $3+$5}'";
                } else if (osType === 'linux') {
                    cpuCommand = "top -b -d 0.5 -n 3 | grep '%Cpu'";
                } else {
                    // Default to Linux command for other systems
                    console.log(`Using Linux command for unknown OS: ${osType}`);
                    cpuCommand = "top -b -d 0.5 -n 3 | grep '%Cpu'";
                }
                
                // Now execute the appropriate CPU command
                executeCpuCommand(sshClient, system, cpuCommand, osType, resolve, reject);
            });
            
            stream.stderr.on("data", (data) => {
                console.error(`SSH STDERR when detecting OS for ${system.name}:`, data.toString());
            });
            
            stream.on("close", (code) => {
                if (code !== 0) {
                    console.error(`OS detection failed with code ${code} for ${system.name}`);
                    const cpuCommand = "top -b -d 0.5 -n 3 | grep '%Cpu'";
                    executeCpuCommand(sshClient, system, cpuCommand, 'linux', resolve, reject);
                }
            });
        });
    });
};

function executeCpuCommand(sshClient, system, command, osType, resolve, reject) {
    sshClient.exec(command, (err, stream) => {
        if (err) {
            console.error(`SSH Command Execution Error for ${system.name}:`, err);
            sendMetric('cpu-metrics', {
                name: system.name,
                value: 0,
                timestamp: new Date().toISOString()
            });
            resolve();
            return;
        }
        
        let dataReceived = false;
        let output = '';
        
        stream.on("data", (data) => {
            dataReceived = true;
            output += data.toString();
            
            let cpuUsage = 0;
            
            // Parse output based on OS type
            if (osType === 'darwin') {
                const value = parseFloat(output.trim());
                if (!isNaN(value)) {
                    cpuUsage = value;
                }
            } else {
                // Linux format parsing
                const lines = output.split('\n').filter(line => line.includes('%Cpu'));
                if (lines.length >= 1) {
                    const lastLine = lines[lines.length - 1];
                    
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
                }
            }
            
            console.log(`Processed CPU usage for ${system.name}: ${cpuUsage}`);
            
            sendMetric('cpu-metrics', {
                name: system.name,
                value: cpuUsage,
                timestamp: new Date().toISOString()
            });
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
}

module.exports = fetchCpuUsage;
