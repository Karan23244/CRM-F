// import React, { useState, useEffect } from "react";
// import { Input, Select, Button, Form, message, Card, Checkbox } from "antd";
// import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
// import Swal from "sweetalert2";

// const { Option } = Select;
// const apiUrl = import.meta.env.VITE_API_URL;

// const SubAdminForm = () => {
//   const [subAdmins, setSubAdmins] = useState([]);
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState(["publisher"]);
//   const [ranges, setRanges] = useState([{ start: "", end: "" }]);
//   const [assignedSubAdmins, setAssignedSubAdmins] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [subAdminOptions, setSubAdminOptions] = useState([]);
//   const [permissionEditCondition, setPermissionEditCondition] = useState(false);
//   const [permissionUploadFiles, setPermissionUploadFiles] = useState(false);

//   useEffect(() => {
//     fetchSubAdmins();
//   }, []);

//   // Fetch Sub-Admins for assignment
//   const fetchSubAdmins = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch(`${apiUrl}/get-subadmin`);
//       const data = await response.json();
//       if (response.ok) {
//         setSubAdmins(
//           data.data.filter((subAdmin) =>
//             [
//               "advertiser",
//               "publisher",
//               "advertiser_manager",
//               "publisher_manager",
//               "operations",
//             ].includes(subAdmin.role)
//           )
//         );
//       } else {
//         message.error(data.message || "Failed to fetch sub-admins.");
//       }
//     } catch (err) {
//       message.error("Error fetching sub-admins.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (subAdmins.length > 0) {
//       setSubAdminOptions(
//         subAdmins.filter((subAdmin) =>
//           [
//             "advertiser",
//             "publisher",
//             "publisher_manager",
//             "advertiser_manager",
//             "operations",
//           ].includes(subAdmin.role)
//         )
//       );
//     }
//   }, [subAdmins]);

//   // Handle Add/Remove Range
//   const addRange = () => setRanges([...ranges, { start: "", end: "" }]);
//   const removeRange = (index) => {
//     if (ranges.length > 1) {
//       setRanges(ranges.filter((_, i) => i !== index));
//     } else {
//       message.warning("At least one range is required!");
//     }
//   };

//   const handleRangeChange = (index, field, value) => {
//     const updatedRanges = [...ranges];
//     updatedRanges[index][field] = value;
//     setRanges(updatedRanges);
//   };

//   // Save new Sub-Admin
//   const handleSaveSubAdmin = async () => {
//     if (!username || !password) {
//       Swal.fire({
//         icon: "warning",
//         title: "Oops...",
//         text: "Please fill all required fields!",
//       });
//       return;
//     }

//     const payload = {
//       username,
//       password,
//       role,
//       ranges: ranges.map(({ start, end }) => ({
//         start: String(start),
//         end: String(end),
//       })),
//       assigned_subadmins:
//         role === "publisher_manager" || role === "advertiser_manager"
//           ? assignedSubAdmins
//           : [],
//       can_see_button1: permissionEditCondition ? 1 : 0,
//       can_see_input1: permissionUploadFiles ? 1 : 0,
//     };
//     console.log("Payload to be sent:", payload);
//     try {
//       const response = await fetch(`${apiUrl}/create-subadmin`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       console.log("Response received:", response);
//       const data = await response.json();

//       if (response.ok) {
//         Swal.fire({
//           icon: "success",
//           title: "Success!",
//           text: "Sub-Admin created successfully!",
//         });
//         resetForm();
//         fetchSubAdmins();
//       } else {
//         Swal.fire({
//           icon: "error",
//           title: "Error!",
//           text: data.message || "Failed to create Sub-Admin.",
//         });
//       }
//     } catch (error) {
//       Swal.fire({
//         icon: "error",
//         title: "Error!",
//         text: "An error occurred while creating the Sub-Admin.",
//       });
//     }
//   };

//   // Reset Form
//   const resetForm = () => {
//     setUsername("");
//     setPassword("");
//     setRole("publisher");
//     setRanges([{ start: "", end: "" }]);
//     setAssignedSubAdmins([]);
//     setPermissionEditCondition(false);
//     setPermissionUploadFiles(false);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
//       <Card className="w-full" title="Create Sub-Admin">
//         <Form layout="vertical" onFinish={handleSaveSubAdmin}>
//           <Form.Item label="Username" required>
//             <Input
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               placeholder="Enter username"
//             />
//           </Form.Item>

//           <Form.Item label="Password" required>
//             <Input.Password
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Enter password"
//             />
//           </Form.Item>

