// For the Node Library: Chokidar Implementation

const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const WebSocket = require("ws");
const axios = require('axios');
const { broadcastToClients }  = require('../controllers/websocket.controller');
const { analyzeImageFromEdgePipeline }  = require('../controllers/analysis.controller');
let watcher;

function initFileWatcher(wss) {
    // Using Node Library: Chokidar to monitor the files
    console.log("InitFile watcher");
    
    // Create watch folder if it doesn't exist
    if (!fs.existsSync(config.WATCH_FOLDER)) {
        fs.mkdirSync(config.WATCH_FOLDER, { recursive: true });
    }

    watcher = chokidar.watch(config.WATCH_FOLDER, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        usePolling: true,          // Add this option
        interval: 1000,   
        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100
        }
    });

    watcher
        .on('add', filePath => handleFileChange(filePath, wss))
        .on('change', filePath => handleFileChange(filePath, wss))
        .on('error', error => console.error('Watcher error:', error));

    return watcher;
}

async function handleFileChange(filePath, wss) {
    // Helper function to process the image and broadcast the response
    try {        
        console.log("In file change");
        
        const response = await analyzeImageFromEdgePipeline(filePath);
        console.log(response);
        
        broadcastResult(wss, {
            fileName: path.basename(filePath),
            filePath,
            result: response,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.log(error);
        
        console.error(`Error processing ${filePath}`);
        broadcastError(wss, {
            fileName: path.basename(filePath),
            error: error.response?.data?.error || error.message,
        });
    }
}

function broadcastResult(wss, data) {
    // Helper function for the Edge Implementation using Chokidar to broadcast the response using Web Socket
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

// Custom error function for the edge pipeline
function broadcastError(wss, data) {
    // Helper function for the Edge Implementation using Chokidar to broadcast the error using Web Socket
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
    initFileWatcher,
    handleFileChange
};