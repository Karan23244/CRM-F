// // zoneUtils.js
// export function calculateCTI(clicks, noi) {
//   return clicks ? (noi / clicks) * 100 : 0;
// }

// export function calculateITE(noe, noi) {
//   return noi ? (noe / noi) * 100 : 0;
// }

// export function calculateETC(nocrm, noe) {
//   return noe ? (nocrm / noe) * 100 : 0;
// }

// export function calculateFraudScore(rti, pi, noi) {
//   const realtimePercent = (rti / noi) * 100;
//   const p360Percent = (pi / noi) * 100;
//   const fraudScore = Math.max(realtimePercent, p360Percent);
//   return fraudScore; // correctly return the value
// }

// const round3 = (val) =>
//   val === null || val === undefined ? null : Number(Number(val).toFixed(3));

// export function getZoneDynamic(
//   fraud,
//   cti,
//   ite,
//   etc,
//   conditions = [],
//   ignores = {},
// ) {
//   console.log("conditions", conditions);
//   console.log(ignores);

//   const values = {
//     fraud: round3(fraud),
//     cti: round3(cti),
//     ite: round3(ite),
//     etc: round3(etc),
//   };

//   const inRange = (val, min, max) => {
//     if (val === null || min === null || max === null) return false;
//     return val >= round3(min) && val <= round3(max);
//   };

//   for (const cond of conditions) {
//     const checks = ["fraud", "cti", "ite", "etc"].map((key) => {
//       if (ignores[key]) return true;

//       const val = values[key];

//       const a = inRange(val, cond[`${key}_min`], cond[`${key}_max`]);
//       const b = inRange(val, cond[`${key}_min_2`], cond[`${key}_max_2`]);

//       return a || b;
//     });

//     if (checks.every(Boolean)) {
//       return cond.zone_color;
//     }
//   }

//   return "Red";
// }

// export function getZoneReason(
//   fraud,
//   cti,
//   ite,
//   etc,
//   conditions = [],
//   ignores = {},
// ) {
//   const values = {
//     fraud: round3(fraud),
//     cti: round3(cti),
//     ite: round3(ite),
//     etc: round3(etc),
//   };

//   const inRange = (val, min, max) => {
//     if (val === null || min === null || max === null) return false;
//     return val >= round3(min) && val <= round3(max);
//   };

//   let reasons = [];

//   for (const cond of conditions) {
//     let failed = [];

//     ["fraud", "cti", "ite", "etc"].forEach((key) => {
//       if (ignores[key]) return;

//       const val = values[key];

//       const a = inRange(val, cond[`${key}_min`], cond[`${key}_max`]);
//       const b = inRange(val, cond[`${key}_min_2`], cond[`${key}_max_2`]);

//       if (!(a || b)) {
//         failed.push(key.toUpperCase());
//       }
//     });

//     if (failed.length) {
//       reasons.push(`${cond.zone_color} zone failed: ${failed.join(", ")}`);
//     } else {
//       reasons.push(`${cond.zone_color} zone satisfied`);
//     }
//   }

//   return reasons;
// }

// // ✅ New helper for extra required percentages with debugging
// export function calculatePercentages(
//   { clicks, installs, noe, rti, pi, pe },
//   conditions = [],
// ) {
//   // console.log("📊 Input row:", { clicks, installs, noe, rti, pi, pe });
//   // console.log("📋 Conditions received:", conditions);

//   const NOI = clicks ? (installs / clicks) * 100 : 0;
//   const NOE = installs ? (noe / installs) * 100 : 0;
//   const RTI = installs ? (rti / installs) * 100 : 0;
//   const PI = installs ? (pi / installs) * 100 : 0;
//   const PE = noe ? (pe / noe) * 100 : 0;

//   function getMetricZone(value, key) {
//     // console.log(`➡️ Checking zone for ${key.toUpperCase()} = ${value}`);

//     // if (!conditions || !conditions.length) {
//     //   console.warn("⚠️ No conditions provided, defaulting to Gray");
//     //   return "Gray";
//     // }

