import React, { useEffect, useState } from "react";
import {
  Tooltip,
  message,
  DatePicker,
  Tag,
  Spin,
  Input,
  Checkbox,
  Button,
} from "antd";
import {
  PushpinOutlined,
  PushpinFilled,
  ClearOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import StyledTable from "../../Utils/StyledTable";
import { useSelector } from "react-redux";
const API = import.meta.env.VITE_API_URL5;

/* ============================= */
/* Helper Display Function */
/* ============================= */

const displayValue = (val, placeholder = "—") =>
  val === null || val === undefined || val === "" ? (
    <span style={{ color: "#bbb" }}>{placeholder}</span>
  ) : (
    val
  );

function AdvertiserAccount() {
  const { user } = useSelector((state) => state.auth);
  const currentMonth = dayjs().format("YYYY-MM");
  const [data, setData] = useState([]);
  const [month, setMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };

  const togglePin = (key) =>
    setPinnedColumns((prev) => ({ ...prev, [key]: !prev[key] }));

  const clearAllFilters = () => {
    setFilters({});
    setPinnedColumns({});
    setFilterSearch({});
    message.success("✅ All filters and pins cleared");
  };
  /* Fetch Data */
  const fetchData = async (selectedMonth) => {
    try {
      setLoading(true);

      const res = await axios.post(`${API}/advertiser/account`, {
        user_id: user?.id,
        role: user?.role || [],
        assigned_subadmins: user?.assigned_subadmins || [],
        month: selectedMonth,
      });

      setData(res.data.data); // ✅ important
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(month);
  }, [month]);

  /* ============================= */
  /* Status Cells */
  /* ============================= */

  const DueStatusCell = ({ record }) => {
    if (record.payment_status === "Paid") {
      return <Tag color="green">PAID</Tag>;
    }

    if (!record.invoice_date) {
      return <Tag color="blue">NOT ISSUED</Tag>;
    }

    const isOverdue = dayjs().isAfter(dayjs(record.invoice_date));

    return isOverdue ? (
      <Tag color="red">OVERDUE</Tag>
    ) : (
      <Tag color="gold">NOT DUE</Tag>
    );
  };

  const AmountUseCell = ({ record }) => {
    const overdue =
      record.payment_status !== "Paid" &&
      record.invoice_date &&
      dayjs().isAfter(dayjs(record.invoice_date));

    return (
      <span
        style={{
          fontWeight: 600,
          color: overdue ? "#ff4d4f" : "#52c41a",
        }}>
        {Number(record.total_amount || 0).toFixed(2)}
      </span>
    );
  };
  const getColumnWithFilterAndPin = (dataIndex, title, renderFn) => {
    const isPinned = pinnedColumns[dataIndex];
    const isFiltered = !!filters[dataIndex];

    return {
      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: isFiltered ? "#1677ff" : "inherit",
          }}>
          <span>{title}</span>

          {isPinned ? (
            <PushpinFilled
              onClick={(e) => {
                e.stopPropagation();
                togglePin(dataIndex);
              }}
              style={{ color: "#1677ff", cursor: "pointer" }}
            />
          ) : (
            <PushpinOutlined
              onClick={(e) => {
                e.stopPropagation();
                togglePin(dataIndex);
              }}
              style={{ cursor: "pointer" }}
            />
          )}
        </div>
      ),

      key: dataIndex,
      dataIndex,
      fixed: isPinned ? "left" : false,

      filterDropdown: () => {
        const allValues = uniqueValues[dataIndex] || [];
        const selectedValues = filters[dataIndex] ?? allValues;
        const searchText = filterSearch[dataIndex] || "";

        const visibleValues = allValues.filter((val) =>
          val.toLowerCase().includes(searchText.toLowerCase()),
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
                allowClear
                placeholder="Search values"
                value={searchText}
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

      render: renderFn
        ? (text, record) => renderFn(text, record)
        : (text) => displayValue(text),
    };
  };
  useEffect(() => {
    const valuesObj = {};

    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (!valuesObj[key]) valuesObj[key] = new Set();
        valuesObj[key].add(normalize(row[key]));
      });
    });

    const formatted = {};
    Object.keys(valuesObj).forEach((key) => {
      formatted[key] = [...valuesObj[key]];
    });

    setUniqueValues(formatted);
  }, [data]);
  const filteredData = data.filter((row) => {
    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(normalize(row[key]));
    });
  });
  /* ============================= */
  /* Table Columns (READ ONLY) */
  /* ============================= */

  const columns = [
    getColumnWithFilterAndPin("adv_id", "Advid (Adv Name)", (_, r) => (
      <Tooltip title={r.note || "No Legal Billing Address"}>
        <span style={{ color: "#1677ff", fontWeight: 500 }}>
          {r.adv_id} ({r.adv_name})
        </span>
      </Tooltip>
    )),

    getColumnWithFilterAndPin("month", "Month"),

    getColumnWithFilterAndPin("total_amount", "Amount ($)", (_, r) => (
      <AmountUseCell record={r} />
    )),

    getColumnWithFilterAndPin("payment_status", "Due Status", (_, r) => (
      <DueStatusCell record={r} />
    )),

    getColumnWithFilterAndPin("invoice_number", "Invoice"),

    getColumnWithFilterAndPin("payment_date", "Payment Status Date"),

    getColumnWithFilterAndPin("payment_receive_date", "Payment Receive Date"),
  ];

  return (
    <div
      style={{
        padding: 24,
        background: "#f5f7fa",
        minHeight: "100vh",
      }}>
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 14,
          boxShadow: "0 6px 25px rgba(0,0,0,0.05)",
        }}>
        <div style={{ display: "flex", gap: 10 }}>
          <DatePicker
            picker="month"
            allowClear={false}
            value={dayjs(month)}
            onChange={(date) => setMonth(date.format("YYYY-MM"))}
          />

          <Button icon={<ClearOutlined />} onClick={clearAllFilters}>
            Clear Filters
          </Button>
        </div>

        <Spin spinning={loading}>
          <StyledTable
            rowKey={(r) => `${r.adv_id}-${r.month}`}
            columns={columns}
            dataSource={filteredData}
            bordered
          />
        </Spin>
      </div>
    </div>
  );
}

export default AdvertiserAccount;
