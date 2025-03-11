import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Spin, Alert } from "antd";
import { useSelector } from "react-redux";

const apiUrl =
  import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";

const PublisherCreateForm = () => {
  const user = useSelector((state) => state.auth.user);
  console.log(user);
  const userId = user?.id || null;
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [publishers, setPublishers] = useState([]);
  const [availableIds, setAvailableIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usedIds, setUsedIds] = useState(new Set());

  // **Initialize available IDs from user.ranges**
  useEffect(() => {
    if (user && user.ranges && user.ranges.length > 0) {
      let allAvailableIds = [];

      user.ranges.forEach(({ start, end }) => {
        const rangeStart = Number(start);
        const rangeEnd = Number(end);

        if (!isNaN(rangeStart) && !isNaN(rangeEnd) && rangeStart <= rangeEnd) {
          const rangeIds = Array.from(
            { length: rangeEnd - rangeStart + 1 },
            (_, i) => (rangeStart + i).toString()
          );
          allAvailableIds = [...allAvailableIds, ...rangeIds];
        }
      });

      console.log(
        "Available IDs (before filtering used ones):",
        allAvailableIds
      );
      setAvailableIds(allAvailableIds);
    }
  }, [user]);
  console.log(availableIds);
  // Fetch data from API and update available IDs dynamically
  useEffect(() => {
    const fetchPublishers = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const { data } = await axios.get(`${apiUrl}/pubid-data/${userId}`);

        if (data.success && Array.isArray(data.Publisher)) {
          setPublishers(data.Publisher);

          const usedIdsSet = new Set(data.Publisher.map((adv) => adv.pub_id));
          setUsedIds(usedIdsSet); // Store used IDs separately

          // **Filter available IDs based on used IDs**
          setAvailableIds((prevIds) =>
            prevIds.filter((id) => !usedIdsSet.has(id))
          );
        } else {
          console.warn("Unexpected API Response Format:", data);
        }
      } catch (error) {
        console.error("Error fetching publishers:", error);
        setError("Failed to fetch publishers. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublishers();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !selectedId) {
      setError("Both fields are required.");
      return;
    }

    const newPub = {
      pub_name: name,
      pub_id: selectedId,
      user_id: userId,
    };

    setLoading(true);
    try {
      await axios.post(`${apiUrl}/create-pubid`, newPub);

      // Refresh publishers after creation
      const { data } = await axios.get(`${apiUrl}/pubid-data/${userId}`);
      if (data.success && Array.isArray(data.Publisher)) {
        setPublishers(data.Publisher);

        // Extract used IDs
        const usedIds = new Set(data.Publisher.map((pub) => pub.pub_id));

        // Update available IDs
        setAvailableIds((prevIds) => prevIds.filter((id) => !usedIds.has(id)));
      }

      setName("");
      setSelectedId("");
      setError(""); // Clear any previous error
    } catch (error) {
      console.error("Error creating publisher:", error);
      setError("Failed to create publisher. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Publisher ID", dataIndex: "pub_id", key: "pub_id" },
    { title: "Publisher Name", dataIndex: "pub_name", key: "pub_name" },
  ];

  return (
    <div className="m-6 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Create Publisher</h2>

      {error && (
        <Alert message={error} type="error" showIcon className="mb-4" />
      )}

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
          className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          disabled={loading}>
          {loading ? <Spin size="small" /> : "Create Publisher"}
        </button>
      </form>

      <h3 className="text-xl font-semibold pt-10">Existing Publishers</h3>
      {loading ? (
        <Spin size="large" className="mt-4" />
      ) : (
        <Table
          dataSource={publishers}
          columns={columns}
          rowKey="pub_id"
          className="mt-4"
        />
      )}
    </div>
  );
};

export default PublisherCreateForm;
