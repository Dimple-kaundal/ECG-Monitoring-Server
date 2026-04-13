const config = require("./config");

function createAck(controlId, bedId, meta) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
    const msh = `MSH|^~\\&|NODE_SERVER|${meta.hospital}|PATMON|${bedId}|${timestamp}||ACK|${controlId}|P|${meta.version}\r`;
    const msa = `MSA|AA|${controlId}\r`;

    return Buffer.concat([
        config.MLLP.VT,
        Buffer.from(msh + msa),
        config.MLLP.FS,
        config.MLLP.CR
    ]);
}

module.exports = createAck;