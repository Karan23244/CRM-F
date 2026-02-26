// utils/billingApi.js
export async function fetchBilling(type, payload) {
  const res = await fetch(`${import.meta.env.VITE_API_URL5}/billing/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to fetch billing");
  return res.json();
}