//     for (const cond of conditions) {
//       const min = Number(cond[`${key}_min`]);
//       const max = Number(cond[`${key}_max`]);
//       // console.log(
//       //   `   🔎 Comparing ${value} with [${min}, ${max}] in zone ${cond.zone_color}`
//       // );

//       if (value >= min && value <= max) {
//         // console.log(`   ✅ Matched zone: ${cond.zone_color}`);
//         return cond.zone_color;
//       }
//     }

//     console.warn(`   ❌ No match for ${key}, defaulting to Red`);
//     return "Red"; // fallback if no match
//   }

//   const result = {
//     NOI: { value: NOI, zone: getMetricZone(NOI, "cti") },
//     NOE: { value: NOE, zone: getMetricZone(NOE, "ite") },
//     RTI: { value: RTI, zone: getMetricZone(RTI, "fraud") },
//     PI: { value: PI, zone: getMetricZone(PI, "fraud") },
//     PE: { value: PE, zone: getMetricZone(PE, "etc") },
//   };

//   // console.log("✅ Final calculated percentages with zones:", result);
//   return result;
// }
// // export function getZoneDynamic(
// //   fraud,
// //   cti,
// //   ite,
// //   etc,
// //   conditions = [],
// //   ignores = {}
// // ) {
// //   if (!conditions || conditions.length === 0) return "Red";

// //   for (const cond of conditions) {
// //     const fMin = Number(cond.fraud_min);
// //     const fMax = Number(cond.fraud_max);
// //     const cMin = Number(cond.cti_min);
// //     const cMax = Number(cond.cti_max);
// //     const iMin = Number(cond.ite_min);
// //     const iMax = Number(cond.ite_max);
// //     const eMin = Number(cond.etc_min);
// //     const eMax = Number(cond.etc_max);

// //     const fraudOk = ignores.fraud ? true : fraud >= fMin && fraud <= fMax;
// //     const ctiOk = ignores.cti ? true : cti >= cMin && cti <= cMax;
// //     const iteOk = ignores.ite ? true : ite >= iMin && ite <= iMax;
// //     const etcOk = ignores.etc ? true : etc >= eMin && etc <= eMax;

// //     if (fraudOk && ctiOk && iteOk && etcOk) {
// //       return cond.zone_color;
// //     }
// //   }
// //   return "Red";
// // }

// // export function getZoneReason(
// //   fraud,
// //   cti,
// //   ite,
// //   etc,
// //   conditions = [],
// //   ignores = {}
// // ) {
// //   if (!conditions || conditions.length === 0) {
// //     return ["No conditions found"];
// //   }

// //   let results = [];

// //   conditions.forEach((cond) => {
// //     const zone = cond.zone_color;

// //     const fMin = Number(cond.fraud_min);
// //     const fMax = Number(cond.fraud_max);
// //     const cMin = Number(cond.cti_min);
// //     const cMax = Number(cond.cti_max);
// //     const iMin = Number(cond.ite_min);
// //     const iMax = Number(cond.ite_max);
// //     const eMin = Number(cond.etc_min);
// //     const eMax = Number(cond.etc_max);

// //     const fraudOk = ignores.fraud ? true : fraud >= fMin && fraud <= fMax;
// //     const ctiOk = ignores.cti ? true : cti >= cMin && cti <= cMax;
// //     const iteOk = ignores.ite ? true : ite >= iMin && ite <= iMax;
// //     const etcOk = ignores.etc ? true : etc >= eMin && etc <= eMax;

// //     let failed = [];
// //     if (!fraudOk && !ignores.fraud) failed.push("Fraud");
// //     if (!ctiOk && !ignores.cti) failed.push("CTI");
// //     if (!iteOk && !ignores.ite) failed.push("ITE");
// //     if (!etcOk && !ignores.etc) failed.push("ETC");

// //     if (failed.length) {
// //       results.push(`${zone} zone - Not satisfied: ${failed.join(", ")}`);
// //     } else {
// //       results.push(`${zone} zone - all conditions satisfied`);
// //     }
// //   });

