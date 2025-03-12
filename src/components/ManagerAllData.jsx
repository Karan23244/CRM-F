import React, { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";
import { Table, Input, Button, message, DatePicker } from "antd";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

const apiUrl =
  import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";
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

const DataTable = ({ role, data, name }) => {
  return role === "publisher" ? (
    <PublisherComponent data={data} name={name} />
  ) : role === "advertiser" ? (
    <AdvertiserData data={data} name={name} />
  ) : (
    <div>No matching role found</div>
  );
};

const PublisherComponent = ({ data, name }) => {
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [loading, setLoading] = useState(false);
  const [reviewOptions, setReviewOptions] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchReviews();
    setTimeout(() => {
      setShowEdit(true);
    }, 2000);
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-reviews`);
      setReviewOptions(
        response.data?.data?.map((item) => ({
          value: item.review_text,
          label: item.review_text,
        })) || []
      );
    } catch (error) {
      message.error("Failed to fetch reviews");
    }
  };

  const handleEdit = (id) => {
    setEditingKey(id);
    setEditedRow(data.find((row) => row.id === id) || {});
  };

  const handleSave = async () => {
    try {
      const updatedData = { ...editedRow, review: editedRow.review.label };
      await axios.post(`${apiUrl}/pubdata-update/${editingKey}`, updatedData, {
        headers: { "Content-Type": "application/json" },
      });
      setEditingKey(null);
      message.success("Data updated successfully");
    } catch (error) {
      message.error("Failed to update data");
    }
  };

  const handleChange = (value) => {
    setEditedRow((prev) => ({ ...prev, review: value }));
  };

  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

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

  const filteredColumns = Object.keys(data[0] || {}).filter(
    (key) => !["id", "user_id", "key", "created_at"].includes(key)
  );
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
    ...filteredColumns.map((key) => {
      if (key.toLowerCase().includes("date")) {
        return {
          title: columnHeadings[key] || key, // Apply custom heading
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
        ...new Set(data.map((item) => item[key]).filter(Boolean)),
      ];

      return {
        title: columnHeadings[key] || key, // Apply custom heading
        dataIndex: key,
        key,
        filters: uniqueValues.map((val) => ({ text: val, value: val })),
        onFilter: (value, record) => record[key] === value,
        render: (text, record) =>
          editingKey === record.id && key === "review" ? (
            <Select
              value={editedRow.review || undefined}
              onChange={handleChange}
              style={{ width: "100%" }}
              dropdownMatchSelectWidth={false} 
              placeholder="Select Review"
              options={reviewOptions}
            />
          ) : (
            text
          ),
      };
    }),
    showEdit && {
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
  ].filter(Boolean);

  return (
    <div className="p-4 bg-gray-100 flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Publisher Data of {name}</h1>
      </div>
      <div className="w-full overflow-auto bg-white p-4 rounded shadow-md">
        <Table
          columns={columns}
          dataSource={filteredRecords}
          pagination={{ pageSize: 10 }}
          bordered
          loading={loading}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
};

const MainComponent = () => {
  const [selectedSubAdmins, setSelectedSubAdmins] = useState([]);
  const [roleData, setRoleData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = selectedSubAdmins.map((admin) =>
          axios.get(`${apiUrl}/user-data/${admin.value}`)
        );
        const responses = await Promise.all(promises);

        // Convert API responses into structured data
        const newRoleData = responses.map((res, index) => ({
          adminId: selectedSubAdmins[index].value, // Ensure correct mapping
          name: selectedSubAdmins[index].label, // Add sub-admin name
          role: selectedSubAdmins[index].role, // Use role from selection
          data: res.data.data,
        }));

        setRoleData(newRoleData); // Update state with all selected sub-admins' data
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (selectedSubAdmins.length > 0) {
      fetchData();
    } else {
      setRoleData([]); // Reset when nothing is selected
    }
  }, [selectedSubAdmins]);

  return (
    <div className="m-6">
      <SubAdminDropdown onSelect={setSelectedSubAdmins} />
      {roleData.length > 0 &&
        roleData.map((data, index) => (
          <DataTable
            key={index}
            name={data.name} // Pass the sub-admin name
            role={data.role}
            data={data.data}
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
      title : columnHeadings[key] || key.replace(/([A-Z])/g, " $1").trim(),
      dataIndex: key,
      key,
      filters: uniqueValues.map((val) => ({ text: val, value: val })),
      onFilter: (value, record) => record[key] === value,
    };
  });

  return (
    <div className="p-4 bg-gray-100 flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Advertiser Data of {name}</h1>
      </div>
      <div className="w-full overflow-auto bg-white p-4 rounded shadow-md">
        <Table
          columns={columns}
          dataSource={filteredRecords}
          pagination={{ pageSize: 10 }}
          bordered
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
};
