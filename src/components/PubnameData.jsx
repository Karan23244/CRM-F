import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Input, Select, Button, Space } from "antd";
import geoData from "../Data/geoData.json";
import Swal from "sweetalert2";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const PubnameData = () => {
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPub, setEditingPub] = useState(null);

  // Form State for Editing
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [pubUserId, setPubUserId] = useState(null);
  const [target, setTarget] = useState("");

  // **Fetch publisher data**
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-Namepub/`);

        if (response.data && Array.isArray(response.data.data)) {
          setTableData(response.data.data);
        } else {
          console.error("Unexpected response format:", response.data);
          setTableData([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // **Filtered data for search**
  const filteredData = tableData.filter((item) =>
    [
      item.username,
      item.pub_name,
      item.pub_id,
      item.geo,
      item.note,
      item.target,
    ].some((field) =>
      field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // **Handle Form Submission for Updating**
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name || !selectedId || !geo) {
      Swal.fire("Error", "Please fill all required fields.", "error");
      return;
    }

    const updatedPub = {
      pub_name: name,
      pub_id: selectedId,
      geo: geo,
      note: note || "",
      target: target || "",
      user_id: pubUserId, // Use the original creator's user_id
    };

    try {
      // **Update existing publisher**
      const response = await axios.put(`${apiUrl}/update-pubid`, updatedPub);
      if (response.data.success) {
        Swal.fire("Success", "Publisher updated successfully.", "success");

        // Refresh table data after update
        const { data } = await axios.get(`${apiUrl}/get-Namepub/`);
        if (data.success && Array.isArray(data.data)) {
          setTableData(data.data);
        }

        resetForm();
      }
    } catch (error) {
      console.error("Error updating publisher:", error);
      alert("Error updating publisher. Please try again.");
    }
  };

  // **Handle Edit Button**
  const handleEdit = (record) => {
    setEditingPub(record);
    setName(record.pub_name);
    setSelectedId(record.pub_id);
    setGeo(record.geo);
    setNote(record.note);
    setTarget(record.target);
    setPubUserId(record.user_id); // Set original creator's user_id for updating
  };

  // **Reset Form**
  const resetForm = () => {
    setName("");
    setSelectedId("");
    setGeo("");
    setNote("");
    setTarget("");
    setPubUserId(null);
    setEditingPub(null);
  };

  const handlePause = async (record) => {
    try {
      const response = await axios.post(`${apiUrl}/publisher-pause`, {
        pub_id: record.pub_id,
        pause: 1,
      });

      if (response.data.success) {
        Swal.fire(
          "Paused",
          `Publisher ${record.pub_id} has been paused.`,
          "success"
        );

        // ✅ Refresh data after pause
        const { data } = await axios.get(`${apiUrl}/get-Namepub/`);
        if (data.success && Array.isArray(data.data)) {
          setTableData(data.data);
        }
      } else {
        Swal.fire(
          "Failed",
          `Failed to pause publisher ${record.pub_id}.`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error pausing publisher:", error);
      Swal.fire("Error", "Error occurred while pausing publisher.", "error");
    }
  };

  // **Table Columns**
  const columns = [
    { title: "UserName", dataIndex: "username", key: "username" },
    { title: "Publisher Name", dataIndex: "pub_name", key: "pub_name" },
    { title: "Publisher ID", dataIndex: "pub_id", key: "pub_id" },
    { title: "Geo", dataIndex: "geo", key: "geo" },
    { title: "Note", dataIndex: "note", key: "note" },
    { title: "Target", dataIndex: "target", key: "target" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            type="default"
            danger={record.pause !== "1"}
            size="small"
            onClick={() => handlePause(record)}
            disabled={record.pause === "1"}
            className={`rounded px-3 py-1 ${
              record.pause === "1"
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}>
            {record.pause === "1" ? "Paused" : "Pause"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="m-6 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Update Publisher</h2>

      {/* Show Form Only in Edit Mode */}
      {editingPub && (
        <form onSubmit={handleUpdate} className="space-y-4 mb-6">
          {/* Publisher Name */}
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

          {/* Publisher ID (Disabled during edit) */}
          <div>
            <label className="block text-lg font-medium">
              Publisher ID (Cannot be modified)
            </label>
            <input
              type="text"
              value={selectedId}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
              disabled
            />
          </div>

          {/* Select Geo with Search Feature */}
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
                <Option key={geo.code} value={geo.code} label={`${geo.code}`}>
                  {geo.code}
                </Option>
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
            />
          </div>
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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
            Update Publisher
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="w-full mt-2 bg-gray-400 text-white p-2 rounded-lg hover:bg-gray-500">
            Cancel
          </button>
        </form>
      )}

      {/* Search Input */}
      <Input
        placeholder="Search by Publisher Name, Geo, or Note"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-1/3 p-2 border rounded"
      />

      {/* Table Component */}
      <Table
        dataSource={filteredData}
        columns={columns}
        rowKey="pub_id"
        pagination={{
          pageSizeOptions: ["10", "20", "50", "100"],
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        bordered
        className="mt-5"
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default PubnameData;
