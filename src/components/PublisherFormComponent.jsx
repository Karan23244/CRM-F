import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Spin, Alert, Select, Button, Space } from "antd";
import { useSelector } from "react-redux";
import geoData from "../Data/geoData.json";

const { Option } = Select;

const apiUrl = import.meta.env.VITE_API_URL || "https://api.clickorbits.in/api";

const PublisherCreateForm = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [publishers, setPublishers] = useState([]);
  const [availableIds, setAvailableIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usedIds, setUsedIds] = useState(new Set());
  const [editingPub, setEditingPub] = useState(null);

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
      setAvailableIds(allAvailableIds);
    }
  }, [user]);

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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !selectedId || !geo) {
      setError("Publisher Name, Publisher ID, and Geo are required.");
      return;
    }

    const newPub = {
      pub_name: name,
      pub_id: selectedId,
      geo: geo,
      note: note || "", // Optional note
      user_id: userId,
    };

    setLoading(true);
    console.log(newPub);
    try {
      if (editingPub) {
        // **Update existing publisher using PUT request**
        const response = await axios.put(
          `${apiUrl}/update-pubid`, // Correct endpoint
          newPub
        );
        console.log(response);
        if (response.data.success) {
          alert("Publisher updated successfully");
        }
        setEditingPub(null);
      } else {
        // **Create new publisher**
        await axios.post(`${apiUrl}/create-pubid`, newPub);
      }

      // Refresh publishers after submission
      const { data } = await axios.get(`${apiUrl}/pubid-data/${userId}`);
      if (data.success && Array.isArray(data.Publisher)) {
        setPublishers(data.Publisher);

        // Extract used IDs
        const usedIds = new Set(data.Publisher.map((pub) => pub.pub_id));

        // Update available IDs
        setAvailableIds((prevIds) => prevIds.filter((id) => !usedIds.has(id)));
      }

      // Reset form after submission
      resetForm();
    } catch (error) {
      console.error("Error creating/updating publisher:", error);
      setError("Failed to create/update publisher. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Button
  const handleEdit = (record) => {
    setEditingPub(record);
    setName(record.pub_name);
    setSelectedId(record.pub_id);
    setGeo(record.geo);
    setNote(record.note);
  };

  // Reset Form
  const resetForm = () => {
    setName("");
    setSelectedId("");
    setGeo("");
    setNote("");
    setEditingPub(null);
    setError("");
  };

  const columns = [
    { title: "Publisher ID", dataIndex: "pub_id", key: "pub_id" },
    { title: "Publisher Name", dataIndex: "pub_name", key: "pub_name" },
    { title: "Geo", dataIndex: "geo", key: "geo" },
    { title: "Note", dataIndex: "note", key: "note" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="m-6 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">
        {editingPub ? "Edit Publisher" : "Create Publisher"}
      </h2>

      {error && (
        <Alert message={error} type="error" showIcon className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Publisher Name */}
        <div>
          <label className="block text-lg font-medium">Publisher Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
            disabled={!!editingPub}
          />
        </div>

        {/* Select Publisher ID */}
        <div>
          <label className="block text-lg font-medium">
            Select Publisher ID
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
            disabled={!!editingPub} // Disable changing ID in edit mode
          >
            <option value="">Select an ID</option>
            {availableIds.length > 0 || editingPub ? (
              (editingPub ? [editingPub.pub_id] : availableIds).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))
            ) : (
              <option disabled>No available IDs</option>
            )}
          </select>
        </div>

        {/* Select Geo with Search */}
        <div>
          <label className="block text-lg font-medium">Select Geo</label>
          <Select
            showSearch
            value={geo}
            onChange={(value) => setGeo(value)}
            placeholder="Select Geo"
            className="w-full"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            required>
            {geoData.geo?.map((geo) => (
              <Select.Option
                key={geo.code}
                value={geo.code}
                label={`${geo.code}`}>
                {geo.code}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Note (Optional) */}
        <div>
          <label className="block text-lg font-medium">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            rows="3"
            disabled={!!editingPub}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          disabled={loading}>
          {loading ? (
            <Spin size="small" />
          ) : editingPub ? (
            "Update Publisher"
          ) : (
            "Create Publisher"
          )}
        </button>

        {editingPub && (
          <button
            type="button"
            onClick={resetForm}
            className="w-full mt-2 bg-gray-400 text-white p-2 rounded-lg hover:bg-gray-500">
            Cancel Edit
          </button>
        )}
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
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: "max-content" }}
        />
      )}
    </div>
  );
};

export default PublisherCreateForm;
