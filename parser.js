// function extractMessageControlId(hl7) {
//   const lines = hl7.split(/[\r\n]/);
//   const mshLine = lines.find(line => line.startsWith("MSH"));
//   if (!mshLine) return "UNKNOWN_ID";
//   const fields = mshLine.split("|");
//   return fields[9] || "0";
// }

// // Your improved logic: Extracting Bed from PV1 segment
// function extractBedId(hl7) {
//     // Splits by any newline or carriage return
//     const lines = hl7.split(/[\r\n|\n|\r]/); 
//     const pv1Line = lines.find(line => line.trim().startsWith("PV1"));
//     if (!pv1Line) return "UNASSIGNED_BED";

//     const fields = pv1Line.split("|");
//     const location = fields[3]; 
//     return location ? location.replace(/\^/g, "_") : "UNASSIGNED_BED";
// }

// function decodeWaveform(encodedString) {
//   if (!encodedString) return [];
//   try {
//     const buffer = Buffer.from(encodedString, "base64");
//     const numbers = [];
//     for (let i = 0; i < buffer.length - 1; i += 2) {
//       // readInt16LE is standard; switch to BE if wave looks like noise
//       numbers.push(buffer.readInt16LE(i));
//     }
//     return numbers;
//   } catch (e) {
//     console.error("Waveform decode error:", e.message);
//     return [];
//   }
// }

// function separateHl7Data(rawHl7) {
//     // Instead of splitting by newline, we split by the segment headers
//     const segments = rawHl7.split(/(?=MSH|PV1|OBX)/); 
//     let vitals = {};
//     let waveforms = {};

//     segments.forEach(segment => {
//         const cleanSeg = segment.trim();
//         if (!cleanSeg.startsWith("OBX")) return;

//         const fields = cleanSeg.split("|");
//         const vitalName = fields[3]?.split("^")[0];

//         if (fields[2] === "NM" && vitalName) {
//             vitals[vitalName] = fields[5];
//         }

//         if (fields[2] === "ED" && vitalName) {
//             let base64Data = fields[5]?.includes("^") ? fields[5].split("^")[2] : fields[6];
//             if (base64Data) {
//                 waveforms[vitalName] = decodeWaveform(base64Data);
//             }
//         }
//     });
//     return { vitals, waveforms };
// }

// module.exports = { 
//     extractMessageControlId, 
//     extractBedId, 
//     separateHl7Data 
// };
/**
 * parser.js - HL7 Parsing Logic for ICU Monitoring
 */

// Utility to get the Message Control ID from MSH segment
// function extractMessageControlId(hl7) {
//   const lines = hl7.split(/[\r\n|\n|\r]/);
//   const mshLine = lines.find(line => line.startsWith("MSH"));
//   if (!mshLine) return "UNKNOWN_ID";
//   const fields = mshLine.split("|");
//   return fields[9] || "0";
// }

// // Utility to get the Bed/Location ID from PV1 segment
// function extractBedId(hl7) {
//   const lines = hl7.split(/[\r\n|\n|\r]/);
//   const pv1Line = lines.find(line => line.trim().startsWith("PV1"));
//   if (!pv1Line) return "UNASSIGNED_BED";

//   const fields = pv1Line.split("|");
//   // Extracts ICU^01^01 format and cleans it for filenames
//   const location = fields[3];
//   return location ? location.replace(/\^/g, "_") : "UNASSIGNED_BED";
// }

// // Decodes Base64 waveform strings into numbers
// function decodeWaveform(encodedString) {
//   if (!encodedString) return [];
//   try {
//     const buffer = Buffer.from(encodedString, "base64");
//     const numbers = [];
//     for (let i = 0; i < buffer.length - 1; i += 2) {
//       // Standard Little Endian Int16 decoding
//       numbers.push(buffer.readInt16LE(i));
//     }
//     return numbers;
//   } catch (e) { 
//     return []; 
//   }
// }

// // Main logic to separate HL7 text into JSON vitals and waveforms
// function separateHl7Data(rawHl7) {
//   // Splits text based on segment headers to handle "jammed" text
//   const segments = rawHl7.split(/(?=MSH|PID|PV1|OBX)/);

//   let vitals = {
//     patientName: "Unknown",
//     bedId: "Unassigned",
//     HR: "--",
//     SpO2: "--", // Matches Flutter PatientData model exactly
//     BP: "--",
//     Temp: "--",
//     RR: "--"
//   };
  
//   let sys = ""; 
//   let dia = "";
//   let waveforms = {};

//   segments.forEach(segment => {
//     const fields = segment.trim().split("|");

//     // 1. Extract Patient Identity
//     if (segment.startsWith("PID")) {
//       vitals.patientName = fields[5]?.replace(/\^/g, " ") || "Unknown";
//     }

