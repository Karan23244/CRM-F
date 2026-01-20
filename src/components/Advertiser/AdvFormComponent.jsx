import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Table, Select, Button, Space, Input, Tooltip, Checkbox } from "antd";
import { useSelector } from "react-redux";
import geoData from "../../Data/geoData.json";
import SubAdminAdvnameData from "./SubAdminAdvnameData";
import {
  SearchOutlined,
  UserOutlined,
  DatabaseOutlined,
  EditOutlined,
} from "@ant-design/icons";
import StyledTable from "../../Utils/StyledTable";

const apiUrl = import.meta.env.VITE_API_URL;

const AdvertiserIDDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState("yourData");
  const showAssignPubTab = user?.role?.includes("advertiser_manager");

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2F5D99] mb-4 md:mb-0">
          Advertiser Dashboard
        </h2>
      </div>
      {/* Tabs Section — only show if user is publisher_manager */}
      {showAssignPubTab && (
        <div className="flex flex-wrap gap-3 mb-6 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <Button
            icon={<UserOutlined />}
            type="default"
            onClick={() => setActiveTab("yourData")}
            className={`!rounded-lg !px-6 !py-2 !text-base font-semibold ${
              activeTab === "yourData"
                ? "!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !border-none !shadow-md"
                : "!bg-gray-100 hover:!bg-gray-200 !text-[#2F5D99]"
            }`}>
            Your Data
          </Button>

          <Button
            icon={<DatabaseOutlined />}
            type="default"
            onClick={() => setActiveTab("assignPub")}
            className={`!rounded-lg !px-6 !py-2 !text-base font-semibold ${
              activeTab === "assignPub"
                ? "!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !border-none !shadow-md"
                : "!bg-gray-100 hover:!bg-gray-200 !text-[#2F5D99]"
            }`}>
            Assign Adv Data
          </Button>
        </div>
      )}

      {activeTab === "yourData" ? (
        <AdvertiserEditForm />
      ) : showAssignPubTab ? (
        <SubAdminAdvnameData />
      ) : null}
    </div>
  );
};

export default AdvertiserIDDashboard;

