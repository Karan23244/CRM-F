import axios from "axios";
import { useSelector } from "react-redux";

const apiUrl = import.meta.env.VITE_API_URL;

export const usePermissionsApi = () => {
  const token = useSelector((state) => state.auth.token);

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  return {
    createPreset: (payload) =>
      axios.post(`${apiUrl}/permissions`, payload, config),

    updatePreset: (id, payload) =>
      axios.put(`${apiUrl}/permissions/${id}`, payload, config),

    getUserPresets: (userId) =>
      axios.get(`${apiUrl}/permissions/user/${userId}`, config),

    deletePreset: (id) => axios.delete(`${apiUrl}/permissions/${id}`, config),
  };
};
