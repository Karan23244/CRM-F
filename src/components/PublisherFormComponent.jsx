import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table } from "antd";
import { useSelector } from "react-redux";

const apiUrl =
  import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";

const PublisherCreateForm = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [publishers, setPublishers] = useState([]);
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
    const fetchPublishers = async () => {
      if (!userId) return;

      try {
        console.log(`Fetching from: ${apiUrl}/pubid-data/${userId}`);
        const { data } = await axios.get(`${apiUrl}/pubid-data/${userId}`);

        console.log("API Response:", data);

        if (data.success && Array.isArray(data.Publisher)) {
          setPublishers(data.Publisher);

          // Extract used IDs
          const usedIds = new Set(data.Publisher.map((ad) => ad.pub_id));

          // Filter out used IDs
          setAvailableIds((prevIds) =>
            prevIds.filter((id) => !usedIds.has(id))
          );
        } else {
          console.warn("Unexpected API Response Format:", data);
        }
      } catch (error) {
        console.error("Error fetching publishers:", error);
        setPublishers([]);
      }
    };

    fetchPublishers();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !selectedId) return;

    const newPub = {
      pub_name: name,
      pub_id: selectedId,
      user_id: userId,
    };

    try {
      await axios.post(`${apiUrl}/create-pubid`, newPub);
      console.log("Publisher Created:", newPub);

      // Refresh publishers after creation
      const { data } = await axios.get(`${apiUrl}/pubid-data/${userId}`);
      if (data.success && Array.isArray(data.Publisher)) {
        setPublishers(data.advertisements);

        // Extract used IDs
        const usedIds = new Set(data.advertisements.map((ad) => ad.pub_id));

        // Update available IDs
        setAvailableIds((prevIds) => prevIds.filter((id) => !usedIds.has(id)));
      }

      setName("");
      setSelectedId("");
    } catch (error) {
      console.error("Error creating publisher:", error);
    }
  };

  const columns = [
    { title: "Publisher ID", dataIndex: "pub_id", key: "pub_id" },
    { title: "Publisher Name", dataIndex: "pub_name", key: "pub_name" },
  ];

  return (
    <div className="m-6 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Create Publisher</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-lg font-medium">Publisher Name</label>
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
            Select Publisher ID
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required>
            <option value="">Select an ID</option>
            {availableIds.length > 0 ? (
              availableIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))
            ) : (
              <option disabled>No available IDs</option>
            )}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
          Create Publisher
        </button>
      </form>
      <h3 className="text-xl font-semibold pt-10">Existing Publishers</h3>
      <Table
        dataSource={publishers}
        columns={columns}
        rowKey="pub_id"
        className="mt-4"
      />
    </div>
  );
};

export default PublisherCreateForm;
