const express = require('express');
const router = express.Router();
const driveController = require('../controllers/drive.controller');

// For the Google Drive Implementation (Cloud Pipeline) (V3)
router.get('/get-image', driveController.getImage);

module.exports = router;