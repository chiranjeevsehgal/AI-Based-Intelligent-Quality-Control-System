const WebSocket = require("ws");
const app = require('./app');
const config = require('./config');
const websocketController = require('./controllers/websocket.controller');
const { initFileWatcher } = require('./services/file-watcher.service');
require("dotenv").config();

const server = app.listen(config.PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${config.PORT}`);
    console.log(`Watching folder: ${config.WATCH_FOLDER}`);
}
);

const wss = new WebSocket.Server({ server });

app.set("wss", wss);

// Initializing file watcher
initFileWatcher(wss);

const runConsumer = require("./consumers/folderMonitor");
runConsumer().catch(console.error);

wss.on("connection", websocketController.handleWebSocketConnection(wss));