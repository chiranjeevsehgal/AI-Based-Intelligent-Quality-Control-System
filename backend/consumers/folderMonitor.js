const kafka = require("../config/kafka");
const { handleFileChange, handleFileChange_custom }  = require('../services/airflow.service');

const consumer = kafka.consumer({ groupId: "folder-monitor-group" });

const runConsumer = async () => {
    await consumer.connect();
    console.log("Kafka Consumer connected ✅");

    await consumer.subscribe({ topic: "folder-monitor", fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(`📥 Received message: ${message.value.toString()}`);
            const parsedMessage = JSON.parse(message.value.toString());
            // Gemini handling
            try{
                const windowsPath = parsedMessage.windows_path;
                handleFileChange(windowsPath)
            }
            catch (error) {
                console.error("Invalid JSON received:", message.value.toString());
            }

            //  Custom handling
            try{
                const windowsPath = parsedMessage.windows_path;
                handleFileChange_custom(windowsPath)
            }
            catch (error) {
                console.error("Invalid JSON received:", message.value.toString());
            }
        },
    });
};

module.exports = runConsumer
