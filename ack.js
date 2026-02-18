// const config = require("./config");

// // Ensure the parameter name is 'controlId'
// function createAck(controlId) {
//     const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");

//     // Using 'controlId' here fixes the "not defined" error
//     const msh = `MSH|^~\\&|NODE_SERVER|HOSPITAL|PATMON|ICU1|${timestamp}||ACK|${controlId}|P|2.6\r`;
//     const msa = `MSA|AA|${controlId}\r`;

//     return Buffer.concat([
//         config.MLLP.VT,
//         Buffer.from(msh + msa),
//         config.MLLP.FS,
//         config.MLLP.CR
//     ]);
// }

// module.exports = createAck;

const config = require("./config");

/**
 * Creates a dynamic ACK message based on the incoming message
/**
 * Creates a fully dynamic ACK message
 * @param {string} controlId - Original MSH-10
 * @param {string} bedId - Original PV1-3
 * @param {object} meta - { hospital, version } from the original message
 */
function createAck(controlId, bedId, meta) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");

    // Mirror the hospital name and version from the meta object
    const msh = `MSH|^~\\&|NODE_SERVER|${meta.hospital}|PATMON|${bedId}|${timestamp}||ACK|${controlId}|P|${meta.version}\r`;   // Message Header
    const msa = `MSA|AA|${controlId}\r`;                                                                                       // Message ack
 
    return Buffer.concat([
        config.MLLP.VT,
        Buffer.from(msh + msa),
        config.MLLP.FS,
        config.MLLP.CR
    ]);
}

module.exports = createAck;





// function createAck(rawHl7) {
//     const lines = rawHl7.split(/\r|\n/);
//     const mshLine = lines.find(line => line.startsWith("MSH"));

//     if (!mshLine) {
//         throw new Error("No MSH segment found in message");
//     }

//     const fields = mshLine.split("|");

//     const sendingApp = fields[2];
//     const sendingFacility = fields[3];
//     const receivingApp = fields[4];
//     const receivingFacility = fields[5];
//     const controlId = fields[9];
//     const processingId = fields[10];
//     const version = fields[11];

//     const timestamp = new Date().toISOString()
//         .replace(/[-:]/g, "")
//         .split(".")[0];

//     const ackMessageType = "ACK^" + (fields[8]?.split("^")[1] || "R01");

//     const ack =
//         `MSH|^~\\&|${receivingApp}|${receivingFacility}|${sendingApp}|${sendingFacility}|${timestamp}||${ackMessageType}|${controlId}|${processingId}|${version}\r` +
//         `MSA|AA|${controlId}\r`;

//     return ack;
// }

// module.exports = createAck;
