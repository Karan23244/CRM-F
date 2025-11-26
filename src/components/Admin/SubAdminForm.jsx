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
  Tag,
  Tooltip,
} from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  EditOutlined,
  UploadOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Swal from "sweetalert2";
import { createNotification } from "../../Utils/Notification";
import { useSelector } from "react-redux";
import StyledTable from "../../Utils/StyledTable";

const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

const SubAdminEdit = () => {
  const senderData = useSelector((state) => state.auth?.user);
  const [subAdmins, setSubAdmins] = useState([]);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState([]);
  const [ranges, setRanges] = useState([{ start: "", end: "" }]);
  const [assignedSubAdmins, setAssignedSubAdmins] = useState([]);
  const [subAdminOptions, setSubAdminOptions] = useState([]);
  const [permissionEditCondition, setPermissionEditCondition] = useState(false);
  const [permissionUploadFiles, setPermissionUploadFiles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRanges, setSelectedRanges] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const handleView = (record) => {
    setSelectedUser(record.username);
    setSelectedRanges(record.ranges || []);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedRanges([]);
    setSelectedUser(null);
  };
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
        // Exclude only those with role "admin"
        setSubAdmins(data.data.filter((subAdmin) => subAdmin.role !== "admin"));
      } else {
        setError(data.message || "Failed to fetch sub-admins.");
      }
    } catch (err) {
      setError("An error occurred while fetching sub-admins.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch filtered options for manager assignment
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

  const handleEdit = (subAdmin) => {
    setSelectedSubAdmin(subAdmin.id);
    setUsername(subAdmin.username);

    // ✅ Handle both stringified array and normal array cases
    let parsedRole = [];

    if (Array.isArray(subAdmin.role)) {
      parsedRole = subAdmin.role;
    } else if (typeof subAdmin.role === "string") {
      // Clean up extra quotes and split by comma
      const cleaned = subAdmin.role.replace(/^"|"$/g, "").trim();
      parsedRole = cleaned.split(",").map((r) => r.trim());
    }

    setRole(parsedRole);

    setRanges(subAdmin.ranges || [{ start: "", end: "" }]);
    setAssignedSubAdmins(subAdmin.assigned_subadmins?.map((a) => a.id) || []);
    setPermissionEditCondition(subAdmin.permissions?.can_see_button1 === 1);
    setPermissionUploadFiles(subAdmin.permissions?.can_see_input1 === 1);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  // Update Sub-Admin
  const handleUpdateSubAdmin = async () => {
    if (!selectedSubAdmin || !username) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Please fill all required fields!",
      });
      return;
    }

    const payload = {
      id: selectedSubAdmin,
      username,
      password,
      // ✅ Convert array back to comma-separated string
      role: Array.isArray(role) ? role.join(", ") : role,
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
      // ✅ Get old sub-admin data from your existing state
      const oldSubAdmin = subAdmins.find((u) => u.id === selectedSubAdmin);
      const response = await fetch(`${apiUrl}/update-sub-admin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Sub-admin updated successfully.",
        });

        // ✅ Detect which fields changed
        const changedFields = [];

        if (oldSubAdmin.username !== username) changedFields.push("username");
        if (oldSubAdmin.role !== role) changedFields.push("role");

        const oldRangeStr = JSON.stringify(oldSubAdmin.ranges || []);
        const newRangeStr = JSON.stringify(payload.ranges);
        if (oldRangeStr !== newRangeStr) changedFields.push("ranges");

        const oldAssignedStr = JSON.stringify(
          oldSubAdmin.assigned_subadmins || []
        );
        const newAssignedStr = JSON.stringify(payload.assigned_subadmins || []);
        if (oldAssignedStr !== newAssignedStr)
          changedFields.push("assigned users");

        if (oldSubAdmin.can_see_button1 !== payload.can_see_button1)
          changedFields.push("edit condition permission");
        if (oldSubAdmin.can_see_input1 !== payload.can_see_input1)
          changedFields.push("upload files permission");

        const detailsChanged =
          changedFields.length > 0
            ? changedFields.join(", ")
            : "general details";

        // ✅ Build notification message
        const message = `⚙️ Your ${detailsChanged} were updated by ${
          senderData?.username || "Admin"
        }.`;

        // ✅ Send notification to updated sub-admin
        await createNotification({
          sender: senderData?.id,
          receiver: selectedSubAdmin,
          type: "subadmin_update",
          message,
          url: "/dashboard/myaccount",
        });
        fetchSubAdmins();
        handleCancel();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: data.message || "Failed to update sub-admin.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "An error occurred while updating the sub-admin.",
      });
    }
  };

  const handleDeleteSubAdmin = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this sub-admin?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${apiUrl}/delete-sub-admin`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete sub-admin");
      }

      await response.json();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Sub-admin deleted successfully.",
      });

      fetchSubAdmins();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Error deleting sub-admin.",
      });
    }
  };

  const addRange = () => setRanges([...ranges, { start: "", end: "" }]);
  const removeRange = (index) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter((_, i) => i !== index));
    } else {
      message.warning("At least one range is required!");
    }
  };
  const handleRangeChange = (index, field, value) => {
    const updatedRanges = [...ranges];
    updatedRanges[index][field] = value;
    setRanges(updatedRanges);
  };

  const resetForm = () => {
    setSelectedSubAdmin(null);
    setUsername("");
    setPassword("");
    setRole("");
    setRanges([{ start: "", end: "" }]);
    setAssignedSubAdmins([]);
    setPermissionEditCondition(false);
    setPermissionUploadFiles(false);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      align: "center",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      align: "center",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      align: "center",
      render: (role) => (
        <span className="text-gray-800 font-medium">{role}</span>
      ),
    },
    {
      title: "Ranges",
      key: "ranges",
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
          style={{
            borderColor: "#2F5D99",
            color: "#2F5D99",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#2F5D99";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#2F5D99";
          }}>
          View
        </Button>
      ),
    },
    {
      title: "Edit Permission",
      key: "editPermission",
      align: "center",
      render: (_, record) =>
        record.permissions?.can_see_button1 ? (
          <Tooltip title="Has Edit Permission">
            <CheckCircleOutlined style={{ color: "#2F5D99", fontSize: 18 }} />
          </Tooltip>
        ) : (
          <Tooltip title="No Edit Permission">
            <CloseCircleOutlined style={{ color: "red", fontSize: 18 }} />
          </Tooltip>
        ),
    },
    {
      title: "Upload Permission",
      key: "uploadPermission",
      align: "center",
      render: (_, record) =>
        record.permissions?.can_see_input1 ? (
          <Tooltip title="Has Upload Permission">
            <CheckCircleOutlined style={{ color: "#2F5D99", fontSize: 18 }} />
          </Tooltip>
        ) : (
          <Tooltip title="No Upload Permission">
            <CloseCircleOutlined style={{ color: "red", fontSize: 18 }} />
          </Tooltip>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (record) => (
        <div className="flex justify-center gap-3">
          <Tooltip title="Edit User">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#2F5D99", fontSize: 18 }} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>

          <Tooltip title="Delete User">
            <Button
              type="text"
              icon={<DeleteOutlined style={{ color: "red", fontSize: 18 }} />}
              onClick={() => handleDeleteSubAdmin(record.id)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];
  return (
    <div className="min-h-screen flex flex-col items-center">
      {!showForm ? (
        <Card className="w-full" title="Existing Users">
          {loading ? (
            <Spin />
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              <StyledTable
                columns={columns}
                dataSource={subAdmins}
                rowKey="id"
                pagination={{
                  pageSizeOptions: ["10", "20", "50"],
                  showSizeChanger: true,
                  defaultPageSize: 10,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                }}
                className="shadow-md rounded-lg"
              />
              <Modal
                title={
                  <div
                    style={{
                      background: "#2F5D99",
                      color: "white",
                      padding: "12px 0",
                      borderRadius: "8px 8px 0 0",
                      textAlign: "center",
                      fontSize: "18px",
                      fontWeight: "600",
                    }}>
                    Ranges for {selectedUser}
                  </div>
                }
                open={isModalOpen}
                onCancel={handleClose}
                footer={[
                  <Button key="close" onClick={handleClose} type="primary">
                    Close
                  </Button>,
                ]}
                centered
                bodyStyle={{
                  maxHeight: "60vh",
                  overflowY: "auto",
                  backgroundColor: "#f9fafb",
                  padding: "20px",
                  borderRadius: "0 0 10px 10px",
                }}
                closable={false} // optional: removes default X to keep header clean
              >
                {selectedRanges.length > 0 ? (
                  <div className="flex flex-wrap gap-3 justify-start">
                    {selectedRanges.map((r, i) => (
                      <div
                        key={i}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-gray-800 font-medium"
                        style={{
                          flex: "1 0 calc(20% - 12px)", // ensures 5 boxes per row (with gap)
                          textAlign: "center",
                          minWidth: "100px",
                        }}>
                        {r.start} - {r.end}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-base py-6">
                    No ranges found for this user.
                  </div>
                )}
              </Modal>
            </>
          )}
        </Card>
      ) : (
        <Card className="w-full max-w-6xl rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit User</h2>

          {/* Username & Password */}
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
              <label className="block font-semibold mb-2">
                Password (optional)
              </label>
              <Input.Password
                value={password}
                placeholder="Password is hidden"
                disabled
                className="h-11 rounded-lg border-gray-200 bg-gray-100"
              />
            </div>
          </div>

          {/* Roles */}
          <div className="mb-6">
            <label className="block font-semibold mb-2">Role</label>
            <Select
              mode="multiple"
              value={role}
              onChange={(value) => setRole(value)}
              placeholder="Select Role(s)"
              className="w-full h-11 rounded-lg border-gray-200 bg-gray-50">
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
                {/* {subAdminOptions
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
                  ))} */}
                {subAdminOptions
                  .filter((s) => {
                    // ❌ Remove current editing user
                    if (s.id === selectedSubAdmin) return false;

                    // If both manager roles selected → show both advertiser + publisher
                    if (
                      role.includes("advertiser_manager") &&
                      role.includes("publisher_manager")
                    ) {
                      return ["advertiser", "publisher"].includes(s.role);
                    }

                    // For advertiser manager → only advertiser + advertiser_manager (except him)
                    if (role.includes("advertiser_manager")) {
                      return ["advertiser"].includes(
                        s.role
                      );
                    }

                    // For publisher manager → only publisher + publisher_manager (except him)
                    if (role.includes("publisher_manager")) {
                      return ["publisher", "publisher_manager"].includes(
                        s.role
                      );
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

          {/* Action Buttons */}
          <div className="flex justify-center gap-6">
            <Button
              onClick={handleCancel}
              className="!bg-gray-300 hover:!bg-gray-400 !text-gray-800 !rounded-lg !px-10 !py-5 !h-12 !text-lg !border-none">
              Cancel
            </Button>
            <Button
              type="default"
              onClick={handleUpdateSubAdmin}
              loading={loading}
              className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-10 !py-5 !h-12 !text-lg !border-none !shadow-md">
              Update Sub-Admin
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SubAdminEdit;
