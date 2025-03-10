import React, { useState, useEffect } from "react";
import { Table, Input, Select, Button, Form, message, Spin, Card } from "antd";

const { Option } = Select;

const apiUrl =
  import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";

const AdminHomepage = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("publisher");
  const [rangeStart, setRangeStart] = useState();
  const [rangeEnd, setRangeEnd] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Sub-Admins from API
  useEffect(() => {
    const fetchSubAdmins = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/get-subadmin`);
        const data = await response.json();
        if (response.ok) {
          setSubAdmins(data.data);
        } else {
          setError(data.message || "Failed to fetch sub-admins.");
        }
      } catch (err) {
        setError("An error occurred while fetching sub-admins.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubAdmins();
  }, []);

  // Create Sub-Admin Function
  const handleCreateSubAdmin = async () => {
    if (!username || !password || !rangeStart || !rangeEnd) {
      message.warning("Please fill all fields!");
      return;
    }

    const newSubAdmin = {
      username,
      password,
      role,
      range_start: rangeStart,
      range_end: rangeEnd,
    };

    try {
      const response = await fetch(`${apiUrl}/create-subadmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubAdmin),
      });

      const data = await response.json();

      if (response.ok) {
        setUsername("");
        setPassword("");
        setRole("publisher");
        setRangeStart("");
        setRangeEnd("");
        message.success("Sub-Admin created successfully!");
      } else {
        message.error(`Error: ${data.message || "Failed to create sub-admin"}`);
      }
    } catch (error) {
      console.error("Error creating sub-admin:", error);
      message.error("An error occurred while creating the sub-admin.");
    }
  };

  // Define Table Columns
  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Range",
      key: "range",
      render: (record) => `${record.range_start} - ${record.range_end}`,
    },
  ];

  // Filter out "admin" roles
  const filteredSubAdmins = subAdmins.filter(
    (subAdmin) => subAdmin.role !== "admin"
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      {/* Create Sub-Admin Form */}
      <Card className="w-full" title="Create Sub-Admin">
        <Form layout="vertical" onFinish={handleCreateSubAdmin}>
          <Form.Item label="Username" required>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </Form.Item>

          <Form.Item label="Password" required>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </Form.Item>

          <Form.Item label="Role" required>
            <Select value={role} onChange={(value) => setRole(value)}>
              <Option value="publisher">Publisher</Option>
              <Option value="advertiser">Advertiser</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Range" required>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={rangeStart}
                onChange={(e) => setRangeStart(Number(e.target.value))}
                placeholder="Start"
              />
              <span>-</span>
              <Input
                type="number"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(Number(e.target.value))}
                placeholder="End"
              />
            </div>
          </Form.Item>

          <Button type="primary" htmlType="submit" className="w-full">
            Create Sub-Admin
          </Button>
        </Form>
      </Card>

      {/* Sub-Admin List */}
      <div className="mt-8 w-full">
        <Card title="Sub-Admins List">
          {loading ? (
            <Spin />
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredSubAdmins}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminHomepage;
