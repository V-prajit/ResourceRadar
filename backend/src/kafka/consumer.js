const { Kafka } = require('kafkajs');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;
const influxUrl = process.env.INFLUXDB_URL || 'http://influxdb:8086/';
console.log(`Using InfluxDB URL: ${influxUrl}`);

const client = new InfluxDB({ url: influxUrl, token: token });
const writeApi = client.getWriteApi(org, bucket, 'ns', { flushInterval: 1000 });

// Use environment variable for Kafka brokers or default to kafka:29092
const brokers = process.env.KAFKA_BROKERS ? [process.env.KAFKA_BROKERS] : ['kafka:29092'];
console.log(`Consumer using Kafka brokers: ${brokers}`);

const kafka = new Kafka({
    clientId: 'resource-radar-consumer',
    brokers: brokers,
    retry: {
        initialRetryTime: 300,
        retries: 10,
        maxRetryTime: 30000,
        factor: 0.2,
    },
    connectionTimeout: 5000 // 5 seconds timeout
});

const consumer = kafka.consumer({ 
    groupId: 'metrics-consumer',
    sessionTimeout: 30000,
    rebalanceTimeout: 60000,
});

// Track connection state
let consumerConnected = false;
let isConnecting = false;

const startConsumer = async () => {
    console.log('Starting Kafka consumer...');
    
    // Connect to Kafka admin first to make sure topics exist
    const admin = kafka.admin();
    try {
        await admin.connect();
        
        // Verify that required topics exist
        console.log('Checking if required topics exist');
        const existingTopics = await admin.listTopics();
        const requiredTopics = ['cpu-metrics', 'memory-metrics'];
        
        const topicsToCreate = requiredTopics.filter(topic => !existingTopics.includes(topic));
        
        if (topicsToCreate.length > 0) {
            console.log(`Creating missing Kafka topics: ${topicsToCreate.join(', ')}`);
            await admin.createTopics({
                topics: topicsToCreate.map(topic => ({
                    topic,
                    numPartitions: 1,
                    replicationFactor: 1
                })),
                waitForLeaders: true
            });
        }
        
        await admin.disconnect();
    } catch (error) {
        console.error('Error checking/creating Kafka topics:', error);
        // Continue anyway, the consumer will retry connections
    }
    
    // Connect consumer with retry logic
    const connectConsumer = async () => {
        if (consumerConnected || isConnecting) return;
        
        isConnecting = true;
        try {
            await consumer.connect();
            console.log('Consumer connected to Kafka');
            
            await consumer.subscribe({ topic: 'cpu-metrics', fromBeginning: false });
            await consumer.subscribe({ topic: 'memory-metrics', fromBeginning: false });
            console.log('Consumer subscribed to topics');
            
            consumerConnected = true;
            
            await consumer.run({
                autoCommitInterval: 5000,
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const metricData = JSON.parse(message.value.toString());
                        console.log(`Received metric: ${topic}, value: ${metricData.value}`);
                        
                        if (topic === 'cpu-metrics') {
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

                        // Flush more frequently with more data
                        if (Math.random() < 0.2) {
                            await writeApi.flush();
                        }
                    } catch (error) {
                        console.error('Error processing Kafka message:', error);
                    }
                },
            });
            
            console.log('Consumer running');
        } catch (error) {
            console.error('Failed to start Kafka consumer:', error);
            consumerConnected = false;
            
            // Schedule reconnect
            setTimeout(connectConsumer, 5000);
        } finally {
            isConnecting = false;
        }
    };
    
    // Start initial connection
    await connectConsumer();
    
    // Set up reconnection logic
    consumer.on('consumer.disconnect', () => {
        console.log('Consumer disconnected from Kafka');
        consumerConnected = false;
        
        // Schedule reconnect
        setTimeout(connectConsumer, 5000);
    });
};

// Ensure InfluxDB data is flushed periodically
setInterval(() => {
    writeApi.flush().catch(err => console.error('Error flushing InfluxDB:', err));
}, 10000);

module.exports = { startConsumer };