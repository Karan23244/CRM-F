import React, { useState, useEffect } from "react";
import { Table, Input, Select, Button, Form, message, Spin, Card } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";

const SubAdminForm = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("publisher");
  const [ranges, setRanges] = useState([{ start: "", end: "" }]);
  const [assignedSubAdmins, setAssignedSubAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subAdminOptions, setSubAdminOptions] = useState([]);

  useEffect(() => {
    fetchSubAdmins();
  }, []);
  // Fetch Sub-Admins
  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/get-subadmin`);

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setSubAdmins(
          data.data.filter((subAdmin) =>
            ["advertiser", "publisher", "manager"].includes(subAdmin.role)
          )
        );
        setSubAdminOptions(
          data.data.filter((subAdmin) =>
            ["advertiser", "publisher"].includes(subAdmin.role)
          )
        );
      } else {
        setError(data.message || "Failed to fetch sub-admins.");
      }
    } catch (err) {
      setError("An error occurred while fetching sub-admins.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add New Range
  const addRange = () => {
    setRanges([...ranges, { start: "", end: "" }]);
  };
  const removeRange = (index) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter((_, i) => i !== index));
    } else {
      message.warning("At least one range is required!");
    }
  };
  // Handle Change in Ranges
  const handleRangeChange = (index, field, value) => {
    const updatedRanges = [...ranges];
    updatedRanges[index][field] = value;
    setRanges(updatedRanges);
  };

  // Handle Create Sub-Admin
  const handleCreateSubAdmin = async () => {
    if (
      !username ||
      !password ||
      ranges.some((range) => !range.start || !range.end)
    ) {
      alert("Please fill all fields!");
      return;
    }

    const newSubAdmin = {
      username,
      password,
      role,
      ranges,
      assigned_subadmins: role === "manager" ? assignedSubAdmins : [],
    };
    console.log(newSubAdmin);
    try {
      const response = await fetch(`${apiUrl}/create-subadmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubAdmin),
      });
      const data = await response.json();

      if (response.ok) {
        alert("Sub-Admin created successfully!");
        resetForm();
        fetchSubAdmins();
      } else {
        alert(`Error: ${data.message || "Failed to create sub-admin"}`);
      }
    } catch (error) {
      alert("An error occurred while creating the sub-admin.");
    }
  };

  // Reset Form
  const resetForm = () => {
    setUsername("");
    setPassword("");
    setRole("publisher");
    setRanges([{ start: "", end: "" }]);
    setAssignedSubAdmins([]);
  };

  // Define Table Columns
  const columns = [
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Role", dataIndex: "role", key: "role" },
    {
      title: "Ranges",
      key: "ranges",
      render: (record) =>
        record?.ranges?.map((range, i) => (
          <div key={i}>
            {range.start} - {range.end}
          </div>
        )),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
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
              <Option value="manager">Manager</Option>
            </Select>
          </Form.Item>

          {role === "manager" && (
            <Form.Item label="Assign Sub-Admins">
              <Select
                mode="multiple"
                value={assignedSubAdmins}
                onChange={setAssignedSubAdmins}
                placeholder="Select sub-admins">
                {subAdminOptions.map((subAdmin) => (
                  <Option key={subAdmin.id} value={subAdmin.id}>
                    {subAdmin.username} ({subAdmin.role})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Ranges" required>
            {ranges.map((range, index) => (
              <div key={index} className="flex space-x-2 items-center mb-2">
                <Input
                  type="number"
                  value={range.start}
                  onChange={(e) =>
                    handleRangeChange(index, "start", e.target.value)
                  }
                  placeholder="Start"
                />
                <span>-</span>
                <Input
                  type="number"
                  value={range.end}
                  onChange={(e) =>
                    handleRangeChange(index, "end", e.target.value)
                  }
                  placeholder="End"
                />
                {ranges.length > 1 && (
                  <MinusCircleOutlined
                    className="text-red-500 cursor-pointer"
                    onClick={() => removeRange(index)}
                  />
                )}
              </div>
            ))}
            <Button type="dashed" onClick={addRange} icon={<PlusOutlined />}>
              Add More Ranges
            </Button>
          </Form.Item>

          <Button type="primary" htmlType="submit" className="w-full">
            Create Sub-Admin
          </Button>
        </Form>
      </Card>

      <div className="mt-8 w-full">
        <Card title="Sub-Admins List">
          {loading ? (
            <Spin />
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <Table
              columns={columns}
              dataSource={subAdmins}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default SubAdminForm;
