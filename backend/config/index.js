require('dotenv').config();
const path = require('path');
const fs = require('fs');

// Ensure the input directory exists for node library monitoring
const inputDir = path.join(__dirname, '../input');
if (!fs.existsSync(inputDir)) {
  fs.mkdirSync(inputDir, { recursive: true });
}

module.exports = {
    PORT: process.env.PORT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    WATCH_FOLDER: path.join(__dirname, '../input'),
};