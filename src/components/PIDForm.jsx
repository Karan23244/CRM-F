import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Table, Button, Input } from "antd";
import Swal from "sweetalert2";
import { EditOutlined, SearchOutlined } from "@ant-design/icons";
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const PIDForm = () => {
  const user = useSelector((state) => state.auth.user);
  const [pid, setPid] = useState("");
  const [pids, setPids] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 For search input

  // Filtered PID list based on search
  const filteredPids = pids.filter((item) =>
    item.pid.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // Function to fetch all PIDs
  const fetchPids = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-pid`);
      if (response.data && response.data.success) {
        setPids(response.data.data);
      } else {
        console.error("Unexpected API response:", response.data);
      }
    } catch (error) {
      console.error("Error fetching PIDs:", error);
    }
  };

  useEffect(() => {
    fetchPids();
  }, []);

  const handleSubmit = async () => {
    const trimmedPid = pid.trim();
    if (!trimmedPid) return;

    try {
      if (editIndex !== null) {
        const response = await axios.post(`${apiUrl}/update-pid/${editId}`, {
          user_id: user?.id,
          pid: trimmedPid,
        });

        if (response.data.success) {
          Swal.fire("Updated!", "PID updated successfully.", "success");
          fetchPids();
          setEditIndex(null);
          setEditId(null);
        } else {
          Swal.fire("Error!", "Failed to update PID.", "error");
        }
      } else {
        const response = await axios.post(`${apiUrl}/add-pid`, {
          user_id: user?.id,
          pid: trimmedPid,
        });

        if (response.status === 500) {
          Swal.fire("Warning", "PID already exists!", "warning");
        } else if (response.data.success) {
          Swal.fire("Success!", "PID added successfully.", "success");
          fetchPids();
        } else {
          Swal.fire("Error!", "Failed to add PID.", "error");
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 500) {
        Swal.fire("Warning", "PID already exists!", "warning");
      } else {
        console.error("Error:", error);
        Swal.fire("Error", "Something went wrong. Please try again.", "error");
      }
    }

    setPid("");
  };

  const handleEdit = (record) => {
    setPid(record.pid);
    setEditId(record.id);
  };

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "PID",
      dataIndex: "pid",
      key: "pid",
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Button type="primary" onClick={() => handleEdit(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="mt-10 bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800">Add PID</h3>
      </div>

      {/* PID Entry Input */}
      <div className="relative w-full sm:w-96 mb-6">
        <Input
          id="pid"
          value={pid}
          onChange={(e) => setPid(e.target.value)}
          className=" pt-4 pb-1 !rounded-lg shadow-sm focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500"
          placeholder="Enter PID"
        />
        <Button type="primary" className="mt-3" onClick={handleSubmit}>
          {editIndex !== null ? "Update PID" : "Add PID"}
        </Button>
      </div>

      {/* Table */}
      <div className="mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-md font-semibold text-gray-700">Event List</h3>
        <div className="relative mt-4 sm:mt-0 w-full sm:w-72">
          <Input
            placeholder="Search Event..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-2 !rounded-lg shadow-sm focus:!border-blue-500 focus:!ring-1 focus:!ring-blue-500"
          />
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={filteredPids}
        rowKey={(record) => record.id}
        pagination={{
          pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        className="rounded-lg shadow-sm"
      />
    </div>
    </div>
  );
};

export default PIDForm;