const AdvertiserEditForm = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const { Option } = Select;
  const isAdvertiserManager = user?.role?.includes("advertiser_manager");

  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("");
  const [acc_email, setAcc_email] = useState("");
  const [poc_email, setPoc_email] = useState("");
  const [assign_user, setAssign_user] = useState("");
  const [assign_id, setAssign_id] = useState("");
  const [editingAdv, setEditingAdv] = useState(null);
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [advertisers, setAdvertisers] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  const [editingAssignRowId, setEditingAssignRowId] = useState(null);
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };
  console.log(subAdmins);
  const trimValues = (obj) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k,
        typeof v === "string" ? v.trim() : v,
      ]),
    );
  const getExcelFilteredDataForColumn = (columnKey) => {
    return advertisers.filter((row) =>
      Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;
        if (!values || values.length === 0) return true;
        return values.includes(normalize(row[key]));
      }),
    );
  };
  useEffect(() => {
    const valuesObj = {};

    Object.keys(advertisers[0] || {}).forEach((col) => {
      const source = getExcelFilteredDataForColumn(col);

      valuesObj[col] = [
        ...new Set(source.map((row) => normalize(row[col]))),
      ].sort((a, b) => a.localeCompare(b));
    });

    setUniqueValues(valuesObj);
  }, [advertisers, filters]);
  const fetchAdvertisers = async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(`${apiUrl}/advid-data/${userId}`);
      if (data.success && Array.isArray(data.advertisements)) {
        setAdvertisers(data.advertisements);
      }
    } catch {
      setAdvertisers([]);
    }
  };
  useEffect(() => {
    fetchAdvertisers();
  }, [userId]);
  const filteredData = advertisers.filter((row) => {
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

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const res = await fetch(`${apiUrl}/get-subadmin`);
        const data = await res.json();
        if (res.ok) {
          setSubAdmins(
            data.data.filter(
              (a) =>
                ["advertiser_manager", "advertiser", "operations"].includes(
                  a.role,
                ) && a.id !== userId,
            ),
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubAdmins();
  }, []);

  const handleEdit = (record) => {
    setEditingAdv(record);
    setName(record.adv_name);
    setSelectedId(record.adv_id);
    setGeo(record.geo);
    setNote(record.note || "");
    setTarget(record.target || "");
    setAcc_email(record.acc_email || "");
    setPoc_email(record.poc_email || "");
    setAssign_user(record.assign_user || "");
    setAssign_id(record.assign_id || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedAdv = trimValues({
      adv_name: name,
      adv_id: selectedId,
      geo,
      note,
      target,
      acc_email,
      poc_email,
      assign_user,
      assign_id,
      user_id:
        user?.role === "advertiser_manager" ? editingAdv?.user_id : userId,
    });

    if (!updatedAdv.adv_name || !updatedAdv.adv_id || !updatedAdv.geo) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all required fields.",
      });
    }

    try {
      const response = await axios.put(`${apiUrl}/update-advid`, updatedAdv);
      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: response.data.message || "Advertiser updated successfully!",
        });

        const { data } = await axios.get(`${apiUrl}/advid-data/${userId}`);
        if (data.success && Array.isArray(data.advertisements)) {
          setAdvertisers(data.advertisements);
        }

        resetForm();
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Something went wrong.",
      });
    }
  };

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
  };
  const columns = [
    {
      title: "Advertiser ID",
      dataIndex: "adv_id",
      key: "adv_id",
      sorter: (a, b) => a.adv_id.localeCompare(b.adv_id),
      sortOrder: sortInfo.columnKey === "adv_id" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "adv_id") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "adv_id",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("adv_id"),
      onFilter: (value, record) => record.adv_id === value,
    },
    {
      title: "Advertiser Name",
      dataIndex: "adv_name",
      key: "adv_name",
      sorter: (a, b) => a.adv_name.localeCompare(b.adv_name),
      sortOrder: sortInfo.columnKey === "adv_name" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "adv_name") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "adv_name",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("adv_name"),
      onFilter: (value, record) => record.adv_name === value,
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
      dataIndex: "assign_user",
      key: "assign_user",
      sorter: (a, b) => a.assign_user.localeCompare(b.assign_user),
      sortOrder: sortInfo.columnKey === "assign_user" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "assign_user") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "assign_user",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("assign_user"),
      onFilter: (value, record) => record.assign_user === value,
    },
    {
      title: "Postback URL",
      dataIndex: "postback_url",
      key: "postback_url",
    },
    /* ✅ CONDITIONAL COLUMN */
    ...(isAdvertiserManager
      ? [
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
                        const response = await axios.put(
                          `${apiUrl}/update-advid`,
                          {
                            ...record,
                            user_id: newUserId,
                          },
                        );
                        if (response.data.success) {
                          Swal.fire(
                            "Success",
                            "User transferred successfully!",
                            "success",
                          );

                          // ✅ Update local tableData to reflect changes
                          setTableData((prev) =>
                            prev.map((item) =>
                              item.adv_id === record.adv_id
                                ? {
                                    ...item,
                                    user_id: newUserId,
                                  }
                                : item,
                            ),
                          );
                        } else {
                          Swal.fire(
                            "Error",
                            "Failed to transfer user",
                            "error",
                          );
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
        ]
      : []),
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
      {editingAdv && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          {/* Advertiser Name */}
          <div>
            <label className="block text-[#2F5D99] text-base font-semibold mb-2">
              Advertiser Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all ${
                editingAdv ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              required
              disabled={!!editingAdv}
            />
          </div>

          {/* Advertiser ID */}
          <div>
            <label className="block text-[#2F5D99] text-base font-semibold mb-2">
              Select Advertiser ID
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all ${
                editingAdv ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              required
              disabled={!!editingAdv}>
              <option value="">Select an ID</option>
              {(editingAdv ? [editingAdv.adv_id] : availableIds).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          {/* Select Geo */}
          <div>
            <label className="block text-[#2F5D99] text-base font-semibold mb-2">
              Select Geo
            </label>
            <Select
              showSearch
              value={geo}
              onChange={(val) => setGeo(val)}
              placeholder="Select Geo"
              className="w-full"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              required>
              {geoData.geo?.map((geo) => (
                <Select.Option key={geo.code} value={geo.code} label={geo.code}>
                  {geo.code}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Conditional Fields for Advertiser Manager */}
          {user?.role?.includes("advertiser_manager") && (
            <>
              <div>
                <label className="block text-[#2F5D99] text-base font-semibold mb-2">
                  Target
                </label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
                />
              </div>
              <div>
                <label className="block text-[#2F5D99] text-base font-semibold mb-2">
                  POC Email
                </label>
                <input
                  type="email"
                  value={poc_email}
                  onChange={(e) => setPoc_email(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
                />
              </div>
              <div>
                <label className="block text-[#2F5D99] text-base font-semibold mb-2">
                  Account Email
                </label>
                <input
                  type="email"
                  value={acc_email}
                  onChange={(e) => setAcc_email(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[#2F5D99] text-base font-semibold mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
                  rows="3"
                />
              </div>
            </>
          )}

          {/* Assign User for Non-Manager */}
          {user?.role !== "advertiser_manager" && (
            <div className="md:col-span-2">
              <label className="block text-[#2F5D99] text-base font-semibold mb-2">
                Assign User
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
                value={assign_id}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedUser = subAdmins.find(
                    (a) => a.id.toString() === selectedId,
                  );
                  setAssign_id(selectedId);
                  setAssign_user(selectedUser?.username || "");
                }}>
                <option value="">Select Sub Admin</option>
                {subAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="md:col-span-2 flex flex-wrap justify-end gap-4 mt-4 pt-4 border-gray-200">
            <button
              type="submit"
              className="flex-1 md:flex-none bg-[#2F5D99] hover:bg-[#24487A] text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all">
              {editingAdv ? "Update Advertiser" : "Create Advertiser"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="flex-1 md:flex-none bg-gray-400 hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Show Table and Search Bar only when not editing */}
      {!editingAdv && (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative w-full md:w-[300px]">
              <Input
                placeholder="Search Advertisers..."
                prefix={<SearchOutlined style={{ color: "#999" }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                className="rounded-full shadow-md border-none ring-1 ring-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          <StyledTable
            bordered
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
            scroll={{ x: "max-content" }}
            onChange={(pagination, filters, sorter) => {
              // Update sort info only if user clicks header or sorter changes
              if (sorter.order || sorter.columnKey) {
                setSortInfo({
                  columnKey: sorter.columnKey,
                  order: sorter.order || null,
                });
              }
            }}
            sortDirections={["ascend", "descend", null]} // 🔹 allows 3rd (none) state
            showSorterTooltip={false}
          />
        </div>
      )}
    </div>
  );
};
