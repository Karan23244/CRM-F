// PublisherCreateForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Select } from "antd";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import geoData from "../../Data/geoData.json";

const apiUrl = import.meta.env.VITE_API_URL;

const PublisherCreateForm = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [availableIds, setAvailableIds] = useState([]);
  const [usedIds, setUsedIds] = useState(new Set());
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
  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = {
      pub_name: name.trim(),
      pub_id: selectedId.trim(),
      geo: geo.trim(),
      user_id: userId,
    };

    if (!trimmed.pub_name || !trimmed.pub_id || !trimmed.geo) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all required fields.",
      });
    }

    try {
      const res = await axios.post(`${apiUrl}/create-pubid`, trimmed);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Created",
          text: "Publisher created successfully!",
        });
        await refreshAvailableIds();
        resetForm();
      }
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
    <div className="m-6 p-6 bg-white shadow-md rounded-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
        Create Publisher
      </h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-6">
        {/* Publisher Name */}
        <div>
          <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
            Publisher Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
            required
          />
        </div>

        {/* Publisher ID */}
        <div>
          <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
            Select Publisher ID
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
            required>
            <option value="">Select an ID</option>
            {availableIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

        {/* Geo */}
        <div className="md:col-span-2">
          <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
            Select Geo
          </label>
          <Select
            showSearch
            value={geo}
            onChange={(val) => setGeo(val)}
            placeholder="Select Geo"
            className="w-full !h-12"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            required>
            {geoData.geo?.map((g) => (
              <Select.Option key={g.code} value={g.code} label={g.code}>
                {g.code}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Buttons */}
        <div className="md:col-span-2 flex flex-wrap gap-4 justify-end mt-4">
          <button
            type="submit"
            className="flex-1 md:flex-none bg-[#2F5D99] hover:bg-[#24487A] text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all">
            Create Publisher
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="flex-1 md:flex-none bg-gray-400 hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublisherCreateForm;
