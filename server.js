// const net = require("net");   //allow computer to talk to hardware 
// const config = require("./config");
// const { extractMessageControlId, extractBedId, separateHl7Data } = require("./parser");
// const createAck = require("./ack");
// const saveData = require("./storage");
// const { Broadcast } = require("./websocket");
// const server = net.createServer((socket) => {
//     const clientIP = socket.remoteAddress.replace(/^.*:/, "");
//     console.log(`New ICU Monitor Connected: ${clientIP}`);

//     let buffer = Buffer.alloc(0);

//     socket.on("data", (chunk) => {
//         buffer = Buffer.concat([buffer, chunk]);
//         let start;

//         while ((start = buffer.indexOf(config.MLLP.VT)) !== -1) {
//             const end = buffer.indexOf(config.MLLP.FS, start);
//             if (end === -1) break;

//             const rawHl7 = buffer.slice(start + 1, end).toString();

//             try {
//                 const controlId = extractMessageControlId(rawHl7);
//                 const bedId = extractBedId(rawHl7);
//                 const result = separateHl7Data(rawHl7);

//                 // Pass clientIP to storage
//                 saveData(bedId, rawHl7, result.waveforms, clientIP);

//                 // Pass monitorIP to Broadcast so Flutter knows which bed it is
//                 Broadcast({
//                     monitorIP: clientIP,
//                     bedId: bedId,
//                     vitals: result.vitals,
//                     waveforms: result.waveforms,
//                     timestamp: new Date().toISOString()
//                 });

//                 socket.write(createAck(controlId));

//             } catch (err) {
//                 console.error(" HL7 Processing Error:", err.message);
//             }
//             buffer = buffer.slice(end + 2);
//         }
//     });

//     socket.on("close", () => console.log(`🔌 Monitor Disconnected: ${clientIP}`));
// });

// // ... (listener remains the same)
// // Start the TCP Listener
// server.listen(config.TCP_PORT, config.TCP_HOST, () => {
//     console.log(`\n ECG BACKEND SYSTEM STARTED`);
//     console.log(`-------------------------------------------`);
//     console.log(` Monitor Listener : ${config.TCP_HOST}:${config.TCP_PORT}`);
//     console.log(` Flutter Broadcast: Port ${config.WS_PORT}`);
//     console.log(`Storage Folder   : ${config.STORAGE_DIR}`);
//     console.log(`-------------------------------------------\n`);
// });

// const net = require("net");
// const config = require("./config");
// const { extractMessageControlId, extractBedId, separateHl7Data } = require("./parser");
// const createAck = require("./ack");
// const saveData = require("./storage");
// const { Broadcast } = require("./websocket");

// const server = net.createServer((socket) => {
//     const clientIP = socket.remoteAddress.replace(/^.*:/, "");
//     console.log(`📡 Monitor Connected: ${clientIP}`);

//     let buffer = Buffer.alloc(0);

//     socket.on("data", (chunk) => {
//         console.log(`📥 Received ${chunk.length} bytes from ${clientIP}`);
//         const fs = require('fs');
//     fs.appendFileSync("debug_raw.txt", `--- FROM ${clientIP} ---\n${chunk.toString()}\n`);
//         buffer = Buffer.concat([buffer, chunk]);

//         // FORGIVING LOGIC: 
//         // If the buffer contains "MSH" but is missing MLLP tags, we manually wrap it.
//         let rawString = buffer.toString();
        
//         if (rawString.includes("MSH") && !rawString.includes(config.MLLP.VT.toString())) {
//             console.log("⚠️ Raw HL7 detected without MLLP wrappers. Processing anyway...");
//         }

//         let start;
//         // Search for the Start Block (VT) OR just start at MSH
//         while ((start = buffer.indexOf(config.MLLP.VT)) !== -1 || (start = buffer.indexOf("MSH")) !== -1) {
            
//             let end = buffer.indexOf(config.MLLP.FS, start);
            
//             // If no FS (End Block) is found, look for the end of the string (for manual testing)
//             if (end === -1) {
//                 if (buffer.length > start + 10) { 
//                     end = buffer.length; 
//                 } else {
//                     break; 
//                 }
//             }

