const axios = require('axios');
require('dotenv').config();
const config = require('../config');
const sharp = require('sharp');

const GEMINI_API_KEY = config.GEMINI_API_KEY;
const GEMINI_MODEL = config.GEMINI_MODEL;

const OLLAMA_URL = process.env.OLLAMA_BASE_URL

const CUSTOM_URL = process.env.CUSTOM_MODEL_URL

async function analyzeImageFromGeminiUploadService(imageBuffer, mimeType) {
  // For the File Upload Functionality (Gemini Single Image)
  // Works for the image data being received from upload module (V1)
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  // Convert image to Base64
  const imageBase64 = imageBuffer.toString("base64");

  const requestBody = {
      contents: [
          {
              parts: [
                  { text: "Carefully analyze the provided paper image and determine whether it is 'Defective' or 'Not Defective'. Identify defects such as pen marks, marker marks, tears, burns, cuts, stain, holes, folds, discoloration, or any other inconsistencies with high precision, even for minor flaws. Provide a classification as either 'Defective' or 'Not Defective' along with the reason or detected issues. If the image is not of paper, respond with 'The uploaded image does not align with the scope of this project. Please provide an image of sheets for defect detection.' without any further analysis." },
                  { inlineData: { mimeType, data: imageBase64 } }
              ]
          }
      ]
  };

  try {
      const response = await axios.post(endpoint, requestBody, {
          headers: { "Content-Type": "application/json" }
      });

      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Error";
  } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error("Failed to classify image");
  }
};

async function analyzeImageWithOllama(imageBuffer) {
  try {
    // Check if Ollama is available
    const healthCheck = await axios.get(`${OLLAMA_URL}/api/version`, { timeout: 5000 });
    if (!healthCheck) {
      console.log(`Ollama service unavailable`);      
      throw new Error('Ollama service unavailable');
    }
    console.log('Ollama service is available');
    
    // Optimize the image
    const optimizedImage = await sharp(imageBuffer)
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    // Convert to base64
    const imageBase64 = optimizedImage.toString('base64');
    
    // Send request to Ollama
    console.log(`[${new Date().toISOString()}] Sending request to Ollama API...`);
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'gemma3:latest',
      prompt: "Carefully analyze the provided paper image and determine whether it is 'Defective' or 'Not Defective'. Identify defects such as marks, holes, folds, discoloration, or any other inconsistencies with high precision, even for minor flaws. Provide a classification as either 'Defective' or 'Not Defective' along with the reason or detected issues. If the image is not of paper, respond with 'The uploaded image does not align with the scope of this project. Please provide an image of sheets for defect detection.' without any further analysis.",
      images: [imageBase64],
      stream: false
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000
    });
    console.log(`[${new Date().toISOString()}] Received response from Ollama API`);
    return response.data.response || "Error analyzing the image";
  } catch (error) {
    console.error('Error processing image with Ollama:', error.message);
    
    // Simple retry with smaller image if it's likely a size issue
    if (error.message.includes('socket hang up') || 
    error.message.includes('timeout') || error.code === 'ECONNRESET') {
      console.log(`[${new Date().toISOString()}] Attempting with smaller image...`);
      try {
        const smallerImage = await sharp(imageBuffer)
          .resize({ width: 400, height: 400, fit: 'inside' })
          .jpeg({ quality: 60 })
          .toBuffer();
        
        const retryResponse = await axios.post(`${OLLAMA_URL}/api/generate`, {
          model: 'gemma3:latest',
          prompt: "Carefully analyze the provided paper image and determine whether it is 'Defective' or 'Not Defective'. Identify defects such as marks, holes, folds, discoloration, or any other inconsistencies with high precision, even for minor flaws. Provide a classification as either 'Defective' or 'Not Defective' along with the reason or detected issues. If the image is not of paper, respond with 'The uploaded image does not align with the scope of this project. Please provide an image of sheets for defect detection.' without any further analysis.",
          images: [smallerImage.toString('base64')],
          stream: false
        }, {
          timeout: 60000
        });
        
        return retryResponse.data.response;
      } catch (retryError) {
        console.error('Retry failed:', retryError.message);
      }
    }
    
    throw new Error('Failed to analyze image');
  }
}

async function analyzeImageFromCloudPipelineService(imageData) {
    // For the Google Drive Implementation (Cloud Pipeline)
    // Works for the image data being received from the appscript (V3)
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
        contents: [
            {
                parts: [
                    {
                      text: "Carefully analyze the provided paper image and determine whether it is 'Defective' or 'Not Defective'. Identify defects such as pen marks, marker marks, tears, burns, cuts, stain, holes, folds, discoloration, or any other inconsistencies with high precision, even for minor flaws. Provide a classification as either 'Defective' or 'Not Defective' along with the reason or detected issues. If the image is not of paper, respond with 'The uploaded image does not align with the scope of this project. Please provide an image of sheets for defect detection.' without any further analysis."
                    },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: imageData.split(',')[1]
                        }
                    }
                ]
            }
        ]
    };

    try {
        const response = await axios.post(endpoint, requestBody);
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Error communicating with Gemini API:", error.response?.data || error.message);
        throw new Error("Failed to analyze image");
    }
};

async function analyzeImageFromEdgePipelineService(base64Data) {
    // For the Edge Implementation using Gemini (Edge Pipeline using Gemini)
    // Works for the image data being received from the kafka (V5)

    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    
    const requestBody = {
      contents: [
        {
          parts: [
            { text: "Carefully analyze the provided paper image and determine whether it is 'Defective' or 'Not Defective'. Identify defects such as pen marks, marker marks, tears, burns, cuts, stain, holes, folds, discoloration, or any other inconsistencies with high precision, even for minor flaws. Provide a classification as either 'Defective' or 'Not Defective' along with the reason or detected issues. If the image is not of paper, respond with 'The uploaded image does not align with the scope of this project. Please provide an image of sheets for defect detection.' without any further analysis." },
            { inlineData: { mimeType: "image/jpeg", data: base64Data.split(',')[1] } }
          ]
        }
      ]
    };
  
    try {
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) throw new Error(`API error: ${response.status}`);
  
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No valid response from AI";
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error("Gemini API request failed");
    }
  }

async function analyzeImageFromEdgePipelineService_Custom(base64Data) {
    // For the Edge Implementation using Custom Model (Edge Pipeline using Custom Model)
    // Works for the image data being received from the kafka (V6)
  
    const endpoint = CUSTOM_URL;
  
    const requestBody = {
      data: base64Data.split(',')[1], // stripping data:image/jpeg;base64,
    };
  
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) throw new Error(`API error: ${response.status}`);
  
      const result = await response.json();
  
      return {
        annotatedImage: `data:image/jpeg;base64,${JSON.parse(result.data).image}`,
        defects: JSON.parse(result.data).defects || "No defects reported",
      };
    } catch (error) {
      console.error('Defect Detection API Error:', error);
      throw new Error("Defect Detection API request failed");
    }
  }

  async function checkOllamaAvailability() {
    // Helper function to check if Ollama is available
    try {
      // Try to hit the Ollama API endpoint
      await axios.get(`${OLLAMA_URL}/api/version`, { timeout: 2000 });
      return true;
    } catch (error) {
      console.error('Ollama health check failed:', error.message);
      return false;
    }
  }
  

module.exports = {
    analyzeImageFromGeminiUploadService,
    analyzeImageWithOllama,
    analyzeImageFromCloudPipelineService,
    analyzeImageFromEdgePipelineService,
    analyzeImageFromEdgePipelineService_Custom
};