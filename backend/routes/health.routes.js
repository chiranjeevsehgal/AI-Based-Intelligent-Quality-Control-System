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

// Kafka health check
router.get('/kafka-health', async (req, res) => {
  try {
    const kafka = new Kafka({
      clientId: 'health-checker',
      brokers: ['kafka:9092']
    });

    const admin = kafka.admin();
    await admin.connect();
    const topics = await admin.listTopics();
    await admin.disconnect();

    res.status(200).json({
      status: 'healthy',
      service: 'kafka',
      topics: topics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Kafka health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      service: 'kafka',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ollama health check (proxy to avoid CORS issues)
// router.get('/ollama-health', async (req, res) => {
//   try {
//     const response = await axios.get('http://ollama:11434/api/version', { timeout: 5000 });
//     res.status(200).json({
//       status: 'healthy',
//       service: 'ollama',
//       version: response.data.version,
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('Ollama health check failed:', error);
//     res.status(500).json({
//       status: 'unhealthy',
//       service: 'ollama',
//       error: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// Airflow health check
router.get('/airflow-health', async (req, res) => {
  try {
    const response = await axios.get('http://airflow-webserver:8080/health', { timeout: 5000 });

    const isHealthy =
      response.status === 200 &&
      response.data?.metadatabase?.status === 'healthy' &&
      response.data?.scheduler?.status === 'healthy';

    res.status(isHealthy ? 200 : 500).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'airflow',
      details: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Airflow health check failed:', error.message);
    res.status(500).json({
      status: 'unhealthy',
      service: 'airflow',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


// Get health of all services
router.get('/all-services', async (req, res) => {
  try {
    
    // const [backendResult, kafkaResult, ollamaResult, airflowResult] = await Promise.allSettled([
    const [backendResult, kafkaResult, airflowResult] = await Promise.allSettled([
      
      Promise.resolve({ status: 'healthy', service: 'backend-api' }),

      // Check Kafka
      axios.get('http://localhost:5001/api/kafka-health')
        .then(response => ({ status: 'healthy', service: 'kafka' }))
        .catch(error => ({ status: 'unhealthy', service: 'kafka', error: error.message })),

      // Check Ollama
      // axios.get('http://localhost:5001/api/ollama-health')
      //   .then(response => ({ status: 'healthy', service: 'ollama', version: response.data.version }))
      //   .catch(error => ({ status: 'unhealthy', service: 'ollama', error: error.message })),

      // Check Airflow
      axios.get('http://localhost:5001/api/airflow-health')
        .then(response => ({ status: 'healthy', service: 'airflow' }))
        .catch(error => ({ status: 'unhealthy', service: 'airflow', error: error.message }))
    ]);
    
    const results = {
      backend: backendResult.value || backendResult.reason,
      kafka: kafkaResult.value || kafkaResult.reason,
      // ollama: ollamaResult.value || ollamaResult.reason,
      airflow: airflowResult.value || airflowResult.reason,
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