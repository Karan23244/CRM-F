import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Input, Select, Button, Space, Tooltip, Checkbox } from "antd";
import geoData from "../../Data/geoData.json";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import StyledTable from "../../Utils/StyledTable";
import { EditOutlined, CopyOutlined, EyeOutlined } from "@ant-design/icons";
const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

const SubAdminPubnameData = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const isPublisherManager = user?.role?.includes("publisher_manager");
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTextPub, setSearchTextPub] = useState("");

  const [editingPub, setEditingPub] = useState(null);
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null, // "ascend" | "descend" | null
  });
  // Form State for Editing
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [pubUserId, setPubUserId] = useState(null);
  const [target, setTarget] = useState("");
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [placeLinkValue, setPlaceLinkValue] = useState("");
  const [subAdmins, setSubAdmins] = useState([]);
  const [editingAssignRowId, setEditingAssignRowId] = useState(null);
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };
  const fetchData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-Namepub/`);
      console.log(response);
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
  // Fetch publisher data
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
            ["publisher_manager", "publisher"].includes(subAdmin.role),
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
  const getExcelFilteredDataForColumn = (columnKey) => {
    return tableData.filter((row) =>
      Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;
        if (!values || values.length === 0) return true;
        return values.includes(normalize(row[key]));
      }),
    );
  };
  useEffect(() => {
    if (!tableData.length) return;

    const valuesObj = {};

    Object.keys(tableData[0]).forEach((col) => {
      const source = getExcelFilteredDataForColumn(col);

      valuesObj[col] = [
        ...new Set(source.map((row) => normalize(row[col]))),
      ].sort((a, b) => a.localeCompare(b));
    });

    setUniqueValues(valuesObj);
  }, [tableData, filters]);
  const filteredData = tableData.filter((row) => {
    // 🔍 Global search
    const matchesSearch = [
      row.pub_name,
      row.pub_id,
      row.geo,
      row.note,
      row.target,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTextPub.toLowerCase());

    if (!matchesSearch) return false;

    // 🎯 Excel-style filters
    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(normalize(row[key]));
    });
  });
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
      const res = await axios.put(
        "https://track.pidmetric.com/postback/place-link",
        {
          pub_id: record.pub_id,
          user_id: userid,
          place_link: trimmedValue,
        },
      );
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
  const excelFilterDropdown = (key) => () => {
    const allValues = uniqueValues[key] || [];
    const selectedValues = filters[key] ?? allValues;
    const searchVal = filterSearch[key] || "";

    const visibleValues = allValues.filter((v) =>
      v.toLowerCase().includes(searchVal.toLowerCase()),
    );

    const isAllSelected = selectedValues.length === allValues.length;
    const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

    return (
      <div className="w-[260px]" onClick={(e) => e.stopPropagation()}>
        {/* Search */}
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

        {/* Select All */}
        <div className="px-3 py-2">
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
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

        {/* Values */}
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
  };

  const columns = [
    {
      title: "UserName",
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username),
      sortOrder: sortInfo.columnKey === "username" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "username") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "username",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("username"),
      onFilter: (value, record) => record.username === value,
    },
    {
      title: "Publisher Name",
      dataIndex: "pub_name",
      key: "pub_name",
      sorter: (a, b) => a.pub_name.localeCompare(b.pub_name),
      sortOrder: sortInfo.columnKey === "pub_name" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "pub_name") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "pub_name",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("pub_name"),
      onFilter: (value, record) => record.pub_name === value,
    },
    {
      title: "Publisher ID",
      dataIndex: "pub_id",
      key: "pub_id",
      sorter: (a, b) => a.pub_id.localeCompare(b.pub_id),
      sortOrder: sortInfo.columnKey === "pub_id" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "pub_id") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "pub_id",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("pub_id"),
      onFilter: (value, record) => record.pub_id === value,
    },
    {
      title: "Geo",
      dataIndex: "geo",
      key: "geo",
      sorter: (a, b) => a.geo.localeCompare(b.geo),
      sortOrder: sortInfo.columnKey === "geo" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "geo") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "geo",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("geo"),
      onFilter: (value, record) => record.geo === value,
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      sorter: (a, b) => a.note.localeCompare(b.note),
      sortOrder: sortInfo.columnKey === "note" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "note") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "note",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("note"),
      onFilter: (value, record) => record.note === value,
    },
    {
      title: "Target",
      dataIndex: "target",
      key: "target",
      sorter: (a, b) => a.target.localeCompare(b.target),
      sortOrder: sortInfo.columnKey === "target" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "target") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "target",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("target"),
      onFilter: (value, record) => record.target === value,
    },
    {
      title: <div style={{ textAlign: "center" }}>Rating</div>,
      dataIndex: "level",
      key: "level",
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
      title: <div style={{ textAlign: "center" }}>Postback URL</div>,
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
    /* ✅ CONDITIONAL COLUMN */
    ...(isPublisherManager
      ? [
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
                          (admin) => admin.id.toString() === newUserId,
                        );
                        if (!selectedAdmin) {
                          Swal.fire("Error", "Invalid user selected", "error");
                          return;
                        }
                        const response = await axios.put(
                          `${apiUrl}/update-pubid`,
                          {
                            ...record,
                            user_id: selectedAdmin.id,
                            username: selectedAdmin.username,
                          },
                        );
                        if (response.data.success) {
                          Swal.fire(
                            "Success",
                            "User transferred successfully!",
                            "success",
                          );
                          fetchData();
                        } else {
                          Swal.fire(
                            "Error",
                            "Failed to transfer user",
                            "error",
                          );
                        }
                        console.log({
                          ...record,
                          user_id: selectedAdmin.id,
                          username: selectedAdmin.username,
                        });
                      } catch (error) {
                        console.error("User transfer error:", error);
                        Swal.fire("Error", "Something went wrong", "error");
                      } finally {
                        setEditingAssignRowId(null);
                      }
                    }}
                    onBlur={() => setEditingAssignRowId(null)}
                    className="min-w-[150px]">
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
        ]
      : []),
    {
      title: <div style={{ textAlign: "center" }}>Action</div>,
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
    {
      title: <div style={{ textAlign: "center" }}>Details</div>,
      key: "details",
      align: "center",
      render: (_, record) => {
        const username = record.publisher_username || "-";
        const password = record.password || "-";

        const copyToClipboard = () => {
          const text = `Username: ${username}\nPassword: ${password}`;
          navigator.clipboard.writeText(text);
          message.success("Details copied!");
        };

        const hoverContent = (
          <div className="text-xs space-y-2 max-w-[250px]">
            <div>
              <strong>Username:</strong> {username}
            </div>
            <div className="break-all">
              <strong>Password:</strong> {password}
            </div>

            <Button
              type="primary"
              size="small"
              icon={<CopyOutlined />}
              onClick={copyToClipboard}
              block>
              Copy Details
            </Button>
          </div>
        );

        return (
          <Tooltip
            title={hoverContent}
            trigger="hover"
            placement="right"
            overlayInnerStyle={{ padding: "10px" }}>
            <Button type="default" size="small" icon={<EyeOutlined />}>
              View
            </Button>
          </Tooltip>
        );
      },
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
        value={searchTextPub}
        onChange={(e) => setSearchTextPub(e.target.value)}
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