//             const rawHl7 = buffer.slice(start, end).toString().replace(/[\x0b\x1c\x0d]/g, "").trim();

//             try {
//                 const cid = extractMessageControlId(rawHl7);
//                 const bid = extractBedId(rawHl7);
//                 const res = separateHl7Data(rawHl7);

//                 console.log(`✅ Processing Bed: ${bid} | HR: ${res.vitals.HR || 'N/A'}`);

//                 saveData(bid, rawHl7, res.waveforms, clientIP);
                
//                 Broadcast({
//                     monitorIP: clientIP,
//                     bedId: bid,
//                     vitals: res.vitals,
//                     waveforms: res.waveforms,
//                     timestamp: new Date().toISOString()
//                 });

//                 // Only send ACK if it looks like proper MLLP
//                 if (buffer.indexOf(config.MLLP.VT) !== -1) {
//                     socket.write(createAck(cid));
//                 }

//             } catch (err) {
//                 console.error("❌ Processing Error:", err.message);
//             }
            
//             // Clear the buffer after processing
//             buffer = buffer.slice(end + (end === buffer.length ? 0 : 2));
//             if (end === buffer.length) buffer = Buffer.alloc(0);
//         }
//     });

//     socket.on("close", () => console.log(`🔌 Disconnected: ${clientIP}`));
// });

// server.listen(config.TCP_PORT, config.TCP_HOST, () => {
//     console.log(`🚀 FORGIVING SERVER ACTIVE ON PORT ${config.TCP_PORT}`);
// });

const net = require('net');
const WebSocket = require('ws');
const parser = require('./parser');
const createAck = require('./ack');
const storage = require('./storage'); // Handles CSV and HL7 file saving

// ----------------------------------------------------------------------
// 1. WEBSOCKET SERVER (For Flutter Web Dashboard)
// ----------------------------------------------------------------------
const wss = new WebSocket.Server({ port: 8080 });
console.log('✅ WebSocket Hub active on Port 8080');

wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`💻 Flutter app connected: ${clientIp}`);
    
    ws.on('close', () => console.log('❌ Flutter app disconnected'));
});

// Function to broadcast data to all connected Flutter clients
function broadcastToDashboards(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// ----------------------------------------------------------------------
// 2. TCP SERVER (For Bedside Monitors/Hercules)
// ----------------------------------------------------------------------
const tcpServer = net.createServer((socket) => {
    const monitorIp = socket.remoteAddress.replace(/^.*:/, '');
    console.log(`📡 Monitor Connected: ${monitorIp}`);

    socket.on('data', (data) => {
        try {
            const rawHl7 = data.toString();
            console.log(`📥 Received ${data.length} bytes from ${monitorIp}`);

            // A. Extract Control ID and Bed ID for the ACK
            const controlId = parser.extractMessageControlId(rawHl7);
            const bedId = parser.extractBedId(rawHl7);

            // B. Parse Vitals and Waveforms for the Dashboard
            const { vitals, waveforms } = parser.separateHl7Data(rawHl7);
            
            // C. Save Data to Folders (storage.js)
            storage.saveHl7Message(monitorIp, bedId, rawHl7);
            if (waveforms['ECG_LEAD_II']) {
                storage.saveWaveformCsv(monitorIp, bedId, waveforms['ECG_LEAD_II']);
            }

            console.log(`✅ Processing Bed: ${bedId} | HR: ${vitals.HR}`);

            // D. Send Dynamic ACK back to Hercules
            const ack = createAck(controlId, bedId);
            socket.write(ack);

            // E. Broadcast to Flutter Web
            broadcastToDashboards({
                monitorIP: monitorIp,
                vitals: vitals,
                waveforms: waveforms,
                timestamp: new Date().toISOString()
            });

        } catch (err) {
            console.error(`❌ Parsing Error: ${err.message}`);
        }
    });

    socket.on('error', (err) => console.log(`⚠️ Socket Error: ${err.message}`));
    socket.on('end', () => console.log(`🔌 Monitor Disconnected: ${monitorIp}`));
});

tcpServer.listen(5000, '0.0.0.0', () => {
    console.log('🚀 TCP SERVER ACTIVE ON PORT 5000 (MLLP)');
});