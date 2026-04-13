




// function extractMessageControlId(hl7) {
//   const lines = hl7.split(/[\r\n|\n|\r]/);
//   const mshLine = lines.find(line => line.startsWith("MSH")); 
//   if (!mshLine) return "UNKNOWN_ID";
//   const fields = mshLine.split("|");                                          
//   return fields[9] || "0";
// }

// function extractHeaderMetadata(hl7) {
//   const lines = hl7.split(/[\r\n|\n|\r]/);
//   const mshLine = lines.find(line => line.startsWith("MSH"));
//   if (!mshLine) return { hospital: "UNKNOWN", version: "2.6" };

//   const fields = mshLine.split("|");
//   return {
//     hospital: fields[3] || "HOSPITAL", 
//     version: fields[11] || "2.6"       
//   };
// }

// function extractBedId(hl7) {
//   const lines = hl7.split(/[\r\n|\n|\r]/);
//   const pv1Line = lines.find(line => line.trim().startsWith("PV1"));
//   if (!pv1Line) return "UNASSIGNED_BED";

//   const fields = pv1Line.split("|");
//   const location = fields[3]; 
//   return location ? location.replace(/\^/g, "_") : "UNASSIGNED_BED";
// }

// function decodeWaveform(encodedString) {
//   if (!encodedString) return [];
//   try {
//     const base64Data = encodedString.includes('^') ? encodedString.split('^').pop() : encodedString;
//     const buffer = Buffer.from(base64Data, "base64");
//     const numbers = [];
//     for (let i = 0; i < buffer.length - 1; i += 2) {
//       numbers.push(buffer.readInt16LE(i));
//     }
//     return numbers;
//   } catch (e) { return []; }
// }

// function separateHl7Data(rawHl7) {
//   const segments = rawHl7.split('\r').filter(line => line.trim().length > 0);
  
//   let vitals = { patientName: "Unknown", bedId: "Unassigned", HR: "--", SpO2: "--", BP: "--" };
//   let waveforms = {};

//   segments.forEach(seg => {
//     const f = seg.split('|');
//     const header = f[0].trim();

//     if (header === "PID") {
//       vitals.patientName = f[5]?.replace(/\^/g, " ") || "Unknown";
//     }
//     if (header === "PV1") {
//       vitals.bedId = f[3]?.replace(/\^/g, "_") || "Unassigned";
//     }
//     if (header === "OBX") {
//       const id = f[3];
//       const val = f[5];
      
//       if (id === "HR") vitals.HR = val;
//       if (id === "SPO2") vitals.SpO2 = val;
      
//       if (id === "ECG") waveforms["ECG"] = decodeWaveform(val);
//       if (id === "SPO2" && f[2] === "ED") waveforms["SPO2"] = decodeWaveform(val);
//       if (id === "RESP") waveforms["RESP"] = decodeWaveform(val);
//     }
//   });
  
//   return { vitals, waveforms };
// }

// module.exports = { 
//   extractMessageControlId, 
//   extractHeaderMetadata, 
//   extractBedId, 
//   separateHl7Data 
// };

const VT = 0x0b; 
const FS = 0x1c; 
const CR = 0x0d;

function extractMessageControlId(hl7) {
  const lines = hl7.split(/[\r\n|\n|\r]/);
  const mshLine = lines.find(line => line.startsWith("MSH"));
  if (!mshLine) return "UNKNOWN_ID";
  const fields = mshLine.split("|");
  return fields[9] || "0";
}

function extractHeaderMetadata(hl7) {
  const lines = hl7.split(/[\r\n|\n|\r]/);
  const mshLine = lines.find(line => line.startsWith("MSH"));
  if (!mshLine) return { hospital: "UNKNOWN", version: "2.6" };

  const fields = mshLine.split("|");
  return {
    hospital: fields[3] || "HOSPITAL", 
    version: fields[11] || "2.6"       
  };
}

function extractBedId(hl7) {
  const lines = hl7.split(/[\r\n|\n|\r]/);
  const pv1Line = lines.find(line => line.trim().startsWith("PV1"));
  if (!pv1Line) return "UNASSIGNED_BED";

  const fields = pv1Line.split("|");
  const location = fields[3]; 
  return location ? location.replace(/\^/g, "_") : "UNASSIGNED_BED";
}

function decodeWaveform(encodedString) {
  if (!encodedString) return [];
  try {
    const base64Data = encodedString.includes('^') ? encodedString.split('^').pop() : encodedString;
    const buffer = Buffer.from(base64Data, "base64");
    const numbers = [];
    for (let i = 0; i < buffer.length - 1; i += 2) {
      numbers.push(buffer.readInt16LE(i));
    }
    return numbers;
  } catch (e) { return []; }
}

function separateHl7Data(rawHl7) {
  const segments = rawHl7.split('\r').filter(line => line.trim().length > 0);
  
  let vitals = { patientName: "Unknown", bedId: "Unassigned", HR: "--", SpO2: "--", BP: "--" };
  let waveforms = {};

  segments.forEach(seg => {
    const f = seg.split('|');
    const header = f[0].trim();

    if (header === "PID") {
      vitals.patientName = f[5]?.replace(/\^/g, " ") || "Unknown";
    }
    if (header === "PV1") {
      vitals.bedId = f[3]?.replace(/\^/g, "_") || "Unassigned";
    }
    if (header === "OBX") {
      const type = f[2]; // NM (Numeric) or ED (Encapsulated Data)
      const id = f[3];
      const val = f[5];
      
      // Handle Numeric Vitals
      if (type === "NM") {
        if (id === "HR") vitals.HR = val;
        if (id === "SPO2") vitals.SpO2 = val;
      }
      
      // Handle Waveforms (ED)
      if (type === "ED") {
        if (id === "ECG") waveforms["ECG"] = decodeWaveform(val);
        if (id === "SPO2") waveforms["SPO2"] = decodeWaveform(val);
        if (id === "RESP") waveforms["RESP"] = decodeWaveform(val);
      }
    }
  });
  
  return { vitals, waveforms };
}

module.exports = { 
  extractMessageControlId, 
  extractHeaderMetadata, 
  extractBedId, 
  separateHl7Data 
};