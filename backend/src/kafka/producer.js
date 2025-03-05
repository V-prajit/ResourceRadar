const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'resource-radar-producer',
    brokers: ['kafka:29092']
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