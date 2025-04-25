const { getImageFromDrive } = require('../services/drive.service');

exports.getImage = async (req, res) => {
  // For the Google Drive Implementation (Cloud Pipeline) (V3)
  // Controller to fetch the image from google drive using the file id 
  try {
    const { fileId } = req.query;
    const imageData = await getImageFromDrive(fileId);
    res.json(imageData);
  } catch (error) {
    console.error('Drive error:', error);
    
    if (error.response && error.response.data) {
      const html = error.response.data.toString();
      if (html.includes('Virus scan warning')) {
        return res.status(400).json({ 
          error: 'Google Drive virus scan warning',
          solution: 'Try downloading manually first to acknowledge warning'
        });
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch image',
      details: error.message 
    });
  }
};