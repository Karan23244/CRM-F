import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Spin, Alert, Select, Button, Space, Input } from "antd";
import { useSelector } from "react-redux";
import { SearchOutlined } from "@ant-design/icons";
import geoData from "../Data/geoData.json";
import SubAdminPubnameData from "./SubAdminPubnameData";
import Swal from "sweetalert2";
const { Option } = Select;

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const PublisherIDDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState("yourData");

  const showAssignPubTab = user?.role === "publisher_manager";

  return (
    <div className="p-4">
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "yourData" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("yourData")}>
          Your Data
        </button>

        {showAssignPubTab && (
          <button
            className={`px-4 py-2 rounded ${
              activeTab === "assignPub"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => setActiveTab("assignPub")}>
            Assign Pub Data
          </button>
        )}
      </div>

      {activeTab === "yourData" ? (
        <PublisherCreateForm />
      ) : showAssignPubTab ? (
        <SubAdminPubnameData />
      ) : null}
    </div>
  );
};

export default PublisherIDDashboard;

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
  const [level, setLevel] = useState("");
  const [vector, setVector] = useState("");
  const [target, setTarget] = useState("");
  const [searchTextPub, setSearchTextPub] = useState("");
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
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Publisher Name, Publisher ID, and Geo are required.",
      });
      return;
    }

    const updatedPub = {
      pub_name: name,
      pub_id: selectedId,
      geo: geo,
      user_id: userId, // Use the current user's ID
      note: note || "",
      target: target || "",
      level: level || "",
      vector: vector || "",
    };
    console.log("Updated Publisher Data:", updatedPub);
    setLoading(true);
    try {
      if (editingPub) {
        // Update existing publisher using PUT request
        const response = await axios.put(`${apiUrl}/update-pubid`, updatedPub);
        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Updated!",
            text: "Publisher updated successfully",
            timer: 2000,
            showConfirmButton: false,
          });
        }
        setEditingPub(null);
      } else {
        // Create new publisher
        await axios.post(`${apiUrl}/create-pubid`, updatedPub);
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: "Publisher created successfully",
          timer: 2000,
          showConfirmButton: false,
        });
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

      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to create/update publisher. Please try again.",
      });
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
    setTarget(record.target || "");
    setLevel(record.level || "");
    setVector(record.vector || "");
  };

  // Reset Form
  const resetForm = () => {
    setName("");
    setSelectedId("");
    setGeo("");
    setNote("");
    setEditingPub(null);
    setTarget("");
    setError("");
    setLevel("");
    setVector("");
  };

  // Filter publishers based on search input
  const filteredPublishers = publishers.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTextPub.toLowerCase())
    )
  );
  const columns = [
    { title: "Publisher ID", dataIndex: "pub_id", key: "pub_id" },
    { title: "Publisher Name", dataIndex: "pub_name", key: "pub_name" },
    { title: "Geo", dataIndex: "geo", key: "geo" },
    { title: "Note", dataIndex: "note", key: "note" },
    { title: "Target", dataIndex: "target", key: "target" },
    { title: "Level", dataIndex: "level", key: "level" },
    { title: "Vector", dataIndex: "vector", key: "vector" },
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

        {editingPub && user?.role === "publisher_manager" && (
          <>
            {/* Target Field */}
            <div>
              <label className="block text-lg font-medium">Target</label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Note Field */}
            <div>
              <label className="block text-lg font-medium">
                Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                rows="3"
              />
            </div>
            {/* Level Field */}
            <div>
              <label className="block text-lg font-medium">Level</label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Vector Field */}
            <div>
              <label className="block text-lg font-medium">Vector</label>
              <input
                type="text"
                value={vector}
                onChange={(e) => setVector(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
          </>
        )}

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

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 mt-10 border border-gray-200 dark:border-gray-700">
        {/* Header and Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
            📚 Existing Publishers
          </h3>
          <div className="relative w-full md:w-[300px]">
            <Input
              placeholder="Search Publishers..."
              prefix={<SearchOutlined style={{ color: "#999" }} />}
              value={searchTextPub}
              onChange={(e) => setSearchTextPub(e.target.value)}
              allowClear
              className="rounded-full shadow-md border-none ring-1 ring-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Table or Spinner */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              dataSource={filteredPublishers}
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
          </div>
        )}
      </div>
    </div>
  );
};
