import React, { useEffect, useMemo, useState } from "react";
import { Table, Select, Input, Checkbox, Tooltip, Button } from "antd";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
import StyledTable from "../../Utils/StyledTable";
const apiUrl = import.meta.env.VITE_API_URL;

/* ---------------- DEMO DATA ---------------- */
const demoData = [
  {
    id: 1,
    pub_name: "John",
    campaign_name: "Android CPI",
    geo: "IN",
    os: "Android",
    status: "Live",
    payout: "0.5",
  },
  {
    id: 2,
    pub_name: "Alex",
    campaign_name: "iOS Finance",
    geo: "US",
    os: "iOS",
    status: "Pause",
    payout: "1.2",
  },
  {
    id: 3,
    pub_name: "John",
    campaign_name: "Gaming BR",
    geo: "BR",
    os: "Android",
    status: "Live",
    payout: "0.8",
  },
];

/* ---------------- COLUMN HEADINGS ---------------- */
const columnHeadings = {
  campaign_id: "Campaign ID",
  publisher_id: "Publisher ID",
  adv_id: "Advertiser ID",
  click_id: "Click ID",
  conversion: "Conversions",
  payout: "Payout $",
};

const Conversion = () => {
  const [data, setData] = useState(demoData);
  const [filteredData, setFilteredData] = useState(demoData);
  const [filters, setFilters] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [firstFilteredColumn, setFirstFilteredColumn] = useState(null);
  const [stickyColumns, setStickyColumns] = useState([]);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  useEffect(() => {
    const fetchConversions = async () => {
      const res = await fetch(`${apiUrl}/get-conversions`);
      const json = await res.json();
      console.log("Fetched Conversions:", json);

      const transformData = (data) => {
        return data.map((item) => ({
          campaign_id: item.campaign_id,
          publisher_id: item.publisher_id,
          adv_id: item.adv_id,
          click_id: item.click_id,
          conversion: item.conversion,
          payout: item.payout,
        }));
      };
      const formatted = transformData(json.data);
      setData(formatted);
      setFilteredData(formatted);
    };

    fetchConversions();
  }, []);

  /* ---------------- PIN COLUMN ---------------- */
  const toggleStickyColumn = (key) => {
    setStickyColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  /* ---------------- FILTER HANDLER ---------------- */
  const handleFilterChange = (value, key) => {
    setFilters((prev) => {
      if (!firstFilteredColumn && value.length > 0) {
        setFirstFilteredColumn(key);
      }

      const next = { ...prev, [key]: value };
      const isEmpty = Object.values(next).every((v) => !v || v.length === 0);

      if (isEmpty) setFirstFilteredColumn(null);

      return next;
    });
  };

  /* ---------------- APPLY SEARCH + FILTER ---------------- */
  useEffect(() => {
    const filtered = data.filter((row) => {
      const matchesSearch = !searchTerm
        ? true
        : Object.values(row)
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

      const matchesFilters = Object.keys(filters).every((key) => {
        if (!filters[key]?.length) return true;
        return filters[key].includes(row[key]);
      });

      return matchesSearch && matchesFilters;
    });

    setFilteredData(filtered);
  }, [data, filters, searchTerm]);

  /* ---------------- DROPDOWN SOURCE LOGIC ---------------- */
  const baseAccessibleData = useMemo(() => data, [data]);

  const getDataForDropdown = (columnKey) => {
    if (!firstFilteredColumn) return baseAccessibleData;
    if (columnKey === firstFilteredColumn) return baseAccessibleData;
    return filteredData;
  };

  /* ---------------- UNIQUE VALUES ---------------- */
  useEffect(() => {
    const values = {};
    Object.keys(columnHeadings).forEach((col) => {
      values[col] = Array.from(
        new Set(getDataForDropdown(col).map((r) => r[col] ?? "-"))
      );
    });
    setUniqueValues(values);
  }, [filteredData, firstFilteredColumn]);

  /* ---------------- COLUMNS ---------------- */
  const columns = Object.keys(columnHeadings)
    .filter((key) => !hiddenColumns.includes(key))
    .map((key) => ({
      title: (
        <div className="flex items-center justify-between">
          <span
            style={{
              color: filters[key]?.length ? "#1677ff" : "inherit",
              fontWeight: filters[key]?.length ? 600 : 400,
            }}>
            {columnHeadings[key]}
          </span>

          <Tooltip title={stickyColumns.includes(key) ? "Unpin" : "Pin"}>
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleStickyColumn(key);
              }}
              style={{ cursor: "pointer" }}>
              {stickyColumns.includes(key) ? (
                <PushpinFilled style={{ color: "#1677ff" }} />
              ) : (
                <PushpinOutlined />
              )}
            </span>
          </Tooltip>
        </div>
      ),
      dataIndex: key,
      key,
      fixed: stickyColumns.includes(key) ? "left" : undefined,

      sorter: (a, b) =>
        (a[key] || "").toString().localeCompare((b[key] || "").toString()),

      sortOrder: sortInfo.columnKey === key ? sortInfo.order : null,

      onHeaderCell: () => ({
        onClick: () => {
          const order =
            sortInfo.columnKey === key && sortInfo.order === "ascend"
              ? "descend"
              : "ascend";
          setSortInfo({ columnKey: key, order });
        },
      }),

      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <div style={{ marginBottom: 8 }}>
            {/* Select All */}
            <Checkbox
              indeterminate={
                filters[key]?.length > 0 &&
                filters[key]?.length < uniqueValues[key]?.length
              }
              checked={filters[key]?.length === uniqueValues[key]?.length}
              onChange={(e) =>
                handleFilterChange(
                  e.target.checked ? [...uniqueValues[key]] : [],
                  key
                )
              }>
              Select All
            </Checkbox>
          </div>
          <Select
            mode="multiple"
            allowClear
            showSearch
            style={{ width: 240, marginTop: 8 }}
            placeholder={`Select ${columnHeadings[key]}`}
            value={filters[key] || []}
            onChange={(val) => handleFilterChange(val, key)}
            maxTagCount="responsive">
            {uniqueValues[key]?.map((val) => (
              <Select.Option key={val} value={val}>
                <Checkbox checked={filters[key]?.includes(val)}>{val}</Checkbox>
              </Select.Option>
            ))}
          </Select>
        </div>
      ),
      filtered: filters[key]?.length > 0,

      render: (text) => text ?? "-",
    }));

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="py-5">
        <h2 className="text-2xl font-semibold ">Conversions</h2>
        <p className="text-gray-600">
          View and manage conversion data for publishers and campaigns.
        </p>
      </div>
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Search anything..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 250 }}
        />

        <Select
          mode="multiple"
          allowClear
          placeholder="Hide columns"
          value={hiddenColumns}
          onChange={setHiddenColumns}
          style={{ minWidth: 250 }}>
          {Object.keys(columnHeadings).map((key) => (
            <Select.Option key={key} value={key}>
              {columnHeadings[key]}
            </Select.Option>
          ))}
        </Select>

        <Button
          danger
          onClick={() => {
            setFilters({});
            setSortInfo({});
            setStickyColumns([]);
            setHiddenColumns([]);
          }}>
          Remove All Filters
        </Button>
      </div>

      <StyledTable
        bordered
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        pagination={{
          pageSizeOptions: ["10", "20", "50", "100"],
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        className="mt-5"
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default Conversion;