//     // 2. Extract Location Information
//     if (segment.startsWith("PV1")) {
//       vitals.bedId = fields[3]?.replace(/\^/g, "_") || "Unassigned";
//     }

//     // 3. Process Observation Segments
//     if (segment.startsWith("OBX")) {
//       const type = fields[2];
//       const id = fields[3];
//       const val = fields[5];

//       // Handle Numeric Vitals (NM)
//       if (type === "NM") {
//         if (id.includes("HEART_RATE") || id === "HR") vitals.HR = val;
        
//         // Map SpO2 (Note the case-sensitivity for Flutter)
//         if (id.includes("PULS_OXIM_SAT_O2") || id.includes("SPO2")) vitals.SpO2 = val;
        
//         // Map Respiration and Temperature
//         if (id.includes("RESP_RATE") || id === "RR") vitals.RR = val;
//         if (id.includes("TEMP")) vitals.Temp = val;
        
//         // Build Blood Pressure string
//         if (id.includes("PRESS_BLD_NONINV_SYS")) sys = val;
//         if (id.includes("PRESS_BLD_NONINV_DIA")) dia = val;
        
//         if (sys && dia) {
//           vitals.BP = `${sys}/${dia}`;
//         }
//       }

//       // Handle Encapsulated Data (ED) for Waveforms
//       if (type === "ED") {
//         const leadName = id.includes("^") ? id.split("^")[0] : id;
        
//         // Extract Base64 from HL7 ED format (field 5 or 6 depending on system)
//         let base64Data = val;
//         if (val && val.includes("^")) {
//            const parts = val.split("^");
//            base64Data = parts[parts.length - 1];
//         }
        
//         if (base64Data) {
//           waveforms[leadName] = decodeWaveform(base64Data);
//         }
//       }
//     }
//   });

//   return { vitals, waveforms };
// }

// module.exports = { extractMessageControlId, extractBedId, separateHl7Data };




/**
 * parser.js - HL7 Parsing Logic for ICU Monitoring
 */

// Utility to get the Message Control ID from MSH segment
// function extractMessageControlId(hl7) {
//   const lines = hl7.split(/[\r\n|\n|\r]/);
//   const mshLine = lines.find(line => line.startsWith("MSH"));
//   if (!mshLine) return "UNKNOWN_ID";
//   const fields = mshLine.split("|");
//   return fields[9] || "0";
// }

// // Utility to get the Bed/Location ID from PV1 segment
// function extractBedId(hl7) {
//   const lines = hl7.split(/[\r\n|\n|\r]/);
//   const pv1Line = lines.find(line => line.trim().startsWith("PV1"));
//   if (!pv1Line) return "UNASSIGNED_BED";

//   const fields = pv1Line.split("|");
//   const location = fields[3]; // Typically ICU^01^01
//   return location ? location.replace(/\^/g, "_") : "UNASSIGNED_BED";
// }

// // Decodes Base64 waveform strings into Little Endian Int16 numbers
// function decodeWaveform(encodedString) {
//   if (!encodedString) return [];
//   try {
//     const buffer = Buffer.from(encodedString, "base64");
//     const numbers = [];
//     for (let i = 0; i < buffer.length - 1; i += 2) {
//       numbers.push(buffer.readInt16LE(i));
//     }
//     return numbers;
//   } catch (e) { 
//     return []; 
//   }
// }

// function separateHl7Data(rawHl7) {
//   // Split based on segment headers to handle "jammed" text (no newlines)
//   const segments = rawHl7.split(/(?=MSH|PID|PV1|OBX)/);

//   let vitals = {
//     patientName: "Unknown",
//     bedId: "Unassigned",
//     HR: "--",
//     SpO2: "--", // Matches Flutter PatientData model
//     BP: "--",
//     Temp: "--",
//     RR: "--"
//   };
  
//   let sys = ""; 
//   let dia = "";
//   let waveforms = {};

//   segments.forEach(segment => {
//     const fields = segment.trim().split("|");

//     if (segment.startsWith("PID")) {
//       vitals.patientName = fields[5]?.replace(/\^/g, " ") || "Unknown";
//     }

//     if (segment.startsWith("PV1")) {
//       vitals.bedId = fields[3]?.replace(/\^/g, "_") || "Unassigned";
//     }

//     if (segment.startsWith("OBX")) {
//       const type = fields[2];
//       const id = fields[3];
//       const val = fields[5];

//       if (type === "NM") {
//         if (id.includes("HEART_RATE") || id === "HR") vitals.HR = val;
//         if (id.includes("PULS_OXIM_SAT_O2") || id.includes("SPO2")) vitals.SpO2 = val;
//         if (id.includes("RESP_RATE") || id === "RR") vitals.RR = val;
//         if (id.includes("TEMP")) vitals.Temp = val;
        
