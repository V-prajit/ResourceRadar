const { Kafka } = require('kafkajs');

// Use environment variable for Kafka brokers or default to kafka:29092
const brokers = process.env.KAFKA_BROKERS ? [process.env.KAFKA_BROKERS] : ['kafka:29092'];
console.log(`Using Kafka brokers: ${brokers}`);

// Configure Kafka with retry settings
const kafka = new Kafka({
    clientId: 'resource-radar-producer',
    brokers: brokers,
    retry: {
        initialRetryTime: 300,
        retries: 10,
        maxRetryTime: 30000,
        factor: 0.2,
    },
    connectionTimeout: 5000 // 5 seconds timeout on connections
});

const producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000
});

// Track connection state
let isConnected = false;
let connectionAttemptInProgress = false;

// Connect to producer on module load
const connectProducer = async () => {
    if (isConnected || connectionAttemptInProgress) return;
    
    connectionAttemptInProgress = true;
    try {
        console.log('Attempting to connect to Kafka...');
        await producer.connect();
        isConnected = true;
        console.log('Successfully connected to Kafka');
        
        // Create topics if they don't exist
        const admin = kafka.admin();
        await admin.connect();
        
        const existingTopics = await admin.listTopics();
        const requiredTopics = ['cpu-metrics', 'memory-metrics'];
        
        const topicsToCreate = requiredTopics.filter(topic => !existingTopics.includes(topic));
        
        if (topicsToCreate.length > 0) {
            await admin.createTopics({
                topics: topicsToCreate.map(topic => ({
                    topic,
                    numPartitions: 1,
                    replicationFactor: 1
                })),
                waitForLeaders: true
            });
            console.log(`Created Kafka topics: ${topicsToCreate.join(', ')}`);
        }
        
        await admin.disconnect();
    } catch (error) {
        console.error('Failed to connect to Kafka:', error.message);
        isConnected = false;
    } finally {
        connectionAttemptInProgress = false;
    }
};

connectProducer().catch(e => console.error('Initial Kafka connection failed:', e.message));

// Reconnect if disconnected
producer.on('producer.disconnect', () => {
    console.log('Producer disconnected from Kafka');
    isConnected = false;
    connectProducer().catch(e => console.error('Kafka reconnection failed:', e.message));
});

// Handle successful connection
producer.on('producer.connect', () => {
    console.log('Producer connected to Kafka');
    isConnected = true;
});

const sendMetric = async (topic, metric) => {
    // Try to ensure we have a connection
    if (!isConnected) {
        await connectProducer();
    }
    
    // Still not connected after reconnection attempt? Queue message for later or handle gracefully
    if (!isConnected) {
        console.log(`Skipping metric for ${topic} - Kafka connection unavailable`);
        return; // Skip this metric rather than causing errors
    }
    
    try {
        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(metric) },
            ],
        });
    } catch (error) {
        console.error(`Error sending message to topic ${topic}:`, error.message);
        isConnected = false; // Force reconnection on next attempt
    }
};

module.exports = { sendMetric };