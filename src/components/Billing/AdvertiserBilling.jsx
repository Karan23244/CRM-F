import React, { useEffect, useState } from "react";
import {
  Table,
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
  const [sortInfo, setSortInfo] = useState({});
  const normalize = (val, key = "") => {
    if (val === null || val === undefined || val === "") return "-";

    // ✅ Format date fields without time
    if (key === "payment_date" || key === "invoice_date") {
      return dayjs(val).isValid() ? dayjs(val).format("DD-MM-YYYY") : "-";
    }

    return val.toString().trim();
  };

  const togglePin = (key) =>
    setPinnedColumns((prev) => ({ ...prev, [key]: !prev[key] }));

  const clearAllFilters = () => {
    setFilters({});
    setPinnedColumns({});
    setFilterSearch({});
    setSortInfo({});
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
    // ✅ Payment received
    if (record.payment_date) {
      return <Tag color="green">RECEIVED</Tag>;
    }

    // ✅ Invoice not raised
    if (!record.invoice_date) {
      return <Tag color="blue">NOT ISSUED</Tag>;
    }

    // ✅ Parse payment terms
    let days = 0;

    if (record.payment_terms) {
      days = parseInt(record.payment_terms.replace("d", ""));
    }

    // ✅ Due date
    const dueDate = dayjs(record.invoice_date).add(days, "day");

    const isOverdue = dayjs().isAfter(dueDate, "day");

    return isOverdue ? (
      <Tag color="red">OVERDUE</Tag>
    ) : (
      <Tag color="gold">NOT DUE</Tag>
    );
  };

  const AmountUseCell = ({ record }) => {
    let overdue = false;

    if (!record.payment_date && record.invoice_date) {
      let days = 0;

      if (record.payment_terms) {
        days = parseInt(record.payment_terms.replace("d", ""));
      }

      const dueDate = dayjs(record.invoice_date).add(days, "day");

      overdue = dayjs().isAfter(dueDate, "day");
    }

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
      sorter: true,

      sortOrder: sortInfo.columnKey === dataIndex ? sortInfo.order : null,

      onHeaderCell: () => ({
        onClick: () => {
          setSortInfo((prev) => {
            if (prev.columnKey !== dataIndex) {
              return {
                columnKey: dataIndex,
                order: "ascend",
              };
            }

            if (prev.order === "ascend") {
              return {
                columnKey: dataIndex,
                order: "descend",
              };
            }

            return {};
          });
        },
      }),
      onFilterDropdownOpenChange: (open) => {
        if (!open) return;

        updateUniqueValuesForColumn(dataIndex);
      },
      filterDropdown: () => {
        const allValues = uniqueValues[dataIndex] || [];
        const selectedValues =
          filters[dataIndex] === undefined ? allValues : filters[dataIndex];
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
  const updateUniqueValuesForColumn = (columnKey) => {
    const source = getExcelFilteredDataForColumn(columnKey);

    const values = [
      ...new Set(source.map((row) => getCellValue(row, columnKey))),
    ].sort((a, b) => String(a).localeCompare(String(b)));

    setUniqueValues((prev) => ({
      ...prev,
      [columnKey]: values,
    }));
  };
  const getCellValue = (row, key) => {
    switch (key) {
      case "adv_id":
        return row.adv_name
          ? `${row.adv_id} (${row.adv_name})`
          : String(row.adv_id);

      case "payment_status":
        if (row.payment_date) return "RECEIVED";

        if (!row.invoice_date) return "NOT ISSUED";

        const days = parseInt(
          String(row.payment_terms || "0d").replace("d", ""),
          10,
        );

        const dueDate = dayjs(row.invoice_date).add(days, "day");

        return dayjs().isAfter(dueDate, "day") ? "OVERDUE" : "NOT DUE";

      default:
        return normalize(row[key], key);
    }
  };
  const getExcelFilteredDataForColumn = (columnKey) => {
    return data.filter((row) => {
      return Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;

        if (!values || values.length === 0) return true;

        return values.includes(getCellValue(row, key));
      });
    });
  };
  const filteredData = React.useMemo(() => {
    let result = data.filter((row) => {
      return Object.entries(filters).every(([key, values]) => {
        if (!values || values.length === 0) return true;

        return values.includes(getCellValue(row, key));
      });
    });

    if (sortInfo?.columnKey && sortInfo?.order) {
      result = [...result].sort((a, b) => {
        const key = sortInfo.columnKey;

        const valA = getCellValue(a, key);
        const valB = getCellValue(b, key);

        const comparison =
          !isNaN(valA) && !isNaN(valB)
            ? Number(valA) - Number(valB)
            : String(valA).localeCompare(String(valB));

        return sortInfo.order === "ascend" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters, sortInfo]);
  /* ============================= */
  /* Table Columns (READ ONLY) */
  /* ============================= */

  const isAdmin =
    user?.role?.includes("admin") || user?.role?.includes("accounts");

  const baseColumns = [
    getColumnWithFilterAndPin("adv_id", "Advid (Adv Name)", (_, r) => (
      <Tooltip title={r.note || "No Legal Billing Address"}>
        <span style={{ color: "#1677ff", fontWeight: 500 }}>
          {r.adv_name ? `${r.adv_id} (${r.adv_name})` : r.adv_id}
        </span>
      </Tooltip>
    )),

    getColumnWithFilterAndPin("month", "Activity Month"),
    getColumnWithFilterAndPin("invoice_date", "Invoice Date", (value) =>
      value ? dayjs(value).format("DD-MM-YYYY") : "-",
    ),
    getColumnWithFilterAndPin(
      "total_amount",
      "PID Metric Amount ($)",
      (_, r) => <AmountUseCell record={r} />,
    ),
    getColumnWithFilterAndPin("payment_terms", "Payment Terms"),
    getColumnWithFilterAndPin("payment_status", "Due Status", (_, r) => (
      <DueStatusCell record={r} />
    )),
    getColumnWithFilterAndPin("invoice_from", "Invoice From", (value) =>
      value ? dayjs(value).format("DD-MM-YYYY") : "-",
    ),

    getColumnWithFilterAndPin("invoice_to", "Invoice To", (value) =>
      value ? dayjs(value).format("DD-MM-YYYY") : "-",
    ),
    getColumnWithFilterAndPin("amount_raised", "Actual Amount Raised"),

    getColumnWithFilterAndPin("invoice_number", "Invoice Number"),

    {
      ...getColumnWithFilterAndPin("payment_date", "Payment Received Date"),
      render: (value) => (value ? dayjs(value).format("DD-MM-YYYY") : "-"),
    },
  ];

  const adminColumns = [];

  const columns = [...baseColumns, ...adminColumns];
  console.log("filteredData",filteredData)
  return (
    <div
      style={{
        minHeight: "100vh",
      }}>
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 14,
          boxShadow: "0 6px 25px rgba(0,0,0,0.05)",
        }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <DatePicker
            picker="month"
            allowClear={false}
            value={dayjs(month)}
            onChange={(d) => {
              setFilters({});
              setFilterSearch({});
              setUniqueValues({});
              setSortInfo({});

              setMonth(d.format("YYYY-MM"));
            }}
          />

          <Button icon={<ClearOutlined />} onClick={clearAllFilters}>
            Clear Filters
          </Button>
        </div>

        <Spin spinning={loading}>
          <StyledTable
            rowKey={(r) => `${r.id}`}
            columns={columns}
            dataSource={filteredData}
            bordered
            summary={() => {
              const totalPIDAmount = filteredData.reduce(
                (sum, row) => sum + Number(row.total_amount || 0),
                0,
              );

              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <strong>Total</strong>
                  </Table.Summary.Cell>

                  <Table.Summary.Cell index={1} colSpan={2} />

                  <Table.Summary.Cell index={3}>
                    <strong>{totalPIDAmount.toFixed(2)}</strong>
                  </Table.Summary.Cell>

                  <Table.Summary.Cell index={4} colSpan={columns.length} />
                </Table.Summary.Row>
              );
            }}
          />
        </Spin>
      </div>
    </div>
  );
}

export default AdvertiserAccount;
