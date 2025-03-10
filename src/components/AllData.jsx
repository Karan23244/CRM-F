import React, { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";
import { Table, Input, Button, message } from "antd";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

const apiUrl =
  import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";

const SubAdminDropdown = ({ onSelect }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [selectedSubAdmins, setSelectedSubAdmins] = useState([]);

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-subadmin`);
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
    setSelectedSubAdmins(selectedOptions);
    onSelect(selectedOptions);
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

const DataTable = ({ role, data }) => {
  return role === "publisher" ? (
    <PublisherComponent data={data} />
  ) : role === "advertiser" ? (
    <AdvertiserData data={data} />
  ) : (
    <div>No matching role found</div>
  );
};

const PublisherComponent = ({ data }) => {
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [loading, setLoading] = useState(false);
  const [reviewOptions, setReviewOptions] = useState([]);
  const [showEdit, setShowEdit] = useState(false);

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
          label: item.review_text, // Fix to properly display options
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
      const updatedData = { ...editedRow, review: editedRow.review.label }; // Preserve other fields
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
    setEditedRow((prev) => ({ ...prev, review: value })); // Store review as a string
  };

  const filteredColumns = data?.length
    ? Object.keys(data[0]).filter((key) => key !== "id")
    : [];

  const columns = [
    ...filteredColumns.map((key) => ({
      title: key.replace(/([A-Z])/g, " $1").trim(),
      dataIndex: key,
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
    })),
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
    <>
      <div className="my-5">
        <h1 className="text-lg font-semibold">Publisher Data</h1>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
        bordered
        loading={loading}
      />
    </>
  );
};

const MainComponent = () => {
  const user = useSelector((state) => state.auth.user);
  const [selectedSubAdmins, setSelectedSubAdmins] = useState([]);
  const [roleData, setRoleData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = selectedSubAdmins.map((admin) =>
          axios.get(`${apiUrl}/user-data/${admin.value}`)
        );
        const responses = await Promise.all(promises);
        setRoleData(
          responses.map((res) => ({
            adminId: res.data.adminId,
            role: res.data.role,
            data: res.data.data,
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

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
            role={data.role}
            data={data.data}
            className="overflow-x-auto"
          />
        ))}
    </div>
  );
};

export default MainComponent;

const AdvertiserData = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500">No data available</p>;
  }

  const filteredData = data.map(({ adv_id, user_id, ...rest }) => rest);

  const columns = Object.keys(filteredData[0] || {}).map((key) => ({
    title: key.replace(/([A-Z])/g, " $1").trim(),
    dataIndex: key,
    key,
  }));

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
      <div>
        <h1 className="text-lg font-semibold">Advertiser Data</h1>
      </div>
      <div className="w-full overflow-auto bg-white p-4 rounded shadow-md">
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
          bordered
        />
      </div>
    </div>
  );
};
