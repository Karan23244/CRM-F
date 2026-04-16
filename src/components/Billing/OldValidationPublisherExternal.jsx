import { useEffect, useState } from "react";
import {
  DatePicker,
  Table,
  Button,
  Modal,
  Tag,
  Spin,
  Input,
  Checkbox,
} from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import { FilterFilled } from "@ant-design/icons";
import { nanoid } from "nanoid";
import StyledTable from "../../Utils/StyledTable";


const API = import.meta.env.VITE_API_URL5;

// helper → always return 0 if empty
const safeNum = (v) => Number(v || 0);

export default function PublisherExternalBilling({pubid, month}) {
    console.log("Rendering old PublisherExternalBilling with pubid:", pubid, "and month:", month);
  const { user } = useSelector((s) => s.auth);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [pidFilters, setPidFilters] = useState({});
  const normalize = (val) =>
    val === null || val === undefined || val === ""
      ? "Pending"
      : String(val).trim();
  // ─────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────
  const fetchBilling = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/billing/old-publisher-external-data`, {
        pubid: pubid,
        month,
      });
      console.log("Raw old API response:", res.data);
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

      const finalRows = Array.from(map.values()).map((r) => {
        const total = (r.pid_data || []).reduce(
          (s, p) => s + safeNum(p.adv_total_no),
          0,
        );

        const approved = (r.pid_data || []).reduce(
          (s, p) => s + safeNum(p.pub_Apno),
          0,
        );

        const payout = (r.pid_data || []).reduce(
          (s, p) => s + safeNum(p.payout_amount),
          0,
        );

        return {
          ...r,
          os: Array.from(r.osSet).join(", "),
          adv_total_no: total,
          pub_Apno: approved,
          total_payout: payout,
        };
      });

      setRows(finalRows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const keys = [
      "campaign_name",
      "geo",
      "os",
      "vertical",
      "payable_event",
      "pay_out",
      "adv_total_no",
      "pub_Apno",
      "total_payout",
    ];

    const obj = {};

    keys.forEach((k) => {
      obj[k] = [...new Set(rows.map((r) => normalize(r[k])))];
    });

    setUniqueValues(obj);
  }, [rows]);
  useEffect(() => {
    if (!activeRow) return;

    const keys = ["os", "pid", "adv_total_no", "pub_Apno"];

    const obj = {};

    keys.forEach((k) => {
      obj[k] = [
        ...new Set((activeRow.pid_data || []).map((p) => normalize(p[k]))),
      ];
    });

    setUniqueValues((prev) => ({ ...prev, ...obj }));
  }, [activeRow]);
  useEffect(() => {
    if (month) fetchBilling();
  }, [month]);

  const getColumnFilter = (dataIndex, isPid = false) => ({
    filterDropdown: () => {
      const allValues = uniqueValues[dataIndex] || [];
      const selected = isPid
        ? (pidFilters[dataIndex] ?? allValues)
        : (filters[dataIndex] ?? allValues);
      const search = filterSearch[dataIndex] || "";
      const visible = allValues.filter((v) =>
        v.toString().toLowerCase().includes(search.toLowerCase()),
      );
      const isAll = selected.length === allValues.length;
      const isIndet = selected.length > 0 && !isAll;

      const update = (next) =>
        isPid
          ? setPidFilters((p) => ({ ...p, [dataIndex]: next }))
          : setFilters((p) => ({ ...p, [dataIndex]: next }));

      const clearKey = () =>
        isPid
          ? setPidFilters((p) => {
              const c = { ...p };
              delete c[dataIndex];
              return c;
            })
          : setFilters((p) => {
              const c = { ...p };
              delete c[dataIndex];
              return c;
            });

      return (
        <div
          className="w-[260px] rounded-xl"
          onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white p-2 border-b">
            <Input
              allowClear
              placeholder="Search values"
              value={search}
              onChange={(e) =>
                setFilterSearch((p) => ({
                  ...p,
                  [dataIndex]: e.target.value,
                }))
              }
            />
          </div>
          <div className="px-3 py-2">
            <Checkbox
              indeterminate={isIndet}
              checked={isAll}
              onChange={(e) => (e.target.checked ? clearKey() : update([]))}>
              Select All
            </Checkbox>
          </div>
          <div className="max-h-[220px] overflow-y-auto px-2 pb-2 space-y-1">
            {visible.map((val) => (
              <label
                key={val}
                className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-blue-50">
                <Checkbox
                  checked={selected.includes(val)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, val]
                      : selected.filter((v) => v !== val);
                    update(next);
                  }}
                />
                <span className="truncate">{val}</span>
              </label>
            ))}
            {visible.length === 0 && (
              <div className="py-4 text-center text-gray-400 text-sm">
                No matching values
              </div>
            )}
          </div>
        </div>
      );
    },
    filterIcon: () => {
      const allValues = uniqueValues[dataIndex] || [];
      const selected = isPid
        ? (pidFilters[dataIndex] ?? allValues)
        : (filters[dataIndex] ?? allValues);
      return (
        <FilterFilled
          style={{
            color: selected.length !== allValues.length ? "#1677ff" : "#bfbfbf",
          }}
        />
      );
    },
  });
  const filteredRows = rows.filter((row) =>
    Object.entries(filters).every(([k, vals]) => {
      if (!vals || vals.length === 0) return true;
      return vals.includes(normalize(row[k]));
    }),
  );
  // ─────────────────────────────────────────────
  // TABLE COLUMNS
  // ─────────────────────────────────────────────
  const columns = [
    {
      title: "Campaign",
      ...getColumnFilter("campaign_name"),
      render: (_, r) => (
        <span>
          {r.campaign_name || "—"} • {r.geo || "—"} • {r.os || "—"}
        </span>
      ),
    },
    {
      title: "Vertical",
      dataIndex: "vertical",
      ...getColumnFilter("vertical"),
      render: (v) => v || "—",
    },
    {
      title: "Payable Event",
      dataIndex: "payable_event",
      ...getColumnFilter("payable_event"),
    },
    {
      title: "Payout Rate",
      dataIndex: "pay_out",
      ...getColumnFilter("pay_out"),
      render: (v) => `$${safeNum(v).toFixed(2)}`,
    },

    // ✅ FIXED TOTALS (derived from pid_data)
    {
      title: "PUB Total",
      ...getColumnFilter("adv_total_no"),
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
      ...getColumnFilter("pub_Apno"),
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
      ...getColumnFilter("total_payout"),
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
          <Button
            onClick={() => {
              setFilters({});
              setFilterSearch({});
            }}>
            Clear Filters
          </Button>
        </div>

          <StyledTable
            rowKey={(r) => r._tmp_id}
            dataSource={filteredRows}
            columns={columns}
            summary={summary}
          />
      </div>

      {/* MODAL */}
      <Modal
        open={detailsOpen}
        onCancel={() => {
          setDetailsOpen(false);
          setActiveRow(null);
          setPidFilters({});
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
                {
                  title: "OS",
                  dataIndex: "os",
                  ...getColumnFilter("os", true),
                },
                {
                  title: "PID",
                  dataIndex: "pid",
                  ...getColumnFilter("pid", true),
                },
                {
                  title: "Total",
                  ...getColumnFilter("adv_total_no", true),
                  render: (_, r) => safeNum(r.adv_total_no),
                },
                {
                  title: "Approved",
                  ...getColumnFilter("pub_Apno", true),
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
