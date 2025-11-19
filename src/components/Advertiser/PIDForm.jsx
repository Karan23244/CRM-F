import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Table, Button, Input, Tooltip } from "antd";
import { EditOutlined, SearchOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";

const apiUrl =
  import.meta.env.VITE_API_URL;

const PIDForm = () => {
  const user = useSelector((state) => state.auth.user);
  const [pid, setPid] = useState("");
  const [pids, setPids] = useState([]);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch all PIDs
  const fetchPids = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-pid`);
      if (response.data?.success) {
        setPids(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching PIDs:", error);
    }
  };

  useEffect(() => {
    fetchPids();
  }, []);

  // ✅ Handle add / update
  const handleSubmit = async () => {
    const trimmedPid = pid.trim();
    if (!trimmedPid) {
      Swal.fire("Warning", "Please enter a PID", "warning");
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        const response = await axios.post(`${apiUrl}/update-pid/${editId}`, {
          user_id: user?.id,
          pid: trimmedPid,
        });

        if (response.data.success) {
          Swal.fire("Success", "PID updated successfully!", "success");
        } else {
          Swal.fire("Error", "Failed to update PID.", "error");
        }
      } else {
        const response = await axios.post(`${apiUrl}/add-pid`, {
          user_id: user?.id,
          pid: trimmedPid,
        });

        if (response.status === 500) {
          Swal.fire("Warning", "PID already exists!", "warning");
        } else if (response.data.success) {
          Swal.fire("Success", "PID added successfully!", "success");
        } else {
          Swal.fire("Error", "Failed to add PID.", "error");
        }
      }

      setPid("");
      setEditId(null);
      fetchPids();
    } catch (error) {
      if (error.response?.status === 500) {
        Swal.fire("Warning", "PID already exists!", "warning");
      } else {
        Swal.fire("Error", "Something went wrong!", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setPid(record.pid);
    setEditId(record.id);
  };

  // ✅ Filter by search
  const filteredPids = pids.filter((item) =>
    item.pid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Table Columns
  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "PID",
      dataIndex: "pid",
      key: "pid",
      render: (text) => <span className="text-gray-800">{text}</span>,
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Tooltip title="Edit PID">
          <EditOutlined
            onClick={() => handleEdit(record)}
            className="text-[#2F5D99] hover:text-[#24487A] text-lg cursor-pointer"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="m-8 p-6 shadow-xl rounded-2xl">
      <h2 className="text-xl font-semibold mb-6 text-[#2F5D99]">Manage PIDs</h2>

      {/* ✅ Input + Button Row */}
      <div className="flex items-center gap-3 mb-6">
        <Input
          placeholder="Enter PID..."
          value={pid}
          onChange={(e) => setPid(e.target.value)}
          className="h-12 rounded-lg border-gray-300 focus:border-[#2F5D99] focus:ring-1 focus:ring-[#2F5D99] text-base"
        />
        <Button
          type="default"
          onClick={handleSubmit}
          loading={loading}
          className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-10 !py-5 !h-12 !text-lg !border-none !shadow-md">
          {editId ? "Update PID" : "Add PID"}
        </Button>
      </div>

      {/* ✅ Search Bar */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-semibold text-gray-700">PID List</h3>
        <div className="relative w-72">
          <Input
            placeholder="Search PID..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 rounded-lg border-gray-300 focus:border-[#2F5D99] focus:ring-1 focus:ring-[#2F5D99]"
          />
        </div>
      </div>

      {/* ✅ Styled Table */}
      <div className="rounded-lg overflow-hidden shadow">
        <Table
          columns={columns}
          dataSource={filteredPids}
          rowKey="id"
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          className="custom-table"
        />
      </div>

      {/* ✅ Table Style */}
      <style jsx>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: #f2f6fc;
          color: #2f5d99;
          font-weight: 600;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background-color: #f9fbff;
        }
      `}</style>
    </div>
  );
};

export default PIDForm;
