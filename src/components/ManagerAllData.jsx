import React, { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";
import { Table, Input, Button, message, DatePicker } from "antd";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { exportToExcel } from "./exportExcel";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";
const { RangePicker } = DatePicker;
const SubAdminDropdown = ({ onSelect }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [selectedSubAdmins, setSelectedSubAdmins] = useState([]);

  // Get assigned sub-admins from Redux
  const user = useSelector((state) => state.auth.user);
  const assignedSubAdmins = user?.assigned_subadmins || [];

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-subadmin`);
        if (response.data.success) {
          const subAdminOptions = response.data.data
            .filter((subAdmin) => assignedSubAdmins.includes(subAdmin.id)) // Filter only assigned sub-admins
            .map((subAdmin) => ({
              value: subAdmin.id,
              label: subAdmin.username,
              role: subAdmin.role,
            }));
          setSubAdmins(subAdminOptions);
        }
      } catch (error) {
        console.error("Error fetching sub-admins:", error);
      }
    };

    fetchSubAdmins();
  }, [assignedSubAdmins]); // Refetch if assigned sub-admins change

  const handleChange = (selectedOptions) => {
    setSelectedSubAdmins(selectedOptions || []); // Ensure it does not become null
    onSelect(selectedOptions || []);
  };

  return (
    <Select
      options={subAdmins}
      value={selectedSubAdmins}
      onChange={handleChange}
      placeholder="Select Sub-Admins..."
      isMulti
      menuPortalTarget={document.body}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
    />
  );
};

const DataTable = ({ role, data, name, fetchData }) => {
  return role === "publisher" ? (
    <PublisherComponent data={data} name={name} fetchData={fetchData} />
  ) : role === "advertiser" ? (
    <AdvertiserData data={data} name={name} />
  ) : (
    <div>No matching role found</div>
  );
};

const PublisherComponent = ({ data, name, fetchData }) => {
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  // Check if a column has all empty values
  const isColumnEmpty = (data, key) => {
    return data.every(
      (item) =>
        item[key] === null || item[key] === "" || item[key] === undefined
    );
  };

  // Enable editing for the selected row
  const handleEdit = (id) => {
    setEditingKey(id);
    setEditedRow(data.find((row) => row.id === id) || {});
  };

  // Save updated data to backend
  const handleSave = async () => {
    try {
      const updatedData = {
        ...editedRow,
      };
      // // Send the updated data to the API
      await axios.post(`${apiUrl}/pubdata-update/${editingKey}`, updatedData, {
        headers: { "Content-Type": "application/json" },
      });

      setEditingKey(null);
      alert("Data updated successfully");
      fetchData();
    } catch (error) {
      alert("Failed to update data", error);
    }
  };

  // Handle change for editable fields
  const handleChange = (value, key) => {
    setEditedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle filters for date and other fields
  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Apply filters to data
  const filteredRecords = data.filter((item) => {
    return Object.keys(filters).every((key) => {
      if (!filters[key]) return true;

      if (Array.isArray(filters[key]) && filters[key].length === 2) {
        const [start, end] = filters[key];
        return dayjs(item[key]).isBetween(start, end, null, "[]");
      }

      return item[key] === filters[key];
    });
  });

  // Define editable column headings
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

  // Define editable keys
  const editableFields = [
    "paused_date",
    "pub_total_numbers",
    "pub_deductions",
    "pub_approved_numbers",
  ];

  // Define table columns with editable fields
  const columns = [
    ...Object.keys(data[0] || {})
      .filter(
        (key) =>
          !["id", "user_id", "key", "created_at"].includes(key) &&
          // ✅ Exclude `adv_name` if it's empty
          !(key === "adv_name" && isColumnEmpty(data, "adv_name"))
      )
      .map((key) => ({
        title: columnHeadings[key] || key,
        dataIndex: key,
        key,
        filters: Array.from(new Set(data.map((item) => item[key]))).map(
          (val) => ({
            text: val,
            value: val,
          })
        ),
        onFilter: (value, record) => record[key] === value,
        render: (text, record) => {
          // Show editable fields for specific columns
          if (editingKey === record.id && editableFields.includes(key)) {
            if (key.toLowerCase().includes("date")) {
              return (
                <DatePicker
                  value={editedRow[key] ? dayjs(editedRow[key]) : null}
                  onChange={(date, dateString) => handleChange(dateString, key)}
                  style={{ width: "100%" }}
                />
              );
            } else {
              return (
                <Input
                  value={editedRow[key]}
                  onChange={(e) => handleChange(e.target.value, key)}
                />
              );
            }
          }
          return text;
        },
      })),
    {
      title: "Actions",
      fixed: "right",
      key: "actions",
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
    <div className="p-4 flex flex-col">
      <Button
        type="primary"
        onClick={() => exportToExcel(data, "Sub-publisher-data.xlsx")}
        className="w-3xs mb-5">
        Download Excel
      </Button>
      <div>
        <h1 className="text-lg font-semibold">Publisher Data of {name}</h1>
      </div>
      <div className="w-full overflow-auto bg-white p-4 rounded shadow-md">
        <Table
          columns={columns}
          dataSource={filteredRecords}
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"], // Define available page sizes
            showSizeChanger: true, // Allow changing page size
            defaultPageSize: 10, // Set the default page size
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`, // Optional: Show total records
          }}
          bordered
          loading={loading}
          rowKey="id"
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

