import { useEffect, useState } from "react";
import {
  Table,
  Tooltip,
  Button,
  Select,
  Checkbox,
  DatePicker,
  Input,
  Space,
} from "antd";
import { PushpinFilled, PushpinOutlined } from "@ant-design/icons";
import { ReloadOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { exportToExcel } from "./exportExcel";

const { RangePicker } = DatePicker;

const { Option } = Select;

const AdvertiserAssignData = ({ data, name }) => {
  const [stickyColumns, setStickyColumns] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const toggleStickyColumn = (key) => {
    setStickyColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
  };
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500">No data available</p>;
  }

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

  const desiredOrder = [
    "adv_id",
    "campaign_name",
    "geo",
    "city",
    "os",
    "payable_event",
    "mmp_tracker",
    "adv_payout",
    "pub_name",
    "pub_id",
    "pub_am",
    "pid",
    "pay_out",
    "shared_date",
    "paused_date",
    "adv_total_no",
    "adv_deductions",
    "adv_approved_no",
  ];

  const [filters, setFilters] = useState({});

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const filteredData = data.map(({ adv_id, user_id, id, ...rest }) => rest);

  const cascadedFilterData = [...data]
    .filter((item) => {
      // ✅ Step 1: Date Range Filter on shared_date
      if (
        selectedDateRange &&
        selectedDateRange.length === 2 &&
        selectedDateRange[0] &&
        selectedDateRange[1]
      ) {
        const itemDate = dayjs(item.shared_date);
        return itemDate.isBetween(
          selectedDateRange[0],
          selectedDateRange[1],
          null,
          "[]"
        );
      }
      return true;
    })
    .filter((item) => {
      // ✅ Step 2: Advanced Dropdown Filters (multi-select, single value, date range)
      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue || filterValue.length === 0) return true;

        // If it's a date range filter
        if (
          Array.isArray(filterValue) &&
          filterValue.length === 2 &&
          dayjs(filterValue[0]).isValid()
        ) {
          const itemDate = dayjs(item[key]);
          return itemDate.isBetween(filterValue[0], filterValue[1], null, "[]");
        }

        // If it's a multi-select
        if (Array.isArray(filterValue)) {
          return filterValue.some(
            (val) =>
              String(item[key]).toLowerCase() === String(val).toLowerCase()
          );
        }

        // If it's a single value
        return (
          String(item[key]).toLowerCase() === String(filterValue).toLowerCase()
        );
      });
    })
    // ✅ Step 3: Search Term Filter
    .filter((item) => {
      if (!searchTerm.trim()) return true;
      const lowerSearch = searchTerm.toLowerCase();
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(lowerSearch)
      );
    });

  const generateUniqueValues = (data) => {
    const uniqueVals = {};
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (!uniqueVals[key]) uniqueVals[key] = new Set();
        uniqueVals[key].add(item[key]);
      });
    });

    const formattedValues = {};
    Object.keys(uniqueVals).forEach((key) => {
      formattedValues[key] = Array.from(uniqueVals[key]);
    });

    setUniqueValues(formattedValues);
  };
  useEffect(() => {
    generateUniqueValues(data);
  }, [data]);

  const columns = desiredOrder
    .filter((key) => key in filteredData[0])
    .map((key) => {
      const isSticky = stickyColumns.includes(key);
      const hasFilter =
        filters[key] &&
        (Array.isArray(filters[key])
          ? filters[key].length > 0
          : !!filters[key]);

      const title = (
        <div
          className={`flex items-center gap-2 ${
            hasFilter ? "text-blue-600 font-semibold" : ""
          }`}>
          <span>
            {columnHeadings[key] || key.replace(/([A-Z])/g, " $1").trim()}
          </span>
          <Tooltip title={isSticky ? "Unpin" : "Pin"}>
            <Button
              size="small"
              icon={
                isSticky ? (
                  <PushpinFilled style={{ color: "#1677ff" }} />
                ) : (
                  <PushpinOutlined />
                )
              }
              onClick={() => toggleStickyColumn(key)}
            />
          </Tooltip>
        </div>
      );

      // Multi-select filter columns
      return {
        title,
        dataIndex: key,
        key,
        fixed: isSticky ? "left" : false,
        filterDropdown: () =>
          Array.isArray(uniqueValues[key]) && uniqueValues[key].length > 0 ? (
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
                      key,
                      checked ? [...uniqueValues[key]] : []
                    );
                  }}>
                  Select All
                </Checkbox>
              </div>
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder={`Select ${columnHeadings[key]}`}
                style={{ width: 250 }}
                value={filters[key] || []}
                onChange={(value) => handleFilterChange(key, value)}
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
          ) : null,
      };
    });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">
          Advertiser Data for <span className="text-blue-600">{name}</span>
        </h1>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() =>
            exportToExcel(cascadedFilterData, "Filtered-Advertiser-Data.xlsx")
          }
          className="bg-blue-600 hover:bg-blue-700">
          Download Excel
        </Button>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <Space
            direction="vertical"
            size="middle"
            className="w-full lg:w-auto">
            <label className="text-sm font-medium text-gray-700">
              Date Range
            </label>
            <RangePicker
              value={selectedDateRange}
              onChange={(dates) => {
                if (!dates || dates.length === 0) {
                  const start = dayjs().startOf("month");
                  const end = dayjs().endOf("month");
                  setSelectedDateRange([start, end]);
                } else {
                  setSelectedDateRange(dates);
                }
              }}
              allowClear
            />
          </Space>

          <Space direction="vertical" size="middle" className="w-full lg:w-1/3">
            <label className="text-sm font-medium text-gray-700">Search</label>
            <Input
              placeholder="Search any field (e.g., campaign, pub name...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              className="rounded-lg"
            />
          </Space>

          <div className="flex items-end">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setFilters({})}
              className="bg-gray-100 hover:bg-gray-200">
              Clear All Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full overflow-auto bg-white p-4 rounded-lg shadow-lg">
        <Table
          columns={columns}
          dataSource={cascadedFilterData}
          rowKey="id"
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          bordered
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

export default AdvertiserAssignData;
