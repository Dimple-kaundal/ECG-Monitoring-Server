// const fs = require('fs');
// const path = require('path');

// function ensureDirectoryExistence(monitorIp) {
//     const safeIp = monitorIp.replace(/[:.]/g, '_');
//     const dir = path.join(__dirname, 'bed_data', safeIp);
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//     return dir;
// }

// function saveHl7Message(monitorIp, bedId, rawHl7) {
//     const dir = ensureDirectoryExistence(monitorIp);
//     const date = new Date().toISOString().split('T')[0];
//     const filePath = path.join(dir, `${bedId}_${date}.hl7`);
//     fs.appendFile(filePath, `${rawHl7}\n---\n`, (err) => {
//         if (err) console.error(`❌ HL7 Save Error:`, err);
//     });
// }

// function saveWaveformCsv(monitorIp, bedId, leadName, waveformArray) {
//     if (!waveformArray || waveformArray.length === 0) return;
//     const dir = ensureDirectoryExistence(monitorIp);
//     const date = new Date().toISOString().split('T')[0];
//     const filePath = path.join(dir, `WAVEFORM_${bedId}_${date}.csv`);
//     const ts = new Date().toISOString();
//     const rows = waveformArray.map(p => `${ts},${leadName},${p}`).join('\n') + '\n';
//     fs.appendFile(filePath, rows, (err) => {
//         if (err) console.error(`❌ CSV Save Error:`, err);
//     });
// }

// module.exports = { saveHl7Message, saveWaveformCsv };
const fs = require('fs');
const path = require('path');

function ensureDirectoryExistence(monitorIp) {
    const safeIp = monitorIp.replace(/[:.]/g, '_');
    const dir = path.join(__dirname, 'bed_data', safeIp);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function saveHl7Message(monitorIp, bedId, rawHl7) {
    const dir = ensureDirectoryExistence(monitorIp);
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(dir, `${bedId}_${date}.hl7`);
    fs.appendFile(filePath, `${rawHl7}\n---\n`, (err) => {
        if (err) console.error(`❌ HL7 Save Error:`, err);
    });
}

function saveWaveformCsv(monitorIp, bedId, leadName, waveformArray) {
    if (!waveformArray || waveformArray.length === 0) return;
    const dir = ensureDirectoryExistence(monitorIp);
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(dir, `WAVEFORM_${bedId}_${date}.csv`);
    const ts = new Date().toISOString();
    const rows = waveformArray.map(p => `${ts},${leadName},${p}`).join('\n') + '\n';
    fs.appendFile(filePath, rows, (err) => {
        if (err) console.error(`❌ CSV Save Error:`, err);
    });
}

module.exports = { saveHl7Message, saveWaveformCsv };