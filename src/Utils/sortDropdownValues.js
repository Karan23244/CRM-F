import dayjs from "dayjs";

/**
 * Sort dropdown/filter values in Excel-like order
 * Rules:
 * 1. "-" always at bottom
 * 2. Numbers → numeric sort
 * 3. Dates (YYYY-MM-DD) → date sort
 * 4. Strings → case-insensitive A–Z
 */
export const sortDropdownValues = (values = []) => {
  return [...values].sort((a, b) => {
    // Normalize empty values
    const valA = a ?? "-";
    const valB = b ?? "-";

    // 1️⃣ Keep "-" at the bottom
    if (valA === "-" && valB !== "-") return 1;
    if (valB === "-" && valA !== "-") return -1;
    if (valA === "-" && valB === "-") return 0;

    // 2️⃣ Numeric sort
    const numA = Number(valA);
    const numB = Number(valB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    // 3️⃣ Date sort (YYYY-MM-DD)
    const dateA = dayjs(valA, "YYYY-MM-DD", true);
    const dateB = dayjs(valB, "YYYY-MM-DD", true);
    if (dateA.isValid() && dateB.isValid()) {
      return dateA.valueOf() - dateB.valueOf();
    }

    // 4️⃣ String sort (case-insensitive)
    return valA
      .toString()
      .localeCompare(valB.toString(), undefined, {
        sensitivity: "base",
      });
  });
};
