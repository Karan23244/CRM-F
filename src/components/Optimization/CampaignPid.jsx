import React, { useEffect, useState } from "react";
import { DatePicker, Typography, Input, Button, message, Checkbox } from "antd";
import { ClearOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import StyledTable from "../../Utils/StyledTable";

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function CampaignTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });

  // 📅 Default last 7 days
  const [dates, setDates] = useState([
    dayjs().subtract(8, "day"),
    dayjs().subtract(1, "day"),
  ]);

  // ✅ API call
  const fetchData = async (start, end) => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:2001/api/recentpid", {
        params: {
          startDate: start.format("YYYY-MM-DD"),
          endDate: end.format("YYYY-MM-DD"),
        },
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error(err);
      message.error("Server error (500)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dates[0] && dates[1]) {
      fetchData(dates[0], dates[1]);
    }
  }, [dates]);

  // 🔹 normalize helper
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };

  // 🔹 unique values
  const getUniqueValues = (key) => {
    return [...new Set(data.map((row) => normalize(row[key])))];
  };

  // 🔹 Sorting handler
  const handleSort = (key) => {
    let order = "ascend";

    if (sortInfo.columnKey === key) {
      if (sortInfo.order === "ascend") order = "descend";
      else if (sortInfo.order === "descend") order = null;
      else order = "ascend";
    }

    setSortInfo({
      columnKey: key,
      order,
    });
  };

  // 🔹 Excel-style column generator
  const getColumn = (dataIndex, title, isNumber = false) => {
    const isFiltered = !!filters[dataIndex];
    const isSorted = sortInfo.columnKey === dataIndex;

    return {
      title: (
        <span style={{ color: isFiltered ? "#1677ff" : "inherit" }}>
          {title}
        </span>
      ),
      dataIndex,
      key: dataIndex,

      // ✅ SORT FIX
      sorter: (a, b) => {
        if (isNumber) {
          return Number(a[dataIndex] || 0) - Number(b[dataIndex] || 0);
        }
        return (a[dataIndex] || "")
          .toString()
          .localeCompare((b[dataIndex] || "").toString());
      },

      sortOrder: isSorted ? sortInfo.order : null,

      onHeaderCell: () => ({
        onClick: () => handleSort(dataIndex),
      }),

      // ✅ FILTER UI
      filterDropdown: () => {
        const allValues = getUniqueValues(dataIndex);
        const selectedValues = filters[dataIndex] ?? allValues;
        const search = filterSearch[dataIndex] || "";

        const visibleValues = allValues.filter((val) =>
          val.toLowerCase().includes(search.toLowerCase()),
        );

        const isAllSelected = selectedValues.length === allValues.length;
        const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

        return (
          <div
            className="w-[260px] rounded-xl"
            onClick={(e) => e.stopPropagation()}>
            {/* 🔍 Search */}
            <div className="sticky top-0 bg-white p-2 border-b">
              <Input
                placeholder="Search values"
                allowClear
                value={search}
                onChange={(e) =>
                  setFilterSearch((prev) => ({
                    ...prev,
                    [dataIndex]: e.target.value,
                  }))
                }
              />
            </div>

            {/* ☑ Select All */}
            <div className="px-3 py-2">
              <Checkbox
                indeterminate={isIndeterminate}
                checked={isAllSelected}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFilters((prev) => {
                    const updated = { ...prev };
                    if (checked) delete updated[dataIndex];
                    else updated[dataIndex] = [];
                    return updated;
                  });
                }}>
                Select All
              </Checkbox>
            </div>

            {/* 📋 Values */}
            <div className="max-h-[220px] overflow-y-auto px-2 pb-2 space-y-1">
              {visibleValues.map((val) => (
                <label
                  key={val}
                  className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-blue-50">
                  <Checkbox
                    checked={selectedValues.includes(val)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedValues, val]
                        : selectedValues.filter((v) => v !== val);

                      setFilters((prev) => ({
                        ...prev,
                        [dataIndex]: next,
                      }));
                    }}
                  />
                  <span className="truncate">{val}</span>
                </label>
              ))}

              {visibleValues.length === 0 && (
                <div className="py-4 text-center text-gray-400 text-sm">
                  No matching values
                </div>
              )}
            </div>
          </div>
        );
      },

      render: (text) =>
        dataIndex === "TotalPIDs" ? (
          <span style={{ wordBreak: "break-all" }}>{text}</span>
        ) : (
          text || "-"
        ),
    };
  };

  // 🔹 Columns
  const columns = [
    getColumn("CampaignName", "Campaign Name"),
    getColumn("TotalPIDs", "PID Numbers", true), // ✅ numeric sort
  ];

  // 🔍 Apply search + filters
  const filteredData = data.filter((row) => {
    const matchesSearch = Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase());

    if (!matchesSearch) return false;

    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(normalize(row[key]));
    });
  });

  // ❌ Clear all
  const clearAll = () => {
    setFilters({});
    setSortInfo({ columnKey: null, order: null });
    setSearchText("");
    message.success("All filters cleared");
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Recent PIDs</Title>

      {/* 🔍 Search + Clear */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {/* 📅 Date */}
        <RangePicker
          value={dates}
          onChange={(val) => setDates(val)}
          allowClear={false}
        />
        <Input
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />

        <Button icon={<ClearOutlined />} onClick={clearAll}>
          Clear All
        </Button>
      </div>

      {/* 📊 Table */}
      <div className="w-full max-w-[800px]">
        {" "}
        {/* 👈 control width here */}
        <StyledTable
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey={(record, index) => index}
        />
      </div>
    </div>
  );
}
