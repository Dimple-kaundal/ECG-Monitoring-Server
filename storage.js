
// // module.exports= saveData;
// const fs = require("fs");
// const path = require("path");
// const config = require("./config");

// if (!fs.existsSync(config.STORAGE_DIR)) {
//     fs.mkdirSync(config.STORAGE_DIR, { recursive: true });
// }

// /**
//  * Saves HL7 logs and extracts waveforms to a separate CSV file
//  */
// function saveData(bedId, hl7, waveforms) {
//     const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//     const dateStr = new Date().toISOString().slice(0, 10);

//     // 1. SAVE RAW HL7 LOG (Daily file)
//     const hl7FileName = `${bedId}_${dateStr}.hl7`;
//     const hl7Path = path.join(config.STORAGE_DIR, hl7FileName);
//     const hl7Entry = `\n[${new Date().toISOString()}]\n${hl7}\n`;
    
//     fs.appendFileSync(hl7Path, hl7Entry);

//     // 2. SAVE WAVEFORM TO SEPARATE CSV
//     if (waveforms && Object.keys(waveforms).length > 0) {
//         const csvFileName = `WAVEFORM_${bedId}_${timestamp}.csv`;
//         const csvPath = path.join(config.STORAGE_DIR, csvFileName);
        
//         // Prepare CSV Header and Data (Format: LeadName, Value)
//         let csvContent = "Lead,Value\n";
        
//         for (const [leadName, dataPoints] of Object.entries(waveforms)) {
//             dataPoints.forEach(point => {
//                 csvContent += `${leadName},${point}\n`;
//             });
//         }

//         fs.writeFileSync(csvPath, csvContent);
//         console.log(` Waveform saved to: ${csvFileName}`);
//     }
// }

// module.exports = saveData;


// const fs = require("fs");
// const path = require("path");
// const config = require("./config");

// // Ensure the base storage directory exists
// if (!fs.existsSync(config.STORAGE_DIR)) {
//     fs.mkdirSync(config.STORAGE_DIR, { recursive: true });
// }

// function saveData(bedId, hl7, waveforms, clientIP) {
//     // 1. Setup IP-specific folder paths
//     const ipFolderName = clientIP.replace(/\./g, "_");
//     const ipFolderPath = path.join(config.STORAGE_DIR, ipFolderName);

//     if (!fs.existsSync(ipFolderPath)) {
//         fs.mkdirSync(ipFolderPath, { recursive: true });
//         console.log(`📁 Created NEW folder for IP: ${clientIP}`);
//     }

//     const dateStr = new Date().toISOString().slice(0, 10);
//     const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//     const hl7Path = path.join(ipFolderPath, `${bedId}_${dateStr}.hl7`);
    
//     // 2. Save Raw HL7 Data
//     console.log(`📝 Writing HL7 data to: ${hl7Path}`);
//     const hl7Entry = `\n[${new Date().toISOString()}]\n${hl7}\n`;
//     fs.appendFileSync(hl7Path, hl7Entry);

//     // 3. Save CSV Waveform (MOVED INSIDE THE FUNCTION)
//     if (waveforms && Object.keys(waveforms).length > 0) {
//         const csvPath = path.join(ipFolderPath, `WAVEFORM_${bedId}_${timestamp}.csv`);
//         console.log(`📊 Saving Waveform CSV to: ${csvPath}`);
        
//         let csvContent = "Lead,Value\n";
//         for (const [leadName, dataPoints] of Object.entries(waveforms)) {
//             dataPoints.forEach(point => {
//                 csvContent += `${leadName},${point}\n`;
//             });
//         }
//         fs.writeFileSync(csvPath, csvContent);
//     }
// }

// module.exports = saveData;


const fs = require("fs");
const path = require("path");
const config = require("./config");

// Ensure the base storage directory exists
if (!fs.existsSync(config.STORAGE_DIR)) {
    fs.mkdirSync(config.STORAGE_DIR, { recursive: true });
}

function saveData(bedId, hl7, waveforms, clientIP) {
    // 1. Setup IP-specific folder paths
    const ipFolderName = clientIP.replace(/\./g, "_");
    const ipFolderPath = path.join(config.STORAGE_DIR, ipFolderName);

    if (!fs.existsSync(ipFolderPath)) {
        fs.mkdirSync(ipFolderPath, { recursive: true });
        console.log(`📁 Created NEW folder for IP: ${clientIP}`);
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const hl7Path = path.join(ipFolderPath, `${bedId}_${dateStr}.hl7`);
    
    // 2. Save Raw HL7 Data (Appends to daily log)
    const hl7Entry = `\n[${new Date().toISOString()}]\n${hl7}\n`;
    fs.appendFileSync(hl7Path, hl7Entry);
    console.log(`📝 HL7 log updated: ${bedId}_${dateStr}.hl7`);

    // 3. Save CSV Waveform (Appends to daily CSV)
    if (waveforms && Object.keys(waveforms).length > 0) {
        const csvPath = path.join(ipFolderPath, `WAVEFORM_${bedId}_${dateStr}.csv`);
        
        // If file doesn't exist, create it with a header first
        if (!fs.existsSync(csvPath)) {
            fs.writeFileSync(csvPath, "Timestamp,Lead,Value\n");
        }
        
        let csvContent = "";
        const currentTime = new Date().toISOString();

        for (const [leadName, dataPoints] of Object.entries(waveforms)) {
            dataPoints.forEach(point => {
                // Adding a timestamp to each row so you know exactly when the wave happened
                csvContent += `${currentTime},${leadName},${point}\n`;
            });
        }
        
        // Use appendFileSync to keep all data in one file
        fs.appendFileSync(csvPath, csvContent); 
        
        console.log(`📊 Waveform data appended to: WAVEFORM_${bedId}_${dateStr}.csv`);
    }
}

module.exports = saveData;