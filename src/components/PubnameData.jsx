import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Input } from "antd";

const apiUrl = import.meta.env.VITE_API_URL || "https://api.clickorbits.in/api";

const PubnameData = () => {
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-Namepub/`);

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
    [item.username, item.pub_name, item.pub_id].some((field) =>
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
      title: "Publisher Name",
      dataIndex: "pub_name",
      key: "pub_name",
    },
    {
      title: "Publisher ID",
      dataIndex: "pub_id",
      key: "pub_id",
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
        pagination={{
          pageSizeOptions: ["10", "20", "50", "100"], // Define available page sizes
          showSizeChanger: true, // Allow changing page size
          defaultPageSize: 10, // Set the default page size
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`, // Optional: Show total records
        }}
        bordered
        className="mt-5"
      />
    </div>
  );
};

export default PubnameData;
