const express = require('express');
const router = express.Router();
const { analyzeImageFromGeminiUpload, analyzeImageFromOllamaUpload, analyzeImageFromCloudPipeline, analyzeImageFromEdgePipeline, analyzeImageFromEdgePipeline_Custom} = require("../controllers/analysis.controller");

const multer = require("multer");

// Filter for image types
const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/jpeg' || 
      file.mimetype === 'image/png' || 
      file.mimetype === 'image/webp'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload JPEG, PNG or WEBP images.'), false);
    }
  };


// Multer config for gemini upload
const upload = multer({ 
    storage: multer.memoryStorage(), // Stores image in memory
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } //  file size limit: 5MB
});


// Multer config for ollama upload
const upload_ollama = multer({ 
    storage: multer.memoryStorage(), // Stores image in memory
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } //  file size limit: 5MB
});

// For the File Upload Functionality (Gemini Single Image)
// Works for the image data being received from upload module (V1)
router.post("/classify-image", upload.single("image"), analyzeImageFromGeminiUpload);

// For the File Upload Functionality (Ollama Single Image)
// Works for the image data being received from upload module (V2)
router.post("/classify-image-ollama", upload_ollama.single("image"), analyzeImageFromOllamaUpload);

// For the Google Drive Implementation (Cloud Pipeline)
// Works for the image data being received from the appscript (V3)
router.post('/analyze-image', analyzeImageFromCloudPipeline);

// For the Edge Implementation using Gemini (Edge Pipeline using Gemini)
// Works for the image data being received (V5)
router.post('/process-image', analyzeImageFromEdgePipeline);

// For the Edge Implementation using Custom Model (Edge Pipeline using Custom Model)
// Works for the image data being received from the kafka (V6)
router.post('/process-image-custom', analyzeImageFromEdgePipeline_Custom);

module.exports = router;