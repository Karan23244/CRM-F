import React, { useState, useEffect, use } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { Table, Input, Select, Button, Space } from "antd";
import { useSelector } from "react-redux";
import geoData from "../../Data/geoData.json";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const AdvnameData = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;

  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAdv, setEditingAdv] = useState(null);
  console.log(tableData);
  // Form State for Editing
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [advUserId, setAdvUserId] = useState(null);
  const [target, setTarget] = useState("");
  const [acc_email, setAcc_email] = useState("");
  const [poc_email, setPoc_email] = useState("");
  const [assign_user, setAssign_user] = useState("");
  const [assign_id, setAssign_id] = useState("");
  const [subAdmins, setSubAdmins] = useState([]);
  const [editingAssignRowId, setEditingAssignRowId] = useState(null);
  // **Fetch advertiser data**
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-NameAdv/`);

        if (response.data && Array.isArray(response.data.data)) {
          const filteredData = response.data.data.filter(
            (item) => item.pause !== 1
          );
          setTableData(filteredData);
        } else {
          console.error("Unexpected response format:", response.data);
          setTableData([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setTableData([]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await fetch(`${apiUrl}/get-subadmin`);
        const data = await response.json();
        if (response.ok) {
          const filtered = data.data.filter((subAdmin) =>
            ["advertiser_manager", "advertiser"].includes(subAdmin.role)
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
      item.adv_name,
      item.adv_id,
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
      Swal.fire(
        "Missing Fields",
        "Please fill all required fields.",
        "warning"
      );

      return;
    }

    const updatedAdv = {
      adv_name: name,
      adv_id: selectedId,
      geo: geo,
      note: note || "",
      target: target || "",
      user_id: advUserId,
      acc_email: acc_email,
      poc_email: poc_email,
      assign_user:
        editingAdv && user?.role === "advertiser_manager"
          ? editingAdv.assign_user
          : assign_user,
      assign_id:
        editingAdv && user?.role === "advertiser_manager"
          ? editingAdv.assign_id
          : assign_id,
    };
    try {
      // **Update existing advertiser**
      const response = await axios.put(`${apiUrl}/update-advid`, updatedAdv);
      if (response.data.success) {
        Swal.fire("Success", "Advertiser updated successfully.", "success");

        // Refresh table data after update
        const { data } = await axios.get(`${apiUrl}/get-NameAdv/`);
        if (data.success && Array.isArray(data.data)) {
          setTableData(data.data);
        }

        resetForm();
      }
    } catch (error) {
      console.error("Error updating advertiser:", error);
      Swal.fire(
        "Error",
        "Error updating advertiser. Please try again.",
        "error"
      );
    }
  };

  // **Handle Edit Button**
  const handleEdit = (record) => {
    setEditingAdv(record);
    setName(record.adv_name);
    setSelectedId(record.adv_id);
    setGeo(record.geo);
    setNote(record.note);
    setTarget(record.target);
    setAdvUserId(record.user_id);
    setAcc_email(record.acc_email);
    setPoc_email(record.poc_email);
    setAssign_user(record.assign_user);
    setAssign_id(record.assign_id);
  };

  // **Reset Form**
  const resetForm = () => {
    setName("");
    setSelectedId("");
    setGeo("");
    setNote("");
    setTarget("");
    setAcc_email("");
    setPoc_email("");
    setAssign_user("");
    setAssign_id("");
    setEditingAdv(null);
  };
  const handlePause = async (record) => {
    try {
      const response = await axios.post(`${apiUrl}/advid-pause`, {
        adv_id: record.adv_id,
        pause: 1,
      });

      if (response.data.success) {
        Swal.fire(
          "Paused",
          `Advertiser ${record.adv_id} has been paused.`,
          "success"
        );

        // ✅ Refresh data after pause
        const { data } = await axios.get(`${apiUrl}/get-NameAdv/`);
        if (data.success && Array.isArray(data.data)) {
          setTableData(data.data);
        }
      } else {
        Swal.fire(
          "Failed",
          `Failed to pause advertiser ${record.pub_id}.`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error pausing advertiser:", error);
      Swal.fire("Error", "Error occurred while pausing advertiser.", "error");
    }
  };
  // **Table Columns**
  const columns = [
    { title: "UserName", dataIndex: "username", key: "username" },
    { title: "Advertiser ID", dataIndex: "adv_id", key: "adv_id" },
    { title: "Advertiser Name", dataIndex: "adv_name", key: "adv_name" },
    { title: "Geo", dataIndex: "geo", key: "geo" },
    { title: "Note", dataIndex: "note", key: "note" },
    { title: "Target", dataIndex: "target", key: "target" },
    {
      title: "Acc Email",
      dataIndex: "acc_email",
      key: "acc_email",
      render: (text) => (user?.role === "advertiser" ? "*****" : text),
    },
    {
      title: "POC Email",
      dataIndex: "poc_email",
      key: "poc_email",
      render: (text) => (user?.role === "advertiser" ? "*****" : text),
    },

    {
      title: "Assign User",
      key: "assign_user",
      dataIndex: "assign_user",
    },
    {
      title: "Transfer Adv AM",
      key: "user_id",
      render: (_, record) => {
        const isEditing = editingAssignRowId === record.adv_id;

        if (isEditing) {
          return (
            <Select
              autoFocus
              value={record.username}
              onChange={async (newUserId) => {
                try {
                  const response = await axios.put(`${apiUrl}/update-advid`, {
                    ...record,
                    user_id: newUserId,
                  });

                  if (response.data.success) {
                    Swal.fire(
                      "Success",
                      "User transferred successfully!",
                      "success"
                    );

                    // ✅ Update local tableData to reflect changes
                    setTableData((prev) =>
                      prev.map((item) =>
                        item.adv_id === record.adv_id
                          ? {
                              ...item,
                              user_id: newUserId,
                            }
                          : item
                      )
                    );
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
              onBlur={() => setEditingAssignRowId(null)} // Close if user clicks away
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
            onClick={() => setEditingAssignRowId(record.adv_id)}
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
      <h2 className="text-2xl font-bold mb-4">Update Advertiser</h2>

      {/* Show Form Only in Edit Mode */}
      {editingAdv && (
        <form onSubmit={handleUpdate} className="space-y-4 mb-6">
          {/* Advertiser Name */}
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

          {/* Advertiser ID (Disabled during edit) */}
          <div>
            <label className="block text-lg font-medium">
              Advertiser ID (Cannot be modified)
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
              >
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
          <div>
            <label className="block text-lg font-medium">Account Email</label>
            <input
              type="text"
              value={acc_email}
              onChange={(e) => setAcc_email(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-lg font-medium">Poc Email</label>
            <input
              type="text"
              value={poc_email}
              onChange={(e) => setPoc_email(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-lg font-medium">Assign User</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={assign_id}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedUser = subAdmins.find(
                  (admin) => admin.id.toString() === selectedId
                );
                setAssign_id(selectedId);
                setAssign_user(selectedUser ? selectedUser.username : "");
              }}>
              <option value="">Select Sub Admin</option>
              {subAdmins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.username}
                </option>
              ))}
            </select>
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
            Update Advertiser
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
        placeholder="Search by Advertiser Name, Geo, or Note"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-1/3 p-2 border rounded"
      />

      {/* Table Component */}
      <Table
        dataSource={filteredData}
        columns={columns}
        rowKey="id"
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

export default AdvnameData;
