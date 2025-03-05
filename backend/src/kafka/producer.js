const { Kafka } = require('kafkajs');

// Use environment variable for Kafka brokers or default to localhost
const brokers = process.env.KAFKA_BROKERS ? [process.env.KAFKA_BROKERS] : ['localhost:29092'];

const kafka = new Kafka({
    clientId: 'resource-radar-producer',
    brokers: brokers
})

const producer = kafka.producer();

const sendMetric = async (topic, metric) =>{
    if (!producer.isConnected){
        await producer.connect();
    }

    await producer.send({
        topic,
        messages: [
            { value: JSON.stringify(metric) },
        ],
    });
};

module.exports = { sendMetric };