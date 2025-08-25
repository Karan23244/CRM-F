// zoneUtils.js
export function calculateCTI(clicks, noi) {
  return clicks ? (noi / clicks) * 100 : 0;
}

export function calculateITE(noe, noi) {
  return noi ? (noe / noi) * 100 : 0;
}

export function calculateETC(nocrm, noe) {
  return noe ? (nocrm / noe) * 100 : 0;
}

export function calculateFraudScore(rti, pi, installs) {
  const realtimePercent = (rti / installs) * 100;
  const p360Percent = (pi / installs) * 100;
  const fraudScore = Math.max(realtimePercent, p360Percent);
  return fraudScore; // correctly return the value
}

// Dynamic evaluation: loop through all DB condition rows
// export function getZoneDynamic(fraud, cti, ite, etc, conditions = []) {
//   if (!conditions || conditions.length === 0) return "Red";

//   for (const cond of conditions) {
//     const fMin = Number(cond.fraud_min);
//     const fMax = Number(cond.fraud_max);
//     const cMin = Number(cond.cti_min);
//     const cMax = Number(cond.cti_max);
//     const iMin = Number(cond.ite_min);
//     const iMax = Number(cond.ite_max);
//     const eMin = Number(cond.etc_min);
//     const eMax = Number(cond.etc_max);

//     const fraudOk = fraud >= fMin && fraud <= fMax;
//     const ctiOk = cti >= cMin && cti <= cMax;
//     const iteOk = ite >= iMin && ite <= iMax;
//     const etcOk = etc >= eMin && etc <= eMax;

//     // For your current ranges, all four metrics must match in a given row
//     if (fraudOk && ctiOk && iteOk && etcOk) {
//       return cond.zone_color;
//     }
//   }
//   return "Red";
// }

// export function getZoneReason(fraud, cti, ite, etc, conditions = []) {
//   if (!conditions || conditions.length === 0) {
//     return ["No conditions found"];
//   }

//   let results = [];

//   conditions.forEach((cond) => {
//     const zone = cond.zone_color;

//     const fMin = Number(cond.fraud_min);
//     const fMax = Number(cond.fraud_max);
//     const cMin = Number(cond.cti_min);
//     const cMax = Number(cond.cti_max);
//     const iMin = Number(cond.ite_min);
//     const iMax = Number(cond.ite_max);
//     const eMin = Number(cond.etc_min);
//     const eMax = Number(cond.etc_max);

//     const fraudOk = fraud >= fMin && fraud <= fMax;
//     const ctiOk = cti >= cMin && cti <= cMax;
//     const iteOk = ite >= iMin && ite <= iMax;
//     const etcOk = etc >= eMin && etc <= eMax;

//     let failed = [];
//     if (!fraudOk) failed.push("Fraud");
//     if (!ctiOk) failed.push("CTI");
//     if (!iteOk) failed.push("ITE");
//     if (!etcOk) failed.push("ETC");

//     if (failed.length) {
//       results.push(
//         `${zone} zone - Not satisfied: ${failed.join(
//           ", "
//         )}`
//       );
//     } else {
//       results.push(`${zone} zone - all conditions satisfied`);
//     }
//   });

//   return results;
// }

export function getZoneDynamic(fraud, cti, ite, etc, conditions = [], ignores = {}) {
  if (!conditions || conditions.length === 0) return "Red";

  for (const cond of conditions) {
    const fMin = Number(cond.fraud_min);
    const fMax = Number(cond.fraud_max);
    const cMin = Number(cond.cti_min);
    const cMax = Number(cond.cti_max);
    const iMin = Number(cond.ite_min);
    const iMax = Number(cond.ite_max);
    const eMin = Number(cond.etc_min);
    const eMax = Number(cond.etc_max);

    const fraudOk = ignores.fraud ? true : fraud >= fMin && fraud <= fMax;
    const ctiOk   = ignores.cti   ? true : cti   >= cMin && cti   <= cMax;
    const iteOk   = ignores.ite   ? true : ite   >= iMin && ite   <= iMax;
    const etcOk   = ignores.etc   ? true : etc   >= eMin && etc   <= eMax;

    if (fraudOk && ctiOk && iteOk && etcOk) {
      return cond.zone_color;
    }
  }
  return "Red";
}

export function getZoneReason(fraud, cti, ite, etc, conditions = [], ignores = {}) {
  if (!conditions || conditions.length === 0) {
    return ["No conditions found"];
  }

  let results = [];

  conditions.forEach((cond) => {
    const zone = cond.zone_color;

    const fMin = Number(cond.fraud_min);
    const fMax = Number(cond.fraud_max);
    const cMin = Number(cond.cti_min);
    const cMax = Number(cond.cti_max);
    const iMin = Number(cond.ite_min);
    const iMax = Number(cond.ite_max);
    const eMin = Number(cond.etc_min);
    const eMax = Number(cond.etc_max);

    const fraudOk = ignores.fraud ? true : fraud >= fMin && fraud <= fMax;
    const ctiOk   = ignores.cti   ? true : cti   >= cMin && cti   <= cMax;
    const iteOk   = ignores.ite   ? true : ite   >= iMin && ite   <= iMax;
    const etcOk   = ignores.etc   ? true : etc   >= eMin && etc   <= eMax;

    let failed = [];
    if (!fraudOk && !ignores.fraud) failed.push("Fraud");
    if (!ctiOk   && !ignores.cti)   failed.push("CTI");
    if (!iteOk   && !ignores.ite)   failed.push("ITE");
    if (!etcOk   && !ignores.etc)   failed.push("ETC");

    if (failed.length) {
      results.push(`${zone} zone - Not satisfied: ${failed.join(", ")}`);
    } else {
      results.push(`${zone} zone - all conditions satisfied`);
    }
  });

  return results;
}

