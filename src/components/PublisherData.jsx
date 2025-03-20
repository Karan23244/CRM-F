import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  Input,
  Button,
  Select,
  DatePicker,
  message,
  Tooltip,
} from "antd";
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
const apiUrl = import.meta.env.VITE_API_URL || "https://api.clickorbits.in/api";

const PublisherData = () => {
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({
    os: ["Android", "APK", "iOS", "Both Android and iOS"],
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
  const fetchDropdowns = async () => {
    try {
      const [advmName, payableEvent, mmpTracker, pid, pubID, review] =
        await Promise.all([
          axios.get(`${apiUrl}/get-subadmin`),
          axios.get(`${apiUrl}/get-paybleevernt`),
          axios.get(`${apiUrl}/get-mmptracker`),
          axios.get(`${apiUrl}/get-pid`),
          axios.get(`${apiUrl}/pubid-data/${user.id}`),
          axios.get(`${apiUrl}/get-reviews`),
        ]);
      setDropdownOptions((prev) => ({
        ...prev,
        adv_name:
          advmName.data?.data
            ?.filter(
              (item) => item.role === "manager" || item.role === "advertiser"
            )
            .map((item) => item.username) || [],
        payable_event:
          payableEvent.data?.data?.map((item) => item.payble_event) || [],
        mmp_tracker: mmpTracker.data?.data?.map((item) => item.mmptext) || [],
        p_id: pid.data?.data?.map((item) => item.pid) || [],
        pub_id: pubID.data?.Publisher?.map((item) => item.pub_id) || [],
        geo: geoData.geo?.map((item) => item.code) || [],
        review: review.data?.data?.map((item) => item.review_text) || [],
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
    const excludedFields = [
      "paused_date",
      "review",
      "pub_total_numbers",
      "pub_deductions",
      "pub_approved_numbers",
    ];
    const isEmptyField = Object.entries(editedRow)
      .filter(([key]) => !excludedFields.includes(key)) // Exclude specific fields
      .some(([_, value]) => !value); // Check for empty values

    if (isEmptyField) {
      alert("All required fields must be filled!");
      return;
    }
    try {
      await axios.post(`${apiUrl}/pubdata-update/${editingKey}`, editedRow, {
        headers: { "Content-Type": "application/json" },
      });
      setEditingKey(null);
      fetchData();
      alert("Data updated successfully");
    } catch (error) {
      alert("Failed to update data");
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

  const allowedFields = {
    manager: [
      "paused_date",
      "pub_total_numbers",
      "pub_deductions",
      "pub_approved_numbers",
    ],
    publisher: ["paused_date"],
  };

  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredRecords = data.filter((item) => {
    return Object.keys(filters).every((key) => {
      if (!filters[key]) return true;

      // Date range filter
      if (Array.isArray(filters[key]) && filters[key].length === 2) {
        const [start, end] = filters[key];
        return dayjs(item[key]).isBetween(start, end, null, "[]");
      }

      return item[key]
        ?.toString()
        .toLowerCase()
        .includes(filters[key].toString().toLowerCase());
    });
  });
  
  const columns = [
    ...Object.keys(data[0] || {})
      .filter((key) => !["id", "user_id", "key", "created_at"].includes(key))
      .map((key) => {
        const isDateField = key.toLowerCase().includes("date");
  
        return {
          title: columnHeadings[key] || key.replace(/([A-Z])/g, " $1").trim(),
          dataIndex: key,
          key,
          filters: isDateField
            ? undefined
            : data
                .map((item) => item[key])
                .filter(Boolean)
                .map((val) => ({ text: val, value: val })),
          filterDropdown: () =>
            isDateField ? (
              <DatePicker.RangePicker
                onChange={(dates, dateStrings) =>
                  handleFilterChange(dateStrings, key)
                }
                style={{ width: "100%" }}
              />
            ) : dropdownOptions[key] ? (
              <Select
                showSearch
                onChange={(value) => handleFilterChange(value, key)}
                style={{ width: "100%" }}
                allowClear
                placeholder="Search..."
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }>
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
          render: (text, record) => {
            const createdAt = dayjs(record.created_at);
            const isEditable = dayjs().diff(createdAt, "day") <= 3;
            const allowedAfter3Days = allowedFields[user?.role.toLowerCase()] || [];
            const canEditAfter3Days =
              dayjs().diff(createdAt, "day") > 3 && allowedAfter3Days.includes(key);
  
            if (editingKey === record.id) {
              return isEditable || canEditAfter3Days ? (
                isDateField ? (
                  <DatePicker
                    value={
                      editedRow[key] ? dayjs(editedRow[key]) : null
                    } // Ensure correct date parsing
                    onChange={(date, dateString) =>
                      handleChange(dateString, key)
                    }
                    style={{ width: "100%" }}
                  />
                ) : dropdownOptions[key] ? (
                  <Select
                    showSearch
                    value={editedRow[key]}
                    onChange={(value) => handleChange(value, key)}
                    style={{ width: "100%" }}
                    allowClear
                    placeholder="Search..."
                    dropdownMatchSelectWidth={false}
                    filterOption={(input, option) =>
                      option.children.toLowerCase().includes(input.toLowerCase())
                    }>
                    {dropdownOptions[key].map((option) => (
                      <Option key={option} value={option}>
                        {option}
                      </Option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    value={editedRow[key]}
                    onChange={(e) => handleChange(e.target.value, key)}
                  />
                )
              ) : (
                text
              );
            }
            return isDateField && text ? dayjs(text).format("YYYY-MM-DD") : text;
          },
        };
      }),
    {
      title: "Actions",
      render: (_, record) => {
        const createdAt = dayjs(record.created_at);
        const isEditable = dayjs().diff(createdAt, "day") <= 3;
        const allowedAfter3Days = allowedFields[user?.role.toLowerCase()] || [];
        const canEditAfter3Days =
          dayjs().diff(createdAt, "day") > 3 && allowedAfter3Days.length > 0;
  
        return editingKey === record.id ? (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => handleSave(record.id)}
          />
        ) : (
          <Tooltip
            title={
              !isEditable && !canEditAfter3Days
                ? "You can't edit because time is over"
                : ""
            }>
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record.id)}
              disabled={!isEditable && !canEditAfter3Days}
            />
          </Tooltip>
        );
      },
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
          dataSource={filteredRecords}
          pagination={{ pageSize: 10 }}
          bordered
          loading={loading}
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

export default PublisherData;
