const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Kafka } = require('kafkajs');

// Backend health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'backend-api',
    timestamp: new Date().toISOString()
  });
});

// Kafka health check function
async function checkKafkaHealth() {
  try {
    const kafka = new Kafka({
      clientId: 'health-checker',
      brokers: ['kafka:9092']
    });

    const admin = kafka.admin();
    await admin.connect();
    const topics = await admin.listTopics();
    await admin.disconnect();

    return {
      status: 'healthy',
      service: 'kafka',
      topics: topics,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Kafka health check failed:', error);
    return {
      status: 'unhealthy',
      service: 'kafka',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Kafka health check endpoint
router.get('/kafka-health', async (req, res) => {
  const result = await checkKafkaHealth();
  res.status(result.status === 'healthy' ? 200 : 500).json(result);
});

// Airflow health check function
async function checkAirflowHealth() {
  try {
    const response = await axios.get('http://airflow-webserver:8080/health', { timeout: 5000 });

    const isHealthy =
      response.status === 200 &&
      response.data?.metadatabase?.status === 'healthy' &&
      response.data?.scheduler?.status === 'healthy';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'airflow',
      details: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Airflow health check failed:', error.message);
    return {
      status: 'unhealthy',
      service: 'airflow',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Airflow health check endpoint
router.get('/airflow-health', async (req, res) => {
  const result = await checkAirflowHealth();
  res.status(result.status === 'healthy' ? 200 : 500).json(result);
});

// Get health of all services
router.get('/all-services', async (req, res) => {
  try {
    // Direct function calls instead of HTTP requests
    const backendResult = { status: 'healthy', service: 'backend-api' };
    const kafkaResult = await checkKafkaHealth();
    const airflowResult = await checkAirflowHealth();
    
    const results = {
      backend: backendResult,
      kafka: kafkaResult,
      airflow: airflowResult,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(results);
  } catch (error) {
    console.error('Error checking all services:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;