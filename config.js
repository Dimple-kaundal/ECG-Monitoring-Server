module.exports = {
    TCP_PORT: 5000,
    TCP_HOST: '0.0.0.0', // Listen on all network interfaces
    WS_PORT: 8081,
    STORAGE_DIR: "./bed_data",
    MAX_BUFFER_SIZE: 1024 * 1024, // 1MB for large waveform packets
    MLLP: {
        VT: Buffer.from([0x0b]), // Vertical Tab (Start of Message)
        FS: Buffer.from([0x1c]), // File Separator (End of Message)
        CR: Buffer.from([0x0d]), // Carriage Return (End of Block)
    }
};