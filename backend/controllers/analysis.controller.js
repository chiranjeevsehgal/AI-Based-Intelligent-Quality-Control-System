const { analyzeImageFromGeminiUploadService, analyzeImageWithOllama, analyzeImageFromCloudPipelineService, analyzeImageFromEdgePipelineService, analyzeImageFromEdgePipelineService_Custom } = require('../services/analysis.service');
const fs = require('fs');
const path = require('path');
const { broadcastToClients } = require('../controllers/websocket.controller');

const analyzeImageFromGeminiUpload = async (req, res) => {
  // For the File Upload Functionality (Gemini Single Image)
  // Works for the image data being received from upload module (V1)
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const result = await analyzeImageFromGeminiUploadService(req.file.buffer, req.file.mimetype);
    res.json({ classification: result });

  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


const analyzeImageFromOllamaUpload = async (req, res) => {
  // For the File Upload Functionality (Ollama Single Image)
  // Works for the image data being received from upload module (V2)
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log(`[${new Date().toISOString()}] Image uploaded: ${req.file.originalname}, Size: ${Math.round(req.file.size / 1024)} KB`);
    
    // Process image and send to Ollama
    const result = await analyzeImageWithOllama(req.file.buffer, req.file.mimetype);
    res.json({ response: result });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing image with Ollama:`, error);
    if (error.message === "Ollama service unavailable") {
      return res.status(503).json({ error: "Ollama service is not available. Please ensure Ollama is running locally." });
    } else if (error.message.includes("too large")) {
      return res.status(413).json({ error: "The image is too large for processing. Please upload a smaller image." });
    }
    res.status(500).json({ error: "Internal server error processing the image. Please try again with a different image." });
  }
};


const analyzeImageFromCloudPipeline = async (req, res) => {
  // For the Google Drive Implementation (Cloud Pipeline)
  // Works for the image data being received from the appscript (V3)
  try {
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const result = await analyzeImageFromCloudPipelineService(imageData);
    res.json({ result });
  } catch (error) {
    console.error("Gemini API error:", error.response?.data || error.message);
    res.status(500).json({ error: "Analysis failed" });
  }
};

const analyzeImageFromEdgePipeline = async (req, res) => {
  // For the Edge Implementation using Gemini (Edge Pipeline using Gemini)
  // Works for the image data being received from the kafka (V5)
  try {
    const { filePath } = req.body;

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ success: false, error: "Invalid or missing file path" });
    }

    const fileExt = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt)) {
      return res.status(400).json({ success: false, error: "Invalid file type" });
    }

    // Converts image to Base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
    const result = await analyzeImageFromEdgePipelineService(base64Data);
    const wss = req.app.get("wss");

    // Broadcast result to all connected WebSocket clients
    if (wss) {
      broadcastToClients(wss, { success: true, result });
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error(`Processing error: ${error.message}`);
    res.status(500).json({ success: false, error: "Image processing failed" });
  }
};

const analyzeImageFromEdgePipeline_Custom = async (req, res) => {
  // For the Edge Implementation using Custom Model (Edge Pipeline using Custom Model)
  // Works for the image data being received from the kafka (V6)
  try {
    const { filePath } = req.body;

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ success: false, error: "Invalid or missing file path" });
    }

    const fileExt = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt)) {
      return res.status(400).json({ success: false, error: "Invalid file type" });
    }

    // Converts image to Base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
    const result = await analyzeImageFromEdgePipelineService_Custom(base64Data);
    const wss = req.app.get("wss");

    // Broadcast result to all connected WebSocket clients
    if (wss) {
      broadcastToClients(wss, { success: true, result });
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error(`Processing error: ${error.message}`);
    res.status(500).json({ success: false, error: "Image processing failed" });
  }
};


module.exports = {
  analyzeImageFromGeminiUpload,
  analyzeImageFromOllamaUpload,
  analyzeImageFromCloudPipeline,
  analyzeImageFromEdgePipeline,
  analyzeImageFromEdgePipeline_Custom
};