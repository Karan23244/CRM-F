import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Input, Select, Button, Space, Tooltip, Checkbox } from "antd";
import { useSelector } from "react-redux";
import Swal from "sweetalert2"; // <-- Import SweetAlert2
import geoData from "../../Data/geoData.json";
import { EditOutlined } from "@ant-design/icons";
import StyledTable from "../../Utils/StyledTable";

const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

const AdvnameData = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAdv, setEditingAdv] = useState(null);
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  // Form State for Editing
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [advUserId, setAdvUserId] = useState(null);
  const [target, setTarget] = useState("");
  const [editingAssignRowId, setEditingAssignRowId] = useState(null);
  const [subAdmins, setSubAdmins] = useState([]);
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };
  // **Fetch advertiser data**
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-NameAdv/`);

        if (response.data && Array.isArray(response.data.data)) {
          setTableData(response.data.data);
        } else {
          console.error("Unexpected response format:", response.data);
          setTableData([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setTableData([]);
      }
    };

    fetchData();
  }, []);
  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await fetch(`${apiUrl}/get-subadmin`);
        const data = await response.json();
        if (response.ok) {
          const filtered = data.data.filter((subAdmin) =>
            ["advertiser_manager", "advertiser", "operations"].includes(
              subAdmin.role
            )
          );
          console.log(filtered);
          setSubAdmins(filtered);
        } else {
          console.log(data.message || "Failed to fetch sub-admins.");
        }
      } catch (err) {
        console.log("An error occurred while fetching sub-admins.");
      }
    };

    fetchSubAdmins();
  }, []);
  const getExcelFilteredDataForColumn = (columnKey) => {
    return tableData.filter((row) =>
      Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;
        if (!values || values.length === 0) return true;
        return values.includes(normalize(row[key]));
      })
    );
  };
  useEffect(() => {
    const valuesObj = {};

    Object.keys(tableData[0] || {}).forEach((col) => {
      const source = getExcelFilteredDataForColumn(col);

      valuesObj[col] = [
        ...new Set(source.map((row) => normalize(row[col]))),
      ].sort((a, b) => a.localeCompare(b));
    });

    setUniqueValues(valuesObj);
  }, [tableData, filters]);
  const filteredData = tableData.filter((row) => {
    // 🔍 Global search
    const matchesSearch = Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 🎯 Excel-style filters
    return Object.entries(filters).every(([key, values]) => {
      if (!values || values.length === 0) return true;
      return values.includes(normalize(row[key]));
    });
  });
  // **Handle Form Submission for Updating**
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name || !selectedId || !geo) {
      Swal.fire({
        icon: "warning",
        title: "Oops...",
        text: "Please fill all required fields.",
      });
      return;
    }

    const updatedAdv = {
      adv_name: name,
      adv_id: selectedId,
      geo: geo,
      note: note || "",
      target: target || "",
      user_id: advUserId,
    };
    try {
      // **Update existing advertiser**
      const response = await axios.put(`${apiUrl}/update-advid`, updatedAdv);
      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Advertiser updated successfully.",
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh table data after update
        const { data } = await axios.get(`${apiUrl}/get-NameAdv/`);
        if (data.success && Array.isArray(data.data)) {
          setTableData(data.data);
        }

        resetForm();
      }
    } catch (error) {
      console.error("Error updating advertiser:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error updating advertiser. Please try again.",
      });
    }
  };

  // **Handle Edit Button**
  const handleEdit = (record) => {
    setEditingAdv(record);
    setName(record.adv_name);
    setSelectedId(record.adv_id);
    setGeo(record.geo);
    setNote(record.note);
    setTarget(record.target);
    setAdvUserId(record.user_id);
  };

  // **Reset Form**
  const resetForm = () => {
    setName("");
    setSelectedId("");
    setGeo("");
    setNote("");
    setTarget("");
    setEditingAdv(null);
  };

  const handlePause = async (record) => {
    try {
      const response = await axios.post(`${apiUrl}/advid-pause`, {
        adv_id: record.adv_id,
        pause: 1,
      });

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Paused",
          text: `Advertiser ${record.adv_id} has been paused.`,
          timer: 2000,
          showConfirmButton: false,
        });

        // ✅ Refresh data after pause
        const { data } = await axios.get(`${apiUrl}/get-NameAdv/`);
        if (data.success && Array.isArray(data.data)) {
          setTableData(data.data);
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: `Failed to pause advertiser ${record.pub_id}.`,
        });
      }
    } catch (error) {
      console.error("Error pausing advertiser:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error occurred while pausing advertiser.",
      });
    }
  };
  const excelFilterDropdown = (key) => () => {
    const allValues = uniqueValues[key] || [];
    const selectedValues = filters[key] ?? allValues;
    const searchVal = filterSearch[key] || "";

    const visibleValues = allValues.filter((v) =>
      v.toLowerCase().includes(searchVal.toLowerCase())
    );

    const isAllSelected = selectedValues.length === allValues.length;
    const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

    return (
      <div className="w-[260px]" onClick={(e) => e.stopPropagation()}>
        {/* 🔍 Search */}
        <div className="p-2 border-b bg-white">
          <Input
            allowClear
            placeholder="Search values"
            value={searchVal}
            onChange={(e) =>
              setFilterSearch((prev) => ({
                ...prev,
                [key]: e.target.value,
              }))
            }
          />
        </div>

        {/* ☑ Select All */}
        <div className="px-3 py-2">
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={(e) => {
              const checked = e.target.checked;
              setFilters((prev) => {
                const updated = { ...prev };
                if (checked) delete updated[key];
                else updated[key] = [];
                return updated;
              });
            }}>
            Select All
          </Checkbox>
        </div>

        {/* 📋 Values */}
        <div className="max-h-[220px] overflow-y-auto px-2 pb-2">
          {visibleValues.map((val) => (
            <label
              key={val}
              className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-blue-50">
              <Checkbox
                checked={selectedValues.includes(val)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selectedValues, val]
                    : selectedValues.filter((v) => v !== val);

                  setFilters((prev) => ({
                    ...prev,
                    [key]: next,
                  }));
                }}
              />
              <span className="truncate">{val}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };
  const columns = [
    {
      title: "UserName",
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username),
      sortOrder: sortInfo.columnKey === "username" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "username") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "username",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("username"),
      onFilter: (value, record) => record.username === value,
    },
    {
      title: "Advertiser Name",
      dataIndex: "adv_name",
      key: "adv_name",
      sorter: (a, b) => a.adv_name.localeCompare(b.adv_name),
      sortOrder: sortInfo.columnKey === "adv_name" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "adv_name") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "adv_name",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("adv_name"),
      onFilter: (value, record) => record.adv_name === value,
    },
    {
      title: "Advertiser ID",
      dataIndex: "adv_id",
      key: "adv_id",
      sorter: (a, b) => a.adv_id.localeCompare(b.adv_id),
      sortOrder: sortInfo.columnKey === "adv_id" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "adv_id") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "adv_id",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("adv_id"),
      onFilter: (value, record) => record.adv_id === value,
    },
    {
      title: "Geo",
      dataIndex: "geo",
      key: "geo",
      sorter: (a, b) => a.geo.localeCompare(b.geo),
      sortOrder: sortInfo.columnKey === "geo" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "geo") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "geo",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("geo"),
      onFilter: (value, record) => record.geo === value,
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      sorter: (a, b) => a.note.localeCompare(b.note),
      sortOrder: sortInfo.columnKey === "note" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "note") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "note",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("note"),
      onFilter: (value, record) => record.note === value,
    },
    {
      title: "Target",
      dataIndex: "target",
      key: "target",
      sorter: (a, b) => a.target.localeCompare(b.target),
      sortOrder: sortInfo.columnKey === "target" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "target") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "target",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("target"),
      onFilter: (value, record) => record.target === value,
    },
    {
      title: "Acc Email",
      dataIndex: "acc_email",
      key: "acc_email",
      render: (text) => (user?.role === "advertiser" ? "*****" : text),
    },
    {
      title: "POC Email",
      dataIndex: "poc_email",
      key: "poc_email",
      render: (text) => (user?.role === "advertiser" ? "*****" : text),
    },
    {
      title: "Assign User",
      dataIndex: "assign_user",
      key: "assign_user",
      sorter: (a, b) => a.assign_user.localeCompare(b.assign_user),
      sortOrder: sortInfo.columnKey === "assign_user" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "assign_user") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "assign_user",
            order: newOrder,
          });
        },
      }),
      filterDropdown: excelFilterDropdown("assign_user"),
      onFilter: (value, record) => record.assign_user === value,
    },
    {
      title: "Postback URL",
      dataIndex: "postback_url",
      key: "postback_url",
      onFilter: (value, record) => record.assign_user === value,
    },
    {
      title: "Transfer Adv AM",
      key: "user_id",
      render: (_, record) => {
        const isEditing = editingAssignRowId === record.adv_id;

        if (isEditing) {
          return (
            <Select
              autoFocus
              value={record.username}
              onChange={async (newUserId) => {
                try {
                  // const response = await axios.put(`${apiUrl}/update-advid`, {
                  //   ...record,
                  //   user_id: newUserId,
                  // });
                  console.log({ user_id: newUserId,...record, });
                  // if (response.data.success) {
                  //   Swal.fire(
                  //     "Success",
                  //     "User transferred successfully!",
                  //     "success"
                  //   );

                  //   // ✅ Update local tableData to reflect changes
                  //   setTableData((prev) =>
                  //     prev.map((item) =>
                  //       item.adv_id === record.adv_id
                  //         ? {
                  //             ...item,
                  //             user_id: newUserId,
                  //           }
                  //         : item
                  //     )
                  //   );
                  // } else {
                  //   Swal.fire("Error", "Failed to transfer user", "error");
                  // }
                } catch (error) {
                  console.error("User transfer error:", error);
                  Swal.fire("Error", "Something went wrong", "error");
                } finally {
                  setEditingAssignRowId(null);
                }
              }}
              onBlur={() => setEditingAssignRowId(null)} // Close if user clicks away
              className="min-w-[150px]">
              <Option value="">Select Sub Admin</Option>
              {subAdmins.map((admin) => (
                <Option key={admin.id} value={admin.id.toString()}>
                  {admin.username}
                </Option>
              ))}
            </Select>
          );
        }

        // Show normal text, and enter edit mode on click
        return (
          <span
            onClick={() => setEditingAssignRowId(record.adv_id)}
            className="cursor-pointer hover:underline"
            title="Click to change user">
            {"-"}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Button
            type="default"
            danger={record.pause !== "1"}
            size="small"
            onClick={() => handlePause(record)}
            disabled={record.pause === "1"}
            className={`rounded px-3 py-1 ${
              record.pause === "1"
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}>
            {record.pause === "1" ? "Paused" : "Pause"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      {/* Show Form Only in Edit Mode */}
      {editingAdv && (
        <form
          onSubmit={handleUpdate}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-white p-6 rounded-2xl shadow-md">
          {/* Advertiser Name */}
          <div>
            <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
              Advertiser Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
              required
            />
          </div>

          {/* Advertiser ID (Disabled during edit) */}
          <div>
            <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
              Advertiser ID (Cannot be modified)
            </label>
            <input
              type="text"
              value={selectedId}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              disabled
            />
          </div>

          {/* Select Geo */}
          <div>
            <label className=" block text-[#2F5D99] text-lg font-semibold mb-2">
              Select Geo
            </label>
            <Select
              showSearch
              value={geo}
              onChange={(value) => setGeo(value)}
              placeholder="Select Geo"
              className="w-full !h-12"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              required>
              {geoData.geo?.map((geo) => (
                <Option key={geo.code} value={geo.code} label={`${geo.code}`}>
                  {geo.code}
                </Option>
              ))}
            </Select>
          </div>

          {/* Target Field */}
          <div>
            <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
              Target
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
            />
          </div>

          {/* Note (Optional) */}
          <div className="md:col-span-2">
            <label className="block text-[#2F5D99] text-lg font-semibold mb-2">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5D99] focus:border-[#2F5D99] transition-all"
              rows="3"
            />
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex flex-wrap gap-4 justify-end mt-4">
            <button
              type="submit"
              className="flex-1 md:flex-none bg-[#2F5D99] hover:bg-[#24487A] text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all">
              Update Advertiser
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="flex-1 md:flex-none bg-gray-400 hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}
      {!editingAdv && (
        <>
          {/* Search Input */}
          <Input
            placeholder="Search by Advertiser Name, Geo, or Note"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 w-1/3 p-2 border rounded"
          />

          {/* Table Component */}
          <StyledTable
            dataSource={filteredData}
            columns={columns}
            rowKey="adv_id"
            pagination={{
              pageSizeOptions: ["10", "20", "50", "100"],
              showSizeChanger: true,
              defaultPageSize: 10,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            bordered
            className="mt-5"
            scroll={{ x: "max-content" }}
          />
        </>
      )}
    </div>
  );
};

export default AdvnameData;
