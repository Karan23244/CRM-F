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
  Checkbox,
} from "antd";
import axios from "axios";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import StyledTable from "../../Utils/StyledTable";
import { nanoid } from "nanoid";
import { FilterFilled } from "@ant-design/icons";

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
const EditableCampaignCell = ({ row, record, onChange, disabled }) => {
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
    onChange(record, local);
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

export default function BillingAdvertiser({ selectedPubId, month }) {
  const autosaveTimer = useRef(null);
  const { user } = useSelector((s) => s.auth);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsIndex, setDetailsIndex] = useState(null);
  const [publishers, setPublishers] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsRowId, setDetailsRowId] = useState(null);
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [pidFilters, setPidFilters] = useState({});
  const isLocked = rows.some((r) => r.status === "locked");
  console.log("Fetched Billing Data:", rows);
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "Pending";
    return String(val).trim();
  };
  const updateCampaignComposite = (record, values) => {
    updateRowsSafely((prev) =>
      prev.map((row) =>
        (row.billing_id || row._tmp_id) ===
        (record.billing_id || record._tmp_id)
          ? { ...row, ...values }
          : row,
      ),
    );
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    const res = await axios.post(`${API}/billing/dropdowns`, {
      roles: user.role,
      user_id: user.id,
    });
    setPublishers(res.data.publishers || []);
  };

  const fetchBilling = async () => {
    if (!selectedPubId || !month) return;
    setLoading(true);
    const res = await axios.post(`${API}/billing/publisher-old-data`, {
      id: selectedPubId,
      month,
    });
    console.log(res.data.data);
    setRows(
      (res.data.data || []).map((r) => ({
        ...r,
        _tmp_id: r.billing_id ? null : nanoid(),
      })),
    );

    setLoading(false);
  };
  useEffect(() => {
    if (selectedPubId && month) {
      fetchBilling();
    }
  }, [selectedPubId, month]);
  const triggerAutosave = (nextRows, previousRows) => {
    if (!selectedPubId || !month) return;

    clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(async () => {
      try {
        const res = await axios.post(`${API}/billing/publisher-save`, {
          pub_id: selectedPubId,
          month,
          data: nextRows,
        });
        console.log("Autosave Response:", res);
        // if (res.data?.success) {
        //   if (res.data.billingIdMap) {
        //     setRows((prev) =>
        //       prev.map((r) => {
        //         const match = res.data.billingIdMap.find(
        //           (b) =>
        //             (!r.billing_id && b.tmp_id === r._tmp_id) ||
        //             b.billing_id === r.billing_id,
        //         );

        //         return match ? { ...r, billing_id: match.billing_id } : r;
        //       }),
        //     );
        //   }
        // }
        if (res.data?.success) {
          setRows((prev) =>
            prev.map((r) => {
              // 1️⃣ Match billingIdMap (for new IDs)
              const idMatch = res.data.billingIdMap?.find(
                (b) =>
                  (!r.billing_id && b.tmp_id === r._tmp_id) ||
                  b.billing_id === r.billing_id,
              );

              // 2️⃣ Match updated row data
              const updatedMatch = res.data.data?.find(
                (d) => d.billing_id === (idMatch?.billing_id || r.billing_id),
              );

              return {
                ...r,
                ...(idMatch ? { billing_id: idMatch.billing_id } : {}),
                ...(updatedMatch || {}),
              };
            }),
          );
        }
      } catch (err) {
        console.log("SAVE ERROR:", err);

        // 🔥 ROLLBACK STATE
        if (previousRows) {
          console.log("Rolling back to previous state:", previousRows);
          setRows(previousRows);
        }

        Swal.fire({
          icon: "error",
          title: "Server Error",
          text:
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Internal Server Error (500)",
        });
      }
    }, 700);
  };
  const updateRowsSafely = (updater) => {
    setRows((prev) => {
      const previous = JSON.parse(JSON.stringify(prev)); // deep copy
      const updated = updater(prev);
      console.log("Updated Rows:", updated);
      console.log("Previous Rows:", previous);
      triggerAutosave(updated, previous);

      return updated;
    });
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
      console.log("PID Updated Rows:", copy);
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
              {
                _id: nanoid(), // ✅ unique id
                os: "",
                pid: "",
                total_no: null,
                deductions: null,
                approved_no: null,
              },
            ],
          }
        : r,
    );
    setRows(updated);
  };
  const addCampaign = () => {
    setRows((r) => [
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
      ...r,
    ]);
  };
  const activeRow = rows.find(
    (r) => (r.billing_id || r._tmp_id) === detailsRowId,
  );
  useEffect(() => {
    const valuesObj = {};

    const keys = [
      "campaign_name",
      "geo",
      "os",
      "payable_event",
      "pub_payout",
      "adv_total_number",
      "pub_apno",
      "payout_amount",
    ];

    keys.forEach((key) => {
      valuesObj[key] = [...new Set(rows.map((row) => normalize(row[key])))];
    });

    setUniqueValues(valuesObj);
  }, [rows]);
  useEffect(() => {
    if (!activeRow) return;

    const pidValues = {};
    const keys = ["os", "pid", "adv_total_number", "pub_apno", "payout_amount"];

    keys.forEach((key) => {
      pidValues[key] = [
        ...new Set((activeRow.pid_data || []).map((p) => normalize(p[key]))),
      ];
    });

    setUniqueValues((prev) => ({
      ...prev,
      ...pidValues,
    }));
  }, [activeRow]);

  const getColumnFilter = (dataIndex, isPid = false) => ({
    filterDropdown: () => {
      const allValues = uniqueValues[dataIndex] || [];

      const selectedValues = isPid
        ? (pidFilters[dataIndex] ?? allValues)
        : (filters[dataIndex] ?? allValues);

      const isFiltered = selectedValues.length !== allValues.length; // ✅ correct check

      const searchText = filterSearch[dataIndex] || "";

      const visibleValues = allValues.filter((val) =>
        val.toString().toLowerCase().includes(searchText.toLowerCase()),
      );

      const isAllSelected = selectedValues.length === allValues.length;
      const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

      const updateFilters = (next) => {
        if (isPid) {
          setPidFilters((prev) => ({
            ...prev,
            [dataIndex]: next,
          }));
        } else {
          setFilters((prev) => ({
            ...prev,
            [dataIndex]: next,
          }));
        }
      };

      return (
        <div
          className="w-[260px] rounded-xl"
          onClick={(e) => e.stopPropagation()}>
          {/* 🔍 Search */}
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

          {/* ☑ Select All */}
          <div className="px-3 py-2">
            <Checkbox
              indeterminate={isIndeterminate}
              checked={isAllSelected}
              onChange={(e) => {
                const checked = e.target.checked;

                if (checked) {
                  if (isPid) {
                    setPidFilters((prev) => {
                      const updated = { ...prev };
                      delete updated[dataIndex];
                      return updated;
                    });
                  } else {
                    setFilters((prev) => {
                      const updated = { ...prev };
                      delete updated[dataIndex];
                      return updated;
                    });
                  }
                } else {
                  updateFilters([]);
                }
              }}>
              Select All
            </Checkbox>
          </div>

          {/* 📋 Values */}
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

                    updateFilters(next);
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

    // ✅ THIS controls icon color
    filterIcon: () => {
      const allValues = uniqueValues[dataIndex] || [];

      const selectedValues = isPid
        ? (pidFilters[dataIndex] ?? allValues)
        : (filters[dataIndex] ?? allValues);

      const isFiltered = selectedValues.length !== allValues.length;

      return (
        <FilterFilled
          style={{
            color: isFiltered ? "#1677ff" : "#bfbfbf",
          }}
        />
      );
    },
  });
  const filteredRows = rows.filter((row) => {
    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(normalize(row[key]));
    });
  });
  const columns = [
    {
      title: "Campaign",
      ...getColumnFilter("campaign_name"),
      render: (_, record) => (
        <EditableCampaignCell
          row={record}
          record={record}
          onChange={updateCampaignComposite}
          disabled={record.status === "locked"}
        />
      ),
    },
    {
      title: "Pub Payout",
      ...getColumnFilter("pub_payout"),
      width: 120,
      render: (_, record) => (
        <EditableCell
          value={record.pub_payout}
          onSave={(v) =>
            updateRowsSafely((prev) =>
              prev.map((row) =>
                (row.billing_id || row._tmp_id) ===
                (record.billing_id || record._tmp_id)
                  ? { ...row, pub_payout: v }
                  : row,
              ),
            )
          }
          disabled={record.status === "locked"}
        />
      ),
    },

    {
      title: "Payable Event",
      ...getColumnFilter("payable_event"),
      render: (_, record) => (
        <EditableTextCell
          value={record.payable_event}
          width={180}
          onSave={(v) =>
            updateRowsSafely((prev) =>
              prev.map((row) =>
                (row.billing_id || row._tmp_id) ===
                (record.billing_id || record._tmp_id)
                  ? { ...row, payable_event: v }
                  : row,
              ),
            )
          }
          disabled={record.status === "locked"}
        />
      ),
    },

    {
      title: "PUB Total",
      ...getColumnFilter("adv_total_number"),
      render: (_, row) => displayValue(row.adv_total_number),
    },
    {
      title: "PUB Approved",
      ...getColumnFilter("pub_apno"),
      render: (_, row) => displayValue(row.pub_apno),
    },
    {
      title: "Total Payout",
      ...getColumnFilter("payout_amount"),
      render: (_, row) => displayValue(row.payout_amount),
    },
    {
      title: "Details",
      render: (_, row) => (
        <Button
          size="small"
          type="link"
          onClick={() => {
            setDetailsRowId(row.billing_id || row._tmp_id);
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
                let billingId = row.billing_id;

                // 1️⃣ Ensure snapshot exists
                if (!billingId) {
                  const saveRes = await axios.post(
                    `${API}/billing/publisher-save`,
                    {
                      pub_id: selectedPubId,
                      month,
                      data: rows,
                    },
                  );
                  console.log("Save before verify:", saveRes);
                  if (saveRes.data?.billingIdMap) {
                    setRows((prev) =>
                      prev.map((r) => {
                        const match = saveRes.data.billingIdMap.find(
                          (b) =>
                            (!r.billing_id && b.tmp_id === r._tmp_id) ||
                            b.billing_id === r.billing_id,
                        );

                        if (match && r._tmp_id === row._tmp_id) {
                          billingId = match.billing_id;
                        }

                        return match
                          ? { ...r, billing_id: match.billing_id }
                          : r;
                      }),
                    );
                  }
                }

                // 2️⃣ Verify row
                const res = await axios.post(
                  `${API}/billing/publisher-verify-row`,
                  {
                    billing_id: billingId,
                  },
                );

                if (res.data?.success) {
                  Swal.fire({
                    icon: "success",
                    title: res.data.title || "Row Verified",
                    text: res.data.message || "Campaign verified successfully.",
                    timer: 1500,
                    showConfirmButton: false,
                  });

                  // ✅ Update row locally (NO refetch)
                  setRows((prev) =>
                    prev.map((r) =>
                      (r.billing_id || r._tmp_id) ===
                      (row.billing_id || row._tmp_id)
                        ? { ...r, status: "verified" }
                        : r,
                    ),
                  );
                } else {
                  Swal.fire({
                    icon: "error",
                    title: res.data.title || "Verification Failed",
                    text: res.data.message || "Unable to verify row.",
                  });
                }
              } catch (err) {
                Swal.fire({
                  icon: "error",
                  title: "Server Error",
                  text:
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Internal Server Error (500)",
                });
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
        // 1️⃣ Calculate from PID only
        const pubTotal = (row.pid_data || []).reduce(
          (sum, p) => sum + (Number(p.adv_total_number) || 0),
          0,
        );
        const pubApproved = (row.pid_data || []).reduce(
          (sum, p) => sum + (Number(p.pub_apno) || 0),
          0,
        );

        // 2️⃣ Calculate payout from approved * payout rate
        const payout =
          row.pub_payout && pubApproved
            ? pubApproved * Number(row.pub_payout)
            : 0;

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
                  <b>{totalPubTotal.toFixed(2)}</b>
                </Table.Summary.Cell>
              );
            }

            if (col.title === "PUB Approved") {
              return (
                <Table.Summary.Cell key={key} className="text-center">
                  <b>{totalPubApproved.toFixed(2)}</b>
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
  const publisherOptions = publishers?.map((publisher) => ({
    label: `${publisher.pub_id} (${publisher.pub_name})`,
    value: publisher.pub_id,
  }));

  const filteredPidData = (activeRow?.pid_data || []).filter((row) => {
    return Object.entries(pidFilters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(normalize(row[key]));
    });
  });
  const index = rows.findIndex(
    (r) => (r.billing_id || r._tmp_id) === detailsRowId,
  );
  return (
    <>
      <div className="p-5">
        {rows.length > 0 && (
          <div className="flex gap-3 mb-4 flex-wrap">
            <Button
              onClick={() => {
                setFilters({});
                setPidFilters({});
                setFilterSearch({});
              }}
              disabled={
                !Object.keys(filters).length && !Object.keys(pidFilters).length
              }>
              Clear Filters
            </Button>
          </div>
        )}

        {loading ? (
          <Spin />
        ) : (
          <>
            <StyledTable
              rowKey={(r) => r.billing_id || r._tmp_id}
              dataSource={filteredRows}
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
                    const res = await axios.post(
                      `${API}/billing/publisher-lock`,
                      {
                        pub_id: selectedPubId,
                        month,
                      },
                    );
                    console.log("LOCK RES:", res.data);
                    if (res.data?.success) {
                      Swal.fire({
                        icon: "success",
                        title: res.data.title || "Billing Closed",
                        text:
                          res.data.message || "Billing locked successfully.",
                      });

                      fetchBilling();
                    } else {
                      Swal.fire({
                        icon: "error",
                        title: res.data.title || "Lock Failed",
                        text: res.data.message || "Unable to lock billing.",
                      });
                    }
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
        key={detailsRowId}
        onCancel={() => {
          setDetailsOpen(false);
          setDetailsRowId(null);

          // ✅ reset PID filters
          setPidFilters({});
          setFilterSearch((prev) => {
            const updated = { ...prev };

            // remove only pid-related search keys (optional clean)
            [
              "os",
              "pid",
              "adv_total_number",
              "pub_apno",
              "payout_amount",
            ].forEach((k) => delete updated[k]);

            return updated;
          });
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
                  onClick={() => {
                    const index = rows.findIndex(
                      (r) => (r.billing_id || r._tmp_id) === detailsRowId,
                    );
                    addPid(index);
                  }}
                  disabled={activeRow.status === "locked"}>
                  + Add PID
                </Button>
              </div>

              <Table
                size="small"
                pagination={false}
                tableLayout="fixed"
                rowKey={(r, i) => `${r.pid}-${i}`}
                dataSource={filteredPidData}
                columns={[
                  {
                    title: "OS",
                    width: 180,
                    ...getColumnFilter("os", true),
                    render: (_, r, i) => (
                      <Select
                        size="small"
                        style={{ width: "100%" }}
                        value={r.os || undefined}
                        placeholder="Select OS"
                        disabled={activeRow.status === "locked"}
                        onChange={(v) => {
                          updateRowsSafely((prev) =>
                            prev.map((row) =>
                              (row.billing_id || row._tmp_id) === detailsRowId
                                ? {
                                    ...row,
                                    pid_data: row.pid_data.map((p, pIndex) =>
                                      pIndex === i ? { ...p, os: v } : p,
                                    ),
                                  }
                                : row,
                            ),
                          );
                        }}>
                        <Option value="Android">Android</Option>
                        <Option value="iOS">iOS</Option>
                      </Select>
                    ),
                  },
                  {
                    title: "PID",
                    width: 220,
                    ...getColumnFilter("pid", true),
                    render: (_, r, i) => (
                      <EditablePidCell
                        value={r.pid}
                        onCommit={(v) => {
                          updateRowsSafely((prev) =>
                            prev.map((row) =>
                              (row.billing_id || row._tmp_id) === detailsRowId
                                ? {
                                    ...row,
                                    pid_data: row.pid_data.map((p, pIndex) =>
                                      pIndex === i ? { ...p, pid: v } : p,
                                    ),
                                  }
                                : row,
                            ),
                          );
                        }}
                        disabled={activeRow.status === "locked"}
                      />
                    ),
                  },
                  {
                    title: "Total",
                    width: 90,
                    ...getColumnFilter("adv_total_number", true),
                    render: (_, r, i) => (
                      <EditableCell
                        value={r.adv_total_number}
                        onSave={(v) =>
                          updatePid(index, i, "adv_total_number", v)
                        }
                        disabled={activeRow.status === "locked"}
                      />
                    ),
                  },
                  {
                    title: "Approved",
                    width: 110,
                    ...getColumnFilter("pub_apno", true),
                    render: (_, r, i) => (
                      <EditableCell
                        value={r.pub_apno}
                        onSave={(v) => updatePid(index, i, "pub_apno", v)}
                        disabled={activeRow.status === "locked"}
                      />
                    ),
                  },
                  {
                    title: "Total Payout",
                    ...getColumnFilter("payout_amount", true),
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
