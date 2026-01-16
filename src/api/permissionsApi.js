import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

export const permissionsApi = {
  createPreset: (payload) =>
    axios.post(`${apiUrl}/permissions`, payload),

  updatePreset: (id, payload) =>
    axios.put(`${apiUrl}/permissions/${id}`, payload),

  getUserPresets: (userId) =>
    axios.get(`${apiUrl}/permissions/user/${userId}`),

  deletePreset: (id) =>
    axios.delete(`${apiUrl}/permissions/${id}`),
};
