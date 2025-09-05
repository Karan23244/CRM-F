import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Input, Select, Checkbox, Tooltip, message } from "antd";
import { PushpinFilled, PushpinOutlined } from "@ant-design/icons";
import axios from "axios";
import { subscribeToNotifications } from "../Publisher/Socket";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { exportToExcel } from "../exportExcel";

const { Option } = Select;

const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in";

const statuses = [
  "waiting",
  "shared",
  "rejected",
  "Handshake Pending",
  "in-use",
  "poor performance",
];

const columnHeadings = {
  pub_name: "Publisher",
  campaign_name: "Campaign",
  note: "Note", 
  adv_name: "Advertiser", // 👈 Added
  payout: "PUB Payout $",
  os: "OS",
  pid: "PID",
  pub_id: "PUB ID",
  geo: "Geo",
  priority: "Priority", // 👈 Added
  created_at: "Created At",
};

const NewRequest = () => {
  const user = useSelector((state) => state.auth.user);
  const username = user?.username || null;
  console.log("Logged in user:", user);
  const [requests, setRequests] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({});
  console.log(requests);
  // const [stickyColumns, setStickyColumns] = useState([]); // for pin/unpin columns
  const clearAllFilters = () => {
    setFilters({});
  };
  useEffect(() => {
    fetchRequests();

    subscribeToNotifications((data) => {
      if (data?.id !== null) {
        fetchRequests();
      }
    });
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getPrmadvRequests`);
      const result = res.data?.data;

      // Sort by id DESC (newest first)
      let sortedData = (Array.isArray(result) ? result : []).sort(
        (a, b) => b.id - a.id
      );

      // Role-based filtering
      if (user?.role === "advertiser") {
        sortedData = sortedData.filter(
          (item) => item.adv_name === user.username
        );
      }
      // if role is advertiser_manager -> no filtering needed

      setRequests(sortedData);
    } catch (error) {
      message.error("Failed to fetch requests");
      setRequests([]); // fallback on error
    }
  };

  // Get unique values for each column for filter options
  const uniqueValues = useMemo(() => {
    const values = {};
    requests.forEach((item) => {
      Object.keys(columnHeadings).forEach((key) => {
        if (!values[key]) values[key] = new Set();
        if (item[key] !== null && item[key] !== undefined)
          values[key].add(item[key]);
      });
    });
    // Convert sets to arrays
    Object.keys(values).forEach((key) => {
      values[key] = Array.from(values[key]);
    });
    return values;
  }, [requests]);

  // Handle filter change for a column
  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Filter requests based on filters and search text
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      // Search text across all fields
      const matchesSearch = Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchText.toLowerCase())
      );
      if (!matchesSearch) return false;

      // Apply filters: if filter array for column is empty or undefined => no filter for that column
      for (const [key, selected] of Object.entries(filters)) {
        if (selected && selected.length > 0 && !selected.includes(item[key])) {
          return false;
        }
      }
      return true;
    });
  }, [requests, filters, searchText]);

  // Compose columns with filterDropdown, filter icon state, and sticky column pin button
  const getColumns = (columnHeadings) => {
    return Object.keys(columnHeadings).map((key) => ({
      title: (
        <div className="flex items-center justify-between">
          <span
            style={{
              color: filters[key]?.length > 0 ? "#1677ff" : "inherit",
              fontWeight: filters[key]?.length > 0 ? "bold" : "normal",
              cursor: "pointer",
              userSelect: "none",
            }}>
            {columnHeadings[key] || key}
          </span>
        </div>
      ),
      key,
      dataIndex: key,

      render: (value) => {
        if (key === "created_at" && value) {
          const date = new Date(value);
          return date.toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });
        }
        return value;
      },

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
                    .map((val) => (
                      <Option key={val} value={val} label={val}>
                        <Checkbox checked={filters[key]?.includes(val)}>
                          {key === "created_at"
                            ? new Date(val).toLocaleDateString("en-IN")
                            : val}
                        </Checkbox>
                      </Option>
                    ))}
                </Select>
              </div>
            )
          : null,

      filtered: filters[key]?.length > 0,
    }));
  };

  // Action column for Status update select dropdown
  const actionColumn = {
    title: "Action",
    key: "action",
    // fixed: stickyColumns.includes("action") ? "left" : undefined,
    render: (text, record) => (
      <Select
        defaultValue={record.adv_res}
        style={{ width: 140 }}
        onChange={(value) => handleStatusUpdate(record.id, value)}>
        {statuses.map((status) => (
          <Option key={status} value={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Option>
        ))}
      </Select>
    ),
  };

  // Existing function for status update
  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${apiUrl}/updateAdvRes`, {
        id,
        adv_res: status,
      });
      fetchRequests();
    } catch (error) {
      console.error("Failed to update status:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update status",
      });
    }
  };

  return (
    <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        All Campaign Requests
      </h2>

      <div className="flex flex-wrap items-center justify-start gap-4 mb-6">
        <Button
          type="primary"
          onClick={() => {
            const tableDataToExport = filteredRequests.map((item) => {
              const filteredItem = {};
              Object.keys(columnHeadings).forEach((key) => {
                if (key === "created_at" && item[key]) {
                  filteredItem[columnHeadings[key]] = new Date(
                    item[key]
                  ).toLocaleString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  });
                } else {
                  filteredItem[columnHeadings[key]] = item[key];
                }
              });
              return filteredItem;
            });
            exportToExcel(tableDataToExport, "advertiser-data.xlsx");
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500">
          📥 <span>Download Excel</span>
        </Button>

        <Button
          onClick={clearAllFilters}
          type="default"
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400">
          Remove All Filters
        </Button>

        <Input
          placeholder="Search across all fields..."
          className="max-w-md rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-300 transition duration-200"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      <div className="overflow-auto border border-gray-300 rounded-lg shadow-sm">
        <Table
          dataSource={filteredRequests}
          columns={[...getColumns(columnHeadings), actionColumn]}
          rowKey="id"
          scroll={{ x: "max-content" }}
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          className="min-w-full"
        />
      </div>
    </div>
  );
};

export default NewRequest;
