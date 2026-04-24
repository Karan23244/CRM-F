import { useEffect, useState, useCallback } from "react";
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
  Tag,
} from "antd";
import axios from "axios";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import StyledTable from "../../Utils/StyledTable";
import { nanoid } from "nanoid";
import { FilterFilled, LockFilled } from "@ant-design/icons";
import OldValidationPublisher from "./OldValidationPublisher";
const { Option } = Select;
const API = import.meta.env.VITE_API_URL5;
const isPidLocked = (p, billingLocked) =>
  billingLocked || p.status === "verified" || p.status === "locked";

const isCampaignLocked = (row, billingLocked) =>
  billingLocked ||
  (row.pid_data || []).some(
    (p) => p.status === "verified" || p.status === "locked",
  );
const displayValue = (v) =>
  v === null || v === undefined ? "Pending" : Number(v) === 0 ? 0 : v;

// ─────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────
const SummaryItem = ({ label, value, highlight }) => (
  <div
    className={`rounded-lg p-3 ${
      highlight ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border"
    }`}>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="text-sm font-semibold text-gray-800">{value}</div>
  </div>
);

// ─────────────────────────────────────────────
// Editable cells — local state only, zero DB writes
// ─────────────────────────────────────────────
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
        className={`campaign-cell ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-gray-100"
        }`}
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

  useEffect(() => setLocal(value || ""), [value]);

  const save = () => {
    setEditing(false);
    if (local !== value) onSave(local.trim());
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

  useEffect(() => setLocalValue(value ?? ""), [value]);

  const save = () => {
    setEditing(false);
    if (localValue !== value)
      onSave(localValue === "" ? null : Number(localValue));
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

const EditablePidCell = ({ value, onCommit, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value || "");

  useEffect(() => setLocal(value || ""), [value]);

  if (!editing) {
    return (
      <div
        onClick={() => !disabled && setEditing(true)}
        className={`px-2 py-1 truncate ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-gray-100"
        }`}
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

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function BillingAdvertiser() {
  const { user } = useSelector((s) => s.auth);

  const [publishers, setPublishers] = useState([]);
  const [selectedPubId, setSelectedPubId] = useState(null);
  const [month, setMonth] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [billingLocked, setBillingLocked] = useState(false);

  // modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRowId, setDetailsRowId] = useState(null);

  // filters
  const [filters, setFilters] = useState({});
  const [pidFilters, setPidFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const isNewBilling = (month) => {
    if (!month) return false;

    const selected = new Date(month + "-01");
    const cutoff = new Date("2026-02-01");

    return selected >= cutoff; // 🔥 reversed
  };
  const isOld = isNewBilling(month);
  const allDataLocked =
    rows.length > 0 &&
    rows.every(
      (r) =>
        (r.pid_data || []).length > 0 &&
        (r.pid_data || []).every((p) => p.status === "locked"),
    );
  // ── helpers ───────────────────────────────────
  const normalize = (val) =>
    val === null || val === undefined || val === ""
      ? "Pending"
      : String(val).trim();

  // true only when every campaign has ≥1 PID and all are verified
  const allPidsVerified =
    rows.length > 0 &&
    rows.every(
      (r) =>
        (r.pid_data || []).length > 0 &&
        (r.pid_data || []).every((p) => p.status === "verified"),
    );
  // ── dropdowns ─────────────────────────────────
  useEffect(() => {
    axios
      .post(`${API}/billing/dropdowns`, {
        roles: user.role,
        user_id: user.id,
      })
      .then((r) => setPublishers(r.data.publishers || []));
  }, []);

  // ── fetch & group flat rows by campaign_id ────
  // const fetchBilling = async () => {
  //   if (!selectedPubId || !month) return;
  //   setLoading(true);
  //   try {
  //     const res = await axios.post(`${API}/billing/publisher-data`, {
  //       id: selectedPubId,
  //       month,
  //     });
  //     console.log("Raw billing data:", res.data);
  //     const flat = res.data.data || [];
  //     const locked = res.data.billing_locked || false;
  //     setBillingLocked(locked);

  //     const map = new Map();

  //     flat.forEach((row) => {
  //       const key = [
  //         row.campaign_name,
  //         row.geo,
  //         row.vertical,
  //         row.payable_event,
  //         Number(row.pay_out || 0),
  //       ].join("|");

  //       if (!map.has(key)) {
  //         map.set(key, {
  //           _tmp_id: nanoid(),
  //           campaign_name: row.campaign_name,
  //           geo: row.geo,
  //           vertical: row.vertical,
  //           payable_event: row.payable_event,
  //           pay_out: Number(row.pay_out || 0),

  //           osSet: new Set(), // ✅ important

  //           adv_total_number: 0,
  //           pub_apno: 0,
  //           payout_amount: 0,

  //           pid_data: [],
  //         });
  //       }

  //       const group = map.get(key);

  //       // ✅ collect OS
  //       if (row.os) group.osSet.add(row.os);

  //       const adv = Number(row.adv_total_no || 0);
  //       const apno = Number(row.pub_Apno || 0);
  //       const payout = Number(row.pay_out || 0);

  //       group.adv_total_number += adv;
  //       group.pub_apno += apno;
  //       group.payout_amount += apno * payout;

  //       group.pid_data.push({
  //         adv_data_id: row.adv_data_id,
  //         pid: row.pid,
  //         os: row.os,
  //         adv_total_no: adv,
  //         pub_Apno: apno,
  //         payout_amount: apno * payout,
  //         status: row.status,
  //       });
  //     });

  //     const finalRows = Array.from(map.values()).map((r) => ({
  //       ...r,
  //       os: Array.from(r.osSet).join(", "), // 🔥 final OS output
  //       adv_total_number: Number(r.adv_total_number.toFixed(2)),
  //       pub_apno: Number(r.pub_apno.toFixed(2)),
  //       payout_amount: Number(r.payout_amount.toFixed(2)),
  //     }));

  //     setRows(finalRows);
  //   } catch (err) {
  //     console.error("fetchBilling error:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const getValidNumber = (val) => {
    return val === null || val === undefined || val === "" ? null : Number(val);
  };

  const isValid = (val) => val !== null && val !== undefined && val !== "";

  const fetchBilling = async () => {
    if (!selectedPubId || !month) return;

    setLoading(true);

    try {
      const res = await axios.post(`${API}/billing/publisher-data`, {
        id: selectedPubId,
        month,
      });

      console.log("Raw billing data:", res.data);

      const flat = res.data.data || [];
      const locked = res.data.billing_locked || false;

      setBillingLocked(locked);

      const map = new Map();

      flat.forEach((row) => {
        const payoutVal = getValidNumber(row.pay_out);

        const key = [
          row.campaign_name,
          row.geo,
          row.vertical,
          row.payable_event,
          payoutVal ?? "NA", // ✅ prevents null & 0 mixing
        ].join("|");

        if (!map.has(key)) {
          map.set(key, {
            _tmp_id: nanoid(),
            campaign_name: row.campaign_name,
            geo: row.geo,
            vertical: row.vertical,
            payable_event: row.payable_event,
            pay_out: payoutVal,

            osSet: new Set(),

            adv_total_number: 0,
            pub_apno: 0,
            payout_amount: 0,

            pid_data: [],
          });
        }

        const group = map.get(key);

        // ✅ Collect OS
        if (row.os) group.osSet.add(row.os);

        const adv = getValidNumber(row.adv_total_no);
        const apno = getValidNumber(row.pub_Apno);
        const payout = payoutVal;

        // ✅ Only add valid values
        if (isValid(adv)) group.adv_total_number += adv;
        if (isValid(apno)) group.pub_apno += apno;

        if (isValid(apno) && isValid(payout)) {
          group.payout_amount += apno * payout;
        }

        group.pid_data.push({
          adv_data_id: row.adv_data_id,
          pid: row.pid,
          os: row.os,
          adv_total_no: adv,
          pub_Apno: apno,
          payout_amount:
            isValid(apno) && isValid(payout) ? apno * payout : null,
          status: row.status,
        });
      });

      const finalRows = Array.from(map.values()).map((r) => ({
        ...r,
        os: Array.from(r.osSet).join(", "),
        adv_total_number: Number(r.adv_total_number.toFixed(2)),
        pub_apno: Number(r.pub_apno.toFixed(2)),
        payout_amount: Number(r.payout_amount.toFixed(2)),
        adv_total_no: Number(r.adv_total_number.toFixed(2)),
        pub_Apno: Number(r.pub_apno.toFixed(2)),
        total_payout: Number(r.payout_amount.toFixed(2)),
      }));
      console.log("Processed billing rows:", finalRows);
      setRows(finalRows);
    } catch (err) {
      console.error("fetchBilling error:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (selectedPubId && month) fetchBilling();
  }, [selectedPubId, month]);

  // ── active modal row ───────────────────────────
  const activeRow = rows.find((r) => r._tmp_id === detailsRowId);
  const activeIndex = rows.findIndex((r) => r._tmp_id === detailsRowId);

  // ── unique filter values ───────────────────────
  useEffect(() => {
    const keys = [
      "campaign_name",
      "geo",
      "os",
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

  // ── local state updaters (no DB write) ────────
  const updateCampaignComposite = (record, values) => {
    setRows((prev) =>
      prev.map((r) => (r._tmp_id === record._tmp_id ? { ...r, ...values } : r)),
    );
  };

  // const updateCampaignField = (tmpId, field, value) => {
  //   setRows((prev) =>
  //     prev.map((r) => (r._tmp_id === tmpId ? { ...r, [field]: value } : r)),
  //   );
  // };

  // const updatePidField = (parentIdx, pidIdx, field, value) => {
  //   setRows((prev) =>
  //     prev.map((r, i) =>
  //       i === parentIdx
  //         ? {
  //             ...r,
  //             pid_data: r.pid_data.map((p, j) =>
  //               j === pidIdx ? { ...p, [field]: value } : p,
  //             ),
  //           }
  //         : r,
  //     ),
  //   );
  // };

  const updateCampaignField = (tmpId, field, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._tmp_id !== tmpId) return r;

        const updated = { ...r, [field]: value };

        // 🔥 If payout changed → recalc totals
        if (field === "pay_out") {
          let payout_amount = 0;

          (updated.pid_data || []).forEach((p) => {
            const apno = Number(p.pub_Apno) || 0;
            payout_amount += apno * (Number(value) || 0);
          });

          updated.payout_amount = payout_amount;
          updated.total_payout = payout_amount;
        }

        return updated;
      }),
    );
  };
  const updatePidField = (parentIdx, pidIdx, field, value) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== parentIdx) return r;

        const updatedPidData = r.pid_data.map((p, j) =>
          j === pidIdx ? { ...p, [field]: value } : p,
        );

        // 🔥 RECALCULATE TOTALS
        let adv_total_number = 0;
        let pub_apno = 0;
        let payout_amount = 0;

        updatedPidData.forEach((p) => {
          const adv = Number(p.adv_total_no) || 0;
          const apno = Number(p.pub_Apno) || 0;
          const payout = Number(r.pay_out) || 0;

          adv_total_number += adv;
          pub_apno += apno;
          payout_amount += apno * payout;
        });

        return {
          ...r,
          pid_data: updatedPidData,
          adv_total_number,
          pub_apno,
          payout_amount,

          // keep aliases in sync
          adv_total_no: adv_total_number,
          pub_Apno: pub_apno,
          total_payout: payout_amount,
        };
      }),
    );
  };
  const addCampaign = () => {
    setRows((prev) => [
      {
        _tmp_id: nanoid(),
        campaign_id: "",
        campaign_name: "",
        geo: "",
        os: "",
        payable_event: "",
        pay_out: null,
        vertical: "",
        pid_data: [],
      },
      ...prev,
    ]);
  };

  const addPid = (parentIndex) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === parentIndex
          ? {
              ...r,
              pid_data: [
                ...(r.pid_data || []),
                {
                  _tmp_id: nanoid(),
                  adv_data_id: null,
                  pid: "",
                  os: "",
                  adv_total_no: null,
                  pub_Apno: null,
                  status: "unverified",
                },
              ],
            }
          : r,
      ),
    );
  };

  // ── verify one PID → writes to pub_data_verified ─
  const verifyPid = async (pidRow, campaignRow, pidIndex, parentIndex) => {
    // ── REMOVED: the adv_data_id guard that was blocking new PIDs
    try {
      const res = await axios.post(`${API}/billing/publisher-verify-pid`, {
        adv_data_id: pidRow.adv_data_id || null, // null for manually added PIDs
        pid: pidRow.pid,
        campaign_id: campaignRow.campaign_id,
        pub_id: pidRow.pub_id || selectedPubId,
        shared_date: pidRow.shared_date || month + "-01", // fallback date for new PIDs
        campaign_name: campaignRow.campaign_name,
        geo: campaignRow.geo,
        os: pidRow.os,
        payable_event: campaignRow.payable_event,
        pay_out: campaignRow.pay_out,
        adv_total_no: pidRow.adv_total_no,
        pub_Apno: pidRow.pub_Apno,
        vertical: campaignRow.vertical,
        billing_month: month,
      });

      if (res.data?.success) {
        // ── flip status locally + store insertId for future re-verifies
        setRows((prev) =>
          prev.map((r, i) =>
            i === parentIndex
              ? {
                  ...r,
                  pid_data: r.pid_data.map((p, j) =>
                    j === pidIndex
                      ? {
                          ...p,
                          status: "verified",
                          // ── NEW: store the db id so a re-verify uses ON DUPLICATE KEY UPDATE
                          adv_data_id:
                            p.adv_data_id ?? res.data.insertId ?? null,
                        }
                      : p,
                  ),
                }
              : r,
          ),
        );
        message.success(`PID "${pidRow.pid}" verified ✔`);
      } else {
        Swal.fire({
          icon: "error",
          title: res.data.title || "Verification Failed",
          text: res.data.message || "Unable to verify.",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: err.response?.data?.message || "Internal Server Error (500)",
      });
    }
  };
  // ── lock entire billing ────────────────────────
  const lockBilling = async () => {
    try {
      const res = await axios.post(`${API}/billing/publisher-lock`, {
        pub_id: selectedPubId,
        month,
      });

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Billing Closed",
          text: "Billing has been locked successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        setBillingLocked(true);
        setRows((prev) =>
          prev.map((r) => ({
            ...r,
            status: "locked",
            pid_data: (r.pid_data || []).map((p) => ({
              ...p,
              status: "locked",
            })),
          })),
        );
      } else {
        Swal.fire({
          icon: "error",
          title: res.data.title || "Lock Failed",
          text: res.data.message || "Unable to lock billing.",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: err.response?.data?.message || "Internal Server Error (500)",
      });
    }
  };
  //verify all PIDs at once
  const verifyAllPidsForRow = async (row, rowIndex) => {
    console.log("Verifying all PIDs for row:", row.pid_data);
    const unverified = (row.pid_data || []).filter(
      (p) => p.status !== "verified" && p.status !== "locked",
    );

    if (!unverified.length) {
      Swal.fire({
        icon: "info",
        title: "Nothing to Verify",
        text: "All PIDs already verified.",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: `Verify ${unverified.length} PIDs?`,
      text: `Campaign: ${row.campaign_name}`,
      showCancelButton: true,
      confirmButtonText: "Yes, Verify All",
      confirmButtonColor: "#1677ff",
    });

    if (!confirm.isConfirmed) return;

    // 🔥 Loader
    Swal.fire({
      title: "Verifying...",
      text: `Processing ${unverified.length} PIDs`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const responses = await Promise.all(
        unverified.map(async (pidRow) => {
          const res = await axios.post(`${API}/billing/publisher-verify-pid`, {
            adv_data_id: pidRow.adv_data_id || null,
            pid: pidRow.pid,
            campaign_id: row.campaign_id,
            pub_id: pidRow.pub_id || selectedPubId,
            shared_date: pidRow.shared_date || month + "-01",
            campaign_name: row.campaign_name,
            geo: row.geo,
            os: pidRow.os,
            payable_event: row.payable_event,
            pay_out: row.pay_out,
            adv_total_no: pidRow.adv_total_no,
            pub_Apno: pidRow.pub_Apno,
            vertical: row.vertical,
            billing_month: month,
          });

          return {
            pid: pidRow.pid,
            insertId: res.data?.insertId,
          };
        }),
      );

      const map = new Map(responses.map((r) => [r.pid, r.insertId]));

      // ✅ Update state
      setRows((prev) =>
        prev.map((r, i) => {
          if (i !== rowIndex) return r;

          return {
            ...r,
            pid_data: r.pid_data.map((p) => {
              if (p.status === "verified" || p.status === "locked") return p;

              return {
                ...p,
                status: "verified",
                adv_data_id: p.adv_data_id ?? map.get(p.pid) ?? null,
              };
            }),
          };
        }),
      );

      Swal.fire({
        icon: "success",
        title: "Done",
        text: `${unverified.length} PIDs verified`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err.response?.data?.message || "Something went wrong",
      });
    }
  };
  // ── column filter helper ──────────────────────
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

  // ── filtered data ──────────────────────────────
  const filteredRows = rows.filter((row) =>
    Object.entries(filters).every(([k, vals]) => {
      if (!vals || vals.length === 0) return true;
      return vals.includes(normalize(row[k]));
    }),
  );

  const filteredPidData = (activeRow?.pid_data || []).filter((row) =>
    Object.entries(pidFilters).every(([k, vals]) => {
      if (!vals || vals.length === 0) return true;
      return vals.includes(normalize(row[k]));
    }),
  );

  // ── campaign table columns ────────────────────
  const columns = [
    {
      title: "Campaign",
      ...getColumnFilter("campaign_name"),
      render: (_, record) => (
        <EditableCampaignCell
          row={record}
          record={record}
          onChange={updateCampaignComposite}
          disabled={isCampaignLocked(record, billingLocked)}
        />
      ),
    },
    {
      title: "Pub Payout",
      ...getColumnFilter("pay_out"),
      width: 120,
      render: (_, record) => (
        <EditableCell
          value={record.pay_out}
          disabled={isCampaignLocked(record, billingLocked)}
          onSave={(v) => updateCampaignField(record._tmp_id, "pay_out", v)}
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
          disabled={isCampaignLocked(record, billingLocked)}
          onSave={(v) =>
            updateCampaignField(record._tmp_id, "payable_event", v)
          }
        />
      ),
    },
    {
      title: "PUB Total",
      ...getColumnFilter("adv_total_no"),
      render: (_, row) => displayValue(row.adv_total_no),
    },
    {
      title: "PUB Approved",
      ...getColumnFilter("pub_Apno"),
      render: (_, row) => displayValue(row.pub_Apno),
    },
    {
      title: "Total Payout",
      ...getColumnFilter("total_payout"),
      render: (_, row) => {
        if (row.total_payout == null) return "Pending";
        return row.total_payout.toFixed(2);
      },
    },
    {
      title: "Details",
      width: 80,
      render: (_, row) => (
        <Button
          size="small"
          type="link"
          onClick={() => {
            setDetailsRowId(row._tmp_id);
            setDetailsOpen(true);
          }}>
          View
        </Button>
      ),
    },
    {
      title: "Status",
      width: 155,
      render: (_, row) => {
        if (billingLocked || row.status === "locked")
          return (
            <Tag icon={<LockFilled />} color="red">
              Locked
            </Tag>
          );

        const total = (row.pid_data || []).length;

        const verified = (row.pid_data || []).filter(
          (p) => p.status === "verified",
        ).length;

        const locked = (row.pid_data || []).filter(
          (p) => p.status === "locked",
        ).length;

        const completed = verified + locked;

        if (total === 0) return <Tag color="default">No PIDs</Tag>;

        // ✅ ALL DONE (verified + locked)
        if (completed === total) return <Tag color="green">All Verified</Tag>;

        return (
          <Tag color="orange">
            {completed}/{total} Verified
          </Tag>
        );
      },
    },
  ];

  // ── table summary row ─────────────────────────
  const tableSummary = useCallback(
    (pageData) => {
      let totalNo = 0,
        totalApproved = 0,
        totalPayout = 0;

      pageData.forEach((row) => {
        const no = (row.pid_data || []).reduce(
          (s, p) => s + (Number(p.adv_total_no) || 0),
          0,
        );
        const approved = (row.pid_data || []).reduce(
          (s, p) => s + (Number(p.pub_Apno) || 0),
          0,
        );
        totalNo += no;
        totalApproved += approved;
        totalPayout +=
          approved && row.pay_out ? approved * Number(row.pay_out) : 0;
      });

      return (
        <Table.Summary.Row>
          {columns.map((col, idx) => {
            const key = `sum-${idx}`;
            if (col.title === "PUB Total")
              return (
                <Table.Summary.Cell key={key} className="text-center">
                  <b>{totalNo.toFixed(2)}</b>
                </Table.Summary.Cell>
              );
            if (col.title === "PUB Approved")
              return (
                <Table.Summary.Cell key={key} className="text-center">
                  <b>{totalApproved.toFixed(2)}</b>
                </Table.Summary.Cell>
              );
            if (col.title === "Total Payout")
              return (
                <Table.Summary.Cell key={key} className="text-center">
                  <b>{totalPayout.toFixed(2)}</b>
                </Table.Summary.Cell>
              );
            return <Table.Summary.Cell key={key} />;
          })}
        </Table.Summary.Row>
      );
    },
    [columns],
  );

  const resetFilters = () => {
    setFilters({});
    setPidFilters({});
    setFilterSearch({});
  };

  const publisherOptions = (publishers || []).map((p) => ({
    label: `${p.pub_id} (${p.pub_name})`,
    value: p.pub_id,
  }));
  console.log(isOld);
  // ── render ─────────────────────────────────────
  return (
    <>
      <div className="p-5">
        {/* toolbar */}
        <div className="flex gap-3 mb-4 flex-wrap items-center">
          <Select
            showSearch
            placeholder="Select Publisher"
            style={{ width: 260 }}
            value={selectedPubId ?? undefined}
            options={publisherOptions}
            optionFilterProp="label"
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            filterSort={(a, b) =>
              a?.label?.toLowerCase().localeCompare(b?.label?.toLowerCase())
            }
            onChange={(v) => {
              setSelectedPubId(v ?? null);
              setRows([]);
              setBillingLocked(false);
              resetFilters();
            }}
          />

          <DatePicker
            picker="month"
            onChange={(_, s) => {
              setMonth(s);
              setRows([]);
              setBillingLocked(false);
              resetFilters();
            }}
          />
          {isOld ? (
            <>
              <Button
                onClick={addCampaign}
                disabled={
                  !selectedPubId || !month || billingLocked || allDataLocked
                }>
                + Add Campaign
              </Button>
              <Button
                type="primary"
                disabled={billingLocked || allDataLocked}
                onClick={async () => {
                  for (let i = 0; i < rows.length; i++) {
                    await verifyAllPidsForRow(rows[i], i);
                  }
                }}>
                Verify All
              </Button>
              <Button
                onClick={resetFilters}
                disabled={
                  !Object.keys(filters).length &&
                  !Object.keys(pidFilters).length
                }>
                Clear Filters
              </Button>

              {/* live billing lock badge */}
              {rows.length > 0 &&
                (allDataLocked ? (
                  <Tag
                    icon={<LockFilled />}
                    color="red"
                    style={{ fontSize: 13, padding: "4px 10px" }}>
                    Billing Locked
                  </Tag>
                ) : allPidsVerified ? (
                  <Tag
                    color="green"
                    style={{ fontSize: 13, padding: "4px 10px" }}>
                    ✔ All PIDs Verified — Ready to Close
                  </Tag>
                ) : (
                  <Tag
                    color="orange"
                    style={{ fontSize: 13, padding: "4px 10px" }}>
                    Pending Verification
                  </Tag>
                ))}
            </>
          ) : (
            <></>
          )}
        </div>
        {isOld ? (
          <>
            <StyledTable
              rowKey={(r) => r._tmp_id}
              dataSource={filteredRows}
              columns={columns}
              summary={tableSummary}
            />

            {/* Close Billing — enabled only when every PID is verified */}
            <div className="flex justify-end mt-4">
              <Button
                danger
                disabled={!allPidsVerified || billingLocked || !rows.length}
                title={
                  billingLocked
                    ? "Billing already locked"
                    : !allPidsVerified
                      ? "Verify all PIDs before closing billing"
                      : "Lock billing permanently"
                }
                onClick={() =>
                  Swal.fire({
                    icon: "warning",
                    title: "Close Billing?",
                    text: "This will lock all verified PIDs permanently and cannot be undone.",
                    showCancelButton: true,
                    confirmButtonText: "Yes, Lock It",
                    confirmButtonColor: "#d33",
                  }).then((result) => {
                    if (result.isConfirmed) lockBilling();
                  })
                }>
                {billingLocked ? (
                  <>
                    <LockFilled className="mr-1" /> Billing Closed
                  </>
                ) : (
                  "Close Billing"
                )}
              </Button>
            </div>
          </>
        ) : (
          <OldValidationPublisher selectedPubId={selectedPubId} month={month} />
        )}
      </div>

      {/* PID detail modal */}
      <Modal
        open={detailsOpen}
        key={detailsRowId}
        onCancel={() => {
          setDetailsOpen(false);
          setDetailsRowId(null);
          setPidFilters({});
          setFilterSearch((prev) => {
            const updated = { ...prev };
            ["os", "pid", "adv_total_no", "pub_Apno"].forEach(
              (k) => delete updated[k],
            );
            return updated;
          });
        }}
        footer={null}
        width={960}
        centered
        title={null}>
        {activeRow && (
          <>
            {/* header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Campaign Details
                </h2>
                <p className="text-sm text-gray-500">
                  {activeRow.campaign_name} • {activeRow.geo} • {activeRow.os}
                </p>
              </div>
              {billingLocked && (
                <Tag icon={<LockFilled />} color="red">
                  Billing Locked
                </Tag>
              )}
            </div>

            {/* summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <SummaryItem
                label="Payable Event"
                value={activeRow.payable_event || "—"}
              />
              <SummaryItem
                label="Pub Payout"
                value={activeRow.pay_out ? `$${activeRow.pay_out}` : "—"}
              />
              <SummaryItem
                label="Total Approved"
                value={displayValue(
                  (activeRow.pid_data || []).reduce(
                    (s, p) => s + (Number(p.pub_Apno) || 0),
                    0,
                  ),
                )}
              />
              <SummaryItem
                highlight
                label="Total Payout"
                value={(() => {
                  const approved = (activeRow.pid_data || []).reduce(
                    (s, p) => s + (Number(p.pub_Apno) || 0),
                    0,
                  );
                  if (approved == null || activeRow.pay_out == null)
                    return "Pending";
                  return `$${(approved * Number(activeRow.pay_out)).toFixed(
                    2,
                  )}`;
                })()}
              />
            </div>

            {/* PID breakdown */}
            <div className="bg-white border rounded-lg p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  PID Breakdown
                </h3>
                <Button
                  size="small"
                  type="dashed"
                  disabled={allDataLocked}
                  onClick={() => addPid(activeIndex)}>
                  + Add PID
                </Button>
              </div>

              <Table
                size="small"
                pagination={false}
                tableLayout="fixed"
                rowKey={(r, i) => r.adv_data_id || r._tmp_id || `${r.pid}-${i}`}
                dataSource={filteredPidData}
                rowClassName={(r) =>
                  r.status === "verified" || r.status === "locked"
                    ? "bg-green-50"
                    : ""
                }
                columns={[
                  {
                    title: "OS",
                    width: 150,
                    ...getColumnFilter("os", true),
                    render: (_, r, i) => (
                      <Select
                        size="small"
                        style={{ width: "100%" }}
                        value={r.os || undefined}
                        placeholder="Select OS"
                        disabled={
                          billingLocked ||
                          r.status === "verified" ||
                          r.status === "locked"
                        }
                        onChange={(v) =>
                          updatePidField(activeIndex, i, "os", v)
                        }>
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
                        disabled={
                          billingLocked ||
                          r.status === "verified" ||
                          r.status === "locked"
                        }
                        onCommit={(v) =>
                          updatePidField(activeIndex, i, "pid", v)
                        }
                      />
                    ),
                  },
                  {
                    title: "Total",
                    width: 100,
                    ...getColumnFilter("adv_total_no", true),
                    render: (_, r, i) => (
                      <EditableCell
                        value={r.adv_total_no}
                        disabled={
                          billingLocked ||
                          r.status === "verified" ||
                          r.status === "locked"
                        }
                        onSave={(v) =>
                          updatePidField(activeIndex, i, "adv_total_no", v)
                        }
                      />
                    ),
                  },
                  {
                    title: "Approved",
                    width: 110,
                    ...getColumnFilter("pub_Apno", true),
                    render: (_, r, i) => (
                      <EditableCell
                        value={r.pub_Apno}
                        disabled={
                          billingLocked ||
                          r.status === "verified" ||
                          r.status === "locked"
                        }
                        onSave={(v) =>
                          updatePidField(activeIndex, i, "pub_Apno", v)
                        }
                      />
                    ),
                  },
                  {
                    title: "Total Payout",
                    width: 120,
                    render: (_, r) => {
                      if (r.pub_Apno == null || activeRow.pay_out == null)
                        return "Pending";
                      return `$${(
                        Number(r.pub_Apno) * Number(activeRow.pay_out)
                      ).toFixed(2)}`;
                    },
                  },
                  {
                    title: "Action",
                    width: 110,
                    render: (_, r, i) => {
                      if (billingLocked || r.status === "locked")
                        return (
                          <Tag icon={<LockFilled />} color="red">
                            Locked
                          </Tag>
                        );
                      if (r.status === "verified")
                        return <Tag color="green">✔ Verified</Tag>;
                      return (
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          onClick={() =>
                            verifyPid(r, activeRow, i, activeIndex)
                          }>
                          Verify
                        </Button>
                      );
                    },
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
