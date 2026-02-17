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
 * @param {string} controlId - The ID from the incoming MSH-10
 * @param {string} bedId - The Bed ID (e.g., ICU_01_01) extracted from PV1
 */
function createAck(controlId, bedId = "ICU_GENERAL") {
    // Generate HL7 compliant timestamp (YYYYMMDDHHMMSS)
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");

    // Dynamic MSH-6 (Receiving Facility) using the Bed ID
    const msh = `MSH|^~\\&|NODE_SERVER|HOSPITAL|PATMON|${bedId}|${timestamp}||ACK|${controlId}|P|2.6\r`;
    const msa = `MSA|AA|${controlId}\r`;

    return Buffer.concat([
        config.MLLP.VT,
        Buffer.from(msh + msa),
        config.MLLP.FS,
        config.MLLP.CR
    ]);
}

module.exports = createAck;