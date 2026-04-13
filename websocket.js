// const WebSocket = require("ws");
// const config = require("./config");

// const wss = new WebSocket.Server({ port: config.WS_PORT });

// function heartbeat() {
//     this.isAlive = true;
// }

// wss.on("connection", (ws, req) => {
//     const clientIP = req.socket.remoteAddress;
//     console.log(`💻 Flutter app connected: ${clientIP}`);

//     ws.isAlive = true;
//     ws.on("pong", heartbeat);

//     ws.on("close", () => console.log(`❌ Flutter disconnected: ${clientIP}`));
//     ws.on("error", (err) => console.error(`⚠️ WS Error: ${err.message}`));
// });

// const interval = setInterval(() => {
//     wss.clients.forEach((ws) => {
//         if (!ws.isAlive) return ws.terminate();
//         ws.isAlive = false;
//         ws.ping();
//     });
// }, 30000);

// wss.on("close", () => clearInterval(interval));

// function Broadcast(data) {
//     const message = JSON.stringify(data);
//     wss.clients.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//             setImmediate(() => {
//                 try {
//                     client.send(message);
//                 } catch (err) {
//                     console.error("Broadcast error:", err.message);
//                 }
//             });
//         }
//     });
// }

// module.exports = { Broadcast };

const WebSocket = require("ws");
const config = require("./config");

const wss = new WebSocket.Server({ port: config.WS_PORT });

function heartbeat() {
    this.isAlive = true;
}

wss.on("connection", (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    console.log(`💻 Flutter app connected: ${clientIP}`);

    ws.isAlive = true;
    ws.on("pong", heartbeat);

    ws.on("close", () => console.log(`❌ Flutter disconnected: ${clientIP}`));
    ws.on("error", (err) => console.error(`⚠️ WS Error: ${err.message}`));
});

const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on("close", () => clearInterval(interval));

function Broadcast(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            setImmediate(() => {
                try {
                    client.send(message);
                } catch (err) {
                    console.error("Broadcast error:", err.message);
                }
            });
        }
    });
}

module.exports = { Broadcast };