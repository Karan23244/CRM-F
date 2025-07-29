import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Input, Select, Button, Space } from "antd";
import geoData from "../../Data/geoData.json";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const SubAdminPubnameData = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
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
  const [level, setLevel] = useState("");
  const [vector, setVector] = useState("");
  // Fetch publisher data
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

  // Filtered data for search
  const filteredData = tableData
    .filter((item) => user?.assigned_subadmins?.includes(item.user_id))
    .filter((item) =>
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

  // Handle Form Submission for Updating
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name || !selectedId || !geo) {
      return Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Please fill all required fields.",
      });
    }

    const updatedPub = {
      pub_name: name,
      pub_id: selectedId,
      geo: geo,
      note: note || "",
      target: target || "",
      user_id: pubUserId, // Use the original creator's user_id
      level: level || "",
      vector: vector || "",
    };

    try {
      const response = await axios.put(`${apiUrl}/update-pubid`, updatedPub);
      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Publisher updated successfully.",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh table data after update
        const { data } = await axios.get(`${apiUrl}/get-Namepub/`);
        if (data.success && Array.isArray(data.data)) {
          setTableData(data.data);
        }

        resetForm();
      }
    } catch (error) {
      console.error("Error updating publisher:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error updating publisher. Please try again.",
      });
    }
  };

  // Handle Edit Button
  const handleEdit = (record) => {
    setEditingPub(record);
    setName(record.pub_name);
    setSelectedId(record.pub_id);
    setGeo(record.geo);
    setNote(record.note);
    setTarget(record.target);
    setPubUserId(record.user_id); // Set original creator's user_id for updating
    setLevel(record.level || "");
    setVector(record.vector || "");
  };

  // Reset Form
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

  // Helper: Get unique values for a column
  const getUniqueValues = (data, key) => [
    ...new Set(data.map((item) => item[key]).filter(Boolean)),
  ];

  // Helper: Create filter dropdown with onChange
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

  // 💡 You'll need your tableData available in scope for filters
  // For example: const [tableData, setTableData] = useState([]);

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
      title: "Publisher Name",
      dataIndex: "pub_name",
      key: "pub_name",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "pub_name",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.pub_name === value,
    },
    {
      title: "Publisher ID",
      dataIndex: "pub_id",
      key: "pub_id",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "pub_id",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.pub_id === value,
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
      title: "Level",
      dataIndex: "level",
      key: "level",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "level",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.level === value,
    },
    {
      title: "Vector",
      dataIndex: "vector",
      key: "vector",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "vector",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.vector === value,
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
            <label className="block text-lg font-medium">Vector</label>
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

export default SubAdminPubnameData;
