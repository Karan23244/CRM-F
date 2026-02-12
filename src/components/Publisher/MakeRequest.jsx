import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createNotification } from "../../Utils/Notification";
import io from "socket.io-client";

import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Checkbox,
  notification,
  DatePicker,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;
import Swal from "sweetalert2";
import { exportToExcel } from "../exportExcel";
import { debounce } from "lodash";
import axios from "axios";
import { subscribeToNotifications } from "./Socket";
import { PushpinOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { AutoComplete } from "antd";
import StyledTable from "../../Utils/StyledTable";
import { RiFileExcel2Line } from "react-icons/ri";
import { FaFilterCircleXmark } from "react-icons/fa6";
import { sortDropdownValues } from "../../Utils/sortDropdownValues";
import geoData from "../../Data/geoData.json";

const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL1;
const apiUrl1 = import.meta.env.VITE_API_URL;
const columnHeadingsMap = {
  pub_name: "Publisher",
  adv_name: "Advertiser",
  campaign_name: "Campaign",
  note: "Note",
  payout: "PUB Payout $",
  os: "OS",
  pid: "PID",
  pub_id: "PUB ID",
  geo: "Geo",
  created_at: "Created At",
  adv_res: "Status",
};
const PublisherRequest = ({ senderId, receiverId }) => {
  const user = useSelector((state) => state.auth.user);
  const username = user?.username || null;
  const userRole = user?.role || []; // array of roles
  const userId = user?.id || null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [requests, setRequests] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({ geo: [] });
  const [searchText, setSearchText] = useState("");
  const [blacklistPIDs, setBlacklistPIDs] = useState([]);
  const [filters, setFilters] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    const saved = localStorage.getItem("hiddenCampaignColumns");
    return saved ? JSON.parse(saved) : [];
  });
  const [firstFilteredColumn, setFirstFilteredColumn] = useState(null);
  const [geoRows, setGeoRows] = useState([]);
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };
  // Default: start = first day of current month, end = today
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  // persist hidden columns
  useEffect(() => {
    localStorage.setItem(
      "hiddenCampaignColumns",
      JSON.stringify(hiddenColumns),
    );
  }, [hiddenColumns]);
  useEffect(() => {
    if (isModalVisible) {
      setGeoRows([{ geo: [], payout: "", os: "" }]);
    }
  }, [isModalVisible]);

  // ✅ Callbacks to prevent re-creation on each render
  const clearAllFilters = useCallback(() => {
    setFilters({});
    setHiddenColumns([]);
    setPinnedColumns({});
    setSearchText("");
    localStorage.removeItem("hiddenCampaignColumns");

    // Reset date range to default Month Start → Today
    setDateRange([dayjs().startOf("month"), dayjs()]);
  }, []);

  const togglePin = useCallback((key) => {
    setPinnedColumns((prev) => {
      let next;
      if (!prev[key]) next = "left";
      else if (prev[key] === "left") next = "right";
      else next = null;
      return { ...prev, [key]: next };
    });
  }, []);
  // const handleFilterChange = useCallback((value, key) => {
  //   setFilters((prev) => ({ ...prev, [key]: value }));
  // }, []);
  const handleFilterChange = useCallback((value, key) => {
    // detect the first filter applied
    setFilters((prev) => {
      const isFirstFilter = Object.values(prev).every((arr) => !arr?.length);

      if (isFirstFilter) {
        setFirstFilteredColumn(key); // ⭐ store first filtered column
      }

      return { ...prev, [key]: value };
    });
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setSearchText(val);
      }, 400),
    [],
  );

  // 🚀 Fetchers
  const fetchDropdowns = useCallback(async () => {
    try {
      const [pidRes, pubRes] = await Promise.all([
        axios.get(`${apiUrl1}/get-pid`),
        axios.get(`${apiUrl1}/get-allpub`),
      ]);
      setDropdownOptions({
        pid: pidRes.data?.data?.map((item) => item.pid) || [],
        pub_id: pubRes.data?.data?.map((item) => item.pub_id) || [],
        geo: [...new Set(geoData.geo?.map((i) => i.code) || [])],
      });
    } catch {
      message.error("Failed to fetch dropdown options");
    }
  }, [apiUrl1]);

  const fetchAdvertisers = useCallback(async () => {
    try {
      const { data } = await axios.get(`${apiUrl1}/get-subadmin`);

      const names =
        data?.data
          ?.filter((a) => {
            // Normalize role string (remove quotes/spaces, split by comma)
            const roles =
              a.role
                ?.replace(/"/g, "") // remove quotes
                ?.split(",") // split by comma
                ?.map((r) => r.trim()) || [];

            // Check if any role matches desired roles
            return roles.some((r) =>
              ["advertiser_manager", "advertiser", "operations"].includes(r),
            );
          })
          ?.map((a) => a.username) || [];

      setAdvertisers(names);
    } catch {
      message.error("Failed to load advertiser names");
    }
  }, [apiUrl1]);

  const fetchBlacklistPIDs = useCallback(async () => {
    try {
      const { data } = await axios.get(`${apiUrl1}/get-blacklist`);
      setBlacklistPIDs(data?.map((item) => item.blacklistID) || []);
    } catch {
      console.error("Failed to fetch blacklist PIDs");
    }
  }, [apiUrl1]);

  const fetchRequests = useCallback(async () => {
    try {
      const [startDate, endDate] = dateRange;
      const res = await axios.get(`${apiUrl}/getAllPubRequests12`, {
        params: {
          startDate: startDate.format("YYYY-MM-DD"),
          endDate: endDate.format("YYYY-MM-DD"),
          id: userId,
        },
      });
      const sortedData = (res.data?.data || []).sort((a, b) => b.id - a.id);
      setRequests(sortedData);
    } catch (err) {
      console.error(err);
      message.error("Failed to load requests");
      setRequests([]);
    }
  }, [apiUrl, dateRange]);
  const showModal = () => {
    setIsModalVisible(true);
  };
  // 🚀 Initial Load
  useEffect(() => {
    fetchBlacklistPIDs();
    fetchDropdowns();
    fetchAdvertisers();
  }, [fetchBlacklistPIDs, fetchDropdowns, fetchAdvertisers]);

  // Separate effect to fetch requests when dateRange changes
  useEffect(() => {
    fetchRequests();
    subscribeToNotifications(() => fetchRequests());
  }, [fetchRequests, subscribeToNotifications]);

  // 🔍 Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter((row) => {
      // 🔍 Global search
      const matchesSearch = Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase());

      if (!matchesSearch) return false;

      // 🎯 Excel-style filters
      return Object.entries(filters).every(([key, values]) => {
        if (!values || values.length === 0) return true;
        return values.includes(normalize(row[key]));
      });
    });
  }, [requests, filters, searchText]);

  const getExcelFilteredDataForColumn = useCallback(
    (columnKey) => {
      return requests.filter((row) => {
        return Object.entries(filters).every(([key, values]) => {
          if (key === columnKey) return true; // ignore self
          if (!values || values.length === 0) return true;
          return values.includes(normalize(row[key]));
        });
      });
    },
    [requests, filters],
  );
  useEffect(() => {
    const valuesObj = {};

    Object.keys(columnHeadingsMap).forEach((col) => {
      const source = getExcelFilteredDataForColumn(col);

      valuesObj[col] = [
        ...new Set(source.map((row) => normalize(row[col]))),
      ].sort((a, b) => a.localeCompare(b));
    });

    setUniqueValues(valuesObj);
  }, [requests, filters, getExcelFilteredDataForColumn]);

  const handleCancel = () => {
    setGeoRows([]); // empty rows
    form.resetFields();
    setIsModalVisible(false);
  };

  const addGeoRow = () => {
    setGeoRows([...geoRows, { geo: [], payout: "", os: "" }]);
  };

  const removeGeoRow = (index) => {
    const updated = [...geoRows];
    updated.splice(index, 1);
    setGeoRows(updated);
  };

  const handleOk = async () => {
    try {
      setIsSubmitting(true);
      const values = await form.validateFields();

      // ⛔ Check if the PID is blacklisted
      if (blacklistPIDs.includes(values.pid)) {
        Swal.fire({
          icon: "error",
          title: "Submission Blocked",
          text: `The selected PID "${values.pid}" is blacklisted and cannot be submitted.`,
        });
        return;
      }

      // ✅ Convert geoRows → Separate Arrays
      const geoArray = geoRows.map((row) => row.geo);
      const payoutArray = geoRows.map((r) => r.payout);
      const osArray = geoRows.map((r) => r.os.toLowerCase());

      // ✅ Prepare Correct Backend Format
      const requestData = {
        adv_name: values.advertiserName,
        campaign_name: values.campaignName,
        payout: payoutArray,
        os: osArray,
        pub_name: username,
        pub_id: values.pub_id,
        pid: values.pid,
        geo: geoArray,
        note: values.note,
      };
      console.log("Submitting Request Data:", requestData);
      const response = await axios.post(
        `${apiUrl}/addPubRequestnew`,
        requestData,
      );

      if (response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Request submitted successfully!",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to submit request!",
        });
      }
      setGeoRows([]); // reset to zero
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: "Failed to submit request",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🚀 Update Permission / Priority
  const handleUpdatePrm = useCallback(
    async (record, values) => {
      try {
        const payload = {
          id: record.id,
          campaign_name: record.campaign_name,
          pid: record.pid,
          priority: values.priority,
          prm: values.prm,
        };
        // 🧠 Dynamic sender (logged-in user)
        const senderName = username; // from Redux
        const receiverName = record.adv_name; // advertiser name from table row

        // 📨 Send notification dynamically
        await createNotification({
          sender: senderName, // will be resolved to sender_id internally
          receiver: receiverName, // will be resolved to receiver_id internally
          type: "link_shared",
          message: `📢 Permission by ${senderName} for campaign "${
            record.campaign_name
          }" — ${
            values.prm === 1
              ? "✅ Allow"
              : values.prm === 2
                ? "❌ Disallow"
                : "🟡 Hold"
          }`,
          url: "/dashboard/view-request",
        });

        const res = await axios.put(`${apiUrl}/updatePubprm`, payload);

        if (res.data?.success) {
          // Update only the specific row in local state
          setRequests((prev) =>
            prev.map((item) =>
              item.id === record.id
                ? { ...item, priority: values.priority, prm: values.prm }
                : item,
            ),
          );

          Swal.fire({
            icon: "success",
            title: "Success",
            text: res.data.message || "Updated successfully",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.data.message || "Update failed",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Server Error",
          text: "Failed to update record",
        });
      }
    },
    [apiUrl],
  );
  const buildColumns = ({
    filters,
    pinnedColumns,
    togglePin,
    uniqueValues,
    userRole,
    handleFilterChange,
    handleUpdatePrm,
  }) => {
    const cols = Object.keys(columnHeadingsMap).map((key) => ({
      title: (
        <div className="flex items-center justify-between">
          <span
            style={{
              color: filters[key]?.length > 0 ? "#1677ff" : "inherit",
              fontWeight: filters[key]?.length > 0 ? "bold" : "normal",
            }}>
            {columnHeadingsMap[key] || key}
          </span>
          <span
            onMouseDownCapture={(e) => e.stopPropagation()} // 🔥 KEY FIX
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              togglePin(key);
            }}
            style={{ display: "flex", alignItems: "center" }}>
            <PushpinOutlined
              rotate={pinnedColumns[key] === "right" ? 180 : 0}
              style={{
                color: pinnedColumns[key] ? "#1677ff" : "#aaa",
                cursor: "pointer",
              }}
            />
          </span>
        </div>
      ),
      key,
      sorter: (a, b) => {
        const valA = a[key] ?? "";
        const valB = b[key] ?? "";

        // If value is number
        if (!isNaN(valA) && !isNaN(valB)) {
          return Number(valA) - Number(valB);
        }

        // If value is date
        if (key === "created_at") {
          return new Date(valA) - new Date(valB);
        }

        // Normal text sorting
        return String(valA).localeCompare(String(valB));
      },

      sortDirections: ["ascend", "descend"],

      dataIndex: key,
      fixed: pinnedColumns[key] || undefined,
      render: (value) => {
        if (key === "created_at") {
          return new Date(value).toLocaleString("en-IN");
        }

        if (key === "geo") {
          try {
            // Case 1: Already an array
            if (Array.isArray(value)) return value.join(", ");

            // Case 2: Value is a JSON string like "[\"IN\",\"PK\"]"
            if (typeof value === "string" && value.startsWith("[")) {
              return JSON.parse(value).join(", ");
            }

            return value || "";
          } catch {
            return value || "";
          }
        }

        return value;
      },
      filterDropdown: ({ confirm }) => {
        const [searchText, setSearchText] = React.useState("");

        const allValues = uniqueValues[key] || [];
        const selectedValues = filters[key] ?? allValues;

        const visibleValues = sortDropdownValues(
          allValues.filter((val) =>
            val.toString().toLowerCase().includes(searchText.toLowerCase()),
          ),
        );
        const isAllSelected = selectedValues.length === allValues.length;
        const isIndeterminate = selectedValues.length > 0 && !isAllSelected;
        return (
          <div
            className="w-[240px] rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}>
            <div className="p-3 border-b">
              <Input
                autoFocus
                allowClear
                placeholder="Search values"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            {/* ☑ Select All */}
            <div className="px-3 py-2">
              <Checkbox
                indeterminate={isIndeterminate}
                checked={isAllSelected}
                onChange={(e) =>
                  handleFilterChange(e.target.checked ? allValues : [], key)
                }>
                <span className="font-medium text-base text-gray-700">
                  Select All
                </span>
              </Checkbox>
            </div>
            <div className="max-h-[220px] overflow-y-auto p-2 space-y-1">
              {visibleValues.map((val) => (
                <label
                  key={val}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-blue-50">
                  <Checkbox
                    key={val}
                    checked={selectedValues.includes(val)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedValues, val]
                        : selectedValues.filter((v) => v !== val);

                      handleFilterChange(next, key);
                      confirm({ closeDropdown: false });
                    }}>
                    {val}
                  </Checkbox>
                </label>
              ))}

              {visibleValues.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  No matching values
                </div>
              )}
            </div>
          </div>
        );
      },
      filterDropdownProps: {
        destroyOnClose: false,
      },
    }));

    cols.push(
      {
        title: "Priority",
        key: "priority",
        dataIndex: "priority",
        fixed: pinnedColumns["priority"] || undefined,
        render: (_, record) =>
          userRole?.some((r) => ["publisher_manager", "admin"].includes(r)) ? (
            <Select
              value={record.priority}
              style={{ width: 80 }}
              onChange={(val) =>
                handleUpdatePrm(record, { priority: val, prm: record.prm })
              }>
              {(record.available_priorities || []).map((p) => (
                <Option key={p} value={p}>
                  {p}
                </Option>
              ))}
            </Select>
          ) : (
            record.priority || "N/A"
          ),
      },
      // {
      //   title: "Permission",
      //   key: "prm",
      //   dataIndex: "prm",
      //   fixed: pinnedColumns["prm"] || undefined,
      //   render: (_, record) =>
      //     userRole === "publisher_manager" ? (
      //       <Select
      //         value={record.prm}
      //         style={{
      //           width: 120,
      //           fontWeight: 600,
      //           backgroundColor: record.prm === 1 ? "#e6ffed" : "#ffe6e6",
      //           color: record.prm === 1 ? "green" : "red",
      //         }}
      //         onChange={(val) =>
      //           handleUpdatePrm(record, { priority: record.priority, prm: val })
      //         }>
      //         <Option value={1}>✅ Allow</Option>
      //         <Option value={0}>❌ Disallow</Option>
      //       </Select>
      //     ) : (
      //       <span
      //         style={{
      //           color: record.prm === 1 ? "green" : "red",
      //           fontWeight: 600,
      //         }}>
      //         {record.prm === 1 ? "✅ Allow" : "❌ Disallow"}
      //       </span>
      //     ),
      // }
      {
        title: "Permission",
        key: "prm",
        dataIndex: "prm",
        fixed: pinnedColumns["prm"] || undefined,
        render: (_, record) =>
          userRole?.some((r) => ["publisher_manager", "admin"].includes(r)) ? (
            <Select
              value={record.prm}
              style={{
                width: 130,
                fontWeight: 600,
                backgroundColor:
                  record.prm === 1
                    ? "#e6ffed" // ✅ Allow
                    : record.prm === 2
                      ? "#ffe6e6" // ❌ Disallow
                      : "#fff3cd", // 🟡 Hold
                color:
                  record.prm === 1
                    ? "green"
                    : record.prm === 2
                      ? "red"
                      : "#b8860b",
              }}
              onChange={(val) =>
                handleUpdatePrm(record, { priority: record.priority, prm: val })
              }>
              <Option value={0}>🟡 Hold</Option>
              <Option value={1}>✅ Allow</Option>
              <Option value={2}>❌ Disallow</Option>
            </Select>
          ) : (
            <span
              style={{
                color:
                  record.prm === 1
                    ? "green"
                    : record.prm === 2
                      ? "red"
                      : "#b8860b",
                fontWeight: 600,
              }}>
              {record.prm === 1
                ? "✅ Allow"
                : record.prm === 2
                  ? "❌ Disallow"
                  : "🟡 Hold"}
            </span>
          ),
      },
    );

    return cols;
  };
  const columns = useMemo(() => {
    const allColumns = buildColumns({
      filters,
      pinnedColumns,
      togglePin,
      uniqueValues,
      userRole,
      handleFilterChange,
      handleUpdatePrm,
    });
    // ✅ Remove hidden columns
    return allColumns.filter((col) => !hiddenColumns.includes(col.key));
  }, [
    filters,
    pinnedColumns,
    uniqueValues,
    userRole,
    handleFilterChange,
    handleUpdatePrm,
    hiddenColumns,
  ]);

  return (
    <div className="p-6 max-w-full rounded-lg shadow-lg h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        All Campaign Requests
      </h2>
      {/* Header / Controls Section */}
      <div className="bg-white rounded-xl shadow-lg p-5 mb-6 flex flex-wrap items-end justify-between gap-4 md:gap-6 lg:gap-4">
        {/* Left Section - Search + Date Range */}
        <div className="flex gap-3">
          {/* Search Input */}
          <Input
            placeholder="Search by Advertiser, Campaign, PID, etc."
            allowClear
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-[100px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            prefix={<span className="text-gray-400">🔍</span>}
          />

          {/* Date Range Picker */}
          <RangePicker
            value={dateRange}
            format="YYYY-MM-DD"
            onChange={(values) => {
              if (values) setDateRange(values);
            }}
            allowClear
            className="w-[300px] rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition"
          />
        </div>

        {/* Right Section - Actions */}
        <div className="flex flex-wrap items-end gap-2">
          {/* Hide / Show Columns */}
          <Tooltip title="Hide / Show Columns" placement="top">
            <Select
              mode="multiple"
              allowClear
              placeholder="Select columns to hide"
              value={hiddenColumns}
              onChange={(selected) => setHiddenColumns(selected)}
              style={{ minWidth: 220 }}
              maxTagCount="responsive"
              className="rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition">
              {Object.entries(columnHeadingsMap).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </Tooltip>
          {/* ➕ Request New Campaign Link */}
          <Tooltip title="Request New Campaign Link" placement="top">
            <Button
              type="primary"
              onClick={showModal}
              className="!bg-green-600 hover:!bg-green-700 text-white !rounded-lg !px-2 !py-4 !shadow-md flex items-center justify-center">
              <span className="text-lg">➕</span>
            </Button>
          </Tooltip>

          {/* 📥 Download Excel */}
          <Tooltip title="Download Excel" placement="top">
            <Button
              type="primary"
              onClick={() => {
                const tableDataToExport = filteredRequests.map((item) => {
                  const filteredItem = {};
                  Object.keys(columnHeadingsMap).forEach((key) => {
                    filteredItem[columnHeadingsMap[key]] = item[key];
                  });
                  return filteredItem;
                });
                exportToExcel(tableDataToExport, "advertiser-data.xlsx");
              }}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white !rounded-lg !px-2 !py-4 !shadow-md flex items-center justify-center">
              <RiFileExcel2Line size={20} />
            </Button>
          </Tooltip>

          {/* ❌ Remove Filters */}
          <Tooltip title="Remove All Filters" placement="top">
            <Button
              onClick={clearAllFilters}
              type="default"
              className="!bg-red-600 hover:!bg-red-700 !border-gray-300 !rounded-lg !px-2 !py-4 shadow-sm hover:shadow-md transition-all duration-200">
              <FaFilterCircleXmark size={20} color="white" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <Modal
        title={
          <div className="text-lg font-semibold text-[#2F5D99]">
            Request New Link
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        centered
        className="rounded-xl">
        <Form
          layout="vertical"
          form={form}
          onFinish={handleOk}
          className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
            {/* Advertiser Name */}
            <Form.Item
              label="Adv AM"
              name="advertiserName"
              rules={[
                { required: true, message: "Please select an advertiser" },
              ]}>
              <Select placeholder="Select Advertiser" className="rounded-lg">
                {advertisers.map((name, index) => (
                  <Option key={index} value={name}>
                    {name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Campaign Name */}
            <Form.Item
              label="Campaign Name"
              name="campaignName"
              rules={[
                { required: true, message: "Please enter campaign name" },
              ]}>
              <Input placeholder="Enter campaign name" className="rounded-lg" />
            </Form.Item>
            {/* PID */}
            <Form.Item
              label="PID"
              name="pid"
              rules={[
                { required: true, message: "Please enter or select a PID" },
              ]}>
              <AutoComplete
                options={dropdownOptions.pid?.map((pid) => ({ value: pid }))}
                placeholder="Enter or select PID"
                filterOption={(inputValue, option) =>
                  option.value.toLowerCase().includes(inputValue.toLowerCase())
                }
                onChange={(value) => {
                  if (blacklistPIDs.includes(value)) {
                    Swal.fire({
                      icon: "warning",
                      title: "Blacklisted PID",
                      text: `The PID "${value}" is blacklisted.`,
                    });
                  }
                }}
                className="rounded-lg"
              />
            </Form.Item>

            {/* PUB ID */}
            <Form.Item
              label="PUB ID"
              name="pub_id"
              rules={[
                { required: true, message: "Please enter or select a PUB ID" },
              ]}>
              <AutoComplete
                options={dropdownOptions.pub_id?.map((pubId) => ({
                  value: String(pubId), // 🔥 ensure string
                }))}
                placeholder="Enter or select PUB ID"
                filterOption={(inputValue, option) =>
                  String(option?.value)
                    .toLowerCase()
                    .includes(String(inputValue).toLowerCase())
                }
                className="rounded-lg"
              />
            </Form.Item>

            {/* Multi Row Geo + Payout + OS */}
            <div className="md:col-span-2">
              {geoRows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* GEO */}
                  <div className="md:col-span-4">
                    <Form.Item label="Geo" required>
                      <Select
                        mode="multiple"
                        placeholder="Select Geo"
                        className="rounded-lg border-gray-300 bg-white"
                        value={row.geo} // <-- store value per row
                        onChange={(value) => {
                          const updated = [...geoRows];
                          updated[index].geo = value; // <-- update state
                          setGeoRows(updated);
                        }}
                        showSearch>
                        {dropdownOptions.geo.map((g) => (
                          <Option key={g} value={g}>
                            {g}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>

                  {/* PAYOUT */}
                  <div className="md:col-span-4">
                    <Form.Item label="Payout" required>
                      <InputNumber
                        placeholder="Enter payout"
                        value={row.payout}
                        min={0}
                        step={0.01}
                        style={{ width: "100%" }}
                        controls={false}
                        // 🔒 Only allow numbers and decimal
                        formatter={(value) =>
                          value?.toString().replace(/[^0-9.]/g, "")
                        }
                        parser={(value) => value?.replace(/[^0-9.]/g, "")}
                        // Mobile numeric keyboard
                        inputMode="decimal"
                        // Block wrong keys
                        onKeyPress={(e) => {
                          if (!/[0-9.]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(value) => {
                          const updated = [...geoRows];
                          updated[index].payout = value;
                          setGeoRows(updated);
                        }}
                      />
                    </Form.Item>
                  </div>
                  {/* OS */}
                  <div className="md:col-span-3">
                    <Form.Item label="OS" required>
                      <Select
                        placeholder="Select OS"
                        value={row.os}
                        onChange={(value) => {
                          const updated = [...geoRows];
                          updated[index].os = value;
                          setGeoRows(updated);
                        }}>
                        <Option value="Android">Android</Option>
                        <Option value="iOS">iOS</Option>
                        <Option value="Web">Web</Option>
                        <Option value="both">Both</Option>
                      </Select>
                    </Form.Item>
                  </div>
                  {/* DELETE BUTTON */}
                  <div className="md:col-span-1">
                    <Button onClick={() => removeGeoRow(index)}>🗑</Button>
                  </div>
                </div>
              ))}

              {/* ADD MORE BUTTON */}
              <Button type="dashed" onClick={addGeoRow} block className="">
                ➕ Add More
              </Button>
            </div>

            {/* Note (Full width) */}
            <Form.Item
              label="Note"
              name="note"
              rules={[{ required: false }]}
              className="md:col-span-2 !pt-4">
              <Input.TextArea
                placeholder="Enter note (optional)"
                rows={3}
                className="rounded-lg"
              />
            </Form.Item>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              className="w-full sm:w-1/2 bg-[#2F5D99] hover:bg-[#24487A] text-white font-medium py-3 rounded-lg shadow-md transition-all">
              {isSubmitting ? "Processing..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-1/2 bg-gray-400 hover:bg-gray-500 text-white font-medium py-3 rounded-lg shadow-md transition-all">
              Cancel
            </button>
          </div>
        </Form>
      </Modal>
      <div className="overflow-auto border border-gray-300 rounded-lg shadow-sm">
        <StyledTable
          rowKey="id"
          className=""
          dataSource={filteredRequests} // show latest data directly
          columns={columns}
          scroll={{ x: "max-content" }}
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100", "200", "300", "500"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </div>
    </div>
  );
};

export default PublisherRequest;
