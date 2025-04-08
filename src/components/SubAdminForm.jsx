import React, { useState, useEffect } from "react";
import { Table, Input, Select, Button, Form, message, Spin, Card } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const SubAdminForm = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [username, setUsername] = useState("");
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);
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
  const handleSaveSubAdmin = async () => {
    if (
      !username ||
      (!selectedSubAdmin && !password) ||
      ranges.some((range) => !range.start || !range.end)
    ) {
      alert("Please fill all fields!");
      return;
    }

    const payload = {
      username,
      password: selectedSubAdmin ? password || "" : password, // Ensure password is empty when not updated
      role,
      ranges: ranges.map(({ start, end }) => ({
        start: `${String(start)}`,
        end: `${String(end)}`,
      })),
      assigned_subadmins: role === "manager" ? assignedSubAdmins : [],
    };

  
    if (selectedSubAdmin) {
      payload.id = selectedSubAdmin; // Include ID only for update
    }
    console.log(payload);
    try {
      const response = await fetch(
        `${apiUrl}/${
          selectedSubAdmin ? "update-sub-admin" : "create-subadmin"
        }`,
        {
          method: selectedSubAdmin ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      console.log(response);
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        alert(
          `Sub-Admin ${selectedSubAdmin ? "updated" : "created"} successfully!`
        );
        resetForm();
        fetchSubAdmins();
      } else {
        alert(
          `Error: ${
            data.message ||
            `Failed to ${selectedSubAdmin ? "update" : "create"} sub-admin`
          }`
        );
      }
    } catch (error) {
      alert(
        `An error occurred while ${
          selectedSubAdmin ? "updating" : "creating"
        } the sub-admin.`
      );
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

  const handleEdit = (subAdmin) => {
    setSelectedSubAdmin(subAdmin.id);
    setUsername(subAdmin.username);
    setRole(subAdmin.role);
    setRanges(subAdmin.ranges);
    setAssignedSubAdmins(subAdmin.assigned_subadmins || []);
  };
const handleDeleteSubAdmin = async (id) => {
  const confirmed = window.confirm("Are you sure you want to delete this sub-admin?");
  if (!confirmed) return;

  try {
    const response = await fetch(`${apiUrl}/delete-sub-admin`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete sub-admin");
    }

    const result = await response.json();
    alert("Sub-admin deleted successfully");
    fetchSubAdmins(); // Refresh the list
  } catch (error) {
    console.error("Error deleting sub-admin:", error);
  }
};


  // Define Table Columns
  // const columns = [
  //   { title: "Username", dataIndex: "username", key: "username" },
  //   { title: "Role", dataIndex: "role", key: "role" },
  //   {
  //     title: "Ranges",
  //     key: "ranges",
  //     render: (record) =>
  //       record?.ranges?.map((range, i) => (
  //         <div key={i}>
  //           {range.start} - {range.end}
  //         </div>
  //       )),
  //   },
  // ];
  const columns = [
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Role", dataIndex: "role", key: "role" },
    {
      title: "Ranges",
      key: "ranges",
      render: (record) =>
        record.ranges.map((range, i) => (
          <div key={i}>
            {range.start} - {range.end}
          </div>
        )),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleDeleteSubAdmin(record.id)} // Use record.id instead of subAdminId
          >
            Delete Sub-Admin
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <Card className="w-full" title="Create Sub-Admin">
        <Form layout="vertical" onFinish={handleSaveSubAdmin}>
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
            {selectedSubAdmin ? "Update Sub-Admin" : "Create Sub-Admin"}
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

// import React, { useState, useEffect } from "react";
// import { Table, Input, Select, Button, Form, message, Spin, Card } from "antd";
// import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

// const { Option } = Select;
// const apiUrl = import.meta.env.VITE_API_URL || "http://160.153.172.237:5200/api";

// const SubAdminForm = () => {
//   const [subAdmins, setSubAdmins] = useState([]);
//   const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState("publisher");
//   const [ranges, setRanges] = useState([{ start: "", end: "" }]);
//   const [assignedSubAdmins, setAssignedSubAdmins] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [subAdminOptions, setSubAdminOptions] = useState([]);

//   useEffect(() => {
//     fetchSubAdmins();
//   }, []);

//   const fetchSubAdmins = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch(`${apiUrl}/get-subadmin`);
//       const data = await response.json();
//       if (response.ok) {
//         setSubAdmins(data.data);
//         setSubAdminOptions(
//           data.data.filter((subAdmin) => ["advertiser", "publisher"].includes(subAdmin.role))
//         );
//       } else {
//         setError(data.message || "Failed to fetch sub-admins.");
//       }
//     } catch (err) {
//       setError("An error occurred while fetching sub-admins.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleEdit = (subAdmin) => {
//     setSelectedSubAdmin(subAdmin.id);
//     setUsername(subAdmin.username);
//     setRole(subAdmin.role);
//     setRanges(subAdmin.ranges);
//     setAssignedSubAdmins(subAdmin.assigned_subadmins || []);
//   };

//   const handleSubmit = async () => {
//     const payload = {
//       id: selectedSubAdmin,
//       username,
//       password: password || undefined, // Only send if changed
//       role,
//       ranges,
//       assigned_subadmins: role === "manager" ? assignedSubAdmins : [],
//     };
//     try {
//       const response = await fetch(`${apiUrl}/update-sub-admin`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await response.json();
//       if (response.ok) {
//         message.success("Sub-Admin updated successfully!");
//         resetForm();
//         fetchSubAdmins();
//       } else {
//         message.error(`Error: ${data.message}`);
//       }
//     } catch (error) {
//       message.error("An error occurred while updating the sub-admin.");
//     }
//   };

//   const resetForm = () => {
//     setSelectedSubAdmin(null);
//     setUsername("");
//     setPassword("");
//     setRole("publisher");
//     setRanges([{ start: "", end: "" }]);
//     setAssignedSubAdmins([]);
//   };

//   const columns = [
//     { title: "Username", dataIndex: "username", key: "username" },
//     { title: "Role", dataIndex: "role", key: "role" },
//     {
//       title: "Ranges",
//       key: "ranges",
//       render: (record) => record.ranges.map((range, i) => (
//         <div key={i}>{range.start} - {range.end}</div>
//       )),
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (record) => (
//         <Button type="link" onClick={() => handleEdit(record)}>
//           Edit
//         </Button>
//       ),
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
//       <Card className="w-full" title={selectedSubAdmin ? "Edit Sub-Admin" : "Create Sub-Admin"}>
//         <Form layout="vertical" onFinish={handleSubmit}>
//           <Form.Item label="Username" required>
//             <Input value={username} onChange={(e) => setUsername(e.target.value)} />
//           </Form.Item>

//           <Form.Item label="Password">
//             <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} />
//           </Form.Item>

//           <Form.Item label="Role" required>
//             <Select value={role} onChange={(value) => setRole(value)}>
//               <Option value="publisher">Publisher</Option>
//               <Option value="advertiser">Advertiser</Option>
//               <Option value="manager">Manager</Option>
//             </Select>
//           </Form.Item>

//           {role === "manager" && (
//             <Form.Item label="Assign Sub-Admins">
//               <Select
//                 mode="multiple"
//                 value={assignedSubAdmins}
//                 onChange={setAssignedSubAdmins}
//               >
//                 {subAdminOptions.map((subAdmin) => (
//                   <Option key={subAdmin.id} value={subAdmin.id}>
//                     {subAdmin.username} ({subAdmin.role})
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           )}

//           <Form.Item label="Ranges" required>
//             {ranges.map((range, index) => (
//               <div key={index} className="flex space-x-2 items-center mb-2">
//                 <Input type="number" value={range.start} onChange={(e) => {
//                   const updatedRanges = [...ranges];
//                   updatedRanges[index].start = e.target.value;
//                   setRanges(updatedRanges);
//                 }} />
//                 <span>-</span>
//                 <Input type="number" value={range.end} onChange={(e) => {
//                   const updatedRanges = [...ranges];
//                   updatedRanges[index].end = e.target.value;
//                   setRanges(updatedRanges);
//                 }} />
//                 <MinusCircleOutlined
//                   className="text-red-500 cursor-pointer"
//                   onClick={() => setRanges(ranges.filter((_, i) => i !== index))}
//                 />
//               </div>
//             ))}
//             <Button type="dashed" onClick={() => setRanges([...ranges, { start: "", end: "" }])}>
//               <PlusOutlined /> Add More Ranges
//             </Button>
//           </Form.Item>

//           <Button type="primary" htmlType="submit" className="w-full">
//             {selectedSubAdmin ? "Update Sub-Admin" : "Create Sub-Admin"}
//           </Button>
//         </Form>
//       </Card>
//       <div className="mt-8 w-full">
//         <Card title="Sub-Admins List">
//           {loading ? <Spin /> : error ? <p className="text-red-500">{error}</p> : <Table columns={columns} dataSource={subAdmins} rowKey="id" pagination={{ pageSize: 5 }} />}
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default SubAdminForm;
