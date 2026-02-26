import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Select,
  Tooltip,
  message,
  DatePicker,
  Spin,
  Tag,
} from "antd";
import dayjs from "dayjs";
import axios from "axios";
import StyledTable from "../../Utils/StyledTable";

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
  const [month, setMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);

  const fetchData = async (m) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/publisher/account`, {
        params: m ? { month: m } : {},
      });
      setData(res.data);
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

  const columns = [
    {
      title: <div style={{ textAlign: "center" }}>PubID (Publisher)</div>,
      render: (_, r) => (
        <Tooltip title={r.note || "No note"}>
          <span style={{ color: "#1677ff", fontWeight: 500 }}>
            {r.pub_id} ({r.pub_name})
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
      title: <div style={{ textAlign: "center" }}>System Amount (Use)</div>,
      render: (_, r) => <SystemAmountCell record={r} />,
    },

    {
      title: <div style={{ textAlign: "center" }}>Due Status</div>,
      render: (_, r) => <DueStatusCell record={r} />,
    },

    {
      title: <div style={{ textAlign: "center" }}>Invoice Received</div>,
      render: (_, r) => (
        <EditableTextCell
          value={r.invoice_number}
          onSave={(v) => updateCell(r, "invoice_number", v)}
        />
      ),
    },

    {
      title: <div style={{ textAlign: "center" }}>Invoice Amount Raised</div>,
      render: (_, r) => (
        <EditableNumberCell
          value={r.amount_paid}
          onSave={(v) => updateCell(r, "amount_paid", v)}
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
    <div style={{ padding: 24 }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 12 }}>
        <div
          style={{ display: "flex", justifyContent: "space-between" }}
          className="mb-5">
          <h2 className="text-xl font-bold">Publisher Account Overview</h2>
          <DatePicker
            picker="month"
            value={dayjs(month)}
            allowClear={false}
            onChange={(d) => setMonth(d.format("YYYY-MM"))}
          />
        </div>

        <Spin spinning={loading}>
          <StyledTable
            rowKey={(r) => `${r.pub_id}-${r.month}`}
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
