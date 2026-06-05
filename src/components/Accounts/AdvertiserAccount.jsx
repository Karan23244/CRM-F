// ==========================
// 📁 AdvertiserAccount.jsx
// ==========================

import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Select,
  Tooltip,
  message,
  DatePicker,
  Tag,
  Spin,
  Checkbox,
  Button,
} from "antd";
import Swal from "sweetalert2";
import {
  PushpinOutlined,
  PushpinFilled,
  ClearOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import axios from "axios";
import { useSelector } from "react-redux";
import StyledTable from "../../Utils/StyledTable";

const { Option } = Select;
const API = import.meta.env.VITE_API_URL5;
const apiUrl = import.meta.env.VITE_API_URL;
/* ============================= */
/* Helper Display Function */
/* ============================= */

const displayValue = (val, placeholder = "—") =>
  val === null || val === undefined || val === "" ? (
    <span style={{ color: "#bbb" }}>{placeholder}</span>
  ) : (
    val
  );

/* ============================= */
/* Editable Text Cell */
/* ============================= */

const EditableTextCell = ({ value, onSave, width = 140 }) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? "");

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  const save = () => {
    setEditing(false);

    if (localValue !== value) {
      onSave(localValue || null);
    }
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
    <div
      onClick={() => setEditing(true)}
      style={{
        minWidth: width,
        padding: "4px 8px",
        borderRadius: 6,
        cursor: "pointer",
      }}>
      {displayValue(value)}
    </div>
  );
};

/* ============================= */
/* Editable Select Cell */
/* ============================= */

const EditableSelectCell = ({ value, options, onSave, width = 120 }) => {
  const [editing, setEditing] = useState(false);

  const label = options.find((o) => o.value === value)?.label || value;

  return editing ? (
    <Select
      size="small"
      autoFocus
      bordered={false}
      value={value}
      style={{ width }}
      onChange={(val) => {
        setEditing(false);
        onSave(val);
      }}
      onBlur={() => setEditing(false)}
      options={options}
    />
  ) : (
    <div
      onClick={() => setEditing(true)}
      style={{
        minWidth: width,
        padding: "4px 8px",
        borderRadius: 6,
        cursor: "pointer",
      }}>
      {displayValue(label)}
    </div>
  );
};

/* ============================= */
/* Editable Date Cell */
/* ============================= */

const EditableDateCell = ({ value, onSave }) => (
  <DatePicker
    value={value ? dayjs(value, "YYYY-MM-DD") : null}
    onChange={(d) => onSave(d ? d.format("YYYY-MM-DD") : null)}
    format="YYYY-MM-DD"
    bordered={false}
    placeholder="Select date"
    style={{ width: 140 }}
  />
);

/* ============================= */
/* Amount Raised Cell */
/* ============================= */

const AmountRaisedCell = ({ record, onSave }) => {
  const [editing, setEditing] = useState(false);

  const [amount, setAmount] = useState(record.amount_raised ?? "");

  const [currency, setCurrency] = useState(record.currency || "INR");

  const commitSave = () => {
    setEditing(false);

    onSave("amount_raised", amount === "" ? null : Number(amount));

    onSave("currency", currency);
  };

  return editing ? (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        background: "#f5f7fa",
        padding: 6,
        borderRadius: 8,
      }}
      onMouseDown={(e) => e.stopPropagation()}>
      <Select
        size="small"
        value={currency}
        style={{ width: 80 }}
        onChange={setCurrency}
        options={[
          { label: "₹ INR", value: "INR" },
          { label: "$ USD", value: "USD" },
        ]}
      />

      <Input
        size="small"
        type="number"
        value={amount}
        autoFocus
        style={{ width: 120 }}
        onChange={(e) => setAmount(e.target.value)}
        onPressEnter={commitSave}
      />

      <span
        onClick={commitSave}
        style={{
          cursor: "pointer",
          color: "#1677ff",
          fontWeight: 600,
        }}>
        ✔
      </span>
    </div>
  ) : (
    <div
      onClick={() => setEditing(true)}
      style={{
        cursor: "pointer",
        padding: "6px 10px",
        borderRadius: 8,
        background: "#f5f7fa",
        fontWeight: 600,
        display: "inline-flex",
        gap: 6,
        alignItems: "center",
      }}>
      <span>{currency === "INR" ? "₹" : "$"}</span>
      <span>{amount || "—"}</span>
    </div>
  );
};
const AdvertiserSelectCell = ({ value, options, onSave }) => {
  return (
    <Select
      showSearch
      placeholder="Select Advertiser"
      value={value || undefined}
      style={{ width: 100 }}
      optionFilterProp="label"
      onChange={onSave}
      options={options}
      filterOption={(input, option) =>
        option?.label?.toLowerCase().includes(input.toLowerCase())
      }
    />
  );
};
/* ============================= */
/* Main Component */
/* ============================= */