//           <Form.Item label="Role" required>
//             <Select
//               mode="multiple"
//               value={role}
//               onChange={(value) => setRole(value)}
//               placeholder="Select Role(s)">
//               <Option value="publisher">Publisher</Option>
//               <Option value="advertiser">Advertiser</Option>
//               <Option value="operations">Operations</Option>
//               <Option value="advertiser_manager">Advertiser Manager</Option>
//               <Option value="publisher_manager">Publisher Manager</Option>
//             </Select>
//           </Form.Item>

//           <Form.Item>
//             <Checkbox
//               checked={permissionEditCondition}
//               onChange={(e) => setPermissionEditCondition(e.target.checked)}>
//               Permission for Edit Condition
//             </Checkbox>
//             <Checkbox
//               checked={permissionUploadFiles}
//               onChange={(e) => setPermissionUploadFiles(e.target.checked)}>
//               Permission for Uploading Files
//             </Checkbox>
//           </Form.Item>

//           {(role === "advertiser_manager" || role === "publisher_manager") && (
//             <Form.Item label="Assign Sub-Admins">
//               <Select
//                 mode="multiple"
//                 showSearch
//                 value={assignedSubAdmins}
//                 onChange={setAssignedSubAdmins}
//                 placeholder="Select sub-admins"
//                 filterOption={(input, option) =>
//                   option.children.toLowerCase().includes(input.toLowerCase())
//                 }>
//                 {subAdminOptions
//                   .filter((subAdmin) =>
//                     role === "advertiser_manager"
//                       ? ["advertiser"].includes(subAdmin.role)
//                       : ["publisher"].includes(subAdmin.role)
//                   )
//                   .map((subAdmin) => (
//                     <Option key={subAdmin.id} value={subAdmin.id}>
//                       {subAdmin.username}
//                     </Option>
//                   ))}
//               </Select>
//             </Form.Item>
//           )}

//           <Form.Item label="Ranges">
//             {ranges.map((range, index) => (
//               <div key={index} className="flex space-x-2 items-center mb-2">
//                 <Input
//                   type="number"
//                   value={range.start}
//                   onChange={(e) =>
//                     handleRangeChange(index, "start", e.target.value)
//                   }
//                   placeholder="Start"
//                 />
//                 <span>-</span>
//                 <Input
//                   type="number"
//                   value={range.end}
//                   onChange={(e) =>
//                     handleRangeChange(index, "end", e.target.value)
//                   }
//                   placeholder="End"
//                 />
//                 {ranges.length > 1 && (
//                   <MinusCircleOutlined
//                     className="text-red-500 cursor-pointer"
//                     onClick={() => removeRange(index)}
//                   />
//                 )}
//               </div>
//             ))}
//             <Button type="dashed" onClick={addRange} icon={<PlusOutlined />}>
//               Add More Ranges
//             </Button>
//           </Form.Item>

//           <Button type="primary" htmlType="submit" className="w-full">
//             Create Sub-Admin
//           </Button>
//         </Form>
//       </Card>
//     </div>
//   );
// };

// export default SubAdminForm;
import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Select,
  Button,
  Form,
  message,
  Spin,
  Card,
  Checkbox,
  Modal,
  Tooltip,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Swal from "sweetalert2";

const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

