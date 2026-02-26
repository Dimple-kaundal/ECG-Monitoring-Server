

// const net = require('net');
// const WebSocket = require('ws');
// const parser = require('./parser');
// const createAck = require('./ack');
// const storage = require('./storage'); 

// // ----------------------------------------------------------------------
// // 1. WEBSOCKET SERVER (For Flutter Web Dashboard)
// // ----------------------------------------------------------------------
// const wss = new WebSocket.Server({ port: 8080 });
// console.log('✅ WebSocket Hub active on Port 8080');

// wss.on('connection', (ws, req) => {
//     const clientIp = req.socket.remoteAddress;
//     console.log(`💻 Flutter app connected: ${clientIp}`);
//     ws.on('close', () => console.log('❌ Flutter app disconnected'));
// });

// function broadcastToDashboards(data) {
//     wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify(data));
//         }
//     });
// }

// // ----------------------------------------------------------------------
// // 2. TCP SERVER (For Bedside Monitors/Hercules)
// // ----------------------------------------------------------------------
// const tcpServer = net.createServer((socket) => {
//     const monitorIp = socket.remoteAddress.replace(/^.*:/, '');
//     console.log(`📡 Monitor Connected: ${monitorIp}`);

//     socket.on('data', (data) => {
//         // Log raw hex to verify MLLP wrappers (0b ... 1c0d)
//         console.log("Raw Data Hex:", data.toString('hex'));

//         try {
//             const rawHl7 = data.toString();
//             console.log(`📥 Received ${data.length} bytes from ${monitorIp}`);

//             // A. Extract Header Metadata (Hospital Name & HL7 Version)
//             // This replaces static strings with real data from the monitor
//             const metadata = parser.extractHeaderMetadata(rawHl7);
//             const controlId = parser.extractMessageControlId(rawHl7);
//             const bedId = parser.extractBedId(rawHl7);

//             // B. Parse Vitals and Waveforms
//             const { vitals, waveforms } = parser.separateHl7Data(rawHl7);

//             // C. Save Data to Folders
//             storage.saveHl7Message(monitorIp, bedId, rawHl7);
//             if (waveforms['ECG_LEAD_II']) {
//                 storage.saveWaveformCsv(monitorIp, bedId, waveforms['ECG_LEAD_II']);
//             }

//             console.log(`✅ Processing Bed: ${bedId} | Hospital: ${metadata.hospital} | Ver: ${metadata.version}`);

//             // D. Send Fully Dynamic ACK (Mirrors hospital and version)
//             const ack = createAck(controlId, bedId, metadata);
//             socket.write(ack);

//             // E. Broadcast to Flutter Web
//             broadcastToDashboards({
//                 monitorIP: monitorIp,
//                 vitals: vitals,
//                 waveforms: waveforms,
//                 timestamp: new Date().toISOString()
//             });

//         } catch (err) {
//             console.error(`❌ Parsing Error: ${err.message}`);
//         }
//     });

//     socket.on('error', (err) => console.log(`⚠️ Socket Error: ${err.message}`));
//     socket.on('end', () => console.log(`🔌 Monitor Disconnected: ${monitorIp}`));
// });

// tcpServer.listen(5000, '0.0.0.0', () => {
//     console.log('🚀 TCP SERVER ACTIVE ON PORT 5000 (MLLP)');
// });

    const net = require('net');
    const parser = require('./parser');
    const createAck = require('./ack');
    const storage = require('./storage');
    const { Broadcast } = require('./websocket'); // Using your dedicated WS module
    const config = require('./config');

    // MLLP Control Characters (Standard for Medical Monitors)
    const VT = '\x0b'; // Start Block
    const FS = '\x1c'; // End Block
    const CR = '\x0d'; // Carriage Return

    // ----------------------------------------------------------------------
    // TCP SERVER (MLLP - Bedside Monitors)
    // ----------------------------------------------------------------------
    const tcpServer = net.createServer((socket) => {
        socket.setKeepAlive(true,60000);
        socket.setNoDelay(true);
        socket.setTimeout(0);

        // Sanitize IP address
        const monitorIp = socket.remoteAddress.replace(/^.*:/, '');
        console.log(`📡 Monitor Connected: ${monitorIp}`);

        let buffer = '';

        socket.on('data', (data) => {
            console.log(`📊 Raw Data Received: ${data.length} bytes`);
            buffer += data.toString();

            // Process all complete HL7 messages in the buffer
            // A message is complete when it is wrapped in VT ... FS + CR
            while (buffer.includes(VT) && buffer.includes(FS + CR)) {
                const start = buffer.indexOf(VT);
                const end = buffer.indexOf(FS + CR);

                if (start === -1 || end === -1) break;

                // Extract the HL7 text between VT and FS
                const rawHl7 = buffer.substring(start + 1, end);
                
                // Remove the processed part from the buffer
                buffer = buffer.substring(end + 2);

                try {
                    console.log(`📥 Received HL7 from ${monitorIp}`);

                    // 1. Extract Metadata
                    const metadata = parser.extractHeaderMetadata(rawHl7);
                    const controlId = parser.extractMessageControlId(rawHl7);
                    const bedId = parser.extractBedId(rawHl7);

                    // 2. Parse Vitals & Waveforms
                    const { vitals, waveforms } = parser.separateHl7Data(rawHl7);

                    // 3. Persistent Storage
                    storage.saveHl7Message(monitorIp, bedId, rawHl7);
                    
                    Object.keys(waveforms).forEach(lead => {
                        storage.saveWaveformCsv(
                            monitorIp,
                            bedId,
                            lead,
                            waveforms[lead]
                        );
                    });

                    console.log(`✅ Bed: ${bedId} | Hospital: ${metadata.hospital} | Ver: ${metadata.version}`);

                    // 4. Send MLLP ACK (Fixed the ReferenceError and Double-Wrapping)
                    // createAck already wraps the message in VT, FS, and CR
                    const ackBuffer = createAck(controlId, bedId, metadata);
                    socket.write(ackBuffer);

                    // 5. Broadcast to Flutter Dashboard via WebSocket
                    Broadcast({
                        monitorIP: monitorIp,
                        vitals: vitals,
                        waveforms: waveforms,
                        timestamp: new Date().toISOString()
                    });

                } catch (err) {
                    console.error(`❌ Processing Error: ${err.message}`);
                }
            }

            // Safety: Prevent buffer from growing infinitely if malformed data arrives
            if (buffer.length > config.MAX_BUFFER_SIZE) {
                console.log("⚠️ Buffer overflow, clearing...");
                buffer = '';
            }
        });

        socket.on('error', (err) =>
            console.log(`⚠️ Socket Error (${monitorIp}): ${err.message}`)
        );

        socket.on('end', () =>
            console.log(`🔌 Monitor Disconnected: ${monitorIp}`)
        );
    });

    // Start the TCP Server
    tcpServer.listen(config.TCP_PORT, config.TCP_HOST, () => {
        console.log(`🚀 TCP SERVER ACTIVE ON PORT ${config.TCP_PORT} (MLLP)`);
    });



//Bedside Monitor
//       ↓
//MLLP TCP Server
//      ↓
//Buffer & Frame Extractor
//       ↓
//HL7 Parser
//       ↓
//Storage Layer
//       ↓
//ACK Generator
//       ↓
//WebSocket Broadcast
//       ↓
//Flutter ICU Wall
