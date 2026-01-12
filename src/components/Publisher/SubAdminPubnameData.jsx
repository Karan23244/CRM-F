import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Input, Select, Button, Space, Tooltip } from "antd";
import geoData from "../../Data/geoData.json";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import StyledTable from "../../Utils/StyledTable";
import { EditOutlined } from "@ant-design/icons";
const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

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
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [placeLinkValue, setPlaceLinkValue] = useState("");
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
      user_id: pubUserId,
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
    setPubUserId(record.user_id);
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
  // Handle place link save
  const autoSavePlaceLink = async (record, value) => {
    const trimmedValue = value.trim();
    const userid = record.user_id;

    // Skip API call if unchanged
    if ((record.place_link || "") === trimmedValue) {
      setEditingLinkId(null);
      return;
    }

    try {
      const res = await axios.put("https://track.pidmetric.com/postback/place-link", {
        pub_id: record.pub_id,
        user_id: userid,
        place_link: trimmedValue,
      });
      console.log("Place link save response:", res);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: "Postback URL saved successfully.",
        });
      }

      const { data } = await axios.get(`${apiUrl}/get-Namepub/`);
      if (data.success && Array.isArray(data.data)) {
        setTableData(data.data);
      }
    } catch (err) {
      console.error("Error saving Postback URL:", err);
      // 🔥 Handle 404 specifically
      if (err.response?.status === 404) {
        Swal.fire({
          icon: "warning",
          title: "Link Not Generated",
          text: "Publisher link has not been generated.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: "Could not save Postback URL. Please try again.",
        });
      }
    } finally {
      setEditingLinkId(null);
    }
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
      title: "Rating",
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
      render: (text) => {
        if (!text) return "-";

        // Format each numeric part to 2 decimals
        return text
          .split(",")
          .map((part) => {
            const match = part.match(/-?\d+(\.\d+)?/);
            if (match) {
              const num = parseFloat(match[0]).toFixed(2);
              return part.replace(match[0], num);
            }
            return part;
          })
          .join(",");
      },
    },
    {
      title: "Postback URL",
      dataIndex: "postback_url",
      key: "postback_url",
      width: 300,
      render: (text, record) => {
        const isEditing = editingLinkId === record.pub_id;

        if (isEditing) {
          return (
            <Input
              autoFocus
              value={placeLinkValue}
              placeholder="Paste Postback URL"
              onChange={(e) => setPlaceLinkValue(e.target.value)}
              onBlur={() => autoSavePlaceLink(record, placeLinkValue)}
              onPressEnter={() => autoSavePlaceLink(record, placeLinkValue)}
              className="w-full"
            />
          );
        }

        return (
          <div
            className="cursor-pointer min-h-[32px]"
            onClick={() => {
              setEditingLinkId(record.pub_id);
              setPlaceLinkValue(text || "");
            }}>
            {text ? (
              <a
                href={text}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}>
                {text}
              </a>
            ) : (
              <span className="text-gray-400">Click to add link</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="">
      {editingPub && (
        <form
          onSubmit={handleUpdate}
          className="bg-white p-8 rounded-2xl shadow-lg space-y-6 mb-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-4">
            Update Publisher Details
          </h2>

          {/* Two-Column Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Publisher Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Publisher Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter publisher name"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5D99] transition-all"
              />
            </div>

            {/* Publisher ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Publisher ID (Cannot be modified)
              </label>
              <input
                type="text"
                value={selectedId}
                disabled
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Select Geo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Geo
              </label>
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
                  <Option key={geo.code} value={geo.code} label={geo.code}>
                    {geo.code}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Enter target value"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5D99] transition-all"
              />
            </div>

            {/* Note - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="3"
                placeholder="Add a note..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5D99] transition-all"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-[#2F5D99] hover:bg-[#24487A] text-white py-3 rounded-lg font-medium shadow-md transition-all duration-300">
              Update Publisher
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-medium shadow-md transition-all duration-300">
              Cancel
            </button>
          </div>
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
      <StyledTable
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
        className="mt-5"
        bordered
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default SubAdminPubnameData;
