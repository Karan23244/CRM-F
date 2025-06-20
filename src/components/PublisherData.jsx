import React, { useEffect, useState } from "react";
import {
  Table,
  Select,
  Button,
  Input,
  Dropdown,
  Menu,
  DatePicker,
  Checkbox,
  Tooltip,
} from "antd";
import { FilterOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import utc from "dayjs/plugin/utc";
import Swal from "sweetalert2"; // <-- Import SweetAlert
import "../index.css";
import geoData from "../Data/geoData.json";
import { useSelector } from "react-redux";
import { exportToExcel } from "./exportExcel";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";

dayjs.extend(isBetween);
dayjs.extend(utc);

const { RangePicker } = DatePicker;
const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const columnHeadingsAdv = {
  username: "Adv AM",
  campaign_name: "Campaign Name",
  geo: "GEO",
  city: "State Or City",
  os: "OS",
  payable_event: "Payable Event",
  mmp_tracker: "MMP Tracker",
  pub_id: "PubID",
  pid: "PID",
  pay_out: "PUB Payout $",
  shared_date: "Shared Date",
  paused_date: "Paused Date",
  adv_total_no: "PUB Total Numbers",
  pub_Apno: "PUB Approved Numbers",
};

const PublisherPayoutData = () => {
  const [advData, setAdvData] = useState([]);
  const [filters, setFilters] = useState({});
  const [stickyColumns, setStickyColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
  const user = useSelector((state) => state.auth.user);
  const toggleStickyColumn = (key) => {
    setStickyColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
  };
  const clearAllFilters = () => {
    setFilters({});
  };
  const fetchAdvData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-advdata`);
      if (response.data.success) {
        setAdvData(response.data.data);

        // Extract unique values for filters
        const unique = {};
        Object.keys(columnHeadingsAdv).forEach((key) => {
          unique[key] = [
            ...new Set(response.data.data.map((item) => item[key])),
          ].filter(Boolean);
        });
        setUniqueValues(unique);

        // Optional: Show success alert when data loads
        // Swal.fire({
        //   icon: "success",
        //   title: "Data Loaded",
        //   timer: 1500,
        //   showConfirmButton: false,
        // });
      } else {
        Swal.fire({
          icon: "error",
          title: "Fetch Failed",
          text: "Failed to load advertiser data.",
        });
      }
    } catch (error) {
      console.error("Error fetching advertiser data:", error);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Could not fetch advertiser data. Please try again later.",
      });
    }
  };

  useEffect(() => {
    fetchAdvData();
  }, []);

  const filteredData = advData.filter((item) => {
    const sharedDate = dayjs(item.shared_date);
    if (
      selectedDateRange &&
      selectedDateRange.length === 2 &&
      selectedDateRange[0] &&
      selectedDateRange[1]
    ) {
      const [start, end] = selectedDateRange;
      if (!sharedDate.isBetween(start, end, null, "[]")) {
        return false;
      }
    }

    const matchesPub = item.pub_name === user?.username;
    const matchesFilters = Object.keys(filters).every((key) => {
      if (!filters[key]) return true;
      if (Array.isArray(filters[key])) {
        return filters[key].includes(item[key]);
      }
      return item[key] === filters[key];
    });

    const matchesSearch = !searchTerm.trim()
      ? true
      : Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );

    return matchesPub && matchesFilters && matchesSearch;
  });

  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value?.length ? value : undefined,
    }));
  };

  const getColumns = (columnHeadings) => {
    return Object.keys(columnHeadings).map((key) => ({
      title: (
        <div className="flex items-center justify-between">
          <span
            style={{
              color: filters[key] ? "#1677ff" : "inherit",
              fontWeight: filters[key] ? "bold" : "normal",
            }}>
            {columnHeadings[key] || key}
          </span>
          <Tooltip
            title={stickyColumns.includes(key) ? "Unpin" : "Pin"}
            className="p-3">
            <Button
              size="small"
              icon={
                stickyColumns.includes(key) ? (
                  <PushpinFilled style={{ color: "#1677ff" }} />
                ) : (
                  <PushpinOutlined />
                )
              }
              onClick={() => toggleStickyColumn(key)}
            />
          </Tooltip>
        </div>
      ),

      key,
      dataIndex: key,
      fixed: stickyColumns.includes(key) ? "left" : undefined,

      // Add filterDropdown to show the custom filter UI (Select All + Select multiple)
      filterDropdown:
        uniqueValues[key]?.length > 0
          ? () => (
              <div style={{ padding: 8 }}>
                {/* Select All Checkbox */}
                <div style={{ marginBottom: 8 }}>
                  <Checkbox
                    indeterminate={
                      filters[key]?.length > 0 &&
                      filters[key]?.length < uniqueValues[key]?.length
                    }
                    checked={filters[key]?.length === uniqueValues[key]?.length}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleFilterChange(
                        checked ? [...uniqueValues[key]] : [],
                        key
                      );
                    }}>
                    Select All
                  </Checkbox>
                </div>

                {/* Multi Select Dropdown */}
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  placeholder={`Select ${columnHeadings[key]}`}
                  style={{ width: 250 }}
                  value={filters[key] || []}
                  onChange={(value) => handleFilterChange(value, key)}
                  optionLabelProp="label"
                  maxTagCount="responsive"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }>
                  {[...uniqueValues[key]]
                    .filter((val) => val !== null && val !== undefined)
                    .sort((a, b) => {
                      const aNum = parseFloat(a);
                      const bNum = parseFloat(b);
                      const isNumeric = !isNaN(aNum) && !isNaN(bNum);
                      return isNumeric
                        ? aNum - bNum
                        : a.toString().localeCompare(b.toString());
                    })
                    .map((val) => (
                      <Select.Option key={val} value={val} label={val}>
                        <Checkbox checked={filters[key]?.includes(val)}>
                          {val}
                        </Checkbox>
                      </Select.Option>
                    ))}
                </Select>
              </div>
            )
          : null,

      // This controls whether the filter icon is shown in the header
      filtered: filters[key]?.length > 0,
    }));
  };

  const handleExport = () => {
    // Only include columns present in columnHeadingsAdv
    const tableDataToExport = filteredData.map((item) => {
      const filteredItem = {};
      Object.keys(columnHeadingsAdv).forEach((key) => {
        filteredItem[columnHeadingsAdv[key]] = item[key]; // Use display heading as key
      });
      return filteredItem;
    });

    exportToExcel(tableDataToExport, "publisher-data.xlsx");
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="w-full bg-white p-4 rounded shadow-md">
        {/* Header Bar */}
        <div className="mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex gap-3">
            <Button
              type="primary"
              onClick={handleExport} // <-- Use handleExport with alert
              className="bg-blue-600 hover:bg-blue-700 text-white">
              📥 Download Excel
            </Button>
            <Button onClick={clearAllFilters} type="default">
              Remove All Filters
            </Button>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="🔍 Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[220px]"
            />
            <RangePicker
              onChange={(dates) => setSelectedDateRange(dates)}
              allowClear
              placeholder={["Start Date", "End Date"]}
              className="w-full md:w-48 rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-auto max-h-[70vh]">
          <Table
            dataSource={filteredData}
            columns={getColumns(columnHeadingsAdv)}
            rowKey="id"
            pagination={{
              pageSizeOptions: ["10", "20", "50"],
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            bordered
            scroll={{ x: "max-content" }}
          />
        </div>
      </div>
    </div>
  );
};

export default PublisherPayoutData;