const MainComponent = () => {
  const [selectedSubAdmins, setSelectedSubAdmins] = useState([]);
  const [roleData, setRoleData] = useState([]);

  // ✅ Move fetchData outside of useEffect
  const fetchData = async () => {
    try {
      const promises = selectedSubAdmins.map((admin) =>
        axios.get(`${apiUrl}/user-data/${admin.value}`)
      );
      const responses = await Promise.all(promises);

      // Convert API responses into structured data
      const newRoleData = responses.map((res, index) => ({
        adminId: selectedSubAdmins[index].value,
        name: selectedSubAdmins[index].label,
        role: selectedSubAdmins[index].role,
        data: res.data.data,
      }));

      setRoleData(newRoleData); // Update state with all selected sub-admins' data
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (selectedSubAdmins.length > 0) {
      fetchData(); // ✅ Fetch data when sub-admins are selected
    } else {
      setRoleData([]); // ✅ Reset data when no selection
    }
  }, [selectedSubAdmins]);
  return (
    <div className="m-6">
      {/* ✅ Sub-admin dropdown */}
      <SubAdminDropdown onSelect={setSelectedSubAdmins} />

      {/* ✅ Render data when available */}
      {roleData.length > 0 &&
        roleData.map((data, index) => (
          <DataTable
            key={index}
            name={data.name}
            role={data.role}
            data={data.data}
            fetchData={fetchData} // ✅ Pass fetchData to DataTable
            className="overflow-x-auto"
          />
        ))}
    </div>
  );
};

export default MainComponent;

const AdvertiserData = ({ data, name }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500">No data available</p>;
  }

  const filteredData = data.map(({ adv_id, user_id, id, ...rest }) => rest);
  const [filters, setFilters] = useState({});

  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredRecords = filteredData.filter((item) => {
    return Object.keys(filters).every((key) => {
      if (!filters[key]) return true;

      if (Array.isArray(filters[key]) && filters[key].length === 2) {
        const [start, end] = filters[key];
        return dayjs(item[key]).isBetween(start, end, null, "[]");
      }

      return item[key] === filters[key];
    });
  });
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
    p_id: "PID",
    shared_date: "Shared Date",
    paused_date: "Paused Date",
    adv_total_numbers: "ADV Total Numbers",
    adv_deductions: "ADV Deductions",
    adv_approved_numbers: "ADV Approved Numbers",
  };
  const columns = Object.keys(filteredData[0] || {}).map((key) => {
    const title = columnHeadings[key] || key.replace(/([A-Z])/g, " $1").trim();
    if (key.toLowerCase().includes("date")) {
      return {
        title, // Use custom title or fallback
        dataIndex: key,
        key,
        filterDropdown: () => (
          <RangePicker
            onChange={(dates) => handleFilterChange(dates, key)}
            style={{ width: "100%" }}
          />
        ),
      };
    }

    const uniqueValues = [
      ...new Set(filteredData.map((item) => item[key]).filter(Boolean)),
    ];

    return {
      title: columnHeadings[key] || key.replace(/([A-Z])/g, " $1").trim(),
      dataIndex: key,
      key,
      filters: uniqueValues.map((val) => ({ text: val, value: val })),
      onFilter: (value, record) => record[key] === value,
    };
  });

  return (
    <div className="p-4 flex flex-col">
      <Button
        type="primary"
        onClick={() => exportToExcel(data, "Sub-publisher-data.xlsx")}
        className="w-3xs mb-5">
        Download Excel
      </Button>
      <div>
        <h1 className="text-lg font-semibold">Advertiser Data of {name}</h1>
      </div>
      <div className="w-full overflow-auto bg-white p-4 rounded shadow-md">
        <Table
          columns={columns}
          dataSource={filteredRecords}
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"], // Define available page sizes
            showSizeChanger: true, // Allow changing page size
            defaultPageSize: 10, // Set the default page size
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`, // Optional: Show total records
          }}
          bordered
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};