// //   return results;
// // }
// // Dynamic evaluation: loop through all DB condition rows
// // export function getZoneDynamic(fraud, cti, ite, etc, conditions = []) {
// //   if (!conditions || conditions.length === 0) return "Red";

// //   for (const cond of conditions) {
// //     const fMin = Number(cond.fraud_min);
// //     const fMax = Number(cond.fraud_max);
// //     const cMin = Number(cond.cti_min);
// //     const cMax = Number(cond.cti_max);
// //     const iMin = Number(cond.ite_min);
// //     const iMax = Number(cond.ite_max);
// //     const eMin = Number(cond.etc_min);
// //     const eMax = Number(cond.etc_max);

// //     const fraudOk = fraud >= fMin && fraud <= fMax;
// //     const ctiOk = cti >= cMin && cti <= cMax;
// //     const iteOk = ite >= iMin && ite <= iMax;
// //     const etcOk = etc >= eMin && etc <= eMax;

// //     // For your current ranges, all four metrics must match in a given row
// //     if (fraudOk && ctiOk && iteOk && etcOk) {
// //       return cond.zone_color;
// //     }
// //   }
// //   return "Red";
// // }

// // export function getZoneReason(fraud, cti, ite, etc, conditions = []) {
// //   if (!conditions || conditions.length === 0) {
// //     return ["No conditions found"];
// //   }

// //   let results = [];

// //   conditions.forEach((cond) => {
// //     const zone = cond.zone_color;

// //     const fMin = Number(cond.fraud_min);
// //     const fMax = Number(cond.fraud_max);
// //     const cMin = Number(cond.cti_min);
// //     const cMax = Number(cond.cti_max);
// //     const iMin = Number(cond.ite_min);
// //     const iMax = Number(cond.ite_max);
// //     const eMin = Number(cond.etc_min);
// //     const eMax = Number(cond.etc_max);

// //     const fraudOk = fraud >= fMin && fraud <= fMax;
// //     const ctiOk = cti >= cMin && cti <= cMax;
// //     const iteOk = ite >= iMin && ite <= iMax;
// //     const etcOk = etc >= eMin && etc <= eMax;

// //     let failed = [];
// //     if (!fraudOk) failed.push("Fraud");
// //     if (!ctiOk) failed.push("CTI");
// //     if (!iteOk) failed.push("ITE");
// //     if (!etcOk) failed.push("ETC");

// //     if (failed.length) {
// //       results.push(
// //         `${zone} zone - Not satisfied: ${failed.join(
// //           ", "
// //         )}`
// //       );
// //     } else {
// //       results.push(`${zone} zone - all conditions satisfied`);
// //     }
// //   });

// //   return results;
// // }

// zoneUtils.js

const round3 = (val) =>
  val === null || val === undefined || isNaN(val)
    ? null
    : Number(Number(val).toFixed(3));

/* =======================
   METRIC CALCULATIONS
======================= */

export function calculateCTI(clicks, noi) {
  if (!clicks || !noi) return 0;
  return (noi / clicks) * 100;
}

export function calculateITE(noe, noi) {
  if (!noi || !noe) return 0;
  return (noe / noi) * 100;
}

export function calculateETC(nocrm, noe) {
  if (!noe || !nocrm) return 0;
  return (nocrm / noe) * 100;
}

export function calculateFraudScore(rti, pi, installs) {
  if (!installs || installs <= 0) return 0;

  const realtimePercent = (rti / installs) * 100;
  const p360Percent = (pi / installs) * 100;
  console.log(realtimePercent, realtimePercent);
  return Math.max(realtimePercent, p360Percent);
}

/* =======================
   ZONE ENGINE (SINGLE SOURCE)
======================= */

const inRange = (val, min, max) => {
  if (
    val === null ||
    min === null ||
    max === null ||
    min === undefined ||
    max === undefined
  )
    return false;

  return round3(val) >= round3(min) && round3(val) <= round3(max);
};