//         // Track individual BP components to combine them
//         if (id.includes("PRESS_BLD_NONINV_SYS")) sys = val;
//         if (id.includes("PRESS_BLD_NONINV_DIA")) dia = val;
        
//         if (sys && dia) {
//           vitals.BP = `${sys}/${dia}`;
//         }
//       }

//       if (type === "ED") {
//         const leadName = id.includes("^") ? id.split("^")[0] : id;
        
//         // Extract base64 part regardless of how many carets (^) are used
//         let base64Data = val;
//         if (val && val.includes("^")) {
//            const parts = val.split("^");
//            base64Data = parts[parts.length - 1];
//         }
        
//         if (base64Data) {
//           waveforms[leadName] = decodeWaveform(base64Data);
//         }
//       }
//     }
//   });

//   return { vitals, waveforms };
// }

// module.exports = { extractMessageControlId, extractBedId, separateHl7Data };

/**
 * parser.js - Dynamic HL7 Parsing Logic
 */

// 1. Extracts the unique message ID (MSH-10)
function extractMessageControlId(hl7) {
  const lines = hl7.split(/[\r\n|\n|\r]/);
  const mshLine = lines.find(line => line.startsWith("MSH")); // find msh line header start with msh if not find then reurn un id
  if (!mshLine) return "UNKNOWN_ID";
  const fields = mshLine.split("|");                          // use as a seperator MSH|^~\&|MONITOR|HOSPITAL|...
  return fields[9] || "0";
}

// 2. Extracts Hospital Name (MSH-4) and HL7 Version (MSH-12)
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

// 3. Extracts Bed/Location ID from PV1 segment
function extractBedId(hl7) {
  const lines = hl7.split(/[\r\n|\n|\r]/);
  const pv1Line = lines.find(line => line.trim().startsWith("PV1"));
  if (!pv1Line) return "UNASSIGNED_BED";

  const fields = pv1Line.split("|");
  const location = fields[3]; 
  return location ? location.replace(/\^/g, "_") : "UNASSIGNED_BED";
}

// 4. Decodes Base64 waveform strings into numbers
function decodeWaveform(encodedString) {
  if (!encodedString) return [];
  try {
    const buffer = Buffer.from(encodedString, "base64");
    const numbers = [];
    for (let i = 0; i < buffer.length - 1; i += 2) {// each ecg sample is 2bytes
      numbers.push(buffer.readInt16LE(i));
    }
    return numbers;
  } catch (e) { return []; }
}

// 5. Separates HL7 text into JSON vitals and waveforms
function separateHl7Data(rawHl7) {
  const segments = rawHl7.split(/(?=MSH|PID|PV1|OBX)/);

  let vitals = {
    patientName: "Unknown",
    bedId: "Unassigned",
    HR: "--",
    SpO2: "--", 
    BP: "--",
    Temp: "--",
    RR: "--"
  };
  
  let sys = ""; 
  let dia = "";
  let waveforms = {};

  segments.forEach(segment => {
    const fields = segment.trim().split("|");

    if (segment.startsWith("PID")) {
      vitals.patientName = fields[5]?.replace(/\^/g, " ") || "Unknown";
    }

    if (segment.startsWith("PV1")) {
      vitals.bedId = fields[3]?.replace(/\^/g, "_") || "Unassigned";
    }

    if (segment.startsWith("OBX")) {
      const type = fields[2];
      const id = fields[3];
      const val = fields[5];

      if (type === "NM") {
        if (id.includes("HEART_RATE") || id === "HR") vitals.HR = val;
        if (id.includes("PULS_OXIM_SAT_O2") || id.includes("SPO2")) vitals.SpO2 = val;
        if (id.includes("RESP_RATE") || id === "RR") vitals.RR = val;
        if (id.includes("TEMP")) vitals.Temp = val;
        
        if (id.includes("PRESS_BLD_NONINV_SYS")) sys = val;
        if (id.includes("PRESS_BLD_NONINV_DIA")) dia = val;
        
        if (sys && dia) {
          vitals.BP = `${sys}/${dia}`;
        }
      }

      if (type === "ED") {
        const leadName = id.includes("^") ? id.split("^")[0] : id;
        let base64Data = val;
        if (val && val.includes("^")) {
           const parts = val.split("^");
           base64Data = parts[parts.length - 1];
        }
        
        if (base64Data) {
          waveforms[leadName] = decodeWaveform(base64Data);
        }
      }
    }
  });

  return { vitals, waveforms };
}

// Ensure all functions used by server.js are exported here
module.exports = { 
  extractMessageControlId, 
  extractHeaderMetadata, 
  extractBedId, 
  separateHl7Data 
};