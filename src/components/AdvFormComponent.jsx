import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Select, Button, Space } from "antd";
import { useSelector } from "react-redux";
import geoData from "../Data/geoData.json";

const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const AdvertiserCreateForm = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const { Option } = Select;
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [advertisers, setAdvertisers] = useState([]);
  const [availableIds, setAvailableIds] = useState([]);
  const [usedIds, setUsedIds] = useState(new Set());
  const [editingAdv, setEditingAdv] = useState(null);

  // **Initialize available IDs from user.ranges**
  useEffect(() => {
    if (user && user.ranges && user.ranges.length > 0) {
      let allAvailableIds = [];

      user.ranges.forEach(({ start, end }) => {
        const rangeStart = Number(start);
        const rangeEnd = Number(end);

        if (!isNaN(rangeStart) && !isNaN(rangeEnd) && rangeStart <= rangeEnd) {
          const rangeIds = Array.from(
            { length: rangeEnd - rangeStart + 1 },
            (_, i) => (rangeStart + i).toString()
          );
          allAvailableIds = [...allAvailableIds, ...rangeIds];
        }
      });
      setAvailableIds(allAvailableIds);
    }
  }, [user]);

  // **Fetch advertisers and remove used IDs**
  useEffect(() => {
    const fetchAdvertisers = async () => {
      if (!userId) return;

      try {
        const { data } = await axios.get(`${apiUrl}/advid-data/${userId}`);

        if (data.success && Array.isArray(data.advertisements)) {
          setAdvertisers(data.advertisements);

          const usedIdsSet = new Set(
            data.advertisements.map((adv) => adv.adv_id)
          );
          setUsedIds(usedIdsSet);

          // **Filter available IDs based on used IDs**
          setAvailableIds((prevIds) =>
            prevIds.filter((id) => !usedIdsSet.has(id))
          );
        }
      } catch (error) {
        setAdvertisers([]);
      }
    };

    fetchAdvertisers();
  }, [userId]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !selectedId || !geo) {
      alert("Please fill all required fields.");
      return;
    }

    const newAdv = {
      adv_name: name,
      adv_id: selectedId,
      geo: geo,
      note: note || "", // Optional note
      user_id: userId,
    };
    console.log(newAdv)
    try {
      if (editingAdv) {
        // **Update existing advertiser**
        const response = await axios.put(
          `${apiUrl}/update-advid`, // Correct endpoint
          newAdv
        );
        console.log(response)
        if (response.data.success) {
          alert("Advertiser updated successfully");
        }
        setEditingAdv(null);
      } else {
        // **Create new advertiser**
        await axios.post(`${apiUrl}/create-advid`, newAdv);
      }

      // Refresh advertisers after submission
      const { data } = await axios.get(`${apiUrl}/advid-data/${userId}`);
      if (data.success && Array.isArray(data.advertisements)) {
        setAdvertisers(data.advertisements);

        const newUsedIds = new Set(
          data.advertisements.map((adv) => adv.adv_id)
        );
        setUsedIds(newUsedIds);
        setAvailableIds((prevIds) =>
          prevIds.filter((id) => !newUsedIds.has(id))
        );
      }

      // Reset form
      resetForm();
    } catch (error) {
      console.log(error)
      alert("Error creating/updating advertiser:");
    }
  };

  // Handle Edit Button
  const handleEdit = (record) => {
    setEditingAdv(record);
    setName(record.adv_name);
    setSelectedId(record.adv_id);
    setGeo(record.geo);
    setNote(record.note);
  };

  // Reset Form
  const resetForm = () => {
    setName("");
    setSelectedId("");
    setGeo("");
    setNote("");
    setEditingAdv(null);
  };

  const columns = [
    { title: "Advertiser ID", dataIndex: "adv_id", key: "adv_id" },
    { title: "Advertiser Name", dataIndex: "adv_name", key: "adv_name" },
    { title: "Geo", dataIndex: "geo", key: "geo" },
    { title: "Note", dataIndex: "note", key: "note" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="m-6 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">
        {editingAdv ? "Edit Advertiser" : "Create Advertiser"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Advertiser Name */}
        <div>
          <label className="block text-lg font-medium">Advertiser Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
            disabled={!!editingAdv}
          />
        </div>

        {/* Select Advertiser ID */}
        <div>
          <label className="block text-lg font-medium">
            Select Advertiser ID
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
            disabled={!!editingAdv} // Disable changing ID in edit mode
          >
            <option value="">Select an ID</option>
            {availableIds.length > 0 || editingAdv ? (
              (editingAdv ? [editingAdv.adv_id] : availableIds).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))
            ) : (
              <option disabled>No available IDs</option>
            )}
          </select>
        </div>

        {/* Select Geo with Search Feature */}
        <div>
          <label className="block text-lg font-medium">Select Geo</label>
          <Select
            showSearch
            value={geo}
            onChange={(value) => setGeo(value)}
            placeholder="Select Geo"
            className="w-full"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option?.label?.toLowerCase().includes(input.toLowerCase())
            }
            required
          >
            {geoData.geo?.map((geo) => (
              <Select.Option
                key={geo.code}
                value={geo.code}
                label={`${geo.code}`}
              >
                {geo.code}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Note (Optional) */}
        <div>
          <label className="block text-lg font-medium">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            rows="3"
            disabled={!!editingAdv}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
        >
          {editingAdv ? "Update Advertiser" : "Create Advertiser"}
        </button>

        {editingAdv && (
          <button
            type="button"
            onClick={resetForm}
            className="w-full mt-2 bg-gray-400 text-white p-2 rounded-lg hover:bg-gray-500"
          >
            Cancel Edit
          </button>
        )}
      </form>

      {/* Existing Advertisers Table */}
      <h3 className="text-xl font-semibold pt-10">Existing Advertisers</h3>
      <Table
        dataSource={advertisers}
        columns={columns}
        rowKey="adv_id"
        className="mt-4"
        pagination={{
          pageSizeOptions: ["10", "20", "50", "100"],
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default AdvertiserCreateForm;
