const host1 = require('../SSH_Client');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const GETDATA = require('../API/websocket')

const token = 'F563snz6Ha80Y2pxMHU-6yVonlIrUs-JmhVPVJYY_e4VgwXWq34EtSx5MNES-Lubnz-D7-Kfa8Rlb3gH8aLmRQ==';
const org = 'server_stat';
const bucket = 'Server_Stats';
const client = new InfluxDB({ url: 'http://localhost:8086/', token: token });

const writeApi = client.getWriteApi(org, bucket);

const fetchMemoryUsage = () => {
    host1.exec("top -bn1 | grep 'MiB Mem' | awk '{print $8}'", (err, stream) => {
        if (err) throw err;
        stream.on("data", (data) => {
            const memoryUsage = parseFloat(data.toString().trim());
            GETDATA.SetMemoryData(memoryUsage)
            const point = new Point('memory_usage')
                .tag('host', 'Host1') // Replace with actual host identifier
                .floatField('usage', memoryUsage);

            writeApi.writePoint(point);
        }).stderr.on("data", (data) => {
            console.log('STDERR: ' + data);
        });
    });
};

module.exports = fetchMemoryUsage;
