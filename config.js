module.exports={
    TCP_PORT:5000,
    TCP_HOST:'0.0.0.0',// for any IP
    WS_PORT:8080,
    STORAGE_DIR :"./bed_data",
    ALLOWES_IPS:[],
    MAX_BUFFER_SIZE:1024*20,
    MLLP:{
        VT: Buffer.from([0x0b]),//Vertical Tab      start block
        FS: Buffer.from([0x1c]),// File seperator   End block
        CR: Buffer.from([0x0d]),// Carriage Return   Trailer
    }

}

// medical monitor wrap messages in these special characters 