import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table } from "antd";
import { useSelector } from "react-redux";

const apiUrl =
  import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";

const AdvertiserCreateForm = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null; // Ensure `userId` is valid
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [advertisers, setAdvertisers] = useState([]);
  const [availableIds, setAvailableIds] = useState([]);

  // Initialize available IDs from user.range on first render
  useEffect(() => {
    if (user?.range?.range_start && user?.range?.range_end) {
      const rangeStart = Number(user.range.range_start);
      const rangeEnd = Number(user.range.range_end);

      if (!isNaN(rangeStart) && !isNaN(rangeEnd) && rangeStart <= rangeEnd) {
        const fullRange = Array.from(
          { length: rangeEnd - rangeStart + 1 },
          (_, i) => (rangeStart + i).toString()
        );
        setAvailableIds(fullRange);
      } else {
        console.error("Invalid range values");
      }
    }
  }, [user?.range]);
  
  // Fetch data from API and update available IDs dynamically
  useEffect(() => {
    const fetchAdvertisers = async () => {
      if (!userId) return;

      try {
        const { data } = await axios.get(`${apiUrl}/advid-data/${userId}`);

        if (data.success && Array.isArray(data.advertisements)) {
          setAdvertisers(data.advertisements);

          // Define the full range (Adjust as needed)
          const fullRange = Array.from({ length: 10 }, (_, i) =>
            (i + 1).toString()
          );

          // Extract used IDs from data
          const usedIds = new Set(data.advertisements.map((adv) => adv.adv_id));

          // Filter available IDs
          const remainingIds = fullRange.filter((id) => !usedIds.has(id));
          setAvailableIds(remainingIds);
        }
      } catch (error) {
        console.error("Error fetching advertisers:", error);
        setAdvertisers([]);
      }
    };

    fetchAdvertisers();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !selectedId) return;

    const newAdv = {
      adv_name: name,
      adv_id: selectedId, // Keep `adv_id` as a string
      user_id: userId,
    };

    try {
      await axios.post(`${apiUrl}/create-advid`, newAdv);

      // Refresh advertisers after creation
      const { data } = await axios.get(`${apiUrl}/advid-data/${userId}`);
      if (data.success && Array.isArray(data.advertisements)) {
        setAdvertisers(data.advertisements);
      }

      setName("");
      setSelectedId("");
    } catch (error) {
      console.error("Error creating advertiser:", error);
    }
  };

  const columns = [
    { title: "Advertiser ID", dataIndex: "adv_id", key: "adv_id" },
    { title: "Advertiser Name", dataIndex: "adv_name", key: "adv_name" },
  ];

  return (
    <div className="m-6 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Create Advertiser</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-lg font-medium">Advertiser Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-lg font-medium">
            Select Advertiser ID
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required>
            <option value="">Select an ID</option>
            {availableIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
          Create Advertiser
        </button>
      </form>
      <h3 className="text-xl font-semibold pt-10">Existing Advertisers</h3>
      <Table
        dataSource={advertisers}
        columns={columns}
        rowKey="id"
        className="mt-4"
      />
    </div>
  );
};

export default AdvertiserCreateForm;
