require('dotenv').config();
const host1 = require('../SSH_Client');
const { InfluxDB, Point, consoleLogger } = require('@influxdata/influxdb-client');
const GETDATA = require('../API/websocket')
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;
const client = new InfluxDB({ url: 'http://localhost:8086/', token: token });

const writeOptions = {flushInterval: 1000};
const writeApi = client.getWriteApi(org, bucket, 'ns', writeOptions);
const fetchCpuUsage = () => {
    host1.exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'", (err, stream) => {
        if (err) throw err;
        stream.on("data", (data) => {
            const output = data.toString();
            const cpuUsage = parseFloat(output).toFixed(1);
            //console.log(cpuUsage);
            const point = new Point('cpu_usage')
                .tag('host', 'Host1')
                .floatField('usage', cpuUsage);
            writeApi.writePoint(point);
            GETDATA.SETCPUDATA(cpuUsage)
        });
    });
};

module.exports = fetchCpuUsage;
