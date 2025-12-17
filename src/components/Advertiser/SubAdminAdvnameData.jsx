import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Input, Select, Button, Space, Tooltip } from "antd";
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

  // Form State for Editing
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [advUserId, setAdvUserId] = useState(null);
  const [target, setTarget] = useState("");
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
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

  const filteredData = tableData
    .filter((item) => user?.assigned_subadmins?.includes(item.user_id))
    .filter((item) =>
      [
        item.username,
        item.adv_name,
        item.adv_id,
        item.geo,
        item.note,
        item.target,
      ].some((field) =>
        field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
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

  const getUniqueValues = (data, key) => {
    return [...new Set(data.map((item) => item[key]).filter(Boolean))];
  };

  const createFilterDropdown = (
    data,
    key,
    setSelectedKeys,
    selectedKeys,
    confirm
  ) => {
    const options = getUniqueValues(data, key).sort((a, b) => {
      const aVal = isNaN(a) ? a.toString().toLowerCase() : parseFloat(a);
      const bVal = isNaN(b) ? b.toString().toLowerCase() : parseFloat(b);
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });

    return (
      <div style={{ padding: 8 }}>
        <Select
          mode="multiple"
          allowClear
          showSearch
          style={{ width: 200 }}
          placeholder={`Filter ${key}`}
          value={selectedKeys}
          onChange={(value) => {
            setSelectedKeys(value);
            confirm({ closeDropdown: false });
          }}
          optionFilterProp="children">
          {options.map((option) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "username",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "adv_name",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "adv_id",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "geo",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "note",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "target",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.target === value,
    },
    {
      title: "Acc Email",
      dataIndex: "acc_email",
      key: "acc_email",
      sorter: (a, b) => a.acc_email.localeCompare(b.acc_email),
      sortOrder: sortInfo.columnKey === "acc_email" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "acc_email") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "acc_email",
            order: newOrder,
          });
        },
      }),
      render: (text) => (user?.role === "advertiser" ? "*****" : text),
    },
    {
      title: "POC Email",
      dataIndex: "poc_email",
      key: "poc_email",
      sorter: (a, b) => a.poc_email.localeCompare(b.poc_email),
      sortOrder: sortInfo.columnKey === "poc_email" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "poc_email") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "poc_email",
            order: newOrder,
          });
        },
      }),
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
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "assign_user",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.assign_user === value,
    },
    {
      title: "Postback URL",
      dataIndex: "postback_url",
      key: "postback_url",
      sorter: (a, b) => a.postback_url.localeCompare(b.postback_url),
      sortOrder: sortInfo.columnKey === "postback_url" ? sortInfo.order : null,
      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === "postback_url") {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend")
              newOrder = null; // 🔹 third click removes sorting
            else newOrder = "ascend";
          }

          setSortInfo({
            columnKey: "postback_url",
            order: newOrder,
          });
        },
      }),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "assign_user",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.assign_user === value,
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
