const WebSocket = require("ws");
const config = require("./config");

const wss = new WebSocket.Server({ port: config.WS_PORT });

// --- Heartbeat Logic for Web/Mobile Stability ---
function Heartbeat() {
    this.isAlive = true;
}
wss.on("connection", (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    console.log(`Flutter app connected ${clientIP}`);
    ws.isAlive = true;
    ws.on('pong', Heartbeat);
    ws.on("close", () => {
        console.log(`flutter Disconnected ${clientIP}`);
    });

    ws.on('error', (err) => {
        console.error(`Websocket Error (${clientIP}):`, err.message);
    });
});
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate(); // if device dsnt response then it cuts the wire
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

function Broadcast(data) {
    const message = JSON.stringify(data); 

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
            } catch (err) {
                console.error("Broadcast and erros", err.message);
            }
        }
    });
}
console.log(`webSocket Hub active on Port ${config.WS_PORT}`);
wss.on('Close', () => clearInterval(interval));
module.exports = { Broadcast };