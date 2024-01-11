require('dotenv').config();
const { Point } = require('@influxdata/influxdb-client')

const fetchMemoryUsage = (sshClient, system, writeApi) => {
    return new Promise((resolve, reject) => {
        sshClient.exec("top -bn1 | grep 'MiB Mem' | awk '{print $8}'", (err, stream) => {
            if (err) {
                console.error('SSH Command Execution Error:', err);
                reject(err); // Reject the promise on error
                return;
            }

            stream.on("data", (data) => {
                const memoryUsage = parseFloat(data.toString().trim());
                const point = new Point('memory_usage')
                    .tag('host', system.host)
                    .tag('systemname', system.name)
                    .floatField('usage', memoryUsage);

                writeApi.writePoint(point);

                        resolve(); // Resolve the promise on successful write
            }).stderr.on("data", (data) => {
                console.error('SSH STDERR:', data.toString());
            });
        });
    });
};

module.exports = fetchMemoryUsage;