import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Input,
  Select,
  Tooltip,
  message,
  DatePicker,
  Spin,
  Tag,
  Button,
  Checkbox,
} from "antd";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import axios from "axios";
import StyledTable from "../../Utils/StyledTable";
import {
  PushpinOutlined,
  PushpinFilled,
  ClearOutlined,
} from "@ant-design/icons";
const { Option } = Select;
const API = import.meta.env.VITE_API_URL5;

const displayValue = (val, placeholder = "—") =>
  val === null || val === undefined || val === "" ? (
    <span style={{ color: "#bbb" }}>{placeholder}</span>
  ) : (
    val
  );

/* Editable Cells (same as advertiser) */
const EditableTextCell = ({ value, onSave, width = 140 }) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? "");

  useEffect(() => setLocalValue(value ?? ""), [value]);

  const save = () => {
    setEditing(false);
    if (localValue !== value) onSave(localValue || null);
  };

  return editing ? (
    <Input
      size="small"
      autoFocus
      bordered={false}
      value={localValue}
      style={{ width }}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={save}
      onPressEnter={save}
    />
  ) : (
    <div onClick={() => setEditing(true)} style={{ cursor: "pointer" }}>
      {displayValue(value)}
    </div>
  );
};

const EditableNumberCell = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? "");

  useEffect(() => setLocalValue(value ?? ""), [value]);

  const save = () => {
    setEditing(false);
    if (localValue !== value)
      onSave(localValue === "" ? null : Number(localValue));
  };

  return editing ? (
    <Input
      size="small"
      type="number"
      autoFocus
      bordered={false}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={save}
      onPressEnter={save}
    />
  ) : (
    <div onClick={() => setEditing(true)} style={{ cursor: "pointer" }}>
      {displayValue(value)}
    </div>
  );
};

const EditableSelectCell = ({ value, options, onSave }) => {
  const [editing, setEditing] = useState(false);
  const label = options.find((o) => o.value === value)?.label || value;

  return editing ? (
    <Select
      size="small"
      autoFocus
      bordered={false}
      value={value}
      options={options}
      onChange={(val) => {
        setEditing(false);
        onSave(val);
      }}
      onBlur={() => setEditing(false)}
    />
  ) : (
    <div onClick={() => setEditing(true)} style={{ cursor: "pointer" }}>
      {displayValue(label)}
    </div>
  );
};
const EditableDateCell = ({ value, onSave }) => (
  <DatePicker
    value={value ? dayjs(value, "YYYY-MM-DD") : null}
    format="YYYY-MM-DD"
    onChange={(d) => onSave(d ? d.format("YYYY-MM-DD") : null)}
    bordered={false}
    style={{ width: 140 }}
  />
);
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

export default function PublisherAccount() {
  const currentMonth = dayjs().format("YYYY-MM");
  const [data, setData] = useState([]);
  const { user } = useSelector((state) => state.auth);
  const [month, setMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [sortInfo, setSortInfo] = useState({});
  const clearAllFilters = () => {
    setFilters({});
    setPinnedColumns({});
    setFilterSearch({});
    setUniqueValues({});
    setSortInfo({});

    message.success("✅ All filters, sorting and pins cleared");
  };
  const fetchData = async (m) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API}/publisher/account`, {
        user_id: user?.id,
        role: user?.role || [],
        assigned_subadmins: user?.assigned_subadmins || [],
        month: month || currentMonth,
      });
      setData(res.data.data);
    } catch {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(month);
  }, [month]);

  const autoSaveRow = async (record) => {
    try {
      await axios.put(`${API}/publisher/account/update`, record);
      message.success("Saved", 0.5);
    } catch {
      message.error("Auto-save failed");
      fetchData(month);
    }
  };

  const updateCell = (record, key, value) => {
    record[key] = value;
    setData([...data]);
    autoSaveRow(record);
  };
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };

  const handlePinColumn = (key) => {
    setPinnedColumns((prev) => {
      const current = prev[key];

      let next;
      if (!current) next = "left";
      else if (current === "left") next = "right";
      else next = null;

      return { ...prev, [key]: next };
    });
  };

  const handleTableChange = (_, __, sorter) => {
    setSortInfo(sorter);
  };

  const getCellValue = (row, key) => {
    switch (key) {
      case "pub_name":
        return `${row.pub_id} (${row.pub_name})`;

      case "payment_status":
        if (row.payment_status === "Paid") return "PAID";
        if (!row.invoice_date) return "NOT ISSUED";

        return dayjs().isAfter(dayjs(row.invoice_date)) ? "OVERDUE" : "NOT DUE";

      default:
        return normalize(row[key]);
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
  const filteredData = useMemo(() => {
    let result = data.filter((row) => {
      return Object.entries(filters).every(([key, values]) => {
        if (!values || values.length === 0) return true;

        return values.includes(getCellValue(row, key));
      });
    });
    if (sortInfo?.columnKey && sortInfo?.order) {
      result = [...result].sort((a, b) => {
        const key = sortInfo.columnKey;

        let valA;
        let valB;

        if (key === "pub_name") {
          valA = `${a.pub_id} (${a.pub_name})`;
          valB = `${b.pub_id} (${b.pub_name})`;
        } else {
          valA = a[key];
          valB = b[key];
        }

        const comparison =
          !isNaN(valA) && !isNaN(valB)
            ? Number(valA) - Number(valB)
            : (valA || "").toString().localeCompare((valB || "").toString());

        return sortInfo.order === "ascend" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters, sortInfo]);
  console.log("filteredData", filteredData);
  const getFilterDropdown = (key) => {
    const allValues = uniqueValues[key] || [];
    const selectedValues =
      filters[key] === undefined ? allValues : filters[key];
    const searchText = filterSearch[key] || "";

    const visibleValues = allValues.filter((val) =>
      val.toLowerCase().includes(searchText.toLowerCase()),
    );

    const isAllSelected = selectedValues.length === allValues.length;
    const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

    return (
      <div
        className="w-[260px] rounded-xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-2 border-b">
          <Input
            allowClear
            placeholder="Search values"
            value={searchText}
            onChange={(e) =>
              setFilterSearch((prev) => ({
                ...prev,
                [key]: e.target.value,
              }))
            }
          />
        </div>

        <div className="px-3 py-2">
          <Checkbox
            indeterminate={isIndeterminate}
            checked={isAllSelected}
            onChange={(e) => {
              const checked = e.target.checked;

              setFilters((prev) => {
                const updated = { ...prev };

                if (checked) {
                  delete updated[key];
                } else {
                  updated[key] = [];
                }

                return updated;
              });
            }}>
            Select All
          </Checkbox>
        </div>

        <div className="max-h-[220px] overflow-y-auto px-2 pb-2">
          {visibleValues.map((val) => (
            <label
              key={val}
              className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-blue-50">
              <Checkbox
                checked={selectedValues.includes(val)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selectedValues, val]
                    : selectedValues.filter((v) => v !== val);

                  setFilters((prev) => ({
                    ...prev,
                    [key]: next,
                  }));
                }}
              />
              {val}
            </label>
          ))}
        </div>
      </div>
    );
  };
  const baseColumns = [
    {
      title: "PubID (Publisher)",
      key: "publisher",
      dataIndex: "pub_name",
      render: (_, r) => (
        <Tooltip title={r.note || "No note"}>
          <span>
            {r.pub_id} ({r.pub_name})
          </span>
        </Tooltip>
      ),
    },

    {
      title: "Month",
      key: "month",
      dataIndex: "month",
    },

    {
      title: "Payment Invoice Date",
      key: "invoice_date",
      dataIndex: "invoice_date",
      render: (_, r) => (
        <EditableDateCell
          value={r.invoice_date}
          onSave={(v) => updateCell(r, "invoice_date", v)}
        />
      ),
    },

    {
      title: "System Amount",
      key: "total_amount",
      dataIndex: "total_amount",
      render: (_, r) => <SystemAmountCell record={r} />,
    },

    {
      title: "Due Status",
      key: "due_status",
      dataIndex: "payment_status",
      render: (_, r) => <DueStatusCell record={r} />,
    },

    {
      title: "Invoice Received",
      key: "invoice_number",
      dataIndex: "invoice_number",
      render: (_, r) => (
        <EditableTextCell
          value={r.invoice_number}
          onSave={(v) => updateCell(r, "invoice_number", v)}
        />
      ),
    },

    {
      title: "Invoice Amount Raised",
      key: "amount_paid",
      dataIndex: "amount_paid",
      render: (_, r) => (
        <EditableNumberCell
          value={r.amount_paid}
          onSave={(v) => updateCell(r, "amount_paid", v)}
        />
      ),
    },

    {
      title: "Payment Status Date",
      key: "payment_date",
      dataIndex: "payment_date",
      render: (_, r) => (
        <EditableDateCell
          value={r.payment_date}
          onSave={(v) => updateCell(r, "payment_date", v)}
        />
      ),
    },
  ];
  const columns = baseColumns.map((col) => {
    const key = col.dataIndex || col.key;

    return {
      ...col,

      title: (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <span
            style={{
              color: filters[key]?.length ? "#1677ff" : undefined,
              fontWeight: filters[key]?.length ? 600 : 400,
            }}>
            {typeof col.title === "string"
              ? col.title
              : col.title?.props?.children}
          </span>

          <span
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              handlePinColumn(key);
            }}>
            {pinnedColumns[key] ? (
              <PushpinFilled rotate={pinnedColumns[key] === "right" ? 90 : 0} />
            ) : (
              <PushpinOutlined />
            )}
          </span>
        </div>
      ),

      fixed: pinnedColumns[key] || undefined,

      sorter: (a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (!isNaN(valA) && !isNaN(valB)) return valA - valB;

        return (valA || "").toString().localeCompare((valB || "").toString());
      },

      sortOrder: sortInfo.columnKey === key ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          setSortInfo((prev) => {
            if (prev.columnKey !== key) {
              return {
                columnKey: key,
                order: "ascend",
              };
            }

            if (prev.order === "ascend") {
              return {
                columnKey: key,
                order: "descend",
              };
            }

            if (prev.order === "descend") {
              return {};
            }

            return {
              columnKey: key,
              order: "ascend",
            };
          });
        },
      }),
      filterDropdown: () => getFilterDropdown(key),

      filtered:
        filters[key] &&
        filters[key].length !== (uniqueValues[key] || []).length,
      onFilterDropdownOpenChange: (open) => {
        if (!open) return;

        const source = getExcelFilteredDataForColumn(key);

        const values = [
          ...new Set(source.map((row) => getCellValue(row, key))),
        ].sort((a, b) => String(a).localeCompare(String(b)));

        setUniqueValues((prev) => ({
          ...prev,
          [key]: values,
        }));
      },
    };
  });
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}>
          <h2 className="text-xl font-bold">Publisher Account Overview</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <DatePicker
              picker="month"
              value={dayjs(month)}
              allowClear={false}
              onChange={(d) => {
                setMonth(d.format("YYYY-MM"));
                setFilters({});
                setUniqueValues({});
                setFilterSearch({});
                setSortInfo({});
              }}
            />
            <Button icon={<ClearOutlined />} onClick={clearAllFilters}>
              Clear Filters
            </Button>
          </div>
        </div>

        <Spin spinning={loading}>
          <StyledTable
            rowKey={(r) => `${r.id}`}
            columns={columns}
            dataSource={filteredData}
            onChange={handleTableChange}
            scroll={{ x: "max-content" }}
            bordered
            pagination={{ pageSize: 8 }}
          />
        </Spin>
      </div>
    </div>
  );
}
