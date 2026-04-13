// const net = require('net');
// const parser = require('./parser');
// const createAck = require('./ack');
// const storage = require('./storage');
// const { Broadcast } = require('./websocket');
// const config = require('./config');

// const VT = '\x0b'; const FS = '\x1c'; const CR = '\x0d';

// const tcpServer = net.createServer((socket) => {
//     socket.setNoDelay(true); // Disable Nagle's Algorithm for real-time
//     const monitorIp = socket.remoteAddress.replace(/^.*:/, '');
//     console.log(`📡 Monitor Connected: ${monitorIp}`);

//     let buffer = '';

//     socket.on('data', (data) => {
//         buffer += data.toString();
//         while (buffer.includes(VT) && buffer.includes(FS + CR)) {
//             const start = buffer.indexOf(VT);
//             const end = buffer.indexOf(FS + CR);
//             const rawHl7 = buffer.substring(start + 1, end);
//             buffer = buffer.substring(end + 2);

//             try {
//                 const { vitals, waveforms } = parser.separateHl7Data(rawHl7);
//                 const controlId = parser.extractMessageControlId(rawHl7);
//                 const bedId = parser.extractBedId(rawHl7);
//                 const metadata = parser.extractHeaderMetadata(rawHl7);

//                 // 1. BROADCAST
//                 Broadcast({ monitorIP: monitorIp, vitals, waveforms, timestamp: new Date().toISOString() });

//                 // 2. ACK
//                 socket.write(createAck(controlId, bedId, metadata));

//                 // 3. BACKGROUND STORAGE
//                 setImmediate(() => {
//                     storage.saveHl7Message(monitorIp, bedId, rawHl7);
//                     Object.keys(waveforms).forEach(lead => {
//                         storage.saveWaveformCsv(monitorIp, bedId, lead, waveforms[lead]);
//                     });
//                 });

//             } catch (err) {
//                 console.error(`❌ Parsing Error: ${err.message}`);
//             }
//         }
//     });

//     socket.on('end', () => console.log(`🔌 Disconnected: ${monitorIp}`));
// });

// tcpServer.listen(config.TCP_PORT, '0.0.0.0', () => {
//     console.log(`🚀 TCP SERVER IS LISTENING ON 0.0.0.0:${config.TCP_PORT}`);
// });

const net = require('net');
const parser = require('./parser');
const createAck = require('./ack');
const storage = require('./storage'); // Ensure this is imported
const { Broadcast } = require('./websocket');
const config = require('./config');

const VT = 0x0b; 
const FS = 0x1c; 
const CR = 0x0d;

const tcpServer = net.createServer((socket) => {
    socket.setNoDelay(true);
    const monitorIp = socket.remoteAddress.replace(/^.*:/, '');
    console.log(`📡 Monitor Connected: ${monitorIp}`);

    let buffer = Buffer.alloc(0);

    socket.on('data', (data) => {
        // 1. Accumulate incoming data
        buffer = Buffer.concat([buffer, data]);

        while (true) {
            const start = buffer.indexOf(VT);
            const end = buffer.indexOf(FS);

            if (start !== -1 && end !== -1 && end > start) {
                // 2. Extract the block between MLLP markers
                const rawHl7Block = buffer.slice(start + 1, end).toString();
                buffer = buffer.slice(end + 2); // Move past FS and CR

                // 3. Handle Mirth sending multiple beds in one block
                const individualMessages = rawHl7Block.split(/(?=MSH|^MSH)/m);

                individualMessages.forEach(rawHl7 => {
                    const trimmedHl7 = rawHl7.trim();
                    if (!trimmedHl7) return;
                    
                    try {
                        // 4. Parse the HL7 message
                        const { vitals, waveforms } = parser.separateHl7Data(trimmedHl7);
                        const controlId = parser.extractMessageControlId(trimmedHl7);
                        const bedId = parser.extractBedId(trimmedHl7);
                        const metadata = parser.extractHeaderMetadata(trimmedHl7);

                        // 5. Broadcast to Flutter
                        Broadcast({ 
                            monitorIP: monitorIp, 
                            vitals, 
                            waveforms, 
                            timestamp: new Date().toISOString() 
                        });

                        // 6. Respond with ACK back to Mirth
                        socket.write(createAck(controlId, bedId, metadata));

                        // 7. 🔥 RESTORED: Save to bed_data folder
                        // We use setImmediate so the drawing doesn't lag while writing to disk
                        setImmediate(() => {
                            storage.saveHl7Message(monitorIp, bedId, trimmedHl7);
                            
                            // Save CSV for each waveform lead received
                            Object.keys(waveforms).forEach(lead => {
                                if (waveforms[lead] && waveforms[lead].length > 0) {
                                    storage.saveWaveformCsv(monitorIp, bedId, lead, waveforms[lead]);
                                }
                            });
                        });

                        console.log(`✅ Processed & Saved: ${bedId}`);

                    } catch (err) {
                        console.error(`❌ Parsing/Storage Error: ${err.message}`);
                    }
                });
            } else {
                break; 
            }
        }
    });

    socket.on('error', (err) => console.error("Socket Error:", err.message));
    socket.on('end', () => console.log(`🔌 Disconnected: ${monitorIp}`));
});

tcpServer.listen(config.TCP_PORT, '0.0.0.0', () => {
    console.log(`🚀 TCP SERVER ACTIVE ON PORT ${config.TCP_PORT}`);
});