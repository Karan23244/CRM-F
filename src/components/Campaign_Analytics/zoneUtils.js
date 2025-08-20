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
export function getZoneDynamic(fraud, cti, ite, etc, conditions = []) {
  console.log("Evaluating Zone with conditions:", conditions); // just for debugging
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

    const fraudOk = fraud >= fMin && fraud <= fMax;
    const ctiOk = cti >= cMin && cti <= cMax;
    const iteOk = ite >= iMin && ite <= iMax;
    const etcOk = etc >= eMin && etc <= eMax;

    // For your current ranges, all four metrics must match in a given row
    if (fraudOk && ctiOk && iteOk && etcOk) {
      return cond.zone_color;
    }
  }
  return "Red";
}
