import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Select } from "antd";
import { useSelector } from "react-redux";
import geoData from "../../Data/geoData.json";

const apiUrl = import.meta.env.VITE_API_URL;
const apiUrl2 = import.meta.env.VITE_API_URL3;

const TAX_TYPES = ["GST", "VAT", "PAN", "TIN", "EIN", "Other"];

const emptyBilling = () => ({
  legal_name: "",
  billing_address: "",
  tax_type: "",
  tax_id: "",
});

const AdvertiserCreateForm = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;

  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [billingDetails, setBillingDetails] = useState([]);
  const [availableIds, setAvailableIds] = useState([]);

  const trimValues = (obj) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
    );

  useEffect(() => {
    const fetchAvailableIds = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/available-id`);
        if (data.success && data.available_id !== undefined) {
          setAvailableIds([String(data.available_id)]);
        } else {
          setAvailableIds([]);
        }
      } catch (err) {
        console.error("Failed to fetch available IDs", err);
        setAvailableIds([]);
      }
    };
    fetchAvailableIds();
  }, []);

  const refreshAvailableIds = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/available-id`);
      setAvailableIds(data.success && data.available_id !== undefined ? [String(data.available_id)] : []);
    } catch (err) {
      console.error("Failed to refresh available IDs", err);
      setAvailableIds([]);
    }
  };

  // ── Billing helpers ──────────────────────────────────────────
  const addBillingEntry = () => setBillingDetails((prev) => [...prev, emptyBilling()]);

  const removeBillingEntry = (index) =>
    setBillingDetails((prev) => prev.filter((_, i) => i !== index));

  const updateBillingEntry = (index, field, value) =>
    setBillingDetails((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newAdv = trimValues({
      adv_name: name,
      adv_id: selectedId,
      geo,
      user_id: userId,
      billing_details: billingDetails.map((b) => trimValues(b)),
    });

    if (!newAdv.adv_name || !newAdv.adv_id || !newAdv.geo) {
      return Swal.fire({ icon: "warning", title: "Missing Fields", text: "Please fill all required fields." });
    }

    try {
      // const response = await axios.post(`http://localhost:5200/api/create-advid`, newAdv);
      const response = await axios.post(`${apiUrl2}/create-advid`, newAdv);

      if (!response.data.success) throw new Error(response.data.message || "Failed to create advertiser");

      Swal.fire({ icon: "success", title: "Created", text: response.data.message || "Advertiser created successfully!" });

      try {
        await axios.post(`${apiUrl2}/link/advertiser`, {
          campaign_id: null,
          advertiser_link: "",
          adv_id: selectedId,
          click_id_param: "click_id",
        });
      } catch (linkErr) {
        console.warn("Link generation failed", linkErr);
      }

      await refreshAvailableIds();
      resetForm();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Something went wrong." });
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedId("");
    setGeo("");
    setBillingDetails([]);
  };

  return (
    <div className="m-6 p-8 bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-2xl border border-gray-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
        Create Advertiser
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Advertiser Name */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Advertiser Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter advertiser name"
            className="p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-gray-50 hover:bg-white"
            required
          />
        </div>

        {/* ID + Geo row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Advertiser ID</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50 hover:bg-white transition-all"
              required>
              <option value="">Select an ID</option>
              {[...availableIds]
                .sort((a, b) => (!isNaN(a) && !isNaN(b) ? Number(a) - Number(b) : a.localeCompare(b)))
                .map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Geo</label>
            <Select
              showSearch
              value={geo}
              onChange={(val) => setGeo(val)}
              placeholder="Select Geo"
              className="w-full rounded-xl !h-12"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }>
              {geoData.geo?.map((g) => (
                <Select.Option key={g.code} value={g.code} label={g.code}>{g.code}</Select.Option>
              ))}
            </Select>
          </div>
        </div>

        {/* ── Billing Details ─────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3 border-t pt-5">
            <h3 className="text-base font-semibold text-gray-700">
              Billing Details
              {billingDetails.length > 0 && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
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
                key={index}
                className="relative p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeBillingEntry(index)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors text-lg leading-none">
                  &#x2715;
                </button>

                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Entry {index + 1}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Legal Name */}
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-600 mb-1">Legal Name</label>
                    <input
                      type="text"
                      value={entry.legal_name}
                      onChange={(e) => updateBillingEntry(index, "legal_name", e.target.value)}
                      placeholder="Legal entity name"
                      className="p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                    />
                  </div>

                  {/* Tax Type */}
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-600 mb-1">Tax Type</label>
                    <input
  type="text"
  value={entry.tax_type}
  onChange={(e) => updateBillingEntry(index, "tax_type", e.target.value)}
  placeholder="e.g. GST, VAT, PAN..."
  className="p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
/>
                  </div>

                  {/* Tax ID */}
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-600 mb-1">Tax ID</label>
                    <input
                      type="text"
                      value={entry.tax_id}
                      onChange={(e) => updateBillingEntry(index, "tax_id", e.target.value)}
                      placeholder="e.g. 27AAPFU0939F1ZV"
                      className="p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                    />
                  </div>

                  {/* Billing Address */}
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-600 mb-1">Billing Address</label>
                    <input
                      type="text"
                      value={entry.billing_address}
                      onChange={(e) => updateBillingEntry(index, "billing_address", e.target.value)}
                      placeholder="Full billing address"
                      className="p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}

            {billingDetails.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                No billing entries yet. Click "+ Add Entry" to add one.
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="button"
            onClick={resetForm}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all">
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-[#2F5D99] hover:bg-[#24487A] text-white font-medium rounded-xl shadow hover:shadow-md transition-all">
            Create Advertiser
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdvertiserCreateForm;