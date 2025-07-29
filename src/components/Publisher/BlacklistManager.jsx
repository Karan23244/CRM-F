import React, { useEffect, useState } from "react";
import { Table, Select, Button, Space, Tag } from "antd";
import axios from "axios";
import Swal from "sweetalert2";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const BlacklistManager = () => {
  const [pids, setPids] = useState([]);
  const [selectedPID, setSelectedPID] = useState("");
  const [blacklistedData, setBlacklistedData] = useState([]);
  const [loading, setLoading] = useState(false);
  console.log(blacklistedData);
  const fetchPIDs = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get-pid`);
      setPids(res.data.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch PIDs", "error");
    }
  };

  const fetchBlacklisted = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get-blacklist`);
      setBlacklistedData(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch blacklist", "error");
    }
  };

  const handleBlacklist = async () => {
    if (!selectedPID) {
      Swal.fire("Warning", "Please select a PID", "warning");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${apiUrl}/add-blacklist`, { blacklistID: selectedPID });
      Swal.fire("Success", `PID ${selectedPID} blacklisted`, "success");
      setSelectedPID(""); // clear after success
      fetchBlacklisted();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to blacklist PID", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblacklist = async (id) => {
    const confirm = await Swal.fire({
      title: `Unblacklist this PID?`,
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
        console.error(err);
        Swal.fire("Error", "Failed to unblacklist PID", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPIDs();
    fetchBlacklisted();
  }, []);

  const columns = [
    {
      title: "Blacklisted PID",
      dataIndex: "blacklistID",
      key: "blacklistID",
    },
    {
      title: "Blacklisted On",
      dataIndex: "date",
      key: "date",
      render: (date) =>
        date
          ? new Date(date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
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
              month: "long",
              year: "numeric",
            })
          : "-",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        console.log("Record:", record); // Debug log
        return (
          <Button
            type="primary"
            danger
            onClick={() => handleUnblacklist(record.id)}>
            Unblacklist
          </Button>
        );
      },
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">PID Blacklist Manager</h2>

      <div className="mb-6">
        <label className="block font-medium mb-2 text-gray-700">
          Select PID to Blacklist
        </label>
        <Space direction="horizontal" wrap>
          <Select
            allowClear
            showSearch
            style={{ width: 400 }}
            placeholder="Search and select a PID"
            value={selectedPID}
            onChange={setSelectedPID}
            optionFilterProp="children">
            {pids.map((pid) => (
              <Option key={pid.id} value={pid.pid}>
                {pid.pid}
              </Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleBlacklist} loading={loading}>
            Blacklist
          </Button>
        </Space>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-4">Blacklisted PIDs</h3>
        <Table
          columns={columns}
          dataSource={blacklistedData.map((item, index) => ({
            key: index,
            id: item.id, // ✅ include id here
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
        />
      </div>
    </div>
  );
};

export default BlacklistManager;
