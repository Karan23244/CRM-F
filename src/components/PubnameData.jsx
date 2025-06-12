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
  const [editingAssignRowId, setEditingAssignRowId] = useState(null);
  const [target, setTarget] = useState("");
  const [level, setLevel] = useState("");
  const [vector, setVector] = useState("");
  const [subAdmins, setSubAdmins] = useState([]);

  // **Fetch publisher data**
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-Namepub/`);
        console.log(response.data);
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
  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await fetch(`${apiUrl}/get-subadmin`);
        const data = await response.json();
        console.log(data);
        if (response.ok) {
          const filtered = data.data.filter((subAdmin) =>
            ["publisher_manager", "publisher"].includes(subAdmin.role)
          );
          setSubAdmins(filtered);
        } else {
          console.log(data.message || "Failed to fetch sub-admins.");
        }
      } catch (err) {
        console.log("An error occurred while fetching sub-admins.");
      }
    };

    fetchSubAdmins();
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

    // const updatedPub = {
    //   pub_name: name,
    //   pub_id: selectedId,
    //   geo: geo,
    //   note: note || "",
    //   target: target || "",
    //   user_id: pubUserId, // Use the original creator's user_id
    // };
    const updatedPub = {
      pub_name: name,
      pub_id: selectedId,
      geo: geo,
      note: note || "",
      target: target || "",
      user_id: pubUserId,
      level: level || "",
      vector: vector || "",
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
    setPubUserId(record.user_id);
    setLevel(record.level || "");
    setVector(record.vector || "");
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
    setLevel("");
    setVector("");
  };

  // **Table Columns**
  const columns = [
    { title: "UserName", dataIndex: "username", key: "username" },
    { title: "Publisher Name", dataIndex: "pub_name", key: "pub_name" },
    { title: "Publisher ID", dataIndex: "pub_id", key: "pub_id" },
    { title: "Geo", dataIndex: "geo", key: "geo" },
    { title: "Note", dataIndex: "note", key: "note" },
    { title: "Target", dataIndex: "target", key: "target" },
    { title: "Level", dataIndex: "level", key: "level" },
    { title: "Vector", dataIndex: "vector", key: "vector" },
    {
      title: "Transfer PUB AM",
      key: "user_id",
      render: (_, record) => {
        const isEditing = editingAssignRowId === record.pub_id;

        if (isEditing) {
          return (
            <Select
              autoFocus
              value={record.user_id?.toString()}
              onChange={async (newUserId) => {
                try {
                  // Get selected username from subAdmins
                  const selectedAdmin = subAdmins.find(
                    (admin) => admin.id.toString() === newUserId
                  );

                  if (!selectedAdmin) {
                    Swal.fire("Error", "Invalid user selected", "error");
                    return;
                  }

                  const response = await axios.put(`${apiUrl}/update-pubid`, {
                    ...record,
                    user_id: selectedAdmin.id,
                    username: selectedAdmin.username,
                  });

                  if (response.data.success) {
                    Swal.fire(
                      "Success",
                      "User transferred successfully!",
                      "success"
                    );
                    fetchData();
                    // Optionally refresh data
                  } else {
                    Swal.fire("Error", "Failed to transfer user", "error");
                  }
                } catch (error) {
                  console.error("User transfer error:", error);
                  Swal.fire("Error", "Something went wrong", "error");
                } finally {
                  setEditingAssignRowId(null);
                }
              }}
              onBlur={() => setEditingAssignRowId(null)}
              className="min-w-[150px]">
              <Option value="">Select Sub Admin</Option>
              {subAdmins.map((admin) => (
                <Option key={admin.id} value={admin.id.toString()}>
                  {admin.username}
                </Option>
              ))}
            </Select>
          );
        }

        // Show normal text, and enter edit mode on click
        return (
          <span
            onClick={() => setEditingAssignRowId(record.pub_id)}
            className="cursor-pointer hover:underline"
            title="Click to change user">
            {"-"}
          </span>
        );
      },
    },
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
            <label className="block text-lg font-medium">Vertical</label>
            <input
              type="text"
              value={vector}
              onChange={(e) => setVector(e.target.value)}
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
