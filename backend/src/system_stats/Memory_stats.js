require('dotenv').config();
const { sendMetric } = require('../kafka/producer');

const fetchMemoryUsage = (sshClient, system, writeApi) => {
    return new Promise((resolve, reject) => {
        // First, detect OS type
        sshClient.exec("uname", (err, stream) => {
            if (err) {
                console.error(`SSH Command Error detecting OS for ${system.name}:`, err);
                reject(err);
                return;
            }
            
            let osType = '';
            
            stream.on("data", (data) => {
                osType = data.toString().trim().toLowerCase();
                console.log(`Detected OS type for ${system.name} (memory): ${osType}`);
                
                // Choose appropriate command based on OS
                let memCommand;
                if (osType === 'darwin') {
                    memCommand = 'vm_stat | perl -ne \'/page size of (\\d+)/ && print $1\' | { read page_size; vm_stat | grep "Pages active\\|Pages wired" | awk -v page_size="$page_size" \'{ sum += $NF * page_size / 1024 / 1024} END { print sum }\' ; }';
                } else if (osType === 'linux') {
                    // Linux command
                    memCommand = "free -m | grep Mem | awk '{print $3}'";
                } else {
                    // Default to Linux command
                    console.log(`Using Linux memory command for unknown OS: ${osType}`);
                    memCommand = "free -m | grep Mem | awk '{print $3}'";
                }
                
                // Execute the appropriate memory command
                executeMemoryCommand(sshClient, system, memCommand, osType, resolve, reject);
            });
            
            stream.stderr.on("data", (data) => {
                console.error(`SSH STDERR when detecting OS for ${system.name} (memory):`, data.toString());
            });
            
            stream.on("close", (code) => {
                if (code !== 0) {
                    console.error(`OS detection failed with code ${code} for ${system.name} (memory)`);
                    // Default to Linux command as fallback
                    const memCommand = "free -m | grep Mem | awk '{print $3}'";
                    executeMemoryCommand(sshClient, system, memCommand, 'linux', resolve, reject);
                }
            });
        });
    });
};

// Function to execute memory command based on detected OS
function executeMemoryCommand(sshClient, system, command, osType, resolve, reject) {
    sshClient.exec(command, (err, stream) => {
        if (err) {
            console.error(`SSH Command Execution Error for ${system.name} memory:`, err);
            // Send zero value on error and resolve to avoid hanging
            sendMetric('memory-metrics', {
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
            output += data.toString().trim();
            console.log(`Raw memory data for ${system.name}: "${output}"`);
            
            let memoryUsage = 0;
            
            if (osType === 'darwin' || osType === 'linux') {
                memoryUsage = parseFloat(output);
                
                if (isNaN(memoryUsage)) {
                    console.error(`Invalid memory value: "${output}"`);
                    memoryUsage = 0;
                }
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
}

module.exports = fetchMemoryUsage;