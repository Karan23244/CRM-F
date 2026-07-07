import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Table, message, Spin } from "antd";
import StyledTable from "../../Utils/StyledTable";
import Swal from "sweetalert2";
const apiUrl = import.meta.env.VITE_API_URL;
const apiUrl3 = import.meta.env.VITE_API_URL3;
const InputField = React.memo(({ label, value, onChange }) => (
  <div className="flex flex-col">
    <label className="text-xs text-gray-500 mb-1">{label}</label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={label}
      className="px-3 py-2.5 rounded-lg border border-gray-300
                 focus:ring-2 focus:ring-blue-500
                 focus:border-blue-500 outline-none text-sm"
    />
  </div>
));
const PublisherBilling = () => {
  const user = useSelector((state) => state.auth.user);
  const emptyBilling = {
    official_name: "",
    address: "",
    account_holder: "",
    account_number: "",
    account_currency: "",
    bank_name: "",
    bank_branch_address: "",
    swift_bic: "",
    ach_routing_number: "",
    account_type: "",
    usdt: "",
    paypal: "",
    payoneer: "",
  };
  const [billingDetails, setBillingDetails] = useState([emptyBilling]);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publisherApiUrl, setPublisherApiUrl] = useState("");
  const [apiUrlLoading, setApiUrlLoading] = useState(false);
  const [hasPostback, setHasPostback] = useState(false);

  // ================= API CALL: FETCH =================
  const fetchBilling = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    console.log("Fetching billing for user:", user.id);

    try {
      const res = await axios.get(
        `${apiUrl}/get-publisher-billing?user_id=${user.id}`,
      );

      console.log("Fetch Response:", res.data);

      if (res.data.success) {
        const formatted = res.data.data.map((item) => ({
          ...item,
          key: item.id,
        }));

        setTableData(formatted);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      message.error("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ================= FIRST LOAD =================
  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  useEffect(() => {
    if (!user?.pubid) return;
    const fetchApiUrl = async () => {
      setApiUrlLoading(true);
      try {
        // First check if postback is set via pubid-data
        const pubRes = await axios.get(`${apiUrl}/pubid-data/${user.id}`);
        const publishers = pubRes.data?.publishers || [];
        const thisPublisher = publishers.find((p) => p.pub_id === user.pubid);
        if (!thisPublisher?.postback_url) return;

        setHasPostback(true);
        const res = await axios.get(`${apiUrl3}/link/publisher-api-url`, {
          params: { publisher_id: user.pubid },
        });
        setPublisherApiUrl(res.data?.api_url || "");
      } catch {
        // silently ignore
      } finally {
        setApiUrlLoading(false);
      }
    };
    fetchApiUrl();
  }, [user?.pubid, user?.id]);

  // ================= FORM HANDLERS =================
  const updateBillingEntry = (index, field, value) => {
    setBillingDetails((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const addBillingEntry = () => {
    setBillingDetails((prev) => [...prev, { ...emptyBilling }]);
  };

  const removeBillingEntry = (index) => {
    setBillingDetails((prev) => prev.filter((_, i) => i !== index));
  };

  // ================= API CALL: CREATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      billingData: billingDetails.map((item) => ({
        ...item,
        user_id: user?.id,
        pub_id: user?.pubid,
      })),
    };

    console.log("Submitting Payload:", payload);

    // 🔥 Optional confirmation popup
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save billing details?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Save",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await axios.post(
        `${apiUrl}/create-publisher-billing`,
        payload,
      );

      console.log("Create Response:", res.data);

      if (res.data.success) {
        // ✅ SUCCESS SWAL
        await Swal.fire({
          title: "Success",
          text: "Billing created successfully",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });

        // Reset form
        setBillingDetails([{ ...emptyBilling }]);

        // 🔥 Refresh table
        fetchBilling();
      }
    } catch (err) {
      console.error("Submit Error:", err);

      // ❌ ERROR SWAL
      Swal.fire({
        title: "Error ❌",
        text: "Failed to save billing",
        icon: "error",
      });
    }
  };
  const scrollableCell = (text, width = "200px") => (
    <div
      className="overflow-x-auto whitespace-nowrap scrollbar-thin"
      style={{ maxWidth: width }}>
      {text || "-"}
    </div>
  );
  // ================= TABLE =================
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      fixed: "left",
    },
    {
      title: "Publisher ID",
      dataIndex: "pub_id",
      key: "pub_id",
      width: 120,
    },
    {
      title: "User ID",
      dataIndex: "user_id",
      key: "user_id",
      width: 100,
    },
    {
      title: "Official Name",
      dataIndex: "official_name",
      key: "official_name",
      width: 200,
      render: (text) => scrollableCell(text, "180px"),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      width: 250,
      render: (text) => scrollableCell(text, "230px"),
    },
    {
      title: "Account Holder",
      dataIndex: "account_holder",
      key: "account_holder",
      width: 180,
      render: (text) => scrollableCell(text, "160px"),
    },
    {
      title: "Account Number",
      dataIndex: "account_number",
      key: "account_number",
      width: 220,
      render: (text) => scrollableCell(text, "200px"),
    },
    {
      title: "Account Currency",
      dataIndex: "account_currency",
      key: "account_currency",
      width: 130,
    },
    {
      title: "Bank Name",
      dataIndex: "bank_name",
      key: "bank_name",
      width: 180,
      render: (text) => scrollableCell(text, "160px"),
    },
    {
      title: "Bank Branch Address",
      dataIndex: "bank_branch_address",
      key: "bank_branch_address",
      width: 250,
      render: (text) => scrollableCell(text, "230px"),
    },
    {
      title: "Swift BIC",
      dataIndex: "swift_bic",
      key: "swift_bic",
      width: 140,
    },
    {
      title: "ACH Routing",
      dataIndex: "ach_routing_number",
      key: "ach_routing_number",
      width: 150,
    },
    {
      title: "Account Type",
      dataIndex: "account_type",
      key: "account_type",
      width: 130,
    },
    {
      title: "USDT",
      dataIndex: "usdt",
      key: "usdt",
      width: 300,
      render: (text) => scrollableCell(text, "280px"),
    },
    {
      title: "Paypal",
      dataIndex: "paypal",
      key: "paypal",
      width: 220,
      render: (text) => scrollableCell(text, "200px"),
    },
    {
      title: "Payoneer",
      dataIndex: "payoneer",
      key: "payoneer",
      width: 220,
      render: (text) => scrollableCell(text, "200px"),
    },
  ];

  const copyApiUrl = () => {
    if (!publisherApiUrl) return;
    navigator.clipboard.writeText(publisherApiUrl);
    message.success("API URL copied to clipboard");
  };

  return (
    <div className="p-6 space-y-6">
      {/* ================= API URL CARD ================= */}
      <div className="bg-white p-6 rounded-xl shadow border border-blue-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Publisher API URL
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Use this URL to access your publisher offer feed.
        </p>
        {apiUrlLoading ? (
          <Spin size="small" />
        ) : publisherApiUrl ? (
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <span className="text-sm text-gray-700 break-all flex-1">
              {publisherApiUrl}
            </span>
            <button
              onClick={copyApiUrl}
              className="shrink-0 bg-[#2F5D99] hover:bg-[#24487A] text-white text-xs font-medium px-4 py-2 rounded-lg transition-all">
              Copy
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No API URL generated yet. Please contact your manager.
          </p>
        )}
      </div>

      {/* ================= FORM ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Add Billing</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {billingDetails.map((entry, index) => (
            <div
              key={index}
              className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Billing Entry {index + 1}
                </h3>

                {billingDetails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBillingEntry(index)}
                    className="text-red-500 hover:text-red-600 text-sm font-medium">
                    ✕ Remove
                  </button>
                )}
              </div>

              {/* Inputs */}
              <div className="grid md:grid-cols-3 gap-4">
                <InputField
                  label="Official Name"
                  value={entry.official_name}
                  onChange={(v) =>
                    updateBillingEntry(index, "official_name", v)
                  }
                />

                <InputField
                  label="Address"
                  value={entry.address}
                  onChange={(v) => updateBillingEntry(index, "address", v)}
                />

                <InputField
                  label="Account Holder"
                  value={entry.account_holder}
                  onChange={(v) =>
                    updateBillingEntry(index, "account_holder", v)
                  }
                />

                <InputField
                  label="Account Number"
                  value={entry.account_number}
                  onChange={(v) =>
                    updateBillingEntry(index, "account_number", v)
                  }
                />

                <InputField
                  label="Account Currency"
                  value={entry.account_currency}
                  onChange={(v) =>
                    updateBillingEntry(index, "account_currency", v)
                  }
                />

                <InputField
                  label="Bank Name"
                  value={entry.bank_name}
                  onChange={(v) => updateBillingEntry(index, "bank_name", v)}
                />

                <InputField
                  label="Bank Branch Address"
                  value={entry.bank_branch_address}
                  onChange={(v) =>
                    updateBillingEntry(index, "bank_branch_address", v)
                  }
                />

                <InputField
                  label="Swift BIC"
                  value={entry.swift_bic}
                  onChange={(v) => updateBillingEntry(index, "swift_bic", v)}
                />

                <InputField
                  label="ACH Routing Number"
                  value={entry.ach_routing_number}
                  onChange={(v) =>
                    updateBillingEntry(index, "ach_routing_number", v)
                  }
                />

                <InputField
                  label="Account Type"
                  value={entry.account_type}
                  onChange={(v) => updateBillingEntry(index, "account_type", v)}
                />

                <InputField
                  label="USDT"
                  value={entry.usdt}
                  onChange={(v) => updateBillingEntry(index, "usdt", v)}
                />

                <InputField
                  label="Paypal"
                  value={entry.paypal}
                  onChange={(v) => updateBillingEntry(index, "paypal", v)}
                />

                <InputField
                  label="Payoneer"
                  value={entry.payoneer}
                  onChange={(v) => updateBillingEntry(index, "payoneer", v)}
                />
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={addBillingEntry}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
              ➕ Add Entry
            </button>

            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-lg shadow-md text-sm font-medium transition-all">
              Save Billing
            </button>
          </div>
        </form>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Billing List</h2>

        {loading ? (
          <Spin />
        ) : (
          <StyledTable columns={columns} dataSource={tableData} />
        )}
      </div>
    </div>
  );
};

export default PublisherBilling;
