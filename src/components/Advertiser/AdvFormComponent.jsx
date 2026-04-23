import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Table, Select, Button, Space, Input, Tooltip, Checkbox } from "antd";
import { useSelector } from "react-redux";
import geoData from "../../Data/geoData.json";
import SubAdminAdvnameData from "./SubAdminAdvnameData";
import {
  SearchOutlined,
  UserOutlined,
  DatabaseOutlined,
  EditOutlined,
} from "@ant-design/icons";
import StyledTable from "../../Utils/StyledTable";

const apiUrl = import.meta.env.VITE_API_URL;

const AdvertiserIDDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState("yourData");
  const showAssignPubTab = user?.role?.includes("advertiser_manager");
  const [billingDetails, setBillingDetails] = useState([]);

  const emptyBilling = () => ({
    legal_name: "",
    billing_address: "",
    tax_type: "",
    tax_id: "",
  });
  const addBillingEntry = () =>
    setBillingDetails((prev) => [...prev, emptyBilling()]);
  const removeBillingEntry = (index) =>
    setBillingDetails((prev) => prev.filter((_, i) => i !== index));
  const updateBillingEntry = (index, field, value) =>
    setBillingDetails((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2F5D99] mb-4 md:mb-0">
          Advertiser Dashboard
        </h2>
      </div>
      {showAssignPubTab && (
        <div className="flex flex-wrap gap-3 mb-6 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <Button
            icon={<UserOutlined />}
            type="default"
            onClick={() => setActiveTab("yourData")}
            className={`!rounded-lg !px-6 !py-2 !text-base font-semibold ${
              activeTab === "yourData"
                ? "!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !border-none !shadow-md"
                : "!bg-gray-100 hover:!bg-gray-200 !text-[#2F5D99]"
            }`}>
            Your Data
          </Button>
          <Button
            icon={<DatabaseOutlined />}
            type="default"
            onClick={() => setActiveTab("assignPub")}
            className={`!rounded-lg !px-6 !py-2 !text-base font-semibold ${
              activeTab === "assignPub"
                ? "!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !border-none !shadow-md"
                : "!bg-gray-100 hover:!bg-gray-200 !text-[#2F5D99]"
            }`}>
            Assign Adv Data
          </Button>
        </div>
      )}
      {activeTab === "yourData" ? (
        <AdvertiserEditForm />
      ) : showAssignPubTab ? (
        <SubAdminAdvnameData />
      ) : null}
    </div>
  );
};

export default AdvertiserIDDashboard;

// ─── Billing helper ──────────────────────────────────────────────────────────
const emptyBilling = () => ({
  legal_name: "",
  billing_address: "",
  tax_type: "",
  tax_id: "",
});

