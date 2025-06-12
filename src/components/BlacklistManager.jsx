import React, { useEffect, useState } from "react";
import { Table, Select, Button, Space, Tag } from "antd";
import axios from "axios";
import Swal from "sweetalert2";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const BlacklistManager = () => {
  const [pids, setPids] = useState([]);
  const [selectedPIDs, setSelectedPIDs] = useState();
  const [blacklistedData, setBlacklistedData] = useState([]);
  const [loading, setLoading] = useState(false);
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
    if (selectedPIDs.length === 0) {
      Swal.fire("Warning", "Please select at least one PID", "warning");
      return;
    }

    console.log("Selected PIDs for blacklisting:", selectedPIDs);

    try {
      setLoading(true);

      for (const pid of selectedPIDs) {
        await axios.post(`${apiUrl}/add-blacklist`, { pid }); // 👈 Send one at a time
      }

      Swal.fire("Success", "PIDs blacklisted successfully", "success");
      setSelectedPIDs([]);
      fetchBlacklisted();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to blacklist PIDs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblacklist = async (pid) => {
    const confirm = await Swal.fire({
      title: `Unblacklist PID: ${pid}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, unblacklist",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      try {
        setLoading(true);
        await axios.post(`${apiUrl}/unblacklist`, { pid });
        Swal.fire("Success", `PID ${pid} unblacklisted`, "success");
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
      title: "PID",
      dataIndex: "pid",
      key: "pid",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Blacklisted On",
      dataIndex: "date",
      key: "date",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          danger
          onClick={() => handleUnblacklist(record.pid)}>
          Unblacklist
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">PID Blacklist Manager</h2>

      <div className="mb-6">
        <label className="block font-medium mb-2 text-gray-700">
          Select PIDs to Blacklist
        </label>
        <Space direction="horizontal" wrap>
          <Select
            allowClear
            showSearch
            style={{ width: 400 }}
            placeholder="Search and select PIDs"
            value={selectedPIDs}
            onChange={setSelectedPIDs}
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
            pid: item.pid,
            date: item.date,
          }))}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
          }}
          rowKey="pid"
        />
      </div>
    </div>
  );
};

export default BlacklistManager;
