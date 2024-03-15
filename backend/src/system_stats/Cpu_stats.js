require('dotenv').config();
const { Point } = require('@influxdata/influxdb-client')

const fetchCpuUsage = (sshClient, system, writeApi) => {
    return new Promise((resolve, reject) => {
        sshClient.exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'", (err, stream) => {
            if (err) {
                console.error('SSH Command Execution Error:', err);
                reject(err); // Reject the promise on error
                return;
           } 
            stream.on("data", (data) => {
                const output = data.toString();
                const cpuUsage = parseFloat(output).toFixed(1);
                const point = new Point('cpu_usage')
                    .tag('host', system.host)
                    .tag('systemname', system.name)
                    .floatField('usage', cpuUsage);

                writeApi.writePoint(point);
                resolve(); 
            });

            stream.stderr.on("data", (data) => {
                console.error('SSH STDERR:', data.toString());
            })
        });
    });
};

module.exports = fetchCpuUsage;
