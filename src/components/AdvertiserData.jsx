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
import { EditOutlined, SaveOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import geoData from "../Data/geoData.json";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";

const AdvertiserData = () => {
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
      const response = await axios.get(`${apiUrl}/advdata-byuser/${user.id}`);
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
      const [advmName, payableEvent, mmpTracker, pid, pub_id] =
        await Promise.all([
          axios.get(`${apiUrl}/get-subadmin`),
          axios.get(`${apiUrl}/get-paybleevernt`),
          axios.get(`${apiUrl}/get-mmptracker`),
          axios.get(`${apiUrl}/get-pid`),
          axios.get(`${apiUrl}/get-allpub`),
        ]);
      console.log(pub_id);
      setDropdownOptions((prev) => ({
        ...prev,
        // pub_name: advmName.data?.data?.map((item) => item.username) || [],
        pub_name:
          advmName.data?.data
            ?.filter(
              (item) => item.role === "manager" || item.role === "publisher"
            )
            .map((item) => item.username) || [],
        payable_event:
          payableEvent.data?.data?.map((item) => item.payble_event) || [],
        mmp_tracker: mmpTracker.data?.data?.map((item) => item.mmptext) || [],
        pid: pid.data?.data?.map((item) => item.pid) || [],
        pub_id: pub_id.data?.data?.map((item) => item.pub_id) || [],
        geo: geoData.geo?.map((item) => item.code) || [],
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
      "adv_total_no",
      "adv_deductions",
      "adv_approved_no",
    ];

    const isEmptyField = Object.entries(editedRow)
      .filter(([key]) => !excludedFields.includes(key)) // Exclude specific fields
      .some(([_, value]) => !value); // Check for empty values

    if (isEmptyField) {
      alert("All required fields must be filled!");
      return;
    }
    try {
      await axios.post(`${apiUrl}/advdata-update/${editingKey}`, editedRow, {
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
      await axios.post(`${apiUrl}/add-advdata`, newRow, {
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
    pub_name: "PUBM Name",
    campaign_name: "Campaign Name",
    geo: "GEO",
    city: "State Or City",
    os: "OS",
    payable_event: "Payable Event",
    mmp_tracker: "MMP Tracker",
    adv_id: "ADV ID",
    adv_payout: "ADV Payout $",
    pub_am: "Pub AM",
    pub_id: "PubID",
    pid: "PID",
    shared_date: "Shared Date",
    paused_date: "Paused Date",
    adv_total_no: "ADV Total Numbers",
    adv_deductions: "ADV Deductions",
    adv_approved_no: "ADV Approved Numbers",
  };

  const columns = [
    ...Object.keys(data[0] || {})
      .filter((key) => !["id", "user_id", "key", "created_at"].includes(key))
      .map((key) => ({
        title: columnHeadings[key] || key.replace(/([A-Z])/g, " $1").trim(),
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
              showSearch
              onChange={(value) => handleFilterChange(value, key)}
              style={{ width: "100%" }}
              dropdownMatchSelectWidth={false}
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
                showSearch
                value={editedRow[key]}
                onChange={(value) => handleChange(value, key)}
                style={{ width: "100%" }}
                dropdownMatchSelectWidth={false}
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
    // {
    //   title: "Actions",
    //   render: (_, record) =>
    //     editingKey === record.id ? (
    //       <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} />
    //     ) : (
    //       <Button
    //         icon={<EditOutlined />}
    //         onClick={() => handleEdit(record.id)}
    //       />
    //     ),
    // },
    {
      title: "Actions",
      render: (_, record) => {
        const createdAt = dayjs(record.created_at);
        const isEditable = dayjs().diff(createdAt, "day") <= 3; // Check if within 3 days

        return editingKey === record.id ? (
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} />
        ) : (
          <Tooltip
            title={!isEditable ? "You can't edit because time is over" : ""}>
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record.id)}
              disabled={!isEditable} // Disable button after 3 days
            />
          </Tooltip>
        );
      },
    },
  ];

  // const columns = [
  //   ...Object.keys(data[0] || {})
  //     .filter((key) => !["id", "user_id", "key"].includes(key))
  //     .map((key) => ({
  //       title: key.replace(/([A-Z])/g, " $1").trim(),
  //       dataIndex: key,
  //       key,
  //       filterDropdown: () =>
  //         key.toLowerCase().includes("date") ? (
  //           <DatePicker
  //             onChange={(date, dateString) =>
  //               handleFilterChange(dateString, key)
  //             }
  //             style={{ width: "100%" }}
  //           />
  //         ) : dropdownOptions[key] ? (
  //           <Select
  //             onChange={(value) => handleFilterChange(value, key)}
  //             style={{ width: "100%" }}
  //             allowClear>
  //             {dropdownOptions[key].map((option) => (
  //               <Option key={option} value={option}>
  //                 {option}
  //               </Option>
  //             ))}
  //           </Select>
  //         ) : (
  //           <Input
  //             onChange={(e) => handleFilterChange(e.target.value, key)}
  //             placeholder={`Search ${key}`}
  //           />
  //         ),
  //       onFilter: (value, record) => {
  //         if (!value) return true;
  //         if (key.toLowerCase().includes("date")) {
  //           return dayjs(record[key]).isSame(dayjs(value), "day");
  //         }
  //         return record[key]
  //           ?.toString()
  //           .toLowerCase()
  //           .includes(value.toLowerCase());
  //       },
  //       render: (text, record) =>
  //         editingKey === record.id ? (
  //           dropdownOptions[key] ? (
  //             <Select
  //               value={editedRow[key]}
  //               onChange={(value) => handleChange(value, key)}
  //               style={{ width: "100%" }}>
  //               {dropdownOptions[key].map((option) => (
  //                 <Option key={option} value={option}>
  //                   {option}
  //                 </Option>
  //               ))}
  //             </Select>
  //           ) : key.toLowerCase().includes("date") ? (
  //             <DatePicker
  //               value={editedRow[key] ? dayjs(editedRow[key]) : null}
  //               onChange={(date, dateString) => handleChange(dateString, key)}
  //               style={{ width: "100%" }}
  //             />
  //           ) : (
  //             <Input
  //               value={editedRow[key]}
  //               onChange={(e) => handleChange(e.target.value, key)}
  //             />
  //           )
  //         ) : (
  //           text
  //         ),
  //     })),
  //   {
  //     title: "Actions",
  //     render: (_, record) =>
  //       editingKey === record.id ? (
  //         <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} />
  //       ) : (
  //         <Button
  //           icon={<EditOutlined />}
  //           onClick={() => handleEdit(record.id)}
  //         />
  //       ),
  //   },
  // ];

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
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

export default AdvertiserData;