const SubAdminForm = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState([]); // ✅ multi-select roles
  const [ranges, setRanges] = useState([{ start: "", end: "" }]);
  const [assignedSubAdmins, setAssignedSubAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subAdminOptions, setSubAdminOptions] = useState([]);
  const [permissionEditCondition, setPermissionEditCondition] = useState(false);
  const [permissionUploadFiles, setPermissionUploadFiles] = useState(false);

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/get-subadmin`);
      const data = await response.json();
      if (response.ok) {
        setSubAdmins(
          data.data.filter((subAdmin) =>
            [
              "advertiser",
              "publisher",
              "advertiser_manager",
              "publisher_manager",
              "operations",
            ].includes(subAdmin.role)
          )
        );
      } else {
        message.error(data.message || "Failed to fetch sub-admins.");
      }
    } catch {
      message.error("Error fetching sub-admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subAdmins.length > 0) {
      setSubAdminOptions(subAdmins);
    }
  }, [subAdmins]);

  const addRange = () => setRanges([...ranges, { start: "", end: "" }]);
  const removeRange = (index) =>
    ranges.length > 1
      ? setRanges(ranges.filter((_, i) => i !== index))
      : message.warning("At least one range is required!");

  const handleRangeChange = (index, field, value) => {
    const updated = [...ranges];
    updated[index][field] = value;
    setRanges(updated);
  };

  const handleSaveSubAdmin = async () => {
    if (!username || !password || role.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Please fill all required fields!",
      });
      return;
    }

    const payload = {
      username,
      password,
      role,
      ranges: ranges.map(({ start, end }) => ({
        start: String(start),
        end: String(end),
      })),
      assigned_subadmins:
        role.includes("publisher_manager") ||
        role.includes("advertiser_manager")
          ? assignedSubAdmins
          : [],
      can_see_button1: permissionEditCondition ? 1 : 0,
      can_see_input1: permissionUploadFiles ? 1 : 0,
    };

    try {
      const response = await fetch(`${apiUrl}/create-subadmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Sub-Admin created successfully!",
        });
        resetForm();
        fetchSubAdmins();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: data.message || "Failed to create Sub-Admin.",
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "An error occurred while creating the Sub-Admin.",
      });
    }
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setRole([]);
    setRanges([{ start: "", end: "" }]);
    setAssignedSubAdmins([]);
    setPermissionEditCondition(false);
    setPermissionUploadFiles(false);
  };

  return (
    <div className="min-h-screen bg-[#E9EEF8] flex flex-col p-10">
      <Card className="w-full max-w-8xl rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Create Sub-Admin
        </h2>

        {/* Username and Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div>
            <label className="block font-semibold mb-2">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Password</label>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </div>
        </div>

        {/* Role */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Role</label>
          <Select
            mode="multiple"
            value={role}
            onChange={(value) => setRole(value)}
            placeholder="Select Role(s)"
            className="w-full h-9 rounded-lg border-gray-200 bg-gray-50">
            <Option value="publisher">Publisher</Option>
            <Option value="advertiser">Advertiser</Option>
            <Option value="operations">Operations</Option>
            <Option value="advertiser_manager">Advertiser Manager</Option>
            <Option value="publisher_manager">Publisher Manager</Option>
          </Select>
        </div>

        {/* Permissions */}
        <div className="flex flex-wrap gap-6 mb-6">
          <Checkbox
            checked={permissionEditCondition}
            onChange={(e) => setPermissionEditCondition(e.target.checked)}>
            Permission for Edit Condition
          </Checkbox>
          <Checkbox
            checked={permissionUploadFiles}
            onChange={(e) => setPermissionUploadFiles(e.target.checked)}>
            Permission for Uploading Files
          </Checkbox>
        </div>

        {/* Assign Sub-Admins */}
        {(role.includes("publisher_manager") ||
          role.includes("advertiser_manager")) && (
          <div className="mb-6">
            <label className="block font-semibold mb-2">
              Assign Sub-Admins
            </label>
            <Select
              mode="multiple"
              showSearch
              value={assignedSubAdmins}
              onChange={setAssignedSubAdmins}
              placeholder="Select sub-admins"
              className="w-full rounded-lg border-gray-200 bg-gray-50"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }>
              {subAdminOptions
                .filter((s) => {
                  if (
                    role.includes("advertiser_manager") &&
                    role.includes("publisher_manager")
                  ) {
                    return ["advertiser", "publisher"].includes(s.role);
                  } else if (role.includes("advertiser_manager")) {
                    return s.role === "advertiser";
                  } else if (role.includes("publisher_manager")) {
                    return s.role === "publisher";
                  }
                  return false;
                })
                .map((subAdmin) => (
                  <Option key={subAdmin.id} value={subAdmin.id}>
                    {subAdmin.username} ({subAdmin.role})
                  </Option>
                ))}
            </Select>
          </div>
        )}

        {/* Ranges */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Ranges</label>
          {ranges.map((range, index) => (
            <div key={index} className="flex items-center gap-8 mb-3">
              <Input
                type="number"
                value={range.start}
                onChange={(e) =>
                  handleRangeChange(index, "start", e.target.value)
                }
                placeholder="Starting Range"
                className="h-11 rounded-lg border-gray-200 bg-gray-50"
              />
              <Input
                type="number"
                value={range.end}
                onChange={(e) =>
                  handleRangeChange(index, "end", e.target.value)
                }
                placeholder="Ending Range"
                className="h-11 rounded-lg border-gray-200 bg-gray-50"
              />
              {ranges.length > 1 && (
                <MinusCircleOutlined
                  className="text-red-500 cursor-pointer"
                  onClick={() => removeRange(index)}
                />
              )}
            </div>
          ))}
          <Button
            onClick={addRange}
            icon={<PlusOutlined />}
            className="border-[#2F5D99] text-[#2F5D99] rounded-lg">
            Add More Ranges
          </Button>
        </div>

        {/* Create Button */}
        <div className="flex justify-center">
          <Button
            type="default"
            onClick={handleSaveSubAdmin}
            loading={loading}
            className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-10 !py-5 !h-12 !text-lg !border-none !shadow-md">
            Create Sub-Admin
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SubAdminForm;
