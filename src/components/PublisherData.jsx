import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Input, Button, Select, DatePicker, message } from "antd";
import {
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import geoData from "../Data/geoData.json";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";

const PublisherData = () => {
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({
    os: ["Android", "APK", "iOS"],
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

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
  console.log(data);
  const fetchDropdowns = async () => {
    try {
      const [advmName, payableEvent, mmpTracker, pid, pubID] =
        await Promise.all([
          axios.get(`${apiUrl}/get-subadmin`),
          axios.get(`${apiUrl}/get-paybleevernt`),
          axios.get(`${apiUrl}/get-mmptracker`),
          axios.get(`${apiUrl}/get-pid`),
          axios.get(`${apiUrl}/pubid-data/${user.id}`),
        ]);

      setDropdownOptions((prev) => ({
        ...prev,
        adv_name: advmName.data?.data?.map((item) => item.username) || [],
        payable_event:
          payableEvent.data?.data?.map((item) => item.payble_event) || [],
        mmp_tracker: mmpTracker.data?.data?.map((item) => item.mmptext) || [],
        p_id: pid.data?.data?.map((item) => item.pid) || [],
        pub_id: pubID.data?.Publisher?.map((item) => item.pub_id) || [],
        geo: geoData.geo,
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

  const handleAddRow = async () => {
    try {
      if (!user?.id) {
        message.error("User ID is missing. Please login again.");
        return;
      }

      const newRow = {
        ...editedRow,
        user_id: user.id,
        createdAt: new Date().toISOString(),
      };

      await axios.post(`${apiUrl}/add-pubdata`, newRow, {
        headers: { "Content-Type": "application/json" },
      });

      setEditedRow({});
      fetchData();
      message.success("Data added successfully");
    } catch (error) {
      message.error("Failed to add data");
    }
  };

  const handleChange = (value, field) => {
    setEditedRow((prev) => ({ ...prev, [field]: value }));
  };

  const filteredColumns = Object.keys(data[0] || {}).filter(
    (key) => !["id", "user_id", "key"].includes(key)
  );
  const handleFilterChange = (value, field) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    applyFilters({ ...filters, [field]: value });
  };

  const applyFilters = (newFilters) => {
    let filtered = data;
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key]) {
        if (Array.isArray(newFilters[key])) {
          filtered = filtered.filter((item) => {
            const itemDate = dayjs(item[key]);
            return (
              itemDate.isAfter(newFilters[key][0]) &&
              itemDate.isBefore(newFilters[key][1])
            );
          });
        } else {
          filtered = filtered.filter((item) =>
            item[key]?.toString().includes(newFilters[key])
          );
        }
      }
    });
    setFilteredData(filtered);
  };
  const columnHeadings = {
    adv_name: "ADVM Name",
    campaign_name: "Campaign Name",
    geo: "GEO",
    city: "State Or City",
    os: "OS",
    payable_event: "Payable Event",
    mmp_tracker: "MMP Tracker",
    pub_id: "Pub ID",
    p_id: "PID",
    pub_payout: "Pub Payout $",
    shared_date: "Shared Date",
    paused_date: "Paused Date",
    review: "Review",
    pub_total_numbers: "PUB Total Numbers",
    pub_deductions: "PUB Deductions",
    pub_approved_numbers: "PUB Approved Numbers",
  };

  const columns = [
    ...Object.keys(data[0] || {})
      .filter((key) => !["id", "user_id", "key", "created_at"].includes(key))
      .map((key) => ({
        title: columnHeadings[key] || key, // Use mapped heading or fallback to key
        dataIndex: key,
        key,
        filterDropdown: () =>
          key.toLowerCase().includes("date") ? (
            <DatePicker
              onChange={(date, dateString) =>
                handleFilterChange(dateString, key)
              }
              style={{ width: "100%" }}
            />
          ) : dropdownOptions[key] ? (
            <Select
              onChange={(value) => handleFilterChange(value, key)}
              style={{ width: "100%" }}
              dropdownMatchSelectWidth={false} 
              allowClear>
              {dropdownOptions[key].map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          ) : (
            <Input
              onChange={(e) => handleFilterChange(e.target.value, key)}
              placeholder={`Search ${columnHeadings[key] || key}`}
            />
          ),
        onFilter: (value, record) => {
          if (!value) return true;
          if (key.toLowerCase().includes("date")) {
            return dayjs(record[key]).isSame(dayjs(value), "day");
          }
          return record[key]
            ?.toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        },
        render: (text, record) =>
          editingKey === record.id ? (
            dropdownOptions[key] ? (
              <Select
                value={editedRow[key]}
                onChange={(value) => handleChange(value, key)}
                style={{ width: "100%" }}
                dropdownMatchSelectWidth={false} // Allows dropdown to take full width based on content
              >
                {dropdownOptions[key].map((option) => (
                  <Option key={option} value={option}>
                    {option}
                  </Option>
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
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          />
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
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
};

export default PublisherData;
