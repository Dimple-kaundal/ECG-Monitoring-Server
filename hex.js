const samples = 5000;
const waveform = Buffer.alloc(samples * 2); // 16-bit signed

// Generate ECG-like sine waveform
for (let i = 0; i < samples; i++) {
    const value = Math.floor(1000 * Math.sin(2 * Math.PI * i / 200));
    waveform.writeInt16LE(value, i * 2);
}

// Convert to Base64
const base64Waveform = waveform.toString("base64");

// Construct HL7
const hl7 =
`MSH|^~\\&|MON|HOSP|NODE|ICU|20260225||ORU^R01|123|P|2.6\r` +
`PID|1||||JOHN^DOE\r` +
`PV1|1|I|ICU_01_01\r` +
`OBX|1|NM|HR||75|bpm\r` +
`OBX|2|NM|SPO2||98|%\r` +
`OBX|3|NM|RR||18\r` +
`OBX|4|NM|TEMP||37.2\r` +
`OBX|5|ED|ECG_LEAD_II||^Base64^${base64Waveform}\r`;

// Wrap with MLLP
const mllpMessage = Buffer.concat([
    Buffer.from([0x0B]),
    Buffer.from(hl7, "utf8"),
    Buffer.from([0x1C, 0x0D])
]);

// Convert entire message to HEX (LIKE YOUR FORMAT)
const hexOutput = mllpMessage.toString("hex").toUpperCase();

console.log(hexOutput);