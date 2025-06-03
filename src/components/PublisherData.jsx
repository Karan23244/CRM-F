import React, { useEffect, useState } from "react";
import { Table, Select, Button, Input, Dropdown, Menu, DatePicker } from "antd";
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
};

const PublisherPayoutData = () => {
  const [advData, setAdvData] = useState([]);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
  const user = useSelector((state) => state.auth.user);

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

    const matchesFilters = Object.keys(filters).every((key) =>
      filters[key] ? item[key] === filters[key] : true
    );

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
      [key]: value,
    }));
  };

  const getColumns = (columnHeadings) => {
    return Object.keys(columnHeadings).map((key) => ({
      title: (
        <div className="flex items-center justify-between">
          <span className="font-medium">{columnHeadings[key]}</span>
          {uniqueValues[key]?.length > 1 && (
            <Dropdown
              overlay={
                <Menu>
                  <div className="p-3 w-48">
                    <Select
                      showSearch
                      allowClear
                      className="w-full"
                      placeholder={`Filter ${key}`}
                      value={filters[key]}
                      onChange={(value) => handleFilterChange(value, key)}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option?.children
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }>
                      {[...uniqueValues[key]]
                        .filter((val) => val !== null && val !== undefined) // remove null/undefined
                        .sort((a, b) => a.localeCompare(b))
                        .map((val) => (
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
    }));
  };

  const handleExport = () => {
    exportToExcel(filteredData, "publisher-data.xlsx");
    Swal.fire({
      icon: "success",
      title: "Export Successful",
      text: "Publisher data exported to Excel.",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="w-full bg-white p-4 rounded shadow-md">
        {/* Header Bar */}
        <div className="mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <Button
            type="primary"
            onClick={handleExport} // <-- Use handleExport with alert
            className="bg-blue-600 hover:bg-blue-700 text-white">
            📥 Download Excel
          </Button>

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
            scroll={{ x: true }}
            pagination={{
              pageSizeOptions: ["10", "20", "50"],
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            bordered
          />
        </div>
      </div>
    </div>
  );
};

export default PublisherPayoutData;
