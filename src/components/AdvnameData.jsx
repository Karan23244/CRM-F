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
  const filteredSubAdmins = subAdmins.filter(
    (subAdmin) => subAdmin.role !== "admin" && subAdmin.role !== "publisher"
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

const AdvnameData = () => {
  const [selectedSubAdmins, setSelectedSubAdmins] = useState([]);
  const [roleData, setRoleData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = selectedSubAdmins.map((admin) =>
          axios.get(`${apiUrl}/advid-data/${admin.value}`)
        );
        const responses = await Promise.all(promises);
        console.log(responses);
        // Convert API responses into structured data
        const newRoleData = responses.map((res, index) => ({
          adminId: selectedSubAdmins[index].value, // Ensure correct mapping
          name: selectedSubAdmins[index].label, // Add sub-admin name
          role: selectedSubAdmins[index].role, // Use role from selection
          data: res.data.advertisements,
        }));
        console.log(newRoleData);
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
const DataTable = ({ name, role, data }) => {
  console.log(data);
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Advertiser Name",
      dataIndex: "adv_name",
      key: "adv_name",
    },
    {
      title: "Advertiser ID",
      dataIndex: "adv_id",
      key: "adv_id",
    },
  ];

  return (
    <div className="mt-6 border p-4 rounded shadow-lg">
      <h2 className="text-xl font-semibold mb-2">
        {name} ({role})
      </h2>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default AdvnameData;
