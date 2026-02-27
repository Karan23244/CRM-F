import React, { useEffect, useState } from "react";
import { Table, Tooltip, message, DatePicker, Tag, Spin } from "antd";
import dayjs from "dayjs";
import axios from "axios";
import StyledTable from "../../Utils/StyledTable";

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

  /* ============================= */
  /* Table Columns (READ ONLY) */
  /* ============================= */

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
      title: <div style={{ textAlign: "center" }}>Amount ($)</div>,
      render: (_, r) => <AmountUseCell record={r} />,
    },
    {
      title: <div style={{ textAlign: "center" }}>Due Status</div>,
      render: (_, r) => <DueStatusCell record={r} />,
    },
    {
      title: <div style={{ textAlign: "center" }}>Invoice</div>,
      render: (_, r) => displayValue(r.invoice_number),
    },
    {
      title: <div style={{ textAlign: "center" }}>Payment Status Date</div>,
      render: (_, r) => displayValue(r.payment_date),
    },
        {
      title: <div style={{ textAlign: "center" }}>Payment Recive Date</div>,
      render: (_, r) => displayValue(r.payment_receive_date),
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
