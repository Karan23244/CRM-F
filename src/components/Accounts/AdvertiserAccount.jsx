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
} from "antd";
import dayjs from "dayjs";
import axios from "axios";
import StyledTable from "../../Utils/StyledTable";
const { Option } = Select;
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
        transition: "0.2s",
      }}>
      {displayValue(value)}
    </div>
  );
};

/* ============================= */
/* Editable Number Cell */
/* ============================= */

const EditableNumberCell = ({ value, onSave, width = 100 }) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? "");

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  const save = () => {
    setEditing(false);
    if (localValue !== value) {
      onSave(localValue === "" ? null : Number(localValue));
    }
  };

  return editing ? (
    <Input
      size="small"
      type="number"
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
/* Main Component */
/* ============================= */

function AdvertiserAccount() {
  const currentMonth = dayjs().format("YYYY-MM");
  const [data, setData] = useState([]);
  const [month, setMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);

  /* Fetch Data */
  const fetchData = async (selectedMonth) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/advertiser/account`, {
        params: selectedMonth ? { month: selectedMonth } : {},
      });
      setData(res.data);
    } catch (err) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(month);
  }, [month]);

  /* Auto Save */
  const autoSaveRow = async (updatedRecord) => {
    console.log("Auto-saving", updatedRecord);
    try {
      await axios.put(`${API}/advertiser/account/update`, updatedRecord);
      message.success("Saved", 0.6);
    } catch (err) {
      message.error("Auto-save failed");
      fetchData(month);
    }
  };

  const updateCell = (record, key, value) => {
    const updated = { ...record, [key]: value };

    setData((prev) =>
      prev.map((row) =>
        row.adv_id === record.adv_id && row.month === record.month
          ? updated
          : row,
      ),
    );

    autoSaveRow({
      adv_id: record.adv_id,
      month: record.month,
      [key]: value,
    });
  };

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

        onSave("invoice_from", from);
        onSave("invoice_to", to);
      }}
      bordered={false}
      format="YYYY-MM-DD"
      style={{ width: 220 }}
    />
  );

  /* Table Columns */
  const columns = [
    {
      title: <div style={{ textAlign: "center" }}>Advid (Adv Name)</div>,
      render: (_, r) => (
        <Tooltip title={r.note || "No Legal Billing Address"}>
          <span style={{ color: "#1677ff", fontWeight: 500 }}>
            {r.adv_id} ({r.adv_name})
          </span>
        </Tooltip>
      ),
    },
    {
      title: <div style={{ textAlign: "center" }}>Month</div>,
      dataIndex: "month",
    },

    {
      title: <div style={{ textAlign: "center" }}>Payment Invoice Date</div>,
      render: (_, r) => (
        <EditableDateCell
          value={r.invoice_date}
          onSave={(v) => updateCell(r, "invoice_date", v)}
        />
      ),
    },

    {
      title: <div style={{ textAlign: "center" }}>Amount ($)</div>,
      render: (_, r) => <AmountUseCell record={r} />,
    },

    {
      title: <div style={{ textAlign: "center" }}>Due Status</div>,
      render: (_, r) => <DueStatusCell record={r} />,
    },

    {
      title: <div style={{ textAlign: "center" }}>Raise Invoice</div>,
      render: (_, r) => (
        <InvoiceRangeCell record={r} onSave={(k, v) => updateCell(r, k, v)} />
      ),
    },

    {
      title: <div style={{ textAlign: "center" }}>Amount Raised</div>,
      render: (_, r) => (
        <AmountRaisedCell record={r} onSave={(k, v) => updateCell(r, k, v)} />
      ),
    },

    {
      title: <div style={{ textAlign: "center" }}>Invoice</div>,
      render: (_, r) => (
        <EditableTextCell
          value={r.invoice_number}
          onSave={(v) => updateCell(r, "invoice_number", v)}
        />
      ),
    },

    {
      title: <div style={{ textAlign: "center" }}>Payment Status Date</div>,
      render: (_, r) => (
        <EditableDateCell
          value={r.payment_date}
          onSave={(v) => updateCell(r, "payment_date", v)}
        />
      ),
    },
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
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}>
          <h2 className="text-xl font-bold">Advertiser Account Overview</h2>

          <DatePicker
            picker="month"
            allowClear={false}
            value={dayjs(month)}
            onChange={(date) => setMonth(date.format("YYYY-MM"))}
            style={{
              borderRadius: 8,
              padding: "6px 10px",
            }}
          />
        </div>

        <Spin spinning={loading}>
          <StyledTable
            rowKey={(r) => `${r.adv_id}-${r.month}`}
            columns={columns}
            dataSource={data}
            bordered
            pagination={{ pageSize: 8 }}
          />
        </Spin>
      </div>
    </div>
  );
}

export default AdvertiserAccount;

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
      onMouseDown={(e) => e.stopPropagation()} // 🔥 IMPORTANT
    >
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
