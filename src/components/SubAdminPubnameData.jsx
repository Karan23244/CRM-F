import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Input, Select, Button, Space } from "antd";
import geoData from "../Data/geoData.json";
import { useSelector } from "react-redux";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const SubAdminPubnameData = () => {
  const user = useSelector((state) => state.auth.user);
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // **Fetch publisher data**
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-Namepub/`);

        if (response.data && Array.isArray(response.data.data)) {
          setTableData(response.data.data);
        } else {
          console.error("Unexpected response format:", response.data);
          setTableData([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // **Filtered data for search**
const filteredData = tableData
  .filter((item) => user?.assigned_subadmins?.includes(item.user_id))
  .filter((item) =>
    [item.username, item.pub_name, item.pub_id, item.geo, item.note].some(
      (field) =>
        field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // **Table Columns**
  const columns = [
    { title: "UserName", dataIndex: "username", key: "username" },
    { title: "Publisher Name", dataIndex: "pub_name", key: "pub_name" },
    { title: "Publisher ID", dataIndex: "pub_id", key: "pub_id" },
    { title: "Geo", dataIndex: "geo", key: "geo" },
    { title: "Note", dataIndex: "note", key: "note" },
  ];

  return (
    <div className="m-6 p-6 bg-white shadow-md rounded-lg">
      {/* Search Input */}
      <Input
        placeholder="Search by Publisher Name, Geo, or Note"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-1/3 p-2 border rounded"
      />

      {/* Table Component */}
      <Table
        dataSource={filteredData}
        columns={columns}
        rowKey="pub_id"
        pagination={{
          pageSizeOptions: ["10", "20", "50", "100"],
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        bordered
        className="mt-5"
        scroll={{ x: "max-content" }}
      />
    </div>
  );
};

export default SubAdminPubnameData;
