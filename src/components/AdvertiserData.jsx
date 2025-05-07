import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Table,
  Input,
  Button,
  Select,
  DatePicker,
  message,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import geoData from "../Data/geoData.json";
import { exportToExcel } from "./exportExcel";
import { Modal, message as antdMessage } from "antd";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const AdvertiserData = () => {
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState({
    os: ["Android", "APK", "iOS"],
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  console.log(data)
  useEffect(() => {
    if (user?.id) {
      fetchData();
      fetchDropdowns();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/advdata-byuser/${user.id}`);
      setData(
        response.data.reverse().map((item) => ({
          ...item,
          key: item.id,
        }))
      );
    } catch (error) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };
  const fetchDropdowns = async () => {
    try {
      const [advmName, payableEvent, mmpTracker, pid, pub_id] =
        await Promise.all([
          axios.get(`${apiUrl}/get-subadmin`),
          axios.get(`${apiUrl}/get-paybleevernt`),
          axios.get(`${apiUrl}/get-mmptracker`),
          axios.get(`${apiUrl}/get-pid`),
          axios.get(`${apiUrl}/get-allpub`),
        ]);
      setDropdownOptions((prev) => ({
        ...prev,
        // pub_name: advmName.data?.data?.map((item) => item.username) || [],
        pub_name:
          advmName.data?.data
            ?.filter(
              (item) => item.role === "advertiser_manager" || item.role === "publisher"
            )
            .map((item) => item.username) || [],
        payable_event:
          payableEvent.data?.data?.map((item) => item.payble_event) || [],
        mmp_tracker: mmpTracker.data?.data?.map((item) => item.mmptext) || [],
        pid: pid.data?.data?.map((item) => item.pid) || [],
        pub_id: pub_id.data?.data?.map((item) => item.pub_id) || [],
        geo: geoData.geo?.map((item) => item.code) || [],
      }));
    } catch (error) {
      message.error("Failed to fetch dropdown options");
    }
  };

  const handleEdit = (id) => {
    setEditingKey(id);
    setEditedRow(data.find((row) => row.id === id) || {});
  };

  const handleSave = async () => {
    const excludedFields = [
      "paused_date",
      "adv_total_no",
      "adv_deductions",
      "adv_approved_no",
    ];

    const isEmptyField = Object.entries(editedRow)
      .filter(([key]) => !excludedFields.includes(key)) // Exclude specific fields
      .some(([_, value]) => !value); // Check for empty values

    if (isEmptyField) {
      alert("All required fields must be filled!");
      return;
    }
    try {
      await axios.post(`${apiUrl}/advdata-update/${editingKey}`, editedRow, {
        headers: { "Content-Type": "application/json" },
      });
      setEditingKey(null);
      fetchData();
      alert("Data updated successfully");
    } catch (error) {
      alert("Failed to update data");
    }
  };
  // Add new row
  const handleAddRow = async () => {
    try {
      if (!user?.id) {
        message.error("User ID is missing. Please login again.");
        return;
      }

      const newRow = {
        ...editedRow,
        user_id: user.id, // Ensure user_id is included
        createdAt: new Date().toISOString(),
      };
      await axios.post(`${apiUrl}/add-advdata`, newRow, {
        headers: { "Content-Type": "application/json" },
      });

      setEditedRow({});
      fetchData();
      alert("Data added successfully");
    } catch (error) {
      alert("Failed to add data");
    }
  };
  const handleCopyRow = async (record) => {
    try {
      if (!user?.id) {
        message.error("User ID is missing. Please login again.");
        return;
      }

      const copiedRow = {
        ...record,
        id: undefined, // Remove the existing ID so a new one gets created
        user_id: user.id,
        createdAt: new Date().toISOString(),
      };

      await axios.post(`${apiUrl}/add-advdata`, copiedRow, {
        headers: { "Content-Type": "application/json" },
      });

      fetchData();
      message.success("Row copied successfully!");
    } catch (error) {
      message.error("Failed to copy row");
    }
  };

  const handleChange = (value, field) => {
    setEditedRow((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item? This action cannot be undone."
    );
    if (!confirmDelete) return;

    axios
      .post(`${apiUrl}/advdata-delete-data/${id}`)
      .then(() => {
        alert("Data deleted");
        fetchData();
      })
      .catch((err) => console.error("Error deleting Data:", err));
  };
  const columnHeadings = {
    pub_name: "PUBM Name",
    campaign_name: "Campaign Name",
    geo: "GEO",
    city: "State Or City",
    os: "OS",
    payable_event: "Payable Event",
    mmp_tracker: "MMP Tracker",
    adv_id: "ADV ID",
    adv_payout: "ADV Payout $",
    pub_am: "Pub AM",
    pub_id: "PubID",
    pid: "PID",
    pay_out: "PUB Payout $",
    shared_date: "Shared Date",
    paused_date: "Paused Date",
    adv_total_no: "ADV Total Numbers",
    adv_deductions: "ADV Deductions",
    adv_approved_no: "ADV Approved Numbers",
  };

  const allowedFieldsAfter3Days = [
    "paused_date",
    "adv_total_no",
    "adv_deductions",
    "adv_approved_no",
  ];
  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredRecords = data.filter((item) => {
    // Apply existing filters
    const matchesFilters = Object.keys(filters).every((key) => {
      if (!filters[key]) return true;

      // Date range filter
      if (Array.isArray(filters[key]) && filters[key].length === 2) {
        const [start, end] = filters[key];
        return dayjs(item[key]).isBetween(start, end, null, "[]");
      }

      return item[key]
        ?.toString()
        .toLowerCase()
        .includes(filters[key].toString().toLowerCase());
    });

    // Apply monthly filter (checks created_at field)
    const matchesMonth = selectedMonth
      ? dayjs(item.created_at).isSame(selectedMonth, "month")
      : true;

    return matchesFilters && matchesMonth;
  });
  const finalFilteredData = data.filter((item) => {
    const createdAt = new Date(item.created_at);
    const itemMonth = createdAt.getMonth();
    const itemYear = createdAt.getFullYear();
  
    // Filter by selectedMonth (if selected)
    if (selectedMonth) {
      const selectedDate = new Date(selectedMonth);
      const selectedMonthValue = selectedDate.getMonth();
      const selectedYear = selectedDate.getFullYear();
      if (itemMonth !== selectedMonthValue || itemYear !== selectedYear) {
        return false;
      }
    }
  
    // If there's no search term, include the item
    if (!searchTerm.trim()) return true;
  
    const lowerSearchTerm = searchTerm.toLowerCase();
  
    // Check if any value in the item includes the search term
    return Object.values(item).some((value) =>
      String(value).toLowerCase().includes(lowerSearchTerm)
    );
  });
  
  const columns = [
    ...Object.keys(data[0] || {})
      .filter((key) => !["id", "user_id", "key", "created_at"].includes(key))
      .map((key) => ({
        title: columnHeadings[key] || key.replace(/([A-Z])/g, " $1").trim(),
        dataIndex: key,
        key,
        filterDropdown: () =>
          key.toLowerCase().includes("date") ? (
            <DatePicker
              onChange={(date, dateString) =>
                handleFilterChange(dateString, key)
              }
              style={{ width: "100%" }}
            />
          ) : dropdownOptions[key] ? (
            <Select
              showSearch
              onChange={(value) => handleFilterChange(value, key)}
              style={{ width: "100%" }}
              dropdownMatchSelectWidth={false}
              allowClear
              placeholder="Search..."
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }>
              {dropdownOptions[key].map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          ) : (
            <Input
              onChange={(e) => handleFilterChange(e.target.value, key)}
              placeholder={`Search ${columnHeadings[key] || key}`}
            />
          ),
        onFilter: (value, record) => {
          if (!value) return true;
          if (key.toLowerCase().includes("date")) {
            return dayjs(record[key]).isSame(dayjs(value), "day");
          }
          return record[key]
            ?.toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        },
        render: (text, record) => {
          const createdAt = dayjs(record.created_at);
          const isEditableAfter3Days =
            dayjs().diff(createdAt, "day") > 3 &&
            allowedFieldsAfter3Days.includes(key); // Only allow specific fields after 3 days

          if (editingKey === record.id) {
            return isEditableAfter3Days ||
              dayjs().diff(createdAt, "day") <= 3 ? (
              dropdownOptions[key] ? (
                <Select
                  showSearch
                  value={editedRow[key]}
                  onChange={(value) => handleChange(value, key)}
                  style={{ width: "100%" }}
                  dropdownMatchSelectWidth={false}
                  allowClear
                  placeholder="Search..."
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }>
                  {dropdownOptions[key].map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Select>
              ) : key.toLowerCase().includes("date") ? (
                <DatePicker
                  value={editedRow[key] ? dayjs(editedRow[key]) : null}
                  onChange={(date, dateString) => handleChange(dateString, key)}
                  style={{ width: "100%" }}
                />
              ) : (
                <Input
                  value={editedRow[key]}
                  onChange={(e) => handleChange(e.target.value, key)}
                />
              )
            ) : (
              text
            );
          }
          return text;
        },
      })),
    {
      title: "Actions",
      fixed: "right",
      render: (_, record) => {
        const createdAt = dayjs(record.created_at);
        const hoursSinceCreation = dayjs().diff(createdAt, "hour");
        const remainingHours = Math.max(24 - hoursSinceCreation, 0);
        const isEditable = dayjs().diff(createdAt, "day") <= 3;
        const isDeletable = hoursSinceCreation < 24; // Delete button active for only 24 hours

        return (
          <div style={{ display: "flex", gap: "8px" }}>
            {editingKey === record.id ? (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
              />
            ) : (
              <Tooltip
                title={
                  !isEditable && !allowedFieldsAfter3Days.length
                    ? "You can't edit because time is over"
                    : ""
                }>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record.id)}
                  disabled={!isEditable && !allowedFieldsAfter3Days.length}
                />
              </Tooltip>
            )}

            {isDeletable && (
              <Tooltip title={`Delete option available for ${remainingHours}h`}>
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record.id)}
                />
              </Tooltip>
            )}

            {/* Copy Button */}
            <Tooltip title="Copy this row">
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleCopyRow(record)}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
        {/* Fixed Button Container */}
        <div className="w-full bg-white p-6 rounded-xl shadow-lg relative">
          {/* Sticky Top Bar */}
          <div className="sticky top-0 left-0 right-0 z-20 bg-white shadow-md rounded-md p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left Section: Buttons */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <Button
                type="primary"
                onClick={() => exportToExcel(data, "advertiser-data.xlsx")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition-all duration-200">
                📥 Download Excel
              </Button>

              {/* Optional Add Row Button */}
              {/*
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddRow}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition-all duration-200"
      >
        ➕ Add Row
      </Button>
      */}
            </div>

            {/* Right Section: Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
              <DatePicker
                picker="month"
                onChange={(date) => setSelectedMonth(date)}
                placeholder="🗓 Filter by Month"
                allowClear
                className="w-full md:w-48 rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition"
              />

              <Input
                placeholder="🔍 Search Username / Publisher / Campaign"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>
          </div>
        

        {/* Scrollable Table Container */}
        <div className="overflow-auto max-h-[70vh] mt-2">
          <Table
            columns={columns}
            dataSource={finalFilteredData}
            pagination={{
              pageSizeOptions: ["10", "20", "50", "100"],
              showSizeChanger: true,
              defaultPageSize: 10,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            bordered
            loading={loading}
            scroll={{ x: "max-content" }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvertiserData;
