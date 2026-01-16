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
  const [permissionAddStore, setPermissionAddStore] = useState(false);
  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/get-subadmin`);
      const data = await response.json();
      if (response.ok) {
        // Exclude only those with role "admin"
        setSubAdmins(data.data.filter((subAdmin) => subAdmin.role !== "admin"));
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
      const cleanedOptions = subAdmins
        .map((u) => {
          // Normalize role string
          let cleanedRole = u.role;

          if (typeof cleanedRole === "string") {
            cleanedRole = cleanedRole.replace(/"/g, "").trim(); // remove extra quotes
          }

          return {
            ...u,
            role: cleanedRole,
          };
        })
        .filter((user) =>
          [
            "advertiser",
            "publisher",
            "publisher_manager",
            "advertiser_manager",
          ].includes(user.role)
        );

      setSubAdminOptions(cleanedOptions);
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
    console.log(role.length, password, username);
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
      // ranges: ranges.map(({ start, end }) => ({
      //   start: String(start),
      //   end: String(end),
      // })),
      assigned_subadmins:
        role.includes("publisher_manager") ||
        role.includes("advertiser_manager")
          ? assignedSubAdmins
          : [],
      can_see_button1: permissionEditCondition ? 1 : 0,
      can_see_input1: permissionUploadFiles ? 1 : 0,
      can_add_store: permissionAddStore ? 1 : 0,
    };

    try {
      const response = await fetch(`${apiUrl}/create-subadmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(response)
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
    // setRanges([{ start: "", end: "" }]);
    setAssignedSubAdmins([]);
    setPermissionEditCondition(false);
    setPermissionUploadFiles(false);
    setPermissionAddStore(false);
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
          <Checkbox
            checked={permissionAddStore}
            onChange={(e) => setPermissionAddStore(e.target.checked)}>
            Permission to Add Store
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
                  // If both manager roles selected → show both advertiser + publisher
                  if (
                    role.includes("advertiser_manager") &&
                    role.includes("publisher_manager")
                  ) {
                    return [
                      "advertiser",
                      "publisher",
                      "publisher_manager",
                    ].includes(s.role);
                  }

                  // For advertiser manager → only advertiser + advertiser_manager (except him)
                  if (role.includes("advertiser_manager")) {
                    return ["advertiser"].includes(s.role);
                  }

                  // For publisher manager → only publisher + publisher_manager (except him)
                  if (role.includes("publisher_manager")) {
                    return ["publisher", "publisher_manager"].includes(s.role);
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

        {/* Ranges
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
        </div> */}

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
