require('dotenv').config();
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;
const client = new InfluxDB({ url: 'http://localhost:8086/', token: token });

const writeOptions = {flushInterval: 1000};
const writeApi = client.getWriteApi(org, bucket, 'ns', writeOptions);

const fetchMemoryUsage = (sshClient, system) => {
    sshClient.exec("top -bn1 | grep 'MiB Mem' | awk '{print $8}'", (err, stream) => {
        if (err) throw err;
        stream.on("data", (data) => {
            const memoryUsage = parseFloat(data.toString().trim());
            const point = new Point('memory_usage')
                .tag('host', system.host) 
                .tag('systemname', system.name)
                .floatField('usage', memoryUsage);
            writeApi.writePoint(point);
        }).stderr.on("data", (data) => {
            console.log('STDERR: ' + data);
        });
    });
};

module.exports = fetchMemoryUsage;
