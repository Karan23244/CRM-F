import { useEffect, useState, useRef } from "react";
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
import Swal from "sweetalert2";
const { Option } = Select;
const API = import.meta.env.VITE_API_URL5;
const centerStyle = {
  textAlign: "center",
};
const displayValue = (v) =>
  v === null || v === undefined ? "Pending" : Number(v) === 0 ? 0 : v;

const SummaryItem = ({ label, value, highlight, disabled }) => (
  <div
    className={`rounded-lg p-3 ${
      highlight ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border"
    } ${disabled ? "opacity-50" : ""}`}>
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
    />
  ) : (
    <div
      onClick={() => !disabled && setEditing(true)}
      style={{
        width,
        padding: "4px 6px",
        cursor: "pointer",
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
        opacity: disabled ? 0.6 : 1,
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
  const [advertisers, setAdvertisers] = useState([]);
  const [selectedAdvId, setSelectedAdvId] = useState(null);
  const [month, setMonth] = useState(null);
  const [rows, setRows] = useState([]);
  const isLocked = rows.some((r) => r.status === "locked");
  const [loading, setLoading] = useState(false);
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
  useEffect(() => {
    if (selectedAdvId && month) {
      fetchBilling();
    }
  }, [selectedAdvId, month]);
  const fetchDropdowns = async () => {
    const res = await axios.post(`${API}/billing/dropdowns`, {
      roles: user.role,
      user_id: user.id,
    });
    setAdvertisers(res.data.advertisers || []);
  };

  const fetchBilling = async () => {
    if (!selectedAdvId || !month) return;
    setLoading(true);
    const res = await axios.post(`${API}/billing/advertiser-data`, {
      id: selectedAdvId,
      month,
    });
    console.log("Fetched billing data:", res.data); // Debug log
    setRows(res.data.data || []);
    setLoading(false);
  };
  const triggerAutosave = (nextRows) => {
    if (!selectedAdvId || !month) return;

    clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(async () => {
      try {
        const res = await axios.post(`${API}/billing/advertiser-save`, {
          adv_id: selectedAdvId,
          month,
          data: nextRows,
        });
        // SUCCESS CONDITION
        if (res.data?.success || res.data?.message) {
          await fetchBilling();

          if (res.data.rows) {
            setRows((prev) =>
              prev.map((r) => {
                const fresh = res.data.rows.find((f) => f.id === r.billing_id);
                if (!fresh) return r;

                return {
                  ...r,
                  billing_id: fresh.id,
                  total_no: fresh.total_no,
                  deductions: fresh.deductions,
                  approved_no: fresh.approved_no,
                  status: fresh.status,
                };
              }),
            );
          }

          Swal.fire({
            icon: "success",
            title: res.data.title || "Saved",
            text: res.data.message || "Changes saved successfully.",
            timer: 1200,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: res.data.title || "Save Failed",
            text: res.data.message || "Unable to save data.",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Server Error",
          text:
            err.response?.data?.message || "Something went wrong while saving.",
        });
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
      align: "center",
      render: (_, row, index) => (
        <div style={centerStyle}>
          <EditableCampaignCell
            row={row}
            rowIndex={index}
            onChange={updateCampaignComposite}
            disabled={isLocked}
          />
        </div>
      ),
    },
    {
      title: "Adv Payout",
      align: "center",
      render: (_, row, index) => (
        <div style={centerStyle}>
          <EditableCell
            value={row.adv_payout}
            onSave={(v) =>
              setRows((prev) => {
                const copy = [...prev];
                copy[index].adv_payout = v;
                triggerAutosave(copy);
                return copy;
              })
            }
            disabled={isLocked}
          />
        </div>
      ),
    },
    {
      title: "Payable Event",
      align: "center",
      render: (_, row, index) => (
        <div style={centerStyle}>
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
            disabled={isLocked}
          />
        </div>
      ),
    },
    {
      title: "Adv Total",
      align: "center",
      render: (_, row) => (
        <div style={centerStyle}>{displayValue(row.total_no)}</div>
      ),
    },
    {
      title: "Deduction",
      align: "center",
      render: (_, row) => (
        <div style={centerStyle}>{displayValue(row.deductions)}</div>
      ),
    },
    {
      title: "Approved",
      align: "center",
      render: (_, row) => (
        <div style={centerStyle}>{displayValue(row.approved_no)}</div>
      ),
    },
    {
      title: "Total Payout",
      align: "center",
      render: (_, row) => (
        <div style={centerStyle}>
          {row.approved_no == null
            ? "Pending"
            : (row.approved_no * row.adv_payout).toFixed(2)}
        </div>
      ),
    },
    {
      title: "Details",
      align: "center",
      render: (_, __, index) => (
        <div style={centerStyle}>
          <Button
            size="small"
            type="link"
            onClick={() => {
              setDetailsIndex(index);
              setDetailsOpen(true);
            }}>
            View
          </Button>
        </div>
      ),
    },
  ];

  const activeRow = detailsIndex !== null ? rows[detailsIndex] : null;

  return (
    <>
      <div className="p-5">
        <div className="flex gap-3 mb-4 flex-wrap">
          <Select
            showSearch
            placeholder="Select Advertiser"
            style={{ width: 260 }}
            value={selectedAdvId ?? undefined}
            optionFilterProp="children"
            filterOption={(input, option) =>
              option?.children?.toLowerCase().includes(input.toLowerCase())
            }
            filterSort={(optionA, optionB) =>
              optionA.children
                .toLowerCase()
                .localeCompare(optionB.children.toLowerCase())
            }
            onChange={(v) => {
              setSelectedAdvId(v ?? null);
              setRows([]);
            }}>
            {advertisers.map((a) => (
              <Select.Option key={a.adv_id} value={a.adv_id}>
                {a.adv_name}
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
            disabled={!rows.length || !selectedAdvId || !month || isLocked}
            onClick={addCampaign}>
            + Add Campaign
          </Button>
        </div>

        {loading ? (
          <Spin />
        ) : (
          <>
            <StyledTable
              rowKey={(r) =>
                r.billing_id ||
                r._tmp_id ||
                `${r.campaign_name}-${r.geo}-${r.os}-${r.adv_payout}`
              }
              dataSource={rows}
              columns={columns}
              summary={() => {
                const totalAdv = rows.reduce(
                  (sum, r) => sum + (Number(r.total_no) || 0),
                  0,
                );
                const totalDeduction = rows.reduce(
                  (sum, r) => sum + (Number(r.deductions) || 0),
                  0,
                );
                const totalApproved = rows.reduce(
                  (sum, r) => sum + (Number(r.approved_no) || 0),
                  0,
                );
                const totalPayout = rows.reduce(
                  (sum, r) =>
                    sum +
                    (r.approved_no && r.adv_payout
                      ? r.approved_no * r.adv_payout
                      : 0),
                  0,
                );

                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: "#fafafa" }}>
                      <Table.Summary.Cell index={0} colSpan={3} align="center">
                        <strong>Total</strong>
                      </Table.Summary.Cell>

                      <Table.Summary.Cell index={3} align="center">
                        <strong>{totalAdv.toFixed(2)}</strong>
                      </Table.Summary.Cell>

                      <Table.Summary.Cell index={4} align="center">
                        <strong>{totalDeduction.toFixed(2)}</strong>
                      </Table.Summary.Cell>

                      <Table.Summary.Cell index={5} align="center">
                        <strong>{totalApproved.toFixed(2)}</strong>
                      </Table.Summary.Cell>

                      <Table.Summary.Cell index={6} align="center">
                        <strong>{totalPayout.toFixed(2)}</strong>
                      </Table.Summary.Cell>

                      <Table.Summary.Cell index={7} />
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />

            <div className="flex justify-end mt-4">
              <Button
                danger
                type="primary"
                disabled={!rows.length || !selectedAdvId || !month || isLocked}
                onClick={async () => {
                  const result = await Swal.fire({
                    title: "Close Billing?",
                    text: "Once closed, billing cannot be edited.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, Close",
                    cancelButtonText: "Cancel",
                    confirmButtonColor: "#d33",
                  });

                  if (!result.isConfirmed) return;

                  try {
                    // 1️⃣ Force snapshot if needed
                    const needsSnapshot = rows.some((r) => !r.billing_id);

                    if (needsSnapshot) {
                      await axios.post(`${API}/billing/advertiser-save`, {
                        adv_id: selectedAdvId,
                        month,
                        data: rows,
                      });
                    }

                    // 2️⃣ Lock billing
                    const res = await axios.post(
                      `${API}/billing/advertiser-lock`,
                      {
                        adv_id: selectedAdvId,
                        month,
                      },
                    );

                    if (res.data?.affected === 0 && !res.data?.created) {
                      Swal.fire(
                        "Nothing locked",
                        "No rows were updated",
                        "warning",
                      );
                      return;
                    }

                    Swal.fire("Locked!", "Billing has been closed.", "success");
                    fetchBilling();
                  } catch (err) {
                    console.log("SAVE ERROR:", err);

                    Swal.fire({
                      icon: "error",
                      title: "Server Error",
                      text:
                        err.response?.data?.message || // backend message
                        err.response?.data?.error || // sometimes error key
                        "Internal Server Error (500)",
                    });
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
                label="Adv Payout"
                value={`$${activeRow.adv_payout}`}
              />
              <SummaryItem
                label="Total Approved"
                value={displayValue(activeRow.approved_no)}
              />
              <SummaryItem
                highlight
                label="Total Payout"
                value={
                  activeRow.approved_no == null
                    ? "Pending"
                    : `$${(activeRow.approved_no * activeRow.adv_payout).toFixed(2)}`
                }
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
                        value={r.total_no}
                        onSave={(v) =>
                          updatePid(detailsIndex, i, "total_no", v)
                        }
                        disabled={activeRow.status === "locked"}
                      />
                    ),
                  },
                  {
                    title: "Deductions",
                    width: 110,
                    render: (_, r, i) => (
                      <EditableCell
                        value={r.deductions}
                        onSave={(v) =>
                          updatePid(detailsIndex, i, "deductions", v)
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
                        value={r.approved_no}
                        onSave={(v) =>
                          updatePid(detailsIndex, i, "approved_no", v)
                        }
                        disabled={activeRow.status === "locked"}
                      />
                    ),
                  },
                  {
                    title: "Total Payout",
                    width: 120,
                    render: (_, r) =>
                      r.approved_no == null
                        ? "Pending"
                        : (r.approved_no * activeRow.adv_payout).toFixed(2),
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
