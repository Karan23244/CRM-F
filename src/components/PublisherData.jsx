import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Input, Button, Select, DatePicker, message } from "antd";
import { EditOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";

const PublisherData = () => {
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({
    geo: ["USA", "India", "Canada", "Germany"],
    os: ["Android", "APK", "iOS"],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchData();
      fetchDropdowns();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/pubdata-byuser/${user.id}`);
      setData(
        response.data.map((item) => ({
          ...item,
          key: item.id,
        }))
      );
    } catch (error) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [advmName, payableEvent, mmpTracker, pid, pubID] = await Promise.all([
        axios.get(`${apiUrl}/get-subadmin`),
        axios.get(`${apiUrl}/get-paybleevernt`),
        axios.get(`${apiUrl}/get-mmptracker`),
        axios.get(`${apiUrl}/get-pid`),
        axios.get(`${apiUrl}/pubid-data/${user.id}`),
      ]);
      
      setDropdownOptions((prev) => ({
        ...prev,
        adv_name: advmName.data?.data?.map((item) => item.username) || [],
        payable_event: payableEvent.data?.data?.map((item) => item.payble_event) || [],
        mmp_tracker: mmpTracker.data?.data?.map((item) => item.mmptext) || [],
        p_id: pid.data?.data?.map((item) => item.pid) || [],
        pub_id: pubID.data?.Publisher?.map((item) => item.pub_id) || [],
      }));
    } catch (error) {
      message.error("Failed to fetch dropdown options");
    }
  };

  const handleEdit = (id) => {
    setEditingKey(id);
    setEditedRow(data.find((row) => row.id === id) || {});
  };

  const handleSave = async () => {
    try {
      await axios.post(`${apiUrl}/pubdata-update/${editingKey}`, editedRow, {
        headers: { "Content-Type": "application/json" },
      });
      setEditingKey(null);
      fetchData();
      message.success("Data updated successfully");
    } catch (error) {
      message.error("Failed to update data");
    }
  };
  // Add new row
  const handleAddRow = async () => {
    try {
      if (!user?.id) {
        message.error("User ID is missing. Please login again.");
        return;
      }

      const newRow = {
        ...editedRow,
        user_id: user.id, // Ensure user_id is included
        createdAt: new Date().toISOString(),
      };

      console.log("Adding new row:", newRow);
      await axios.post(`${apiUrl}/add-pubdata`, newRow, {
        headers: { "Content-Type": "application/json" },
      });

      setEditedRow({});
      fetchData();
      message.success("Data added successfully");
    } catch (error) {
      console.error("Add Data Error:", error.response?.data || error.message);
      message.error("Failed to add data");
    }
  };
  const handleChange = (value, field) => {
    setEditedRow((prev) => ({ ...prev, [field]: value }));
  };

  const filteredColumns = Object.keys(data[0] || {}).filter(
    (key) => !["id", "user_id", "key"].includes(key)
  );

  const columns = [
    ...filteredColumns.map((key) => ({
      title: key.replace(/([A-Z])/g, " $1").trim(),
      dataIndex: key,
      render: (text, record) =>
        editingKey === record.id ? (
          dropdownOptions[key] && dropdownOptions[key].length > 0 ? (
            <Select
              value={editedRow[key]}
              onChange={(value) => handleChange(value, key)}
              style={{ width: "100%" }}>
              {dropdownOptions[key].map((option) => (
                <Option key={option} value={option}>{option}</Option>
              ))}
            </Select>
          ) : key.toLowerCase().includes("date") ? (
            <DatePicker
              value={editedRow[key] ? dayjs(editedRow[key]) : null}
              onChange={(date, dateString) => handleChange(dateString, key)}
              style={{ width: "100%" }}
            />
          ) : (
            <Input
              value={editedRow[key]}
              onChange={(e) => handleChange(e.target.value, key)}
            />
          )
        ) : (
          text
        ),
    })),
    {
      title: "Actions",
      render: (_, record) =>
        editingKey === record.id ? (
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} />
        ) : (
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record.id)} />
        ),
    },
  ];

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="w-full overflow-auto bg-white p-4 rounded shadow-md">
        <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddRow}
        className="mb-4">
        Add Row
      </Button>
        <Table
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10 }}
          bordered
          loading={loading}
        />
      </div>
    </div>
  );
};

export default PublisherData;