export function getZoneDynamic(
  fraud,
  cti,
  ite,
  etc,
  conditions = [],
  ignores = {},
) {
  console.log("cond",conditions)
  if (!Array.isArray(conditions) || !conditions.length) return "Red";

  const values = {
    fraud: round3(fraud),
    cti: round3(cti),
    ite: round3(ite),
    etc: round3(etc),
  };

  for (const cond of conditions) {
    const ok = ["fraud", "cti", "ite", "etc"].every((key) => {
      if (ignores[key]) return true;

      const val = values[key];

      const a = inRange(val, cond[`${key}_min`], cond[`${key}_max`]);
      const b = inRange(val, cond[`${key}_min_2`], cond[`${key}_max_2`]);

      return a || b;
    });

    if (ok) return cond.zone_color;
  }

  return "Red";
}

export function getZoneReason(
  fraud,
  cti,
  ite,
  etc,
  conditions = [],
  ignores = {},
) {
  if (!Array.isArray(conditions) || !conditions.length) return [];

  const values = {
    fraud: round3(fraud),
    cti: round3(cti),
    ite: round3(ite),
    etc: round3(etc),
  };

  return conditions.map((cond) => {
    const failed = [];

    ["fraud", "cti", "ite", "etc"].forEach((key) => {
      if (ignores[key]) return;

      const val = values[key];
      const a = inRange(val, cond[`${key}_min`], cond[`${key}_max`]);
      const b = inRange(val, cond[`${key}_min_2`], cond[`${key}_max_2`]);

      if (!(a || b)) failed.push(key.toUpperCase());
    });

    return failed.length
      ? `${cond.zone_color} failed: ${failed.join(", ")}`
      : `${cond.zone_color} satisfied`;
  });
}

/* =======================
   MODAL % CALC (USES SAME ENGINE)
======================= */

export function calculatePercentages(
  { clicks, installs, noe, rti, pi, pe },
  conditions = [],
) {
  // ---------- Percentage calculations ----------
  const CTI = clicks ? (installs / clicks) * 100 : null;
  const ITE = installs ? (noe / installs) * 100 : null;
  const FRAUD = installs ? (rti / installs) * 100 : null;
  const PI_VAL = installs ? (pi / installs) * 100 : null;
  const ETC = noe ? (pe / noe) * 100 : null;

  const round3 = (v) => (v === null ? null : Number(v.toFixed(3)));

  const metrics = {
    cti: round3(CTI),
    ite: round3(ITE),
    fraud: round3(FRAUD),
    pi: round3(PI_VAL),
    etc: round3(ETC),
  };

  // ---------- Zone resolver (2 min–max ranges) ----------
  function getMetricZone(value, key) {
    if (value === null) return null;

    for (const cond of conditions) {
      const min1 = cond[`${key}_min`];
      const max1 = cond[`${key}_max`];
      const min2 = cond[`${key}_min_2`];
      const max2 = cond[`${key}_max_2`];

      const inRange1 =
        min1 !== null &&
        max1 !== null &&
        value >= Number(min1) &&
        value <= Number(max1);

      const inRange2 =
        min2 !== null &&
        max2 !== null &&
        value >= Number(min2) &&
        value <= Number(max2);

      if (inRange1 || inRange2) {
        return cond.zone_color;
      }
    }

    return "Red"; // fallback if no range matched
  }

  // ---------- Final result ----------
  const result = {
    NOI: { value: metrics.cti, zone: getMetricZone(metrics.cti, "cti") },
    NOE: { value: metrics.ite, zone: getMetricZone(metrics.ite, "ite") },
    RTI: {
      value: metrics.fraud,
      zone: getMetricZone(metrics.fraud, "fraud"),
    },
    PI: { value: metrics.pi, zone: getMetricZone(metrics.pi, "pi") },
    PE: { value: metrics.etc, zone: getMetricZone(metrics.etc, "etc") },
  };

  return result;
}
