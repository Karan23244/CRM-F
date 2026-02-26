import { useEffect, useState, useCallback } from "react";
import { DatePicker, Table, Button, Spin, Modal } from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import StyledTable from "../../Utils/StyledTable";
const API = import.meta.env.VITE_API_URL5;

const displayValue = (v) =>
  v === null || v === undefined ? "Pending" : Number(v) === 0 ? 0 : v;

const SummaryItem = ({ label, value, highlight }) => (
  <div
    className={`rounded-lg p-3 ${
      highlight ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border"
    }`}>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="text-sm font-semibold text-gray-800">{value}</div>
  </div>
);

export default function PublisherExternalBilling() {
  const { user } = useSelector((s) => s.auth);

  const [month, setMonth] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsIndex, setDetailsIndex] = useState(null);

  const fetchBilling = async () => {
    if (!month) return;

    setLoading(true);
    const res = await axios.post(`${API}/billing/publisher-external-data`, {
      pubid: user.username,
      month,
    });

    setRows(res.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (month) fetchBilling();
  }, [month]);

  const columns = [
    {
      title: "Campaign",
      render: (_, r) => (
        <span title={`${r.campaign_name} • ${r.geo} • ${r.os}`}>
          {r.campaign_name} • {r.geo} • {r.os}
        </span>
      ),
    },
    {
      title: "Payable Event",
      dataIndex: "payable_event",
    },
    {
      title: "PUB Payout",
      dataIndex: "pub_payout",
    },
    {
      title: "PUB Total",
      render: (_, r) => displayValue(r.pub_total_no),
    },
    {
      title: "PUB Approved",
      render: (_, r) => displayValue(r.pub_approved_no),
    },
    {
      title: "Total Payout",
      render: (_, r) => displayValue(r.payout_amount),
    },
    {
      title: "Details",
      render: (_, __, i) => (
        <Button
          size="small"
          type="link"
          onClick={() => {
            setDetailsIndex(i);
            setDetailsOpen(true);
          }}>
          View
        </Button>
      ),
    },
    {
      title: "Status",
      render: (_, r) =>
        r.status === "verified" ? (
          <span className="text-green-600 font-semibold">Verified</span>
        ) : (
          <span className="text-orange-600 font-semibold">Locked</span>
        ),
    },
  ];

  const tableSummary = useCallback((pageData) => {
    let approved = 0;
    let payout = 0;

    pageData.forEach((r) => {
      if (r.status === "verified") {
        approved += Number(r.pub_approved_no || 0);
        payout += Number(r.payout_amount || 0);
      }
    });

    return (
      <Table.Summary.Row>
        <Table.Summary.Cell colSpan={4} />
        <Table.Summary.Cell className="text-center">
          <b>{approved}</b>
        </Table.Summary.Cell>
        <Table.Summary.Cell className="text-center">
          <b>{payout.toFixed(2)}</b>
        </Table.Summary.Cell>
        <Table.Summary.Cell colSpan={2} />
      </Table.Summary.Row>
    );
  }, []);

  const activeRow = detailsIndex !== null ? rows[detailsIndex] : null;

  return (
    <>
      <div className="p-5">
        <div className="flex gap-3 mb-4">
          <DatePicker
            picker="month"
            onChange={(_, s) => {
              setMonth(s);
              setRows([]);
            }}
          />
        </div>

        {loading ? (
          <Spin />
        ) : (
          <StyledTable
            rowKey={(r) => r.billing_id}
            dataSource={rows}
            columns={columns}
            summary={tableSummary}
          />
        )}
      </div>

      <Modal
        open={detailsOpen}
        onCancel={() => {
          setDetailsOpen(false);
          setDetailsIndex(null);
        }}
        footer={null}
        width={900}
        centered>
        {activeRow && (
          <>
            <div className="mb-4 border-b pb-3">
              <h2 className="text-lg font-semibold">
                {activeRow.campaign_name}
              </h2>
              <p className="text-sm text-gray-500">
                {activeRow.geo} • {activeRow.os}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <SummaryItem
                label="Payable Event"
                value={activeRow.payable_event}
              />
              <SummaryItem
                label="PUB Payout"
                value={`$${activeRow.pub_payout}`}
              />
              <SummaryItem
                label="Approved"
                value={displayValue(activeRow.pub_approved_no)}
              />
              <SummaryItem
                label="Total Payout"
                highlight
                value={displayValue(activeRow.payout_amount)}
              />
            </div>

            <Table
              size="small"
              pagination={false}
              dataSource={activeRow.pid_data || []}
              rowKey={(r, i) => `${r.pid}-${i}`}
              columns={[
                { title: "PID", dataIndex: "pid" },
                {
                  title: "Total",
                  render: (_, r) => displayValue(r.total_no),
                },
                {
                  title: "Approved",
                  render: (_, r) => displayValue(r.approved_no),
                },
                {
                  title: "Payout",
                  render: (_, r) => displayValue(r.payout_amount),
                },
              ]}
            />
          </>
        )}
      </Modal>
    </>
  );
}
