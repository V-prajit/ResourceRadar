const { Kafka } = require('kafkajs');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;
const influxUrl = process.env.INFLUXDB_URL ||
'http://influxdb:8086/';
const client = new InfluxDB({ url: influxUrl, token:
 token });
const writeApi = client.getWriteApi(org, bucket,
'ns', { flushInterval: 1000 });

const kafka = new Kafka({
    clientId: 'resource-radar-producer',
    brokers: ['kafka:29092'] 
});

const consumer = kafka.consumer({ groupId: 'metrics-consumer'});

const startConsumer = async () =>{
    await consumer.connect();

    await consumer.subscribe({ topic: 'cpu-metrics', fromBeginning: false});
    await consumer.subscribe({ topic: 'memory-metrics', fromBeginning: false});

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) =>{
            try {
                const metricData = JSON.parse(message.value.toString());
                if (topic === 'cpu-metrics'){
                    const point = new Point('cpu_usage')
                        .tag('name', metricData.name)
                        .floatField('usage', metricData.value);
                    writeApi.writePoint(point);
                } else if (topic === 'memory-metrics') {
                    const point = new Point('memory_usage')
                        .tag('name', metricData.name)
                        .floatField('usage', metricData.value);
                    writeApi.writePoint(point);
                }

                if (Math.random() < 0.1){
                    await writeApi.flush();
                }
            } catch (error) {
                console.error('Error processing Kafka message:', error);
            }
        },
    });
};


module.exports = { startConsumer };