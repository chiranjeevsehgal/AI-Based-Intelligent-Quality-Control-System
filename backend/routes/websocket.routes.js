const express = require('express');
const router = express.Router();
const websocketController = require('../controllers/websocket.controller');

// For the Google Drive Implementation (Cloud Pipeline) (V3)
// To get an update from App Script, if there is some change in google drive
router.post("/webhook", (req, res) => websocketController.handleWebhook(req, res, req.app.get("wss")));


module.exports = router;