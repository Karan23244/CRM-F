import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Input, Select, Button, Space, Tooltip, Checkbox } from "antd";
import {
  FilterOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import geoData from "../../Data/geoData.json";
import Swal from "sweetalert2";
import StyledTable from "../../Utils/StyledTable";

const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

const PubnameData = () => {
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPub, setEditingPub] = useState(null);
  console.log(tableData)
  // Form State for Editing
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [pubUserId, setPubUserId] = useState(null);
  const [editingAssignRowId, setEditingAssignRowId] = useState(null);
  const [target, setTarget] = useState("");
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [placeLinkValue, setPlaceLinkValue] = useState("");
  // const [level, setLevel] = useState("");
  const [subAdmins, setSubAdmins] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };
  const getExcelFilteredDataForColumn = (columnKey) => {
    return tableData.filter((row) =>
      Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;
        if (!values || values.length === 0) return true;
        return values.includes(normalize(row[key]));
      })
    );
  };
  useEffect(() => {
    const valuesObj = {};

    Object.keys(tableData[0] || {}).forEach((col) => {
      const source = getExcelFilteredDataForColumn(col);
      valuesObj[col] = [
        ...new Set(source.map((row) => normalize(row[col]))),
      ].sort((a, b) => a.localeCompare(b));
    });

    setUniqueValues(valuesObj);
  }, [tableData, filters]);

  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value?.length ? value : undefined,
    }));
  };

  const finalFilteredData = tableData.filter((row) => {
    // 🔍 Global search
    const matchesSearch = Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 🎯 Excel-style filters
    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(normalize(row[key]));
    });
  });
  const togglePin = (key) => {
    setPinnedColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ✅ Make fetchData reusable
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

  // **Fetch publisher data on mount**
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await fetch(`${apiUrl}/get-subadmin`);
        const data = await response.json();
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
      user_id: pubUserId,
      // level: level || "",
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
    // setLevel(record.level || "");
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
    // setLevel("");
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
      const res = await axios.put(`${apiUrl}/place-link`, {
        pub_id: record.pub_id,
        user_id: userid,
        place_link: trimmedValue,
      });

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
  const createExcelColumn = ({ key, title }) => {
    const isFiltered = !!filters[key]?.length;
    const isPinned = pinnedColumns[key];
    const isSorted = sortInfo.columnKey === key;

    return {
      title: (
        <div className="flex items-center justify-between gap-2">
          <span
            style={{
              color: isFiltered ? "#1677ff" : "inherit",
              fontWeight: isFiltered ? "bold" : "normal",
            }}>
            {title}
          </span>

          <PushpinOutlined
            onClick={(e) => {
              e.stopPropagation();
              togglePin(key);
            }}
            style={{
              color: isPinned ? "#1677ff" : "#aaa",
              cursor: "pointer",
            }}
          />
        </div>
      ),

      key,
      dataIndex: key,
      fixed: isPinned ? "left" : false,

      sorter: (a, b) =>
        (a[key] || "").toString().localeCompare((b[key] || "").toString()),

      sortOrder: isSorted ? sortInfo.order : null,

      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";
          if (sortInfo.columnKey === key) {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend") newOrder = null;
          }
          setSortInfo({ columnKey: key, order: newOrder });
        },
      }),

      filterDropdown: () => {
        const allValues = uniqueValues[key] || [];
        const selectedValues = filters[key] ?? allValues;
        const searchVal = filterSearch[key] || "";

        const visibleValues = allValues.filter((v) =>
          v.toLowerCase().includes(searchVal.toLowerCase())
        );

        const isAllSelected = selectedValues.length === allValues.length;

        return (
          <div className="w-[260px]" onClick={(e) => e.stopPropagation()}>
            {/* 🔍 Search */}
            <div className="p-2 border-b bg-white">
              <Input
                allowClear
                placeholder="Search values"
                value={searchVal}
                onChange={(e) =>
                  setFilterSearch((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
              />
            </div>

            {/* ☑ Select All */}
            <div className="px-3 py-2">
              <Checkbox
                checked={isAllSelected}
                indeterminate={selectedValues.length > 0 && !isAllSelected}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFilters((prev) => {
                    const updated = { ...prev };
                    if (checked) delete updated[key];
                    else updated[key] = [];
                    return updated;
                  });
                }}>
                Select All
              </Checkbox>
            </div>

            {/* 📋 Values */}
            <div className="max-h-[220px] overflow-y-auto px-2 pb-2">
              {visibleValues.map((val) => (
                <label
                  key={val}
                  className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-blue-50">
                  <Checkbox
                    checked={selectedValues.includes(val)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedValues, val]
                        : selectedValues.filter((v) => v !== val);

                      setFilters((prev) => ({
                        ...prev,
                        [key]: next,
                      }));
                    }}
                  />
                  <span className="truncate">{val}</span>
                </label>
              ))}
            </div>
          </div>
        );
      },

      filtered: isFiltered,
    };
  };
  const columnConfig = {
    username: "UserName",
    pub_name: "Publisher Name",
    pub_id: "Publisher ID",
    geo: "Geo",
    note: "Note",
    target: "Target",
  };

  const columns = [
    ...Object.entries(columnConfig).map(([key, label]) =>
      createExcelColumn({ key, title: label })
    ),

    {
      title: (
        <div className="flex items-center justify-between">
          <span>Level</span>
        </div>
      ),
      key: "level",
      dataIndex: "level",
      render: (text) => {
        if (!text) return "-";

        // Example: split by comma and process each numeric part
        return text
          .split(",")
          .map((part) => {
            // Extract number (can be negative or decimal)
            const match = part.match(/-?\d+(\.\d+)?/);
            if (match) {
              const num = parseFloat(match[0]).toFixed(2); // limit to 2 decimals
              return part.replace(match[0], num);
            }
            return part;
          })
          .join(",");
      },
    },
    {
      title: (
        <div className="flex items-center justify-between">
          <span>Postback URL</span>
        </div>
      ),
      key: "postback_url",
      dataIndex: "postback_url",
      width: 300,
      render: (text, record) => {
        if (!text && editingLinkId !== record.pub_id) {
          return (
            <div
              className="cursor-pointer min-h-[32px] text-gray-400"
              onClick={() => {
                setEditingLinkId(record.pub_id);
                setPlaceLinkValue("");
              }}>
              Click to add link
            </div>
          );
        }

        const isEditing = editingLinkId === record.pub_id;

        if (isEditing) {
          return (
            <Input
              autoFocus
              value={placeLinkValue}
              placeholder="Paste place link"
              onChange={(e) => setPlaceLinkValue(e.target.value)}
              onBlur={() => autoSavePlaceLink(record, placeLinkValue)}
              onPressEnter={() => autoSavePlaceLink(record, placeLinkValue)}
              className="w-full"
            />
          );
        }

        // Normal render (like Level column formatting logic)
        return (
          <div
            className="cursor-pointer min-h-[32px]"
            onClick={() => {
              setEditingLinkId(record.pub_id);
              setPlaceLinkValue(text);
            }}>
            <a
              href={text}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-500 underline">
              {text}
            </a>
          </div>
        );
      },
    },
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

        return (
          <span
            onClick={() => setEditingAssignRowId(record.pub_id)}
            className="cursor-pointer hover:underline"
            title="Click to change user">
            {record.username || "Select Sub Admin"}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <EditOutlined
              onClick={() => handleEdit(record)}
              style={{
                color: "#2F5D99",
                fontSize: "18px",
                cursor: "pointer",
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="m-6 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Publisher</h2>

      {/* Show Form Only in Edit Mode */}
      {editingPub && (
        <form
          onSubmit={handleUpdate}
          className="bg-white shadow-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Update Publisher
          </h2>

          {/* Two-column grid */}
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
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99] transition-all"
                required
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
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                disabled
              />
            </div>

            {/* Select Geo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Geo
              </label>
              <select
                showSearch
                value={geo}
                onChange={(value) => setGeo(value)}
                placeholder="Select Geo"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99]"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.label?.toLowerCase().includes(input.toLowerCase())
                }
                required>
                {geoData.geo?.map((geo) => (
                  <option key={geo.code} value={geo.code} label={`${geo.code}`}>
                    {geo.code}
                  </option>
                ))}
              </select>
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
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99]"
              />
            </div>

            {/* Note (Full width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="3"
                placeholder="Enter any note"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99] transition-all"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              className="w-full sm:w-1/2 bg-[#2F5D99] hover:bg-[#24487A] text-white font-medium py-3 rounded-lg shadow-md transition-all">
              Update Publisher
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-1/2 bg-gray-400 hover:bg-gray-500 text-white font-medium py-3 rounded-lg shadow-md transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* 🔍 Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        {/* Search Section */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search by Advertiser Name, Geo, or Note"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined className="text-gray-400" />}
            className="!w-72 !rounded-lg !border-gray-300 hover:!border-[#2F5D99] !px-2 !py-2 !h-10 focus:!border-[#2F5D99] !shadow-sm transition-all"
          />

          <Button
            type="default"
            onClick={() => handleSearch?.()} // optional if you have a search handler
            className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-6 !py-2 !h-10 !text-sm !border-none !shadow-md flex items-center gap-2">
            <SearchOutlined /> Search
          </Button>

          <Button
            onClick={() => {
              setSearchTerm("");
              setFilters({});
            }}
            className="!bg-gray-400 hover:!bg-gray-500 !text-white !rounded-lg !px-6 !py-2 !h-10 !text-sm !border-none !shadow-md flex items-center gap-2"
            disabled={Object.keys(filters).length === 0 && !searchTerm}>
            <ReloadOutlined /> Clear Filters
          </Button>
        </div>
      </div>

      {/* Table Component */}
      <StyledTable
        dataSource={finalFilteredData}
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
