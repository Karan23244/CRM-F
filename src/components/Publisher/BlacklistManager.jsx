import React, { useEffect, useState } from "react";
import { Table, Select, Button, Input, Space, Tooltip } from "antd";
import { StopOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "axios";
import Swal from "sweetalert2";
import { createNotification } from "../../Utils/Notification";
import { useSelector } from "react-redux";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const BlacklistManager = () => {
  const user = useSelector((state) => state.auth.user);
  const senderData = user;
  const [pids, setPids] = useState([]);
  const [selectedPID, setSelectedPID] = useState("");
  const [blacklistedData, setBlacklistedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPIDs = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get-pid`);
      setPids(res.data.data);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch PIDs", "error");
    }
  };

  const fetchBlacklisted = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get-blacklist`);
      setBlacklistedData(res.data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch blacklist", "error");
    }
  };

  useEffect(() => {
    fetchPIDs();
    fetchBlacklisted();
  }, []);

  const handleBlacklist = async () => {
    if (!selectedPID) {
      Swal.fire("Warning", "Please select a PID", "warning");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${apiUrl}/add-blacklist`, { blacklistID: selectedPID });
      Swal.fire("Success", `PID ${selectedPID} blacklisted`, "success");

      // Notify publisher users
      const { data } = await axios.get(`${apiUrl}/get-subadmin`);
      const allUsers = data?.data || data || [];

      const publisherUsers = allUsers.filter(
        (u) =>
          (u.role === "publisher" || u.role === "publisher_manager") &&
          u.id !== senderData?.id
      );

      const message = `🚫 PID ${selectedPID} has been added to blacklist by ${
        senderData?.username || "a user"
      }`;

      for (const user of publisherUsers) {
        await createNotification({
          sender: senderData?.id,
          receiver: user.id,
          type: "blacklist_update",
          message,
          url: "/dashboard/blacklistpid",
        });
      }

      setSelectedPID("");
      fetchBlacklisted();
    } catch (err) {
      Swal.fire("Error", "Failed to blacklist PID", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblacklist = async (id) => {
    const confirm = await Swal.fire({
      title: "Unblacklist this PID?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, unblacklist",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      try {
        setLoading(true);
        await axios.delete(`${apiUrl}/blacklist-delete/${id}`);
        Swal.fire("Success", `PID unblacklisted successfully`, "success");
        fetchBlacklisted();
      } catch (err) {
        Swal.fire("Error", "Failed to unblacklist PID", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // ✅ Filtered data by search
  const filteredData = blacklistedData.filter((item) =>
    item.blacklistID.toLowerCase().includes(searchTerm.toLowerCase())
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
      title: "Blacklisted PID",
      dataIndex: "blacklistID",
      key: "blacklistID",
      render: (text) => <span className="text-gray-800">{text}</span>,
    },
    {
      title: "Blacklisted On",
      dataIndex: "date",
      key: "date",
      render: (date) =>
        date
          ? new Date(date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-",
    },
    {
      title: "Unblacklist Date",
      dataIndex: "unblacklist_date",
      key: "unblacklist_date",
      render: (date) =>
        date
          ? new Date(date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-",
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Tooltip title="Unblacklist PID">
          <Button
            danger
            type="primary"
            onClick={() => handleUnblacklist(record.id)}
            icon={<StopOutlined />}
            className="!bg-red-500 hover:!bg-red-600 !text-white !rounded-md !border-none">
            Unblacklist
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="m-8 p-6 shadow-xl rounded-2xl">
      <h2 className="text-xl font-semibold mb-6 text-[#2F5D99]">
        Manage Blacklisted PIDs
      </h2>

      {/* ✅ PID Select + Button */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select
          showSearch
          allowClear
          placeholder="Search and select PID..."
          style={{ width: 350 }}
          value={selectedPID}
          onChange={setSelectedPID}
          optionFilterProp="children"
          className="rounded-lg border-gray-300 focus:border-[#2F5D99] focus:ring-1 !h-10 p-4 focus:ring-[#2F5D99]">
          {pids.map((pid) => (
            <Option key={pid.id} value={pid.pid}>
              {pid.pid}
            </Option>
          ))}
        </Select>

        <Button
          type="default"
          onClick={handleBlacklist}
          loading={loading}
          className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-10 !py-5 !h-10 !text-lg !border-none !shadow-md">
          Blacklist PID
        </Button>
      </div>

      {/* ✅ Search Bar */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-semibold text-gray-700">
          Blacklisted PID List
        </h3>
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
          dataSource={filteredData.map((item, index) => ({
            key: index,
            id: item.id,
            blacklistID: item.blacklistID,
            date: item.blacklist_date,
            unblacklist_date: item.unblacklist_date,
          }))}
          loading={loading}
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          rowKey="id"
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

export default BlacklistManager;
