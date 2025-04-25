// For the Airflow + Kakfa Implementation

const axios = require('axios');
const { broadcastToClients }  = require('../controllers/websocket.controller');
const fs = require('fs');
const path = require('path');
const app = require('../app');
const config = require('../config');
const wss = app.get("wss");

async function handleFileChange(filePath) {
    // For the Edge Implementation using Gemini (Edge Pipeline using Gemini)
    // Works for the image data being received from the kafka (V5)
    try {
        broadcastToClients(wss, filePath)
        console.log("file path:\n"+filePath);
        
        const response = await axios.post('http://localhost:5001/api/process-image', { filePath });

        broadcastResult({
            fileName: path.basename(filePath),
            filePath,
            result: response.data.result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error(`Error processing ${filePath}:`);
        broadcastError({
            fileName: path.basename(filePath),
            error: error.response?.data?.error || error.message,
        });
    }
}

async function handleFileChange_custom(filePath) {
    // For the Edge Implementation using Custom Model (Edge Pipeline using Custom Model)
    // Works for the image data being received from the kafka (V6)
    try {
        broadcastResult_original({filePath})
        const response = await axios.post('http://localhost:5001/api/process-image-custom', { filePath });
        console.log("From airflow file service");
        console.log(response.data.success);
        broadcastResult({
            fileName: path.basename(filePath),
            filePath,
            result: response.data.success,
            defects:response.data.result.defects,
            annotated:response.data.result.annotatedImage,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error(`Error processing ${filePath}`);
        broadcastError({
            fileName: path.basename(filePath),
            error: error.response?.data?.error || error.message,
        });
    }
}

function broadcastResult(data) {
    // Helper function for the Edge Implementation to broadcast the response using Web Socket
    const filePath = data.filePath
    const fileBuffer = fs.readFileSync(filePath);

    const base64Image = fileBuffer.toString('base64');
    const mimeType = 'image/jpeg';
    const message = {
        type: 'LOCAL_FILE_RESULT',
        data: {
            ...data,
            previewData: `data:${mimeType};base64,${base64Image}`,
            status: 'completed'
        }
    };
    broadcastToClients(wss, message);
    
}

function broadcastResult_original(data) {
    // Helper function for the Edge Implementation to broadcast the original data using Web Socket
    const filePath = data.filePath
    const fileBuffer = fs.readFileSync(filePath);

    const base64Image = fileBuffer.toString('base64');
    const mimeType = 'image/jpeg';
    const message = {
        type: 'ORIGINAL',
        data: {
            previewData: `data:${mimeType};base64,${base64Image}`,
            filePath,
            status: 'processing'
        }
    };
    broadcastToClients(wss, message);
    
}

function broadcastError(data) {
    // Helper function for the Edge Implementation to broadcast the error using Web Socket
    const message = {
        type: 'LOCAL_FILE_ERROR',
        data: {
            ...data,
            timestamp: new Date().toISOString()
        }
    };
    broadcastToClients(wss, message);
}

module.exports = {
    handleFileChange,
    handleFileChange_custom
};