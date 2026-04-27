import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Table, message, Spin } from "antd";
import StyledTable from "../../Utils/StyledTable";
import Swal from "sweetalert2";
const apiUrl = import.meta.env.VITE_API_URL;

const PublisherBilling = () => {
  const user = useSelector((state) => state.auth.user);

  const [billingDetails, setBillingDetails] = useState([
    { legal_name: "", tax_type: "", tax_id: "", billing_address: "" },
  ]);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // ================= FORM HANDLERS =================
  const updateBillingEntry = (index, field, value) => {
    setBillingDetails((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const addBillingEntry = () => {
    setBillingDetails((prev) => [
      ...prev,
      { legal_name: "", tax_type: "", tax_id: "", billing_address: "" },
    ]);
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
        setBillingDetails([
          { legal_name: "", tax_type: "", tax_id: "", billing_address: "" },
        ]);

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

  // ================= TABLE =================
  const columns = [
    { title: "ID", dataIndex: "id" },
    { title: "Publisher ID", dataIndex: "pub_id" },
    { title: "Legal Name", dataIndex: "legal_name" },
    { title: "Billing Address", dataIndex: "billing_address" },
    { title: "Tax Type", dataIndex: "tax_type" },
    { title: "Tax ID", dataIndex: "tax_id" },
  ];

  return (
    <div className="p-6 space-y-6">
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
              <div className="grid md:grid-cols-2 gap-4">
                {/* Legal Name */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={entry.legal_name}
                    onChange={(e) =>
                      updateBillingEntry(index, "legal_name", e.target.value)
                    }
                    placeholder="ABC Pvt Ltd"
                    className="px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition"
                  />
                </div>

                {/* Tax Type */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Tax Type</label>
                  <input
                    type="text"
                    value={entry.tax_type}
                    onChange={(e) =>
                      updateBillingEntry(index, "tax_type", e.target.value)
                    }
                    placeholder="GST"
                    className="px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                {/* Tax ID */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Tax ID</label>
                  <input
                    type="text"
                    value={entry.tax_id}
                    onChange={(e) =>
                      updateBillingEntry(index, "tax_id", e.target.value)
                    }
                    placeholder="07ABCDE1234F1Z5"
                    className="px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                {/* Billing Address */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">
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
                    placeholder="Delhi, India"
                    className="px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
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