function AdvertiserAccount() {
  const currentMonth = dayjs().format("YYYY-MM");

  const [data, setData] = useState([]);
  const [month, setMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);
  const [advertisers, setAdvertisers] = useState([]);
  /* FILTER STATES */
  const [filters, setFilters] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});

  const { user } = useSelector((state) => state.auth);

  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";

    return val.toString().trim();
  };

  const togglePin = (key) =>
    setPinnedColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

  const clearAllFilters = () => {
    setFilters({});
    setPinnedColumns({});
    setFilterSearch({});

    message.success("✅ All filters and pins cleared");
  };

  /* ============================= */
  /* Fetch Data */
  /* ============================= */
  const fetchAdvertisers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-NameAdv/`);

      console.log("Fetched Advertisers:", response.data);

      setAdvertisers(response.data.data || []);
    } catch (error) {
      console.error(error);
      message.error("Failed to fetch advertisers");
    }
  };
  const fetchData = async (selectedMonth) => {
    try {
      setLoading(true);

      const res = await axios.post(`${API}/advertiser/account`, {
        user_id: user?.id,
        role: user?.role || [],
        assigned_subadmins: user?.assigned_subadmins || [],
        month: selectedMonth || currentMonth,
      });
      console.log("Fetched Data:", res.data);
      setData(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(month);
    fetchAdvertisers();
  }, [month]);

  /* ============================= */
  /* Auto Save */
  /* ============================= */

  const autoSaveRow = async (record, changedFields) => {
    try {
      console.log("record", record);
      console.log("changedFields", changedFields);
      if (record.isNew && changedFields.adv_id) {
        const res = await axios.post(`${API}/advertiser/account/manual`, {
          adv_id: changedFields.adv_id,
          month: record.month,
          is_manual: 1,
        });
        console.log("Auto Save Response:", res.data.success, res.data.message);
        if (!res.data.success) {
          Swal.fire({
            icon: "error",
            title: "Duplicate Entry",
            text: res.data.message || "Manual record already exists",
            confirmButtonColor: "#d33",
          });

          return;
        }

        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Record created successfully",
          timer: 1500,
          showConfirmButton: false,
        });

        fetchData(month);
        message.success("Created");

        fetchData(month);
        return;
      } else {
        await axios.put(`${API}/advertiser/account/update`, {
          id: record.id,
          ...changedFields,
        });
        fetchData(month);
        message.success("Saved");
      }
    } catch (err) {
      console.error(err);

      if (
        err?.response?.status === 400 &&
        err?.response?.data?.message === "Manual record already exists"
      ) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Entry",
          text: "Manual record already exists",
          confirmButtonColor: "#faad14",
        });

        return;
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Something went wrong",
      });
    }
  };

  const updateCell = (record, key, value) => {
    const updated = { ...record, [key]: value };

    setData((prev) =>
      prev.map((row) =>
        row.id === record.id || (record.tempId && row.tempId === record.tempId)
          ? updated
          : row,
      ),
    );

    autoSaveRow(updated, {
      [key]: value,
    });
  };

  /* ============================= */
  /* Due Status */
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

  /* ============================= */
  /* Amount Color */
  /* ============================= */

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

  /* ============================= */
  /* Invoice Range */
  /* ============================= */

  const InvoiceRangeCell = ({ record, onSave }) => (
    <DatePicker.RangePicker
      value={
        record.invoice_from && record.invoice_to
          ? [dayjs(record.invoice_from), dayjs(record.invoice_to)]
          : null
      }
      onChange={(dates) => {
        const from = dates?.[0] ? dates[0].format("YYYY-MM-DD") : null;

        const to = dates?.[1] ? dates[1].format("YYYY-MM-DD") : null;

        onSave({
          invoice_from: from,
          invoice_to: to,
        });
      }}
      bordered={false}
      format="YYYY-MM-DD"
      style={{ width: 220 }}
    />
  );

  /* ============================= */
  /* UNIQUE VALUES */
  /* ============================= */

  useEffect(() => {
    const valuesObj = {};

    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (!valuesObj[key]) valuesObj[key] = new Set();

        if (key === "adv_id") {
          valuesObj[key].add(
            row.adv_name
              ? `${row.adv_id} (${row.adv_name})`
              : String(row.adv_id),
          );
        } else {
          valuesObj[key].add(normalize(row[key]));
        }
      });
    });

    const formatted = {};

    Object.keys(valuesObj).forEach((key) => {
      formatted[key] = [...valuesObj[key]];
    });

    setUniqueValues(formatted);
  }, [data]);

  /* ============================= */
  /* FILTERED DATA */
  /* ============================= */
  const advertiserOptions = advertisers.map((adv) => ({
    value: adv.adv_id,
    label: `${adv.adv_id} (${adv.adv_name})`,
  }));
  const filteredData = data.filter((row) => {
    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;

      if (key === "adv_id") {
        const advDisplay = row.adv_name
          ? `${row.adv_id} (${row.adv_name})`
          : String(row.adv_id);

        return values.includes(advDisplay);
      }

      return values.includes(normalize(row[key]));
    });
  });

  /* ============================= */
  /* FILTER + PIN COLUMN */
  /* ============================= */

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
              style={{
                color: "#1677ff",
                cursor: "pointer",
              }}
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
          String(val).toLowerCase().includes(searchText.toLowerCase()),
        );

        const isAllSelected = selectedValues.length === allValues.length;

        const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

        return (
          <div
            className="w-[260px] rounded-xl"
            onClick={(e) => e.stopPropagation()}>
            {/* Search */}
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

            {/* Select All */}
            <div className="px-3 py-2">
              <Checkbox
                indeterminate={isIndeterminate}
                checked={isAllSelected}
                onChange={(e) => {
                  const checked = e.target.checked;

                  setFilters((prev) => {
                    const updated = {
                      ...prev,
                    };

                    if (checked) delete updated[dataIndex];
                    else updated[dataIndex] = [];

                    return updated;
                  });
                }}>
                Select All
              </Checkbox>
            </div>

            {/* Values */}
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

  /* ============================= */
  /* Columns */
  /* ============================= */

  const columns = [
    getColumnWithFilterAndPin("adv_id", "Advid (Adv Name)", (_, r) => {
      if (r.isNew) {
        return (
          <Select
            showSearch
            style={{ width: 170 }}
            placeholder="Select Advertiser"
            value={r.adv_id || undefined}
            options={advertiserOptions}
            optionFilterProp="label"
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            onChange={(value) => updateCell(r, "adv_id", value)}
          />
        );
      }

      return (
        <Tooltip title={r.note || "No Legal Billing Address"}>
          <span
            style={{
              color: "#1677ff",
              fontWeight: 500,
            }}>
            {r.adv_name ? `${r.adv_id} (${r.adv_name})` : r.adv_id}
          </span>
        </Tooltip>
      );
    }),

    getColumnWithFilterAndPin("month", "Activity Month"),

    getColumnWithFilterAndPin("invoice_date", "Invoice Date", (_, r) => (
      <EditableDateCell
        value={r.invoice_date}
        onSave={(v) => updateCell(r, "invoice_date", v)}
      />
    )),

    getColumnWithFilterAndPin(
      "total_amount",
      "PID Metric Amount ($)",
      (_, r) => <AmountUseCell record={r} />,
    ),

    getColumnWithFilterAndPin("payment_terms", "Payment Terms", (_, r) => (
      <EditableSelectCell
        value={r.payment_terms}
        width={110}
        options={[
          {
            label: "15 Days",
            value: "15d",
          },
          {
            label: "30 Days",
            value: "30d",
          },
          {
            label: "45 Days",
            value: "45d",
          },
          {
            label: "60 Days",
            value: "60d",
          },
          {
            label: "90 Days",
            value: "90d",
          },
          {
            label: "120 Days",
            value: "120d",
          },
        ]}
        onSave={(v) => updateCell(r, "payment_terms", v)}
      />
    )),

    getColumnWithFilterAndPin("due_status", "Due Status", (_, r) => (
      <DueStatusCell record={r} />
    )),

    getColumnWithFilterAndPin("invoice_range", "Raise Invoice", (_, r) => (
      <InvoiceRangeCell
        record={r}
        onSave={(values) => {
          const updated = {
            ...r,
            ...values,
          };

          setData((prev) =>
            prev.map((row) => (row.id === r.id ? updated : row)),
          );

          autoSaveRow(r, values);
        }}
      />
    )),

    getColumnWithFilterAndPin(
      "amount_raised",
      "Actual Amount Raised",
      (_, r) => (
        <AmountRaisedCell record={r} onSave={(k, v) => updateCell(r, k, v)} />
      ),
    ),

    getColumnWithFilterAndPin("invoice_number", "Invoice Number", (_, r) => (
      <EditableTextCell
        value={r.invoice_number}
        onSave={(v) => updateCell(r, "invoice_number", v)}
      />
    )),

    getColumnWithFilterAndPin(
      "payment_date",
      "Payment Received Date",
      (_, r) => (
        <EditableDateCell
          value={r.payment_date}
          onSave={(v) => updateCell(r, "payment_date", v)}
        />
      ),
    ),
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
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}>
          <h2 className="text-xl font-bold">Advertiser Account Overview</h2>

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
            <Button
              type="primary"
              onClick={() => {
                setData((prev) => [
                  {
                    tempId: Date.now(),
                    adv_id: "",
                    month,
                    isNew: true,
                    is_manual: 1,
                  },
                  ...prev,
                ]);
              }}>
              Add New Details
            </Button>
          </div>
        </div>

        <Spin spinning={loading}>
          <StyledTable
            rowKey={(r) => `${r.id}`}
            columns={columns}
            dataSource={filteredData}
            bordered
            scroll={{ x: "max-content" }}
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
