import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Table, Select, Button, Space, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import geoData from "../../Data/geoData.json";
const apiUrl = import.meta.env.VITE_API_URL;

const AdvertiserCreateForm = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const { Option } = Select;

  // Form state
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [editingAdv, setEditingAdv] = useState(null);

  // Data state
  const [advertisers, setAdvertisers] = useState([]);
  const [availableIds, setAvailableIds] = useState([]);
  const [usedIds, setUsedIds] = useState(new Set());

  // Trim helper
  const trimValues = (obj) => {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k,
        typeof v === "string" ? v.trim() : v,
      ])
    );
  };
  // Fetch available advertiser IDs (GLOBAL – no user_id)
  useEffect(() => {
    const fetchAvailableIds = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/available-id`);
        if (data.success && data.available_id !== undefined) {
          // Wrap single ID into array
          setAvailableIds([String(data.available_id)]);
        } else {
          setAvailableIds([]);
        }
      } catch (err) {
        console.error("Failed to fetch available IDs", err);
        setAvailableIds([]);
      }
    };

    fetchAvailableIds();
  }, []);
  const refreshAvailableIds = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/available-id`);

      if (data.success && data.available_id !== undefined) {
        // Wrap single ID into array
        setAvailableIds([String(data.available_id)]);
      } else {
        setAvailableIds([]);
      }
    } catch (err) {
      console.error("Failed to refresh available IDs", err);
      setAvailableIds([]);
    }
  };

  // Fetch advertisers
  useEffect(() => {
    const fetchAdvertisers = async () => {
      if (!userId) return;
      try {
        const { data } = await axios.get(`${apiUrl}/advid-data/${userId}`);
        if (data.success && Array.isArray(data.advertisements)) {
          setAdvertisers(data.advertisements);
        }
      } catch {
        setAdvertisers([]);
      }
    };
    fetchAdvertisers();
  }, [userId]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ trim input values
    const newAdv = trimValues({
      adv_name: name,
      adv_id: selectedId,
      geo,
      user_id: editingAdv
        ? user?.role === "advertiser_manager"
          ? editingAdv.user_id
          : userId
        : userId,
    });

    if (!newAdv.adv_name || !newAdv.adv_id || !newAdv.geo) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all required fields.",
      });
    }

    try {
      const response = await axios.post(`${apiUrl}/create-advid`, newAdv);

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Created",
          text: response.data.message || "Operation successful!",
        });
      }
      await refreshAvailableIds();
      // Refresh advertisers
      const { data } = await axios.get(`${apiUrl}/advid-data/${userId}`);
      if (data.success && Array.isArray(data.advertisements)) {
        setAdvertisers(data.advertisements);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Something went wrong.",
      });
    }
  };
  const resetForm = () => {
    setName("");
    setSelectedId("");
    setGeo("");
  };
  return (
    <div className="m-6 p-8 bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-2xl border border-gray-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
        {editingAdv ? "Edit Advertiser" : "Create Advertiser"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Advertiser Name */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Advertiser Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter advertiser name"
            className="p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-gray-50 hover:bg-white"
            required
          />
        </div>

        {/* Select Advertiser ID */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Select Advertiser ID
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 hover:bg-white transition-all"
            required>
            <option value="">Select an ID</option>
            {(editingAdv
              ? [editingAdv.adv_id]
              : [...availableIds].sort((a, b) => {
                  // If IDs are numbers, sort numerically
                  if (!isNaN(a) && !isNaN(b)) return Number(a) - Number(b);
                  // Otherwise, sort alphabetically
                  return a.localeCompare(b);
                })
            ).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

        {/* Select Geo */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Select Geo
          </label>
          <Select
            showSearch
            value={geo}
            onChange={(val) => setGeo(val)}
            placeholder="Select Geo"
            className="w-full rounded-xl !h-12 "
            optionFilterProp="children"
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            required
            popupClassName="rounded-xl shadow-md">
            {geoData.geo?.map((geo) => (
              <Select.Option key={geo.code} value={geo.code} label={geo.code}>
                {geo.code}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Submit & Cancel Buttons */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="button"
            onClick={() => setEditingAdv(null)}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all">
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-[#2F5D99] hover:bg-[#24487A] text-white font-medium rounded-xl shadow hover:shadow-md transition-all">
            {editingAdv ? "Update Advertiser" : "Create Advertiser"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdvertiserCreateForm;
