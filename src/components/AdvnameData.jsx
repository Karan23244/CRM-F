import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Input } from "antd";

const apiUrl = import.meta.env.VITE_API_URL || "https://api.clickorbits.in/api";

const AdvnameData = () => {
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-NameAdv/`);

        // Extracting data correctly
        if (response.data && Array.isArray(response.data.data)) {
          setTableData(response.data.data); // Setting tableData to the extracted array
        } else {
          console.error("Unexpected response format:", response.data);
          setTableData([]); // Fallback to empty array
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);


  // Filtering data based on search input for multiple fields
  const filteredData = tableData.filter((item) =>
    [item.username, item.adv_name, item.adv_id].some((field) =>
      field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Table columns definition
  const columns = [
    {
      title: "UserName",
      dataIndex: "username",
      key: "username",
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
    <div className="m-6">
      {/* Search Input */}
      <Input
        placeholder="Search by Advertiser Name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-1/3 p-2 border rounded"
      />
      
      {/* Table Component */}
      <Table
        dataSource={filteredData}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default AdvnameData;
