const axios = require('axios');
const stream = require('stream');

exports.getImageFromDrive = async (fileId) => {
  // For the Google Drive Implementation (Cloud Pipeline) (V3)
  // Service to fetch the image from google drive using the file id 
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  const response = await axios({
    method: 'get',
    url: directUrl,
    responseType: 'stream',
    maxRedirects: 5 
  });

  return new Promise((resolve, reject) => {
    const chunks = [];
    response.data.on('data', (chunk) => chunks.push(chunk));
    response.data.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString('base64');
      const contentType = response.headers['content-type'] || 'image/jpeg';
      
      resolve({
        mimeType: contentType,
        data: `data:${contentType};base64,${base64}`
      });
    });
    response.data.on('error', reject);
  });
};