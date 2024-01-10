require('dotenv').config();
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;
const client = new InfluxDB({ url: 'http://localhost:8086/', token: token });

const writeOptions = { flushInterval: 1000 };
const writeApi = client.getWriteApi(org, bucket, 'ns', writeOptions);

const fetchCpuUsage = (sshClient, system) => {
    sshClient.exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'", (err, stream) => {
        if (err) {
            console.error('SSH Command Execution Error:', err);
            return; // Prevent further execution and crashing
        }
        
        stream.on("data", (data) => {
            const output = data.toString();
            const cpuUsage = parseFloat(output).toFixed(1);
            const point = new Point('cpu_usage')
                .tag('host', system.host)
                .tag('systemname', system.name)
                .floatField('usage', cpuUsage);
            writeApi.writePoint(point);
        }).stderr.on("data", (data) => {
            console.error('SSH STDERR:', data.toString());
        });
    });
};

module.exports = fetchCpuUsage;
