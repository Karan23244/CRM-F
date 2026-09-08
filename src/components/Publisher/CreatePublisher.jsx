// PublisherCreateForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Select } from "antd";
import Swal from "sweetalert2";
import { useSelector } from "react-redux";
import geoData from "../../Data/geoData.json";

const apiUrl = import.meta.env.VITE_API_URL;

const PublisherCreateForm = () => {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const userId = user?.id || null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");

  // Assigned user's ID
  const [assignedUserId, setAssignedUserId] = useState("");

  const [availableIds, setAvailableIds] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);

  // Fetch available Publisher ID
  useEffect(() => {
    const fetchAvailableIds = async () => {
      try {
        const { data } = await axios.get(`${apiUrl}/available-id`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (data.success && data.available_id !== undefined) {
          const firstId = String(data.available_id);

          setAvailableIds([firstId]);
          setSelectedId(firstId); // auto select first ID
        } else {
          setAvailableIds([]);
          setSelectedId("");
        }
      } catch (err) {
        console.error("Failed to fetch available IDs", err);
        setAvailableIds([]);
      }
    };

    if (token) {
      fetchAvailableIds();
    }
  }, [token]);

  // Fetch users for Assign User dropdown
  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-subadmin`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Sub-admins fetched:", response.data);
        const data = response.data;

        const filtered = (data?.data || []).filter(
          (subAdmin) =>
            ["publisher", "pub_executive"].includes(subAdmin.role) &&
            subAdmin.id !== userId &&
            subAdmin.pause !== 1,
        );

        setSubAdmins(filtered);

        setSubAdmins(filtered);
      } catch (err) {
        console.error("Failed to fetch sub-admins:", err);
        setSubAdmins([]);
      }
    };

    if (token) {
      fetchSubAdmins();
    }
  }, [token, userId]);

  // Refresh available Publisher ID
  const refreshAvailableIds = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/available-id`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success && data.available_id !== undefined) {
        const firstId = String(data.available_id);

        setAvailableIds([firstId]);
        setSelectedId(firstId); // auto select new available ID
      } else {
        setAvailableIds([]);
        setSelectedId("");
      }
    } catch (err) {
      console.error("Failed to refresh available IDs", err);
      setAvailableIds([]);
      setSelectedId("");
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      pub_name: name.trim(),
      email: email.trim(),
      pub_id: selectedId.trim(),
      geo: geo.trim(),

      // Selected assigned user, NOT logged-in user
      user_id: assignedUserId,
    };
    console.log("Submitting payload:", payload);
    if (
      !payload.pub_name ||
      !payload.email ||
      !payload.pub_id ||
      !payload.geo ||
      !payload.user_id
    ) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all required fields.",
      });
    }

    try {
      const res = await axios.post(`${apiUrl}/create-pubid`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Created",
          text: "Publisher created successfully!",
        });

        resetForm();
        await refreshAvailableIds();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data.message || "Failed to create publisher.",
        });
      }
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err.response?.data?.message || err.message || "Something went wrong.",
      });
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setSelectedId("");
    setGeo("");
    setAssignedUserId("");
  };

  return (
    <div className="m-6 p-6 bg-white shadow-md rounded-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
        Create Publisher
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Publisher Name */}
        <div>
          <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
            Publisher Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter publisher name"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
            required
          />
        </div>

        {/* Publisher ID */}
        <div>
          <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
            Select Publisher ID
          </label>

          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
            required>
            <option value="">Select an ID</option>

            {availableIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

        {/* Assign User */}
        {/* Assign User */}
        <div>
          <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
            Assign User
          </label>

          <Select
            showSearch
            value={assignedUserId || undefined}
            onChange={(value) => setAssignedUserId(value)}
            placeholder="Select User"
            className="w-full !h-12"
            optionFilterProp="label"
            options={subAdmins.map((subAdmin) => ({
              value: subAdmin.id, // sends ID
              label: subAdmin.username, // shows username
            }))}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>

        {/* Geo */}
        <div className="md:col-span-2">
          <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
            Select Geo
          </label>

          <Select
            showSearch
            value={geo || undefined}
            onChange={(val) => setGeo(val)}
            placeholder="Select Geo"
            className="w-full !h-12"
            optionFilterProp="label"
            options={
              geoData.geo?.map((g) => ({
                value: g.code,
                label: g.code,
              })) || []
            }
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>

        {/* Buttons */}
        <div className="md:col-span-2 flex flex-wrap gap-4 justify-end mt-4">
          <button
            type="submit"
            className="flex-1 md:flex-none bg-[#2F5D99] hover:bg-[#24487A] text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all">
            Create Publisher
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="flex-1 md:flex-none bg-gray-400 hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublisherCreateForm;
