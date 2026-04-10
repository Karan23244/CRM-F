import { useEffect, useState } from "react";
import { DatePicker, Table, Button, Modal, Tag, Spin } from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import { nanoid } from "nanoid";
import StyledTable from "../../Utils/StyledTable";

const API = import.meta.env.VITE_API_URL5;

// helper → always return 0 if empty
const safeNum = (v) => Number(v || 0);

export default function PublisherExternalBilling() {
  const { user } = useSelector((s) => s.auth);

  const [month, setMonth] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);

  const [filters, setFilters] = useState({});

  // ─────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────
  const fetchBilling = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/billing/publisher-external-data`, {
        pubid: 361,
        month,
      });

      const flat = res.data.data || [];
      const map = new Map();

      flat.forEach((row) => {
        const key = [
          row.campaign_name,
          row.geo,
          row.vertical,
          row.payable_event,
          Number(row.pay_out || 0),
        ].join("|");

        if (!map.has(key)) {
          map.set(key, {
            _tmp_id: nanoid(),
            campaign_name: row.campaign_name,
            geo: row.geo,
            vertical: row.vertical,
            payable_event: row.payable_event,
            pay_out: safeNum(row.pay_out),

            osSet: new Set(),

            pid_data: [],
          });
        }

        const group = map.get(key);

        if (row.os) group.osSet.add(row.os);

        const adv = safeNum(row.adv_total_no);
        const apno = safeNum(row.pub_Apno);
        const payout = safeNum(row.pay_out);

        group.pid_data.push({
          adv_data_id: row.adv_data_id,
          pid: row.pid,
          os: row.os,
          adv_total_no: adv,
          pub_Apno: apno,
          payout_amount: apno * payout,
        });
      });

      const finalRows = Array.from(map.values()).map((r) => ({
        ...r,
        os: Array.from(r.osSet).join(", "),
      }));

      setRows(finalRows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (month) fetchBilling();
  }, [month]);

  // ─────────────────────────────────────────────
  // FILTER
  // ─────────────────────────────────────────────
  const filteredRows = rows.filter((row) =>
    Object.entries(filters).every(([key, val]) => {
      if (!val) return true;
      return row[key] === val;
    }),
  );

  // ─────────────────────────────────────────────
  // TABLE COLUMNS
  // ─────────────────────────────────────────────
  const columns = [
    {
      title: "Campaign",
      render: (_, r) => (
        <span>
          {r.campaign_name || "—"} • {r.geo || "—"} • {r.os || "—"}
        </span>
      ),
    },
    {
      title: "Vertical",
      dataIndex: "vertical",
      render: (v) => v || "—",
    },
    {
      title: "Payable Event",
      dataIndex: "payable_event",
      render: (v) => v || "—",
    },
    {
      title: "Payout Rate",
      dataIndex: "pay_out",
      render: (v) => `$${safeNum(v).toFixed(2)}`,
    },

    // ✅ FIXED TOTALS (derived from pid_data)
    {
      title: "PUB Total",
      render: (_, row) => {
        const total = (row.pid_data || []).reduce(
          (s, p) => s + safeNum(p.adv_total_no),
          0,
        );
        return total.toFixed(2);
      },
    },
    {
      title: "PUB Approved",
      render: (_, row) => {
        const approved = (row.pid_data || []).reduce(
          (s, p) => s + safeNum(p.pub_Apno),
          0,
        );
        return approved.toFixed(2);
      },
    },
    {
      title: "Total Payout",
      render: (_, row) => {
        const payout = (row.pid_data || []).reduce(
          (s, p) => s + safeNum(p.payout_amount),
          0,
        );
        return `$${payout.toFixed(2)}`;
      },
    },

    {
      title: "Details",
      render: (_, row) => (
        <Button
          type="link"
          onClick={() => {
            setActiveRow(row);
            setDetailsOpen(true);
          }}>
          View
        </Button>
      ),
    },
  ];

  // ─────────────────────────────────────────────
  // SUMMARY FIXED
  // ─────────────────────────────────────────────
  const summary = (pageData) => {
    let totalNo = 0,
      totalApproved = 0,
      totalPayout = 0;

    pageData.forEach((row) => {
      totalNo += (row.pid_data || []).reduce(
        (s, p) => s + safeNum(p.adv_total_no),
        0,
      );

      totalApproved += (row.pid_data || []).reduce(
        (s, p) => s + safeNum(p.pub_Apno),
        0,
      );

      totalPayout += (row.pid_data || []).reduce(
        (s, p) => s + safeNum(p.payout_amount),
        0,
      );
    });

    return (
      <Table.Summary.Row>
        <Table.Summary.Cell colSpan={4}>
          <b>Total</b>
        </Table.Summary.Cell>
        <Table.Summary.Cell>
          <b>{totalNo.toFixed(2)}</b>
        </Table.Summary.Cell>
        <Table.Summary.Cell>
          <b>{totalApproved.toFixed(2)}</b>
        </Table.Summary.Cell>
        <Table.Summary.Cell>
          <b>${totalPayout.toFixed(2)}</b>
        </Table.Summary.Cell>
        <Table.Summary.Cell />
      </Table.Summary.Row>
    );
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <>
      <div className="p-5">
        <div className="flex gap-3 mb-4">
          <DatePicker picker="month" onChange={(_, s) => setMonth(s)} />
          <Button onClick={() => setFilters({})}>Clear Filters</Button>
        </div>

        {loading ? (
          <Spin />
        ) : (
          <StyledTable
            rowKey={(r) => r._tmp_id}
            dataSource={filteredRows}
            columns={columns}
            summary={summary}
          />
        )}
      </div>

      {/* MODAL */}
      <Modal
        open={detailsOpen}
        onCancel={() => {
          setDetailsOpen(false);
          setActiveRow(null);
        }}
        footer={null}
        width={900}>
        {activeRow && (
          <>
            <h2 className="text-lg font-semibold mb-2">
              {activeRow.campaign_name}
            </h2>

            <p className="text-gray-500 mb-4">
              {activeRow.geo} • {activeRow.os}
            </p>

            <StyledTable
              size="small"
              pagination={false}
              rowKey={(r, i) => i}
              dataSource={activeRow.pid_data || []}
              columns={[
                { title: "OS", dataIndex: "os" },
                { title: "PID", dataIndex: "pid" },
                {
                  title: "Total",
                  render: (_, r) => safeNum(r.adv_total_no),
                },
                {
                  title: "Approved",
                  render: (_, r) => safeNum(r.pub_Apno),
                },
                {
                  title: "Payout",
                  render: (_, r) => `$${safeNum(r.payout_amount).toFixed(2)}`,
                },
                {
                  title: "Status",
                  render: () => <Tag color="green">Verified</Tag>,
                },
              ]}
            />
          </>
        )}
      </Modal>
    </>
  );
}
