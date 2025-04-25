const { Kafka } = require("kafkajs");
require("dotenv").config();

const kafka = new Kafka({
    clientId: "my-consumer",
    brokers: [process.env.KAFKA_BROKER],
    retry: {
        initialRetryTime: 1000,
        retries: 10
    }

});

module.exports = kafka;
