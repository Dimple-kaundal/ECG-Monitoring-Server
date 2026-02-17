const config = require("./config");

// Ensure the parameter name is 'controlId'
function createAck(controlId) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");

    // Using 'controlId' here fixes the "not defined" error
    const msh = `MSH|^~\\&|NODE_SERVER|HOSPITAL|PATMON|ICU1|${timestamp}||ACK|${controlId}|P|2.6\r`;
    const msa = `MSA|AA|${controlId}\r`;

    return Buffer.concat([
        config.MLLP.VT,
        Buffer.from(msh + msa),
        config.MLLP.FS,
        config.MLLP.CR
    ]);
}

module.exports = createAck;