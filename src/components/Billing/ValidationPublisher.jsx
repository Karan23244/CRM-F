import { useEffect, useState, useRef, useCallback } from "react";
import {
  Select,
  DatePicker,
  Table,
  Button,
  Spin,
  Input,
  Modal,
  message,
} from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import StyledTable from "../../Utils/StyledTable";
import { nanoid } from "nanoid";
const { Option } = Select;
const API = import.meta.env.VITE_API_URL5;

const displayValue = (v) =>
  v === null || v === undefined ? "Pending" : Number(v) === 0 ? 0 : v;

const SummaryItem = ({ label, value, highlight, disabled }) => (
  <div
    className={`rounded-lg p-3 ${highlight ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border"} ${disabled ? "opacity-50" : ""}`}>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="text-sm font-semibold text-gray-800">{value}</div>
  </div>
);
const EditableCampaignCell = ({ row, rowIndex, onChange, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState({
    campaign_name: row.campaign_name || "",
    geo: row.geo || "",
    os: row.os || "",
  });

  useEffect(() => {
    setLocal({
      campaign_name: row.campaign_name || "",
      geo: row.geo || "",
      os: row.os || "",
    });
  }, [row]);

  const save = () => {
    setEditing(false);
    onChange(rowIndex, local);
  };

  if (!editing) {
    return (
      <div
        onClick={() => !disabled && setEditing(true)}
        className={`campaign-cell ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-100"}`}
        title={`${row.campaign_name} - ${row.geo} - ${row.os}`}>
        <span className="truncate">
          {row.campaign_name || "—"} <span className="text-gray-400">•</span>{" "}
          {row.geo || "—"} <span className="text-gray-400">•</span>{" "}
          {row.os || "—"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        size="small"
        placeholder="Campaign"
        value={local.campaign_name}
        onChange={(e) => setLocal({ ...local, campaign_name: e.target.value })}
        onPressEnter={save}
        onBlur={save}
      />
      <Input
        size="small"
        placeholder="Geo"
        value={local.geo}
        onChange={(e) => setLocal({ ...local, geo: e.target.value })}
        onPressEnter={save}
        onBlur={save}
        style={{ width: 80 }}
      />
      <Select
        mode="multiple"
        size="small"
        value={local.os ? local.os.split(",") : []}
        style={{ width: 160 }}
        onChange={(v) => setLocal({ ...local, os: v.join(",") })}
        onBlur={save}>
        <Option value="Android">Android</Option>
        <Option value="iOS">iOS</Option>
      </Select>
    </div>
  );
};
const EditableTextCell = ({
  value,
  onSave,
  width = 160,
  placeholder = "—",
  disabled,
}) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value || "");

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  const save = () => {
    setEditing(false);
    if (local !== value) {
      onSave(local.trim());
    }
  };

  return editing ? (
    <Input
      size="small"
      autoFocus
      value={local}
      style={{ width }}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={save}
      onPressEnter={save}
      disabled={disabled}
    />
  ) : (
    <div
      onClick={() => !disabled && setEditing(true)}
      style={{
        width,
        padding: "4px 6px",
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      title={value}>
      {value || placeholder}
    </div>
  );
};

const EditableCell = ({ value, onSave, width = 100, disabled }) => {
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
      autoFocus
      value={localValue}
      style={{ width }}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={save}
      onPressEnter={save}
    />
  ) : (
    <div
      onClick={() => !disabled && setEditing(true)}
      style={{
        minWidth: width,
        padding: "4px 6px",
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
      }}>
      {displayValue(value)}
    </div>
  );
};
const EditablePidCell = ({ value, onCommit }) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value || "");

  useEffect(() => {
    setLocal(value || "");
  }, [value]);

  if (!editing) {
    return (
      <div
        onClick={() => setEditing(true)}
        className="px-2 py-1 cursor-pointer hover:bg-gray-100 truncate"
        title={local}>
        {local || "—"}
      </div>
    );
  }

  return (
    <Input
      size="small"
      autoFocus
      value={local}
      style={{ width: 200 }}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onCommit(local);
      }}
      onPressEnter={() => {
        setEditing(false);
        onCommit(local);
      }}
    />
  );
};

