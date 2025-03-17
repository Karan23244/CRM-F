import React, { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";
import { Table, Input, Button, message, DatePicker } from "antd";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://api.clickorbits.in/api";
const { RangePicker } = DatePicker;
const SubAdminDropdown = ({ onSelect }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [selectedSubAdmins, setSelectedSubAdmins] = useState([]);

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-subadmin`);
        console.log(response);
        if (response.data.success) {
          const subAdminOptions = response.data.data.map((subAdmin) => ({
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
  }, []);
  const handleChange = (selectedOptions) => {
    setSelectedSubAdmins(selectedOptions || []); // Ensure it does not become null
    onSelect(selectedOptions || []);
  };
  // Filter out "admin" roles
  const filteredSubAdmins = subAdmins.filter(
    (subAdmin) => subAdmin.role !== "admin"
  );
  return (
    <Select
      options={filteredSubAdmins}
      value={selectedSubAdmins}
      onChange={handleChange}
      placeholder="Select Sub-Admins..."
      isMulti
      menuPortalTarget={document.body}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
    />
  );
};

const DataTable = ({ role, data, name,fetchData }) => {
  return role === "publisher" ? (
    <PublisherComponent data={data} name={name} role={role} fetchData={fetchData}/>
  ) : role === "advertiser" ? (
    <AdvertiserData data={data} name={name} role={role} />
  ) : role === "manager" ? (
    <>
      <PublisherComponent data={data} name={name} role={role} fetchData={fetchData}/>
      <AdvertiserData data={data} name={name} role={role} />
    </>
  ) : (
    <div>No matching role found</div>
  );
};
const MainComponent = () => {
  const [selectedSubAdmins, setSelectedSubAdmins] = useState([]);
  const [roleData, setRoleData] = useState([]);

  // Define fetchData at the top level
  const fetchData = async () => {
    try {
      const promises = selectedSubAdmins.map((admin) =>
        axios.get(`${apiUrl}/user-data/${admin.value}`)
      );
      const responses = await Promise.all(promises);
      
      const newRoleData = responses.map((res, index) => ({
        adminId: selectedSubAdmins[index].value,
        name: selectedSubAdmins[index].label,
        role: selectedSubAdmins[index].role,
        data: res.data.data,
      }));

      setRoleData(newRoleData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (selectedSubAdmins.length > 0) {
      fetchData();
    } else {
      setRoleData([]);
    }
  }, [selectedSubAdmins]);

  return (
    <div className="m-6">
      <SubAdminDropdown onSelect={setSelectedSubAdmins} />
      {roleData.length > 0 &&
        roleData.map((data, index) => (
          <DataTable
            key={index}
            name={data.name}
            role={data.role}
            data={data.data}
            fetchData={fetchData}  // Pass fetchData to DataTable
            className="overflow-x-auto"
          />
        ))}
    </div>
  );
};


export default MainComponent;

const AdvertiserData = ({ data, name, role }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500">No data available</p>;
  }
  const filteredData =
    role === "advertiser"
      ? data.map(({ adv_id, user_id, id, ...rest }) => rest)
      : role === "manager"
      ? data.advertiser_data.map(({ adv_id, user_id, id, ...rest }) => rest)
      : [];
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
    const title = columnHeadings[key] || key.replace(/([A-Z])/g, " $1").trim(); // Use custom title or fallback
    if (key.toLowerCase().includes("date")) {
      return {
        title,
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
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};
const PublisherComponent = ({ data, name, role,fetchData }) => {
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [loading, setLoading] = useState(false);
  const [reviewOptions, setReviewOptions] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [filters, setFilters] = useState({});
  console.log("Publisher Data:", data.publisher_data);
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

  const handleEdit = (id, record) => {
    setEditingKey(id);
    setEditedRow({ ...record }); // Store the entire row data, including review
  };

  const handleSave = async (id) => {
    console.log("i am hitting", data.publisher_data);
  
    const originalRow = data.publisher_data.find((row) => row.id === id);
    console.log("originalRow", originalRow);
  
    if (!originalRow) {
      console.error(`Row with id ${id} not found!`);
      return;
    }
  
    try {
      const updatedData = {
        ...originalRow, // Keep all other fields unchanged
        ...editedRow, // Merge updated review data
        review:
          typeof editedRow.review === "object"
            ? editedRow.review.label
            : editedRow.review,
      };
  
      console.log("updatedData", updatedData); // Debugging output
  
      await axios.post(`${apiUrl}/pubdata-update/${id}`, updatedData, {
        headers: { "Content-Type": "application/json" },
      });
  
      setEditingKey(null);
      setEditedRow({}); // Reset edited row
      fetchData();
      console.log("Reset editing key and edited row");
  
      message.success("Review updated successfully");
    } catch (error) {
      console.error("Error updating review:", error);
      message.error("Failed to update review");
    }
  };
  
  const handleChange = (value) => {
    setEditedRow((prev) => ({
      ...prev, // Keep all other fields unchanged
      review: value, // Update only the review field
    }));
  };

  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500">No data available</p>;
  }
  const filteredData =
    role === "publisher"
      ? data.map(({ adv_id, user_id, id, created_at, ...rest }) => ({
          id, // Ensure the ID remains for tracking
          ...rest,
        }))
      : role === "manager"
      ? data.publisher_data.map(
          ({ adv_id, user_id, id, created_at, ...rest }) => ({
            id, // Ensure the ID remains for tracking
            ...rest,
          })
        )
      : [];

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

  const columns = Object.keys(filteredData[0] || {}).map((key) => {
    if (key.toLowerCase().includes("date")) {
      return {
        title: columnHeadings[key] || key, // Use mapped heading or fallback to key
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
            placeholder="Select Review"
            options={reviewOptions}
          />
        ) : (
          text
        ),
    };
  });

  if (showEdit) {
    columns.push({
      title: "Actions",
      render: (_, record) =>
        editingKey === record.id ? (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => handleSave(record.id)} // Pass `id` to `handleSave`
          />
        ) : (
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id, record)}
          />
        ),
    });
  }

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
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};
