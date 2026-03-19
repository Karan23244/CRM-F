import React, { useEffect, useState } from "react";
import {
  Tooltip,
  message,
  DatePicker,
  Spin,
  Tag,
  Input,
  Checkbox,
  Button,
} from "antd";
import dayjs from "dayjs";
import axios from "axios";
import { useSelector } from "react-redux";
import StyledTable from "../../Utils/StyledTable";
import {
  PushpinOutlined,
  PushpinFilled,
  ClearOutlined,
} from "@ant-design/icons";
const API = import.meta.env.VITE_API_URL5;

const displayValue = (val, placeholder = "—") =>
  val === null || val === undefined || val === "" ? (
    <span style={{ color: "#bbb" }}>{placeholder}</span>
  ) : (
    val
  );

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

  const overdue = dayjs().isAfter(dayjs(record.invoice_date));

  return overdue ? (
    <Tag color="red">OVERDUE</Tag>
  ) : (
    <Tag color="gold">NOT DUE</Tag>
  );
};

const SystemAmountCell = ({ record }) => {
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

/* ============================= */
/* MAIN COMPONENT */
/* ============================= */

export default function PublisherAccount() {
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
  const clearAllFilters = () => {
    setFilters({});
    setPinnedColumns({});
    setFilterSearch({});
    message.success("All filters & pins cleared");
  };
  const togglePin = (key) =>
    setPinnedColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  const fetchData = async (m) => {
    try {
      setLoading(true);

      const res = await axios.post(`${API}/publisher/account`, {
        user_id: user?.id,
        role: user?.role || [],
        assigned_subadmins: user?.assigned_subadmins || [],
        month: m,
      });

      setData(res.data.data); // ⚠️ important (your backend sends { success, data })
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
  /* TABLE COLUMNS (READ ONLY) */
  /* ============================= */
  useEffect(() => {
    const valuesObj = {};

    columnsRaw.forEach((col) => {
      const key = col.key;
      if (!key) return;

      valuesObj[key] = [...new Set(data.map((row) => normalize(row[key])))];
    });

    setUniqueValues(valuesObj);
  }, [data]);
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
            gap: 6,
          }}>
          <span>{title}</span>
          <div
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}>
            {/* Pin Icon */}
            {isPinned ? (
              <PushpinFilled
                onClick={(e) => {
                  e.stopPropagation(); // 👈 prevent header click
                  togglePin(dataIndex);
                }}
                style={{ color: "#1677ff", cursor: "pointer" }}
              />
            ) : (
              <PushpinOutlined
                onClick={(e) => {
                  e.stopPropagation(); // 👈 prevent header click
                  togglePin(dataIndex);
                }}
                style={{ color: "#888", cursor: "pointer" }}
              />
            )}
          </div>
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
  const filteredData = data.filter((row) => {
    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(normalize(row[key]));
    });
  });
  // const columns = [
  //   {
  //     title: <div style={{ textAlign: "center" }}>PubID (Publisher)</div>,
  //     render: (_, r) => (
  //       <Tooltip title={r.note || "No note"}>
  //         <span style={{ color: "#1677ff", fontWeight: 500 }}>
  //           {r.pub_id} ({r.pub_name})
  //         </span>
  //       </Tooltip>
  //     ),
  //   },

  //   {
  //     title: <div style={{ textAlign: "center" }}>Month</div>,
  //     dataIndex: "month",
  //   },

  //   {
  //     title: <div style={{ textAlign: "center" }}>Payment Invoice Date</div>,
  //     render: (_, r) => displayValue(r.invoice_date),
  //   },

  //   {
  //     title: <div style={{ textAlign: "center" }}>Due Status</div>,
  //     render: (_, r) => <DueStatusCell record={r} />,
  //   },

  //   {
  //     title: <div style={{ textAlign: "center" }}>Invoice Received</div>,
  //     render: (_, r) => displayValue(r.invoice_number),
  //   },

  //   {
  //     title: <div style={{ textAlign: "center" }}>Invoice Amount Raised</div>,
  //     render: (_, r) =>
  //       displayValue(
  //         r.amount_paid !== null && r.amount_paid !== undefined
  //           ? Number(r.amount_paid).toFixed(2)
  //           : null,
  //       ),
  //   },

  //   {
  //     title: <div style={{ textAlign: "center" }}>Payment Status Date</div>,
  //     render: (_, r) => displayValue(r.payment_date),
  //   },
  // ];
  const columnsRaw = [
    getColumnWithFilterAndPin("pub_id", "PubID (Publisher)", (_, r) => (
      <Tooltip title={r.note || "No note"}>
        <span style={{ color: "#1677ff", fontWeight: 500 }}>
          {r.pub_id} ({r.pub_name})
        </span>
      </Tooltip>
    )),

    getColumnWithFilterAndPin("month", "Month"),

    getColumnWithFilterAndPin("invoice_date", "Payment Invoice Date"),

    getColumnWithFilterAndPin("payment_status", "Due Status", (_, r) => (
      <DueStatusCell record={r} />
    )),

    getColumnWithFilterAndPin("invoice_number", "Invoice Received"),

    getColumnWithFilterAndPin("amount_paid", "Invoice Amount Raised", (_, r) =>
      displayValue(
        r.amount_paid !== null && r.amount_paid !== undefined
          ? Number(r.amount_paid).toFixed(2)
          : null,
      ),
    ),

    getColumnWithFilterAndPin("payment_date", "Payment Status Date"),
  ];
  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 12 }}>
        <div
          style={{ display: "flex", justifyContent: "space-between" }}
          className="mb-5">
          <h2 className="text-xl font-bold">Publisher Account Overview</h2>

          <div style={{ display: "flex", gap: 10 }}>
            <DatePicker
              picker="month"
              value={dayjs(month)}
              allowClear={false}
              onChange={(d) => setMonth(d.format("YYYY-MM"))}
            />

            <Button icon={<ClearOutlined />} onClick={clearAllFilters}>
              Clear Filters
            </Button>
          </div>
        </div>

        <Spin spinning={loading}>
          <StyledTable
            rowKey={(r) => `${r.pub_id}-${r.month}`}
            columns={columnsRaw}
            dataSource={filteredData}
            bordered
          />
        </Spin>
      </div>
    </div>
  );
}