export default function BillingAdvertiser() {
  const autosaveTimer = useRef(null);
  const { user } = useSelector((s) => s.auth);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsIndex, setDetailsIndex] = useState(null);
  const [publishers, setPublishers] = useState([]);
  const [selectedPubId, setSelectedPubId] = useState(null);
  const [month, setMonth] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const isLocked = rows.some((r) => r.status === "locked");
  const updateCampaignComposite = (rowIndex, values) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[rowIndex] = { ...copy[rowIndex], ...values };
      triggerAutosave(copy);
      return copy;
    });
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    const res = await axios.post(`${API}/billing/dropdowns`, {
      roles: user.role,
      user_id: user.id,
    });
    console.log(res.data.publishers);
    setPublishers(res.data.publishers || []);
  };

  const fetchBilling = async () => {
    if (!selectedPubId || !month) return;
    setLoading(true);
    const res = await axios.post(`${API}/billing/publisher-data`, {
      id: selectedPubId,
      month,
    });
    console.log(res.data.data);
    setRows(res.data.data || []);
    setLoading(false);
  };
  useEffect(() => {
    if (selectedPubId && month) {
      fetchBilling();
    }
  }, [selectedPubId, month]);
  const triggerAutosave = (nextRows) => {
    if (!selectedPubId || !month) return;

    clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(async () => {
      try {
        const res = await axios.post(`${API}/billing/publisher-save`, {
          pub_id: selectedPubId,
          month,
          data: nextRows,
        });

        if (res.data.billingIdMap) {
          setRows((prev) =>
            prev.map((r) => {
              const match = res.data.billingIdMap.find(
                (b) =>
                  (!r.billing_id && b.tmp_id === r._tmp_id) ||
                  b.billing_id === r.billing_id,
              );
              return match ? { ...r, billing_id: match.billing_id } : r;
            }),
          );
        }

        message.success("Autosaved", 0.6);
      } catch {
        message.error("Autosave failed");
      }
    }, 700);
  };

  const updatePid = (parentIndex, pidIndex, field, value) => {
    setRows((prev) => {
      const copy = prev.map((r, i) =>
        i === parentIndex
          ? {
              ...r,
              pid_data: r.pid_data.map((p, j) =>
                j === pidIndex ? { ...p, [field]: value } : p,
              ),
            }
          : r,
      );

      triggerAutosave(copy);
      return copy;
    });
  };

  const addPid = (parentIndex) => {
    const updated = rows.map((r, i) =>
      i === parentIndex
        ? {
            ...r,
            pid_data: [
              ...(r.pid_data || []),
              { pid: "", total_no: null, deductions: null, approved_no: null },
            ],
          }
        : r,
    );
    setRows(updated);
    triggerAutosave(updated);
  };

  const addCampaign = () => {
    setRows((r) => [
      ...r,
      {
        _tmp_id: nanoid(),
        campaign_name: "",
        geo: "",
        os: "",
        payable_event: "",
        payout_rate: 0,
        total_no: null,
        deductions: null,
        approved_no: null,
        pid_data: [],
      },
    ]);
  };

  const columns = [
    {
      title: "Campaign",
      render: (_, row, index) => (
        <EditableCampaignCell
          row={row}
          rowIndex={index}
          onChange={updateCampaignComposite}
          disabled={row.status === "locked"}
        />
      ),
    },
    {
      title: "Pub Payout",
      width: 120,
      render: (_, row, index) => (
        <EditableCell
          value={row.pub_payout}
          onSave={(v) =>
            setRows((prev) => {
              const copy = [...prev];
              copy[index].pub_payout = v;
              triggerAutosave(copy);
              return copy;
            })
          }
          disabled={row.status === "locked"}
        />
      ),
    },

    {
      title: "Payable Event",
      render: (_, row, index) => (
        <EditableTextCell
          value={row.payable_event}
          width={180}
          onSave={(v) =>
            setRows((prev) => {
              const copy = [...prev];
              copy[index].payable_event = v;
              triggerAutosave(copy);
              return copy;
            })
          }
          disabled={row.status === "locked"}
        />
      ),
    },

    {
      title: "PUB Total",
      render: (_, row) => displayValue(row.adv_total_number),
    },
    {
      title: "PUB Approved",
      render: (_, row) => displayValue(row.pub_apno),
    },
    {
      title: "Total Payout",
      render: (_, row) => displayValue(row.payout_amount),
    },

    {
      title: "Details",
      render: (_, __, index) => (
        <Button
          size="small"
          type="link"
          onClick={() => {
            setDetailsIndex(index);
            setDetailsOpen(true);
          }}>
          View
        </Button>
      ),
    },
    {
      title: "Status",
      width: 140,
      render: (_, row) =>
        row.status === "verified" ? (
          <span className="text-green-600 font-semibold">Verified</span>
        ) : (
          <Button
            size="small"
            disabled={row.status === "locked"}
            onClick={async () => {
              try {
                // 1️⃣ Ensure snapshot exists for this row
                if (!row.billing_id) {
                  await axios.post(`${API}/billing/publisher-save`, {
                    pub_id: selectedPubId,
                    month,
                    data: rows,
                  });
                }

                // 2️⃣ Verify row
                await axios.post(`${API}/billing/publisher-verify-row`, {
                  billing_id: row.billing_id,
                });

                message.success("Row verified");
                fetchBilling();
              } catch (err) {
                message.error("Failed to verify row");
              }
            }}>
            Verify
          </Button>
        ),
    },
  ];
  const tableSummary = useCallback(
    (pageData) => {
      let totalPubTotal = 0;
      let totalPubApproved = 0;
      let totalPubPayout = 0;

      pageData.forEach((row) => {
        const pubTotal =
          (Number(row.adv_total_number) || 0) +
          (row.pid_data || []).reduce(
            (s, p) => s + (Number(p.adv_total_number) || 0),
            0,
          );

        const pubApproved =
          (Number(row.pub_apno) || 0) +
          (row.pid_data || []).reduce(
            (s, p) => s + (Number(p.pub_apno) || 0),
            0,
          );

        const payout =
          row.pub_payout && pubApproved
            ? pubApproved * Number(row.pub_payout)
            : Number(row.payout_amount) || 0;

        totalPubTotal += pubTotal;
        totalPubApproved += pubApproved;
        totalPubPayout += payout;
      });

      return (
        <Table.Summary.Row>
          {columns.map((col, index) => {
            const key = col.dataIndex || `col-${index}`;

            if (col.title === "PUB Total") {
              return (
                <Table.Summary.Cell key={key} className="text-center">
                  <b>{totalPubTotal}</b>
                </Table.Summary.Cell>
              );
            }

            if (col.title === "PUB Approved") {
              return (
                <Table.Summary.Cell key={key} className="text-center">
                  <b>{totalPubApproved}</b>
                </Table.Summary.Cell>
              );
            }

            if (col.title === "Total Payout") {
              return (
                <Table.Summary.Cell key={key} className="text-center">
                  <b>{totalPubPayout.toFixed(2)}</b>
                </Table.Summary.Cell>
              );
            }

            return <Table.Summary.Cell key={key} />;
          })}
        </Table.Summary.Row>
      );
    },
    [columns],
  );

  const activeRow = detailsIndex !== null ? rows[detailsIndex] : null;

  return (
    <>
      <div className="p-5">
        <div className="flex gap-3 mb-4 flex-wrap">
          <Select
            showSearch
            placeholder="Select Publisher"
            style={{ width: 260 }}
            value={selectedPubId ?? undefined}
            optionFilterProp="children"
            filterOption={(input, option) =>
              option?.children?.toLowerCase().includes(input.toLowerCase())
            }
            filterSort={(optionA, optionB) =>
              optionA.children
                ?.toLowerCase()
                ?.localeCompare(optionB.children.toLowerCase())
            }
            onChange={(v) => {
              setSelectedPubId(v ?? null);
              setRows([]);
            }}>
            {publishers.map((a) => (
              <Select.Option key={a.pub_id} value={a.pub_id}>
                {a.pub_name}
              </Select.Option>
            ))}
          </Select>

          <DatePicker
            picker="month"
            onChange={(d, s) => {
              setMonth(s);
              setRows([]);
            }}
          />

          <Button
            onClick={addCampaign}
            disabled={!rows.length || !selectedPubId || !month || isLocked}>
            + Add Campaign
          </Button>
        </div>

        {loading ? (
          <Spin />
        ) : (
          <>
            <StyledTable
              rowKey={(r) => r.billing_id || r._tmp_id}
              dataSource={rows}
              columns={columns}
              summary={tableSummary}
            />
            <div className="flex justify-end mt-4">
              <Button
                danger
                disabled={!rows.length || !selectedPubId || !month || isLocked}
                onClick={async () => {
                  try {
                    const needsSnapshot = rows.some((r) => !r.billing_id);

                    // 1️⃣ Ensure snapshot exists
                    if (needsSnapshot) {
                      await axios.post(`${API}/billing/publisher-save`, {
                        pub_id: selectedPubId,
                        month,
                        data: rows,
                      });
                    }

                    // 2️⃣ Lock billing
                    await axios.post(`${API}/billing/publisher-lock`, {
                      pub_id: selectedPubId,
                      month,
                    });

                    message.success("Billing locked");
                    fetchBilling();
                  } catch (err) {
                    message.error("Failed to lock billing");
                  }
                }}>
                Close Billing
              </Button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={detailsOpen}
        onCancel={() => {
          setDetailsOpen(false);
          setDetailsIndex(null);
        }}
        footer={null}
        width={920}
        centered
        title={null}>
        {activeRow && (
          <>
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Campaign Details
                </h2>
                <p className="text-sm text-gray-500">
                  {activeRow.campaign_name} • {activeRow.geo} • {activeRow.os}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-4 gap-4 mb-6">
              <SummaryItem
                label="Payable Event"
                value={activeRow.payable_event}
              />
              <SummaryItem
                label="PUB Payout"
                value={`$${activeRow.pub_payout}`}
              />
              <SummaryItem
                label="Total Approved"
                value={displayValue(activeRow.pub_apno)}
              />
              <SummaryItem
                label="Total Payout"
                highlight
                value={displayValue(activeRow.payout_amount)}
              />
            </div>

            <div className="bg-white border rounded-lg p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  PID Breakdown
                </h3>
                <Button
                  size="small"
                  type="dashed"
                  onClick={() => addPid(detailsIndex)}
                  disabled={activeRow.status === "locked"}>
                  + Add PID
                </Button>
              </div>

              <Table
                size="small"
                pagination={false}
                tableLayout="fixed"
                rowKey={(r, i) => `${r.pid}-${i}`}
                dataSource={activeRow.pid_data || []}
                columns={[
                  {
                    title: "PID",
                    width: 220,
                    render: (_, r, i) => (
                      <EditablePidCell
                        value={r.pid}
                        onCommit={(v) => {
                          setRows((prev) => {
                            const copy = [...prev];
                            copy[detailsIndex].pid_data[i].pid = v;
                            triggerAutosave(copy);
                            return copy;
                          });
                        }}
                        disabled={activeRow.status === "locked"}
                      />
                    ),
                  },
                  {
                    title: "Total",
                    width: 90,
                    render: (_, r, i) => (
                      <EditableCell
                        value={r.adv_total_number}
                        onSave={(v) =>
                          updatePid(detailsIndex, i, "adv_total_number", v)
                        }
                        disabled={activeRow.status === "locked"}
                      />
                    ),
                  },
                  {
                    title: "Approved",
                    width: 110,
                    render: (_, r, i) => (
                      <EditableCell
                        value={r.pub_apno}
                        onSave={(v) =>
                          updatePid(detailsIndex, i, "pub_apno", v)
                        }
                        disabled={activeRow.status === "locked"}
                      />
                    ),
                  },
                  {
                    title: "Total Payout",
                    width: 120,
                    render: (_, r) =>
                      r.payout_amount == null
                        ? "Pending"
                        : displayValue(r.payout_amount),
                  },
                ]}
              />
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
