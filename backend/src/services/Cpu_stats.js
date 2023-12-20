const host1 = require('../SSH_Client');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const token = 'F563snz6Ha80Y2pxMHU-6yVonlIrUs-JmhVPVJYY_e4VgwXWq34EtSx5MNES-Lubnz-D7-Kfa8Rlb3gH8aLmRQ==';
const org = 'server_stat';
const bucket = 'Server_Stats';
const client = new InfluxDB({ url: 'http://localhost:8086/', token: token });

const writeApi = client.getWriteApi(org, bucket);

const fetchCpuUsage = () => {
    host1.exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'", (err, stream) => {
        if (err) throw err;
        stream.on("data", (data) => {
            const output = data.toString();
            const cpuUsage = parseFloat(output);
            console.log(cpuUsage)
            // Create a point with tags
            const point = new Point('cpu_usage')
                .tag('host', 'Host1') // Replace 'HostIdentifier' with a unique identifier for this host
                .floatField('usage', cpuUsage);

            writeApi.writePoint(point);
        });
    });
};

module.exports = fetchCpuUsage;