const AdvertiserEditForm = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const { Option } = Select;
  const isAdvertiserManager = user?.role?.includes("advertiser_manager");
  const restrictedRoles = ["operation", "optimization"];

  // ── Main form state ──────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("");
  const [acc_email, setAcc_email] = useState("");
  const [poc_email, setPoc_email] = useState("");
  const [assign_user, setAssign_user] = useState("");
  const [assign_id, setAssign_id] = useState("");
  const [editingAdv, setEditingAdv] = useState(null);

  // ── Billing state ────────────────────────────────────────────────────────
  const [billingDetails, setBillingDetails] = useState([]);

  // ── Table / filter state ─────────────────────────────────────────────────
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [advertisers, setAdvertisers] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortInfo, setSortInfo] = useState({ columnKey: null, order: null });
  const [editingAssignRowId, setEditingAssignRowId] = useState(null);

  // ── Billing helpers ──────────────────────────────────────────────────────
  const addBillingEntry = () =>
    setBillingDetails((prev) => [...prev, emptyBilling()]);

  const removeBillingEntry = (index) =>
    setBillingDetails((prev) => prev.filter((_, i) => i !== index));

  const updateBillingEntry = (index, field, value) =>
    setBillingDetails((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );

  // ── Utilities ────────────────────────────────────────────────────────────
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };

  const trimValues = (obj) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k,
        typeof v === "string" ? v.trim() : v,
      ]),
    );

  const getExcelFilteredDataForColumn = (columnKey) => {
    return advertisers.filter((row) =>
      Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;
        if (!values || values.length === 0) return true;
        return values.includes(normalize(row[key]));
      }),
    );
  };

  useEffect(() => {
    const valuesObj = {};
    Object.keys(advertisers[0] || {}).forEach((col) => {
      // skip nested array — billing_details would produce [object Object]
      if (col === "billing_details") return;
      const source = getExcelFilteredDataForColumn(col);
      valuesObj[col] = [
        ...new Set(source.map((row) => normalize(row[col]))),
      ].sort((a, b) => a.localeCompare(b));
    });
    setUniqueValues(valuesObj);
  }, [advertisers, filters]);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchAdvertisers = async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(`${apiUrl}/advid-data/${userId}`);
      // const { data } = await axios.get(`http://localhost:5200/api/advid-data/${userId}`);

      if (data.success && Array.isArray(data.advertisements)) {
        setAdvertisers(data.advertisements);
      }
    } catch {
      setAdvertisers([]);
    }
  };

  useEffect(() => {
    fetchAdvertisers();
  }, [userId]);

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const res = await fetch(`${apiUrl}/get-subadmin`);
        const data = await res.json();
        if (res.ok) {
          setSubAdmins(
            data.data.filter(
              (a) =>
                [
                  "advertiser_manager",
                  "advertiser",
                  "adv_executive",
                  "operations",
                ].includes(a.role) && a.id !== userId,
            ),
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubAdmins();
  }, []);

  // ── Filtered table data ──────────────────────────────────────────────────
  const filteredData = advertisers.filter((row) => {
    // exclude billing_details array from search join to avoid [object Object]
    const { billing_details, ...flatRow } = row;
    const matchesSearch = Object.values(flatRow)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(normalize(row[key]));
    });
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (record) => {
    setEditingAdv(record);
    setName(record.adv_name);
    setSelectedId(record.adv_id);
    setGeo(record.geo);
    setNote(record.note || "");
    setTarget(record.target || "");
    setAcc_email(record.acc_email || "");
    setPoc_email(record.poc_email || "");
    setAssign_user(record.assign_user || "");
    setAssign_id(record.assign_id || "");

    // ✅ THIS WAS MISSING — load billing_details from record
    setBillingDetails(
      Array.isArray(record.billing_details) && record.billing_details.length > 0
        ? record.billing_details.map(
            ({ id, legal_name, billing_address, tax_type, tax_id }) => ({
              id,
              legal_name: legal_name || "",
              billing_address: billing_address || "",
              tax_type: tax_type || "",
              tax_id: tax_id || "",
            }),
          )
        : [emptyBilling()],
    );
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedAdv = {
      ...trimValues({
        adv_name: name,
        adv_id: selectedId,
        geo,
        note,
        target,
        acc_email,
        poc_email,
        assign_user,
        assign_id,
        user_id:
          user?.role === "advertiser_manager" ? editingAdv?.user_id : userId,
      }),
      // ✅ include billing as array (not inside trimValues to avoid breaking it)
      billing_details: billingDetails.map((b) => trimValues(b)),
    };

    if (!updatedAdv.adv_name || !updatedAdv.adv_id || !updatedAdv.geo) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all required fields.",
      });
    }

    try {
      const response = await axios.put(`${apiUrl}/update-advid`, updatedAdv);
      //  const response = await axios.put(`http://localhost:5200/api/update-advid`, updatedAdv);

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: response.data.message || "Advertiser updated successfully!",
        });
        await fetchAdvertisers();
        resetForm();
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Something went wrong.",
      });
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedId("");
    setGeo("");
    setNote("");
    setTarget("");
    setAcc_email("");
    setPoc_email("");
    setAssign_user("");
    setAssign_id("");
    setEditingAdv(null);
    setBillingDetails([]); // ✅ clear billing
  };

  // ── Excel filter dropdown ────────────────────────────────────────────────
  const excelFilterDropdown = (key) => () => {
    const allValues = uniqueValues[key] || [];
    const selectedValues = filters[key] ?? allValues;
    const searchVal = filterSearch[key] || "";

    const visibleValues = allValues.filter((v) =>
      v.toLowerCase().includes(searchVal.toLowerCase()),
    );

    const isAllSelected = selectedValues.length === allValues.length;
    const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

    return (
      <div className="w-[260px]" onClick={(e) => e.stopPropagation()}>
        <div className="p-2 border-b bg-white">
          <Input
            allowClear
            placeholder="Search values"
            value={searchVal}
            onChange={(e) =>
              setFilterSearch((prev) => ({ ...prev, [key]: e.target.value }))
            }
          />
        </div>
        <div className="px-3 py-2">
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={(e) => {
              const checked = e.target.checked;
              setFilters((prev) => {
                const updated = { ...prev };
                if (checked) delete updated[key];
                else updated[key] = [];
                return updated;
              });
            }}>
            Select All
          </Checkbox>
        </div>
        <div className="max-h-[220px] overflow-y-auto px-2 pb-2">
          {visibleValues.map((val) => (
            <label
              key={val}
              className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-blue-50">
              <Checkbox
                checked={selectedValues.includes(val)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selectedValues, val]
                    : selectedValues.filter((v) => v !== val);
                  setFilters((prev) => ({ ...prev, [key]: next }));
                }}
              />
              <span className="truncate">{val}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  // ── Columns ──────────────────────────────────────────────────────────────
  const makeSortHeader = (key) => ({
    sorter: (a, b) => (a[key] || "").localeCompare(b[key] || ""),
    sortOrder: sortInfo.columnKey === key ? sortInfo.order : null,
    onHeaderCell: () => ({
      onClick: () => {
        setSortInfo((prev) => {
          if (prev.columnKey !== key)
            return { columnKey: key, order: "ascend" };
          if (prev.order === "ascend")
            return { columnKey: key, order: "descend" };
          if (prev.order === "descend") return { columnKey: key, order: null };
          return { columnKey: key, order: "ascend" };
        });
      },
    }),
    filterDropdown: excelFilterDropdown(key),
    onFilter: (value, record) => record[key] === value,
  });

  const columns = [
    {
      title: "Advertiser ID",
      dataIndex: "adv_id",
      key: "adv_id",
      ...makeSortHeader("adv_id"),
    },
    {
      title: "Advertiser Name",
      dataIndex: "adv_name",
      key: "adv_name",
      ...makeSortHeader("adv_name"),
    },
    { title: "Geo", dataIndex: "geo", key: "geo", ...makeSortHeader("geo") },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      ...makeSortHeader("note"),
    },
    {
      title: "Target",
      dataIndex: "target",
      key: "target",
      ...makeSortHeader("target"),
    },
    {
      title: "Acc Email",
      dataIndex: "acc_email",
      key: "acc_email",
      render: (text) => (user?.role === "advertiser" ? "*****" : text),
    },
    {
      title: "POC Email",
      dataIndex: "poc_email",
      key: "poc_email",
      render: (text) => (user?.role === "advertiser" ? "*****" : text),
    },
    {
      title: "Assign User",
      dataIndex: "assign_user",
      key: "assign_user",
      ...makeSortHeader("assign_user"),
    },
    {
      title: "Postback URL",
      dataIndex: "postback_url",
      key: "postback_url",
      render: (text) => {
        if (!text) return "-";
        return (
          <div className="w-[250px] overflow-hidden whitespace-nowrap relative group">
            <div className="inline-block animate-marquee group-hover:pause">
              {text}
            </div>
          </div>
        );
      },
    },
    ...(isAdvertiserManager
      ? [
          {
            title: "Transfer Adv AM",
            key: "user_id",
            render: (_, record) => {
              const isEditing = editingAssignRowId === record.adv_id;
              if (isEditing) {
                return (
                  <Select
                    autoFocus
                    value={record.username}
                    onChange={async (newUserId) => {
                      try {
                        const response = await axios.put(
                          `${apiUrl}/update-advid`,
                          {
                            ...record,
                            user_id: newUserId,
                          },
                        );
                        if (response.data.success) {
                          Swal.fire(
                            "Success",
                            "User transferred successfully!",
                            "success",
                          );
                          await fetchAdvertisers();
                        } else {
                          Swal.fire(
                            "Error",
                            "Failed to transfer user",
                            "error",
                          );
                        }
                      } catch (error) {
                        console.error("User transfer error:", error);
                        Swal.fire("Error", "Something went wrong", "error");
                      } finally {
                        setEditingAssignRowId(null);
                      }
                    }}
                    onBlur={() => setEditingAssignRowId(null)}
                    className="min-w-[150px]">
                    {subAdmins.map((admin) => (
                      <Option key={admin.id} value={admin.id.toString()}>
                        {admin.username}
                      </Option>
                    ))}
                  </Select>
                );
              }
              return (
                <span
                  onClick={() => setEditingAssignRowId(record.adv_id)}
                  className="cursor-pointer hover:underline"
                  title="Click to change user">
                  {"-"}
                </span>
              );
            },
          },
        ]
      : []),
    ...(!user?.role?.some((role) => restrictedRoles.includes(role))
      ? [
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space size="middle">
                <Tooltip title="Edit">
                  <Button
                    type="primary"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  />
                </Tooltip>
              </Space>
            ),
          },
        ]
      : []),
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="">
      {editingAdv && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          {/* Advertiser Name */}
          <div>
            <label className="block text-[#2F5D99] text-base font-semibold mb-2">
              Advertiser Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              required
              disabled
            />
          </div>

          {/* Advertiser ID */}
          <div>
            <label className="block text-[#2F5D99] text-base font-semibold mb-2">
              Advertiser ID
            </label>
            <select
              value={selectedId}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              required
              disabled>
              <option value={editingAdv.adv_id}>{editingAdv.adv_id}</option>
            </select>
          </div>

          {/* Geo */}
          <div>
            <label className="block text-[#2F5D99] text-base font-semibold mb-2">
              Select Geo
            </label>
            <Select
              showSearch
              value={geo}
              onChange={(val) => setGeo(val)}
              placeholder="Select Geo"
              className="w-full"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              required>
              {geoData.geo?.map((g) => (
                <Select.Option key={g.code} value={g.code} label={g.code}>
                  {g.code}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Advertiser Manager only fields */}
          {user?.role?.includes("advertiser_manager") && (
            <>
              <div>
                <label className="block text-[#2F5D99] text-base font-semibold mb-2">
                  Target
                </label>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
                />
              </div>
              <div>
                <label className="block text-[#2F5D99] text-base font-semibold mb-2">
                  POC Email
                </label>
                <input
                  type="email"
                  value={poc_email}
                  onChange={(e) => setPoc_email(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
                />
              </div>
              <div>
                <label className="block text-[#2F5D99] text-base font-semibold mb-2">
                  Account Email
                </label>
                <input
                  type="email"
                  value={acc_email}
                  onChange={(e) => setAcc_email(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[#2F5D99] text-base font-semibold mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
                  rows="3"
                />
              </div>
            </>
          )}

          {/* Assign User */}
          <div className="md:col-span-2">
            <label className="block text-[#2F5D99] text-base font-semibold mb-2">
              Assign User
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
              value={assign_id}
              onChange={(e) => {
                const sid = e.target.value;
                const selectedUser = subAdmins.find(
                  (a) => a.id.toString() === sid,
                );
                setAssign_id(sid);
                setAssign_user(selectedUser?.username || "");
              }}>
              <option value="">Select Sub Admin</option>
              {subAdmins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.username}
                </option>
              ))}
            </select>
          </div>

          {/* ── Billing Details ──────────────────────────────────────────────── */}
          {/* ── Billing Details ─────────────────────────────────────── */}
          <div className="md:col-span-2 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#2F5D99] text-base font-semibold">
                Billing Details
                {billingDetails.length > 0 && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-normal">
                    {billingDetails.length}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={addBillingEntry}
                className="text-sm px-4 py-1.5 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 transition-all">
                + Add Entry
              </button>
            </div>

            <div className="space-y-4">
              {billingDetails.map((entry, index) => (
                <div
                  key={entry.id || index}
                  className="relative p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => removeBillingEntry(index)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors text-lg leading-none">
                    &#x2715;
                  </button>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                    Entry {index + 1}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Legal Name
                      </label>
                      <input
                        type="text"
                        value={entry.legal_name}
                        onChange={(e) =>
                          updateBillingEntry(
                            index,
                            "legal_name",
                            e.target.value,
                          )
                        }
                        placeholder="Legal entity name"
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:outline-none text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Tax Type
                      </label>
                      <input
                        type="text"
                        value={entry.tax_type}
                        onChange={(e) =>
                          updateBillingEntry(index, "tax_type", e.target.value)
                        }
                        placeholder="e.g. GST, VAT, PAN..."
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:outline-none text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Tax ID
                      </label>
                      <input
                        type="text"
                        value={entry.tax_id}
                        onChange={(e) =>
                          updateBillingEntry(index, "tax_id", e.target.value)
                        }
                        placeholder="e.g. 27AAPFU0939F1ZV"
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:outline-none text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Billing Address
                      </label>
                      <input
                        type="text"
                        value={entry.billing_address}
                        onChange={(e) =>
                          updateBillingEntry(
                            index,
                            "billing_address",
                            e.target.value,
                          )
                        }
                        placeholder="Full billing address"
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:outline-none text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {billingDetails.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                  No billing entries. Click "+ Add Entry" to add one.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-2 flex flex-wrap justify-end gap-4 mt-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 md:flex-none bg-[#2F5D99] hover:bg-[#24487A] text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all">
              Update Advertiser
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 md:flex-none bg-gray-400 hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {!editingAdv && (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative w-full md:w-[300px]">
              <Input
                placeholder="Search Advertisers..."
                prefix={<SearchOutlined style={{ color: "#999" }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                className="rounded-full shadow-md border-none ring-1 ring-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
          </div>
          <StyledTable
            bordered
            dataSource={filteredData}
            columns={columns}
            rowKey="adv_id"
            pagination={{
              pageSizeOptions: ["10", "20", "50", "100"],
              showSizeChanger: true,
              defaultPageSize: 10,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            scroll={{ x: "max-content" }}
            onChange={(pagination, filters, sorter) => {
              if (sorter.order || sorter.columnKey) {
                setSortInfo({
                  columnKey: sorter.columnKey,
                  order: sorter.order || null,
                });
              }
            }}
            sortDirections={["ascend", "descend", null]}
            showSorterTooltip={false}
          />
        </div>
      )}
    </div>
  );
};
