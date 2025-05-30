import React, { useEffect, useState } from "react";
import {
  Table,
  Checkbox,
  Select,
  Button,
  Input,
  DatePicker,
  Dropdown,
  Menu,
  message,
} from "antd";
import { FilterOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../index.css";
import geoData from "../Data/geoData.json";
import { exportToExcel } from "./exportExcel";
const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

// Publisher Column Headings
const columnHeadingsPub = {
  username: "Input UserName",
  adv_name: "ADVM Name",
  campaign_name: "Campaign Name",
  geo: "GEO",
  city: "State Or City",
  os: "OS",
  payable_event: "Payable Event",
  mmp_tracker: "MMP Tracker",
  pub_id: "Pub ID",
  p_id: "PID",
  pay_out: "Pub Payout $",
  shared_date: "Shared Date",
  paused_date: "Paused Date",
  review: "Review",
  pub_total_numbers: "PUB Total Numbers",
  pub_deductions: "PUB Deductions",
  pub_approved_numbers: "PUB Approved Numbers",
};

// Advertiser Column Headings
const columnHeadingsAdv = {
  username: "Input UserName",
  pub_name: "PUBM Name",
  campaign_name: "Campaign Name",
  geo: "GEO",
  city: "State Or City",
  os: "OS",
  payable_event: "Payable Event",
  mmp_tracker: "MMP Tracker",
  adv_id: "ADV ID",
  adv_payout: "ADV Payout $",
  pub_id: "PubID",
  pay_out: "Pub Payout $",
  pid: "PID",
  shared_date: "Shared Date",
  paused_date: "Paused Date",
  adv_total_no: "ADV Total Numbers",
  adv_deductions: "ADV Deductions",
  adv_approved_no: "ADV Approved Numbers",
};

const CampianAllData = () => {
  const [advData, setAdvData] = useState([]);
  const [pubData, setPubData] = useState([]);
  const [selectedType, setSelectedType] = useState("advertiser");
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({
    os: ["Android", "APK", "iOS"],
  });
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Publisher Data
  const fetchPubData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/all-pubdata`);
      if (response.data.success) {
        setPubData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching publisher data:", error);
    }
  };

  // Fetch Advertiser Data
  const fetchAdvData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-advdata`);
      if (response.data.success) {
        setAdvData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching advertiser data:", error);
    }
  };

  // Fetch data on load
  useEffect(() => {
    fetchPubData();
    fetchAdvData();
    fetchDropdowns();
  }, []);

  // Set initial data based on selection
  // useEffect(() => {
  //   const data = selectedType === "publisher" ? pubData : advData;
  //   setFilteredData(data.filter((row) => !isRowEmpty(row)));
  //   generateUniqueValues(data);
  // }, [selectedType, pubData, advData]);

  useEffect(() => {
    const data = selectedType === "publisher" ? pubData : advData;
    generateUniqueValues(data);
    const filtered = data.filter((item) => {
      const sharedDate = new Date(item.shared_date);

      // If a month is selected, apply filtering
      if (selectedMonth) {
        const itemMonth = sharedDate.getMonth();
        const itemYear = sharedDate.getFullYear();
        const selectedDate = new Date(selectedMonth);
        const selectedMonthValue = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();

        if (itemMonth !== selectedMonthValue || itemYear !== selectedYear) {
          return false;
        }
      }

      const passesAdvancedFilters = Object.keys(filters).every((key) => {
        if (!filters[key]) return true;

        if (Array.isArray(filters[key]) && filters[key].length === 2) {
          const [start, end] = filters[key];
          return dayjs(item[key]).isBetween(start, end, null, "[]");
        }

        return item[key]
          ?.toString()
          .toLowerCase()
          .includes(filters[key].toString().toLowerCase());
      });

      if (!passesAdvancedFilters) return false;

      if (!searchTerm.trim()) return true;

      const lowerSearch = searchTerm.toLowerCase();
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(lowerSearch)
      );
    });

    setFilteredData(filtered.filter((row) => !isRowEmpty(row)));
  }, [pubData, advData, selectedType, selectedMonth, filters, searchTerm]);

  // Generate unique values for filtering
  const generateUniqueValues = (data) => {
    const uniqueVals = {};
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (!uniqueVals[key]) {
          uniqueVals[key] = new Set();
        }
        uniqueVals[key].add(item[key]);
      });
    });
    const formattedValues = Object.keys(uniqueVals).reduce((acc, key) => {
      acc[key] = Array.from(uniqueVals[key]);
      return acc;
    }, {});
    setUniqueValues(formattedValues);
  };

  // Fetch Dropdown Options
  const fetchDropdowns = async () => {
    try {
      const [advmName, payableEvent, mmpTracker, pid, review] =
        await Promise.all([
          axios.get(`${apiUrl}/get-subadmin`),
          axios.get(`${apiUrl}/get-paybleevernt`),
          axios.get(`${apiUrl}/get-mmptracker`),
          axios.get(`${apiUrl}/get-pid`),
          axios.get(`${apiUrl}/get-reviews`),
        ]);
      setDropdownOptions((prev) => ({
        ...prev,
        adv_name:
          advmName.data?.data
            ?.filter(
              (item) => item.role === "manager" || item.role === "advertiser"
            )
            .map((item) => item.username) || [],
        pub_name:
          advmName.data?.data
            ?.filter(
              (item) => item.role === "manager" || item.role === "publisher"
            )
            .map((item) => item.username) || [],
        payable_event:
          payableEvent.data?.data?.map((item) => item.payble_event) || [],
        mmp_tracker: mmpTracker.data?.data?.map((item) => item.mmptext) || [],
        p_id: pid.data?.data?.map((item) => item.pid) || [],
        review: review.data?.data?.map((item) => item.review_text) || [],
        geo: geoData.geo?.map((item) => item.code) || [],
      }));
    } catch (error) {
      message.error("Failed to fetch dropdown options");
    }
  };
  // Handle Checkbox Change
  const handleCheckboxChange = (type) => {
    setSelectedType(type);
    setFilters({});
  };
  // Check if all values in a row are empty
  // Check if the row has empty pub_name or adv_name
  const isRowEmpty = (row) => {
    if (selectedType === "publisher") {
      return !row.adv_name || row.adv_name === null || row.adv_name === "";
    } else {
      return !row.pub_name || row.pub_name === null || row.pub_name === "";
    }
  };
  // Handle Filter Change
  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Apply filters
  useEffect(() => {
    const data = selectedType === "publisher" ? pubData : advData;
    const filtered = data.filter((item) =>
      Object.keys(filters).every((key) =>
        filters[key] ? item[key] === filters[key] : true
      )
    );
    setFilteredData(filtered.filter((row) => !isRowEmpty(row)));
  }, [filters, pubData, advData, selectedType]);

  // Handle Edit
  const handleEdit = (id) => {
    setEditingKey(id);
    setEditedRow(filteredData.find((row) => row.id === id) || {});
  };

  // Handle Change in Input / Dropdown
  const handleChange = (value, key) => {
    setEditedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle Save
  const handleSave = async () => {
    try {
      const updateUrl =
        selectedType === "publisher"
          ? `${apiUrl}/pubdata-update/${editingKey}`
          : `${apiUrl}/advdata-update/${editingKey}`;
      await axios.post(updateUrl, editedRow, {
        headers: { "Content-Type": "application/json" },
      });
      setEditingKey(null);
      alert("Data updated successfully");
      fetchPubData();
      fetchAdvData();
    } catch (error) {
      alert("Failed to update data");
    }
  };

  // Generate Columns Dynamically with Edit + Filters
  const getColumns = (columnHeadings) => {
    return [
      ...Object.keys(columnHeadings).map((key) => ({
        title: (
          <div className="flex items-center justify-between">
            <span className="font-medium">{columnHeadings[key]}</span>
            {uniqueValues[key]?.length > 1 && (
              <Dropdown
                overlay={
                  <Menu>
                    <div className="p-3 w-48">
                      <Select
                        allowClear
                        className="w-full"
                        placeholder={`Filter ${key}`}
                        value={filters[key]}
                        onChange={(value) => handleFilterChange(value, key)}>
                        {uniqueValues[key]?.map((val) => (
                          <Option key={val} value={val}>
                            {val}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Menu>
                }
                trigger={["click"]}
                placement="bottomRight">
                <FilterOutlined className="cursor-pointer text-gray-500 hover:text-black ml-2" />
              </Dropdown>
            )}
          </div>
        ),
        dataIndex: key,
        key,
        render: (text, record) => {
          return editingKey === record.id ? (
            dropdownOptions[key] ? (
              <Select
                showSearch
                value={editedRow[key]}
                onChange={(value) => handleChange(value, key)}
                style={{ width: "100%" }}>
                {dropdownOptions[key]?.map((option) => (
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
        },
      })),
      {
        title: "Actions",
        fixed: "right",
        key: "actions",
        render: (record) =>
          editingKey === record.id ? (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              className="mr-2">
              Save
            </Button>
          ) : (
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record.id)}>
              Edit
            </Button>
          ),
      },
    ];
  };
  console.log("Filtered Data", filteredData);
  return (
    <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
      {/* Toggle Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-xl font-bold mb-3 text-gray-700">Data Type</h2>
        <div className="flex flex-wrap gap-4">
          <Checkbox
            checked={selectedType === "advertiser"}
            onChange={() => handleCheckboxChange("advertiser")}
            className="flex items-center space-x-2">
            <span className="text-base font-medium text-gray-800">
              Advertiser Data
            </span>
          </Checkbox>
          <Checkbox
            checked={selectedType === "publisher"}
            onChange={() => handleCheckboxChange("publisher")}
            className="flex items-center space-x-2">
            <span className="text-base font-medium text-gray-800">
              Publisher Data
            </span>
          </Checkbox>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button
          onClick={() =>
            exportToExcel(
              selectedType === "publisher" ? pubData : advData,
              selectedType === "publisher"
                ? "publisher-data.xlsx"
                : "advertiser-data.xlsx"
            )
          }
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded-lg font-medium shadow">
          📥 Download Excel
        </button>

        <Input
          placeholder="🔍 Search by Username, Pub Name, or Campaign Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <DatePicker
          picker="month"
          onChange={(date) => setSelectedMonth(date)}
          placeholder="🗓 Filter by Month"
          allowClear
          className="w-full md:w-56 border border-gray-300 rounded-lg shadow-sm"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white shadow-xl rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {selectedType === "publisher" ? "Publisher" : "Advertiser"} Report
          Table
        </h2>
        <Table
          dataSource={filteredData}
          columns={
            selectedType === "publisher"
              ? getColumns(columnHeadingsPub)
              : getColumns(columnHeadingsAdv)
          }
          rowKey="id"
          bordered
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

export default CampianAllData;
