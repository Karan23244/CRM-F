import React, { useEffect, useState } from "react";
import Select from "react-select";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";

const SubAdminDropdown = ({ onSelect }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);

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

  const handleChange = (selectedOption) => {
    setSelectedSubAdmin(selectedOption);
    onSelect(selectedOption);
  };

  return (
    <Select
      options={subAdmins}
      value={selectedSubAdmin}
      onChange={handleChange}
      placeholder="Select Sub-Admin..."
      menuPortalTarget={document.body}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
    />
  );
};

const DataTable = ({ role, data }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{role.toUpperCase()} DATA</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">ID</th>
            <th className="border p-2">Publisher Name</th>
            <th className="border p-2">Campaign Name</th>
            <th className="border p-2">Geo</th>
            <th className="border p-2">City</th>
            <th className="border p-2">OS</th>
            <th className="border p-2">Payable Event</th>
            <th className="border p-2">MMP Tracker</th>
            <th className="border p-2">Adv Payout</th>
            <th className="border p-2">Shared Date</th>
            <th className="border p-2">Paused Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border">
              <td className="border p-2">{item.id}</td>
              <td className="border p-2">{item.pub_name}</td>
              <td className="border p-2">{item.campaign_name}</td>
              <td className="border p-2">{item.geo}</td>
              <td className="border p-2">{item.city}</td>
              <td className="border p-2">{item.os}</td>
              <td className="border p-2">{item.payable_event}</td>
              <td className="border p-2">{item.mmp_tracker}</td>
              <td className="border p-2">{item.adv_payout}</td>
              <td className="border p-2">{item.shared_date}</td>
              <td className="border p-2">{item.paused_date || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MainComponent = () => {
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);
  const [roleData, setRoleData] = useState(null);

  useEffect(() => {
    if (selectedSubAdmin) {
      axios.get(`${apiUrl}/get-data/${selectedSubAdmin.value}`).then((response) => {
        setRoleData(response.data);
      }).catch(error => {
        console.error("Error fetching data:", error);
      });
    }
  }, [selectedSubAdmin]);

  return (
    <div>
      <SubAdminDropdown onSelect={setSelectedSubAdmin} />
      {roleData && <DataTable role={roleData.role} data={roleData.data} />}
    </div>
  );
};

export default MainComponent;
