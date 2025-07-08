import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Input, Select, Button, Space } from "antd";
import { useSelector } from "react-redux";
import Swal from "sweetalert2"; // <-- Import SweetAlert2
import geoData from "../Data/geoData.json";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const AdvnameData = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAdv, setEditingAdv] = useState(null);

  // Form State for Editing
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [advUserId, setAdvUserId] = useState(null);
  const [target, setTarget] = useState("");
  // **Fetch advertiser data**
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-NameAdv/`);

        if (response.data && Array.isArray(response.data.data)) {
          setTableData(response.data.data);
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

  const filteredData = tableData
    .filter((item) => user?.assigned_subadmins?.includes(item.user_id))
    .filter((item) =>
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
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Please fill all required fields.",
      });
      return;
    }

    const updatedAdv = {
      adv_name: name,
      adv_id: selectedId,
      geo: geo,
      note: note || "",
      target: target || "",
      user_id: advUserId,
    };
    try {
      // **Update existing advertiser**
      const response = await axios.put(`${apiUrl}/update-advid`, updatedAdv);
      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Advertiser updated successfully.",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh table data after update
        const { data } = await axios.get(`${apiUrl}/get-NameAdv/`);
        if (data.success && Array.isArray(data.data)) {
          setTableData(data.data);
        }

        resetForm();
      }
    } catch (error) {
      console.error("Error updating advertiser:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error updating advertiser. Please try again.",
      });
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
  };

  // **Reset Form**
  const resetForm = () => {
    setName("");
    setSelectedId("");
    setGeo("");
    setNote("");
    setTarget("");
    setEditingAdv(null);
  };

  const handlePause = async (record) => {
    try {
      const response = await axios.post(`${apiUrl}/advid-pause`, {
        adv_id: record.adv_id,
        pause: 1,
      });

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Paused",
          text: `Advertiser ${record.adv_id} has been paused.`,
          timer: 2000,
          showConfirmButton: false,
        });

        // ✅ Refresh data after pause
        const { data } = await axios.get(`${apiUrl}/get-NameAdv/`);
        if (data.success && Array.isArray(data.data)) {
          setTableData(data.data);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: `Failed to pause advertiser ${record.pub_id}.`,
        });
      }
    } catch (error) {
      console.error("Error pausing advertiser:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error occurred while pausing advertiser.",
      });
    }
  };

  const getUniqueValues = (data, key) => {
    return [...new Set(data.map((item) => item[key]).filter(Boolean))];
  };

  const createFilterDropdown = (
    data,
    key,
    setSelectedKeys,
    selectedKeys,
    confirm
  ) => {
    const options = getUniqueValues(data, key).sort((a, b) => {
      const aVal = isNaN(a) ? a.toString().toLowerCase() : parseFloat(a);
      const bVal = isNaN(b) ? b.toString().toLowerCase() : parseFloat(b);
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });

    return (
      <div style={{ padding: 8 }}>
        <Select
          mode="multiple"
          allowClear
          showSearch
          style={{ width: 200 }}
          placeholder={`Filter ${key}`}
          value={selectedKeys}
          onChange={(value) => {
            setSelectedKeys(value);
            confirm({ closeDropdown: false });
          }}
          optionFilterProp="children">
          {options.map((option) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      </div>
    );
  };

  const columns = [
    {
      title: "UserName",
      dataIndex: "username",
      key: "username",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "username",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.username === value,
    },
    {
      title: "Advertiser Name",
      dataIndex: "adv_name",
      key: "adv_name",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "adv_name",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.adv_name === value,
    },
    {
      title: "Advertiser ID",
      dataIndex: "adv_id",
      key: "adv_id",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "adv_id",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.adv_id === value,
    },
    {
      title: "Geo",
      dataIndex: "geo",
      key: "geo",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "geo",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.geo === value,
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "note",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.note === value,
    },
    {
      title: "Target",
      dataIndex: "target",
      key: "target",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "target",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.target === value,
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
        rowKey="adv_id"
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
