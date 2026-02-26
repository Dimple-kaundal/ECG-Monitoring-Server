// module.exports={
//     TCP_PORT:5000,
//     TCP_HOST:'0.0.0.0',// for any IP
//     WS_PORT:8080,
//     STORAGE_DIR :"./bed_data",
//     ALLOWES_IPS:[], //ALLOWED_IPS: ['192.168.1.50']
//     MAX_BUFFER_SIZE:1024*20, //20KB
//     MLLP:{
//         VT: Buffer.from([0x0b]),//Vertical Tab      start block
//         FS: Buffer.from([0x1c]),// File seperator   End block
//         CR: Buffer.from([0x0d]),// Carriage Return   Trailer
//     }

// }
// config.js
module.exports = {
    TCP_PORT: 5000,
    TCP_HOST: '0.0.0.0',
    WS_PORT: 8080,
    STORAGE_DIR: "./bed_data",
    ALLOWES_IPS: [], 
    // INCREASE THIS: 20KB is too small for 5000 samples. Set to 1MB.
    MAX_BUFFER_SIZE: 1024 * 1024, 
    MLLP: {
        VT: Buffer.from([0x0b]),
        FS: Buffer.from([0x1c]),
        CR: Buffer.from([0x0d]),
    }
};
// medical monitor wrap messages in these special characters 
//Minimum Lowr Layer protocol