import React, { useEffect, useState } from "react";
import {
  Table,
  Select,
  Button,
  Input,
  DatePicker,
  Dropdown,
  Menu,
  message,
  Checkbox,
  Tooltip,
} from "antd";
import { FilterOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../index.css";
import isBetween from "dayjs/plugin/isBetween";
import geoData from "../Data/geoData.json";
import { useSelector } from "react-redux";
import { exportToExcel } from "./exportExcel";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const PublisherPayoutData = () => {
  const [advData, setAdvData] = useState([]);
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
  const [stickyColumns, setStickyColumns] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubAdmins, setSelectedSubAdmins] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);

  const user = useSelector((state) => state.auth.user);
  const handleDateRangeChange = (dates) => {
    if (!dates || dates.length === 0) {
      // Reset to current month
      setSelectedDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    } else {
      setSelectedDateRange(dates);
    }
  };
  const clearAllFilters = () => {
    setFilters({});
  };
  const columnHeadingsAdv = {
    ...(selectedSubAdmins?.length > 0 && { pub_name: "PUBM Name" }),
    pub_name: "PUBM Name",
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
  const toggleStickyColumn = (key) => {
    setStickyColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
  };
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

  const assignedSubAdmins = user?.assigned_subadmins || [];

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-subadmin`);
        if (response.data.success) {
          const subAdminOptions = response.data.data
            .filter((subAdmin) => assignedSubAdmins.includes(subAdmin.id)) // Filter only assigned sub-admins
            .map((subAdmin) => ({
              value: subAdmin.id,
              label: subAdmin.username,
              role: subAdmin.role,
            }));
          setSubAdmins(subAdminOptions);
        }
      } catch (error) {
        console.error("Error fetching sub-admins:", error);
      }
    };

    fetchSubAdmins();
  }, [assignedSubAdmins]); // Refetch if assigned sub-admins change

  useEffect(() => {
    fetchAdvData();
  }, []);

  // useEffect(() => {
  //   const currentMonth = dayjs().month(); // 0-based (0 = January)
  //   const currentYear = dayjs().year();

  //   const data = advData.filter((row) => {
  //     const sharedDate = dayjs(row.shared_date);
  //     return (
  //       row.pub_name === user?.username &&
  //       sharedDate.month() === currentMonth &&
  //       sharedDate.year() === currentYear
  //     );
  //   });

  //   setFilteredData(data);
  //   generateUniqueValues(data);
  // }, [advData, user]);

  const generateUniqueValues = (data) => {
    const uniqueVals = {};
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (!uniqueVals[key]) uniqueVals[key] = new Set();
        const normalizedValue = item[key]?.toString().trim(); // normalize
        if (normalizedValue) uniqueVals[key].add(normalizedValue);
      });
    });
    const formattedValues = Object.keys(uniqueVals).reduce((acc, key) => {
      acc[key] = Array.from(uniqueVals[key]);
      return acc;
    }, {});
    setUniqueValues(formattedValues);
  };

  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value?.length ? value : undefined,
    }));
  };

  useEffect(() => {
    const currentMonth = dayjs().month();
    const currentYear = dayjs().year();

    const filtered = advData.filter((item) => {
      const sharedDate = dayjs(item.shared_date);

      // Normalize pub_name for comparison
      const normalizedPubName = item.pub_name?.toString().trim().toLowerCase();
      const matchesPub = [
        user?.username?.toString().trim().toLowerCase(),
        ...(selectedSubAdmins || []).map((sub) =>
          sub?.toString().trim().toLowerCase()
        ),
      ].includes(normalizedPubName);

      // Date filtering
      const matchesDate =
        selectedDateRange?.length === 2 &&
        selectedDateRange[0] &&
        selectedDateRange[1]
          ? sharedDate.isBetween(
              selectedDateRange[0],
              selectedDateRange[1],
              null,
              "[]"
            )
          : sharedDate.month() === currentMonth &&
            sharedDate.year() === currentYear;

      // Dynamic filters (category, status, etc.)
      const matchesFilters = Object.keys(filters).every((key) => {
        if (!filters[key]) return true;

        const itemVal = item[key]?.toString().trim().toLowerCase();

        if (Array.isArray(filters[key])) {
          return filters[key].some(
            (filterVal) =>
              itemVal === filterVal?.toString().trim().toLowerCase()
          );
        }

        return itemVal === filters[key]?.toString().trim().toLowerCase();
      });

      // Search filter
      const matchesSearch = !searchTerm.trim()
        ? true
        : Object.values(item).some((val) =>
            val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          );

      return matchesPub && matchesDate && matchesFilters && matchesSearch;
    });

    setFilteredData(filtered);
    generateUniqueValues(filtered); // Already normalized in your version
  }, [
    advData,
    filters,
    searchTerm,
    selectedDateRange,
    selectedSubAdmins,
    user,
  ]);

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
  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col items-center">
      <div className="w-full bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="sticky top-0 z-30 bg-white -mx-6 px-6 pt-4 pb-4 border-b border-gray-200">
          <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 md:gap-6">
            {/* Download Excel Button */}
            <Button
              type="primary"
              onClick={() => {
                const tableDataToExport = filteredData.map((item) => {
                  const filteredItem = {};
                  Object.keys(columnHeadingsAdv).forEach((key) => {
                    filteredItem[columnHeadingsAdv[key]] = item[key]; // Custom column names
                  });
                  return filteredItem;
                });

                exportToExcel(tableDataToExport, "advertiser-data.xlsx");
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition duration-300 transform hover:scale-105">
              📥 <span>Download Excel</span>
            </Button>

            <div className="flex justify-end">
              <Button onClick={clearAllFilters} type="default">
                Remove All Filters
              </Button>
            </div>
            {/* Subadmins Dropdown */}
            {user?.role === "publisher_manager" && (
              <Select
                mode="multiple"
                allowClear
                placeholder="Select Subadmins"
                value={selectedSubAdmins}
                onChange={setSelectedSubAdmins}
                onClear={() => setFilters({})}
                className="min-w-[200px] md:min-w-[250px] border border-gray-300 rounded-lg py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition">
                {subAdmins?.map((subAdmin) => (
                  <Option key={subAdmin.label} value={subAdmin.label}>
                    {subAdmin.label}
                  </Option>
                ))}
              </Select>
            )}

            {/* Search Input */}
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3 border border-gray-300 rounded-lg py-2 px-4 shadow-sm focus:ring-2 focus:ring-blue-400 transition"
            />

            {/* Date Picker */}
            <RangePicker
              onChange={handleDateRangeChange}
              allowClear
              placeholder={["Start Date", "End Date"]}
              className="w-full md:w-[220px] rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition"
            />
          </div>
        </div>

        <Table
          columns={getColumns(columnHeadingsAdv)}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
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

export default PublisherPayoutData;
