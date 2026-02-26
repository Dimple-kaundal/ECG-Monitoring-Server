
// const fs = require('fs');
// const path = require('path');

// /**
//  * Ensures the directory for a specific monitor exists.
//  * Organized as: bed_data / monitor_ip /
//  */
// function ensureDirectoryExistence(monitorIp) {
//     const dir = path.join(__dirname, 'bed_data', monitorIp.replace(/\./g, '_'));

//     // mkdirSync with recursive does NOT throw if folder already exists
//     try {
//         fs.mkdirSync(dir, { recursive: true });
//     } catch (err) {
//         console.error("Error creating directory:", err);
//     }

//     return dir;
// }

// /**
//  * Saves the raw HL7 message to a daily log file.
//  */
// function saveHl7Message(monitorIp, bedId, rawHl7) {
//     const dir = ensureDirectoryExistence(monitorIp);
//     const date = new Date().toISOString().split('T')[0];
//     const fileName = `${bedId}_${date}.hl7`;
//     const filePath = path.join(dir, fileName);

//     const content = rawHl7 + '\n---\n';

//     fs.appendFile(filePath, content, (err) => {
//         if (err) {
//             console.error("Error saving HL7 message:", err);
//         }
//     });
// }

// /**
//  * Saves waveform data into a daily CSV file.
//  * NOTE: Currently assigns same timestamp to batch.
//  * Can be extended later for sample-level timestamps.
//  */
// function saveWaveformCsv(monitorIp, bedId, leadName, waveformArray) {
//     if (!waveformArray || waveformArray.length === 0) return;

//     const dir = ensureDirectoryExistence(monitorIp);
//     const date = new Date().toISOString().split('T')[0];
//     const fileName = `WAVEFORM_${bedId}_${date}.csv`;
//     const filePath = path.join(dir, fileName);

//     const baseTimestamp = new Date().toISOString();

//     // Prepare rows
//     const rows = waveformArray
//         .map(point => `${baseTimestamp},${leadName},${point}`)
//         .join('\n') + '\n';

//     // Check if file exists
//     fs.access(filePath, fs.constants.F_OK, (err) => {

//         if (err) {
//             // File does not exist → create with header + rows
//             const header = 'Timestamp,Lead,Value\n';
//             fs.writeFile(filePath, header + rows, (writeErr) => {
//                 if (writeErr) {
//                     console.error("Error creating waveform CSV:", writeErr);
//                 }
//             });
//         } else {
//             // File exists → append only rows
//             fs.appendFile(filePath, rows, (appendErr) => {
//                 if (appendErr) {
//                     console.error("Error appending waveform CSV:", appendErr);
//                 }
//             });
//         }
//     });
// }

// module.exports = {
//     saveHl7Message,
//     saveWaveformCsv
// };
const fs = require('fs');
const path = require('path');

/**
 * Ensures the directory for a specific monitor exists.
 * Organized as: ./bed_data / monitor_ip_address /
 */
function ensureDirectoryExistence(monitorIp) {
    // 1. Use an absolute path to ensure files go to the right place
    const safeIp = monitorIp.replace(/[:.]/g, '_');
    const dir = path.join(__dirname, 'bed_data', safeIp);

    // 2. mkdirSync with { recursive: true } handles nested folders reliably
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
    return dir;
}
/**
 * Saves the raw HL7 message to a daily log file.
 * Automatically creates the file if it doesn't exist.
 */
function saveHl7Message(monitorIp, bedId, rawHl7) {
    console.log(`🛠️ Attempting to save for Bed: ${bedId} from IP: ${monitorIp}`);
    const dir = ensureDirectoryExistence(monitorIp);
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(dir, `${bedId}_${date}.hl7`);

    const content = `${rawHl7}\n---\n`;

    fs.appendFile(filePath, content, (err) => {
        if (err) {
            console.error(`❌ ERROR writing to ${filePath}:`, err);
        } else {
            console.log(`✅ SUCCESS: File written to ${filePath}`);
        }
    });
}
/**
 * Saves waveform data into a daily CSV file.
 * Uses a single write operation per batch for better performance.
 */
function saveWaveformCsv(monitorIp, bedId, leadName, waveformArray) {
    if (!waveformArray || waveformArray.length === 0) return;

    const dir = ensureDirectoryExistence(monitorIp);
    const date = new Date().toISOString().split('T')[0];
    const fileName = `WAVEFORM_${bedId}_${date}.csv`;
    const filePath = path.join(dir, fileName);

    const baseTimestamp = new Date().toISOString();

    // Check if file exists to determine if we need a header
    const fileExists = fs.existsSync(filePath);
    const header = fileExists ? '' : 'Timestamp,Lead,Value\n';

    // Map all points to a string block to minimize disk I/O
    const rows = waveformArray
        .map(point => `${baseTimestamp},${leadName},${point}`)
        .join('\n') + '\n';

    fs.appendFile(filePath, header + rows, (err) => {
        if (err) {
            console.error(`Error appending Waveform CSV for Bed ${bedId}:`, err);
        }
    });
}

module.exports = {
    saveHl7Message,
    saveWaveformCsv
};