
// const net = require('net');

// function generateECGMessage() {
//     const samples = [];
//     const sampleRate = 500; // Matches your app's sampleRate
    
//     // Generate exactly 1 second of data
//     for (let i = 0; i < sampleRate; i++) {
//         let phase = i % 250; // Roughly 120bpm
//         let val = 500; // Baseline

//         // Moderated R-wave (The spike)
//         if (phase >= 10 && phase <= 20) {
//             val += (phase - 10) * 25; // R-wave up (Moderate peak of 250)
//         } else if (phase > 20 && phase <= 30) {
//             val += 250 - (phase - 20) * 30; // S-wave down
//         }
        
//         // Natural noise
//         val += (Math.random() - 0.5) * 8;
//         samples.push(Math.floor(val));
//     }
    
//     const buf = Buffer.alloc(samples.length * 2);
//     samples.forEach((s, i) => buf.writeInt16LE(s, i * 2));
//     const base64Waveform = buf.toString('base64');

//     const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
//     const msh = `MSH|^~\\&|EMULATOR|HOSPITAL|PATMON|ICU_01_01|${timestamp}||ORU^R01|123|P|2.6\r`;
//     const pid = `PID|1||||DOE^JOHN\r`;
//     const pv1 = `PV1|1|I|ICU_01_01\r`;
//     const obxVitals = `OBX|1|NM|HEART_RATE||72|bpm\r`;
//     const obxWave = `OBX|2|ED|ECG_LEAD_II||^^^Base64^${base64Waveform}\r`;

//     const fullMessage = msh + pid + pv1 + obxVitals + obxWave;
    
//     return Buffer.concat([
//         Buffer.from([0x0b]), 
//         Buffer.from(fullMessage),
//         Buffer.from([0x1c, 0x0d])
//     ]);
// }

// const client = new net.Socket();
// client.connect(5000, '127.0.0.1', () => {
//     console.log('--- EMULATOR CONNECTED ---');
//     setInterval(() => {
//         const packet = generateECGMessage(50);
//         client.write(packet);
//         console.log(`[${new Date().toLocaleTimeString()}] Sent 500 samples (1.0s)`);
//     }, 100);
// });
const net = require('net');

let currentIdx = 0;
const SAMPLE_RATE = 500;
const TICK_INTERVAL = 100;
const SAMPLES_PER_TICK = (SAMPLE_RATE / 1000) * TICK_INTERVAL;

function generateSample(type, index) {
    let val = 0;
    const phase = index % 500;
    switch (type) {
        case 'ECG':
            if (phase >= 10 && phase <= 20) val = (phase - 10) * 150;
            else if (phase > 20 && phase <= 30) val = 1500 - (phase - 20) * 180;
            else if (phase > 30 && phase <= 40) val = -300 + (phase - 30) * 30;
            else if (phase > 150 && phase <= 200) val = Math.sin((phase - 150) * Math.PI / 50) * 200;
            break;
        case 'SPO2': val = Math.sin(index * 0.1) * 500 + Math.sin(index * 0.05) * 200; break;
        case 'RESP': val = Math.sin(index * 0.02) * 800; break;
    }
    return Math.floor(val + (Math.random() - 0.5) * 20);
}

function getWaveformChunk(type, size) {
    const buffer = Buffer.alloc(size * 2);
    for (let i = 0; i < size; i++) {
        buffer.writeInt16LE(generateSample(type, currentIdx + i), i * 2);
    }
    return buffer.toString('base64');
}

const client = new net.Socket();
client.connect(5000, '10.228.12.123', () => {
    console.log('📡 Streaming Waveforms & Vitals to Server...');
    setInterval(() => {
        const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
        
        // 1. Core HL7 Segments
        const msh = `MSH|^~\\&|EMULATOR|HOSPITAL|PATMON|ICU_01_01|${timestamp}||ORU^R01|${Date.now()}|P|2.6\r`;
        const pid = `PID|1||||DOE^JOHN\r`;
        const pv1 = `PV1|1|I|ICU_01_01\r`;
        
        // 2. Waveform Segments (ED Type)
        const obxECG = `OBX|1|ED|ECG||^^^Base64^${getWaveformChunk('ECG', SAMPLES_PER_TICK)}\r`;
        const obxSPO2 = `OBX|2|ED|SPO2||^^^Base64^${getWaveformChunk('SPO2', SAMPLES_PER_TICK)}\r`;
        const obxRESP = `OBX|3|ED|RESP||^^^Base64^${getWaveformChunk('RESP', SAMPLES_PER_TICK)}\r`;

        // 3. ADDED: Numeric Vitals Segments (NM Type)
        // These will replace the "--" in your Flutter UI
        const hrVal = Math.floor(70 + Math.random() * 5);   // Simulated HR ~72
        const spo2Val = Math.floor(97 + Math.random() * 2); // Simulated SpO2 ~98
        const rrVal = Math.floor(16 + Math.random() * 2);   // Simulated RR ~17
        const tempVal = (36.6 + Math.random() * 0.5).toFixed(1); // Simulated Temp ~36.8

        const vitHR = `OBX|4|NM|HR||${hrVal}|bpm|||||F\r`;
        const vitSPO2 = `OBX|5|NM|SPO2||${spo2Val}|%|||||F\r`;
        const vitRR = `OBX|6|NM|RR||${rrVal}|bpm|||||F\r`;
        const vitTEMP = `OBX|7|NM|TEMP||${tempVal}|C|||||F\r`;

        // Combine all segments into the full message
        const fullHL7 = msh + pid + pv1 + obxECG + obxSPO2 + obxRESP + vitHR + vitSPO2 + vitRR + vitTEMP;

        // Wrap in MLLP and send
        client.write(Buffer.concat([
            Buffer.from([0x0b]), 
            Buffer.from(fullHL7), 
            Buffer.from([0x1c, 0x0d])
        ]));

        currentIdx += SAMPLES_PER_TICK;
    }, TICK_INTERVAL); 
});