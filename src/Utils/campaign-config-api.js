import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL5;
const API1 = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export const createCampaignConfig = async (payload) => {
  const { data } = await api.post("/campaign-config", payload);
  return data;
};

export const getCampaignConfig = async (campaign_ids) => {
  console.log("Fetching campaign config for IDs:", campaign_ids);
  const res = await api.post(`/campaign-config/find`, {
    campaign_ids,
  });

  return res.data;
};

export const updateCampaignConfig = async (id, payload) => {
  const { data } = await api.put(`/campaign-config/${id}`, payload);
  return data;
};
