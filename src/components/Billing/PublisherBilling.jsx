import React, { useEffect, useState } from "react";
import { Tooltip, message, DatePicker, Spin, Tag } from "antd";
import dayjs from "dayjs";
import axios from "axios";
import StyledTable from "../../Utils/StyledTable";

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

  /* ============================= */
  /* TABLE COLUMNS (READ ONLY) */
  /* ============================= */

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
      render: (_, r) => displayValue(r.invoice_date),
    },

    {
      title: <div style={{ textAlign: "center" }}>Due Status</div>,
      render: (_, r) => <DueStatusCell record={r} />,
    },

    {
      title: <div style={{ textAlign: "center" }}>Invoice Received</div>,
      render: (_, r) => displayValue(r.invoice_number),
    },

    {
      title: <div style={{ textAlign: "center" }}>Invoice Amount Raised</div>,
      render: (_, r) =>
        displayValue(
          r.amount_paid !== null && r.amount_paid !== undefined
            ? Number(r.amount_paid).toFixed(2)
            : null,
        ),
    },

    {
      title: <div style={{ textAlign: "center" }}>Payment Status Date</div>,
      render: (_, r) => displayValue(r.payment_date),
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
