import React, { useState, useEffect, use } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { Table, Input, Select, Button, Space, Tooltip, Checkbox } from "antd";
import StyledTable from "../../Utils/StyledTable";
import {
  FilterOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import geoData from "../../Data/geoData.json";
import { PushpinOutlined } from "@ant-design/icons";
const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

const AdvnameData = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;

  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAdv, setEditingAdv] = useState(null);
  console.log(tableData);
  // Form State for Editing
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [advUserId, setAdvUserId] = useState(null);
  const [target, setTarget] = useState("");
  const [acc_email, setAcc_email] = useState("");
  const [poc_email, setPoc_email] = useState("");
  const [assign_user, setAssign_user] = useState("");
  const [assign_id, setAssign_id] = useState("");
  const [subAdmins, setSubAdmins] = useState([]);
  const [filterSearch, setFilterSearch] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [editingAssignRowId, setEditingAssignRowId] = useState(null);
  const [filters, setFilters] = useState({});
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  // ✅ Fallbacks for empty data (avoid "not iterable" error)
  const safeArray = (key) =>
    Array.from(uniqueValues[key] || []).filter(
      (val) => val && val.trim() !== ""
    );
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };
  const getExcelFilteredDataForColumn = (columnKey) => {
    return tableData.filter((row) => {
      return Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;
        if (!values || values.length === 0) return true;
        return values.includes(normalize(row[key]));
      });
    });
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
  const togglePin = (key) => {
    setPinnedColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const finalFilteredData = tableData.filter((row) => {
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

  // **Fetch advertiser data**
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-NameAdv/`);

        if (response.data && Array.isArray(response.data.data)) {
          const filteredData = response.data.data.filter(
            (item) => item.pause !== 1
          );
          setTableData(filteredData);
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
  // **Handle Form Submission for Updating**
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name || !selectedId || !geo) {
      Swal.fire(
        "Missing Fields",
        "Please fill all required fields.",
        "warning"
      );

      return;
    }

    const updatedAdv = {
      adv_name: name,
      adv_id: selectedId,
      geo: geo,
      note: note || "",
      target: target || "",
      user_id: advUserId,
      acc_email: acc_email,
      poc_email: poc_email,
      assign_user:
        editingAdv && user?.role === "advertiser_manager"
          ? editingAdv.assign_user
          : assign_user,
      assign_id:
        editingAdv && user?.role === "advertiser_manager"
          ? editingAdv.assign_id
          : assign_id,
    };
    try {
      // **Update existing advertiser**
      const response = await axios.put(`${apiUrl}/update-advid`, updatedAdv);
      if (response.data.success) {
        Swal.fire("Success", "Advertiser updated successfully.", "success");

        // Refresh table data after update
        const { data } = await axios.get(`${apiUrl}/get-NameAdv/`);
        if (data.success && Array.isArray(data.data)) {
          setTableData(data.data);
        }

        resetForm();
      }
    } catch (error) {
      console.error("Error updating advertiser:", error);
      Swal.fire(
        "Error",
        "Error updating advertiser. Please try again.",
        "error"
      );
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
    setAcc_email(record.acc_email);
    setPoc_email(record.poc_email);
    setAssign_user(record.assign_user);
    setAssign_id(record.assign_id);
  };

  // **Reset Form**
  const resetForm = () => {
    setName("");
    setSelectedId("");
    setGeo("");
    setNote("");
    setTarget("");
    setAcc_email("");
    setPoc_email("");
    setAssign_user("");
    setAssign_id("");
    setEditingAdv(null);
  };
  const handlePause = async (record) => {
    try {
      const response = await axios.post(`${apiUrl}/advid-pause`, {
        adv_id: record.adv_id,
        pause: 1,
      });

      if (response.data.success) {
        Swal.fire(
          "Paused",
          `Advertiser ${record.adv_id} has been paused.`,
          "success"
        );

        // ✅ Refresh data after pause
        const { data } = await axios.get(`${apiUrl}/get-NameAdv/`);
        if (data.success && Array.isArray(data.data)) {
          setTableData(data.data);
        }
      } else {
        Swal.fire(
          "Failed",
          `Failed to pause advertiser ${record.pub_id}.`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error pausing advertiser:", error);
      Swal.fire("Error", "Error occurred while pausing advertiser.", "error");
    }
  };
  // **Table Columns**
  // const columns = [
  //   {
  //     title: (
  //       <div className="flex items-center justify-between">
  //         <span>Username</span>
  //       </div>
  //     ),
  //     key: "username",
  //     dataIndex: "username",
  //     sorter: (a, b) => a.adv_id.localeCompare(b.adv_id),
  //     sortOrder: sortInfo.columnKey === "username" ? sortInfo.order : null,
  //     onHeaderCell: () => ({
  //       onClick: () => {
  //         let newOrder = "ascend";

  //         if (sortInfo.columnKey === "username") {
  //           if (sortInfo.order === "ascend") newOrder = "descend";
  //           else if (sortInfo.order === "descend")
  //             newOrder = null; // 🔹 third click removes sorting
  //           else newOrder = "ascend";
  //         }

  //         setSortInfo({
  //           columnKey: "username",
  //           order: newOrder,
  //         });
  //       },
  //     }),
  //     filterDropdown: ({ confirm }) => (
  //       <div style={{ padding: 8 }}>
  //         <Select
  //           mode="multiple"
  //           allowClear
  //           showSearch
  //           placeholder="Select UserName"
  //           style={{ width: 200 }}
  //           value={filters["username"] || []}
  //           onChange={(value) => {
  //             handleFilterChange(value, "username");
  //             confirm();
  //           }}>
  //           {safeArray("username").map((val) => (
  //             <Select.Option key={val} value={val}>
  //               {val}
  //             </Select.Option>
  //           ))}
  //         </Select>
  //       </div>
  //     ),
  //     filtered: !!filters["username"],
  //   },
  //   {
  //     title: (
  //       <div className="flex items-center justify-between">
  //         <span>Advertiser ID</span>
  //       </div>
  //     ),
  //     dataIndex: "adv_id",
  //     key: "adv_id",
  //     sorter: (a, b) => a.adv_id.localeCompare(b.adv_id),
  //     sortOrder: sortInfo.columnKey === "adv_id" ? sortInfo.order : null,
  //     onHeaderCell: () => ({
  //       onClick: () => {
  //         let newOrder = "ascend";

  //         if (sortInfo.columnKey === "adv_id") {
  //           if (sortInfo.order === "ascend") newOrder = "descend";
  //           else if (sortInfo.order === "descend")
  //             newOrder = null; // 🔹 third click removes sorting
  //           else newOrder = "ascend";
  //         }

  //         setSortInfo({
  //           columnKey: "adv_id",
  //           order: newOrder,
  //         });
  //       },
  //     }),
  //     filterDropdown: ({ confirm }) => (
  //       <div style={{ padding: 8 }}>
  //         <Select
  //           mode="multiple"
  //           allowClear
  //           showSearch
  //           placeholder="Select Advertiser ID"
  //           style={{ width: 200 }}
  //           value={filters["adv_id"] || []}
  //           onChange={(value) => {
  //             handleFilterChange(value, "adv_id");
  //             confirm();
  //           }}>
  //           {safeArray("adv_id").map((val) => (
  //             <Select.Option key={val} value={val}>
  //               {val}
  //             </Select.Option>
  //           ))}
  //         </Select>
  //       </div>
  //     ),
  //     filtered: !!filters["adv_id"],
  //   },
  //   {
  //     title: (
  //       <div className="flex items-center justify-between">
  //         <span>Advertiser Name</span>
  //       </div>
  //     ),
  //     dataIndex: "adv_name",
  //     key: "adv_name",
  //     sorter: (a, b) => a.adv_name.localeCompare(b.adv_name),
  //     sortOrder: sortInfo.columnKey === "adv_name" ? sortInfo.order : null,
  //     onHeaderCell: () => ({
  //       onClick: () => {
  //         let newOrder = "ascend";

  //         if (sortInfo.columnKey === "adv_name") {
  //           if (sortInfo.order === "ascend") newOrder = "descend";
  //           else if (sortInfo.order === "descend")
  //             newOrder = null; // 🔹 third click removes sorting
  //           else newOrder = "ascend";
  //         }

  //         setSortInfo({
  //           columnKey: "adv_name",
  //           order: newOrder,
  //         });
  //       },
  //     }),
  //     filterDropdown: ({ confirm }) => (
  //       <div style={{ padding: 8 }}>
  //         <Select
  //           mode="multiple"
  //           allowClear
  //           showSearch
  //           placeholder="Select Advertiser Name"
  //           style={{ width: 200 }}
  //           value={filters["adv_name"] || []}
  //           onChange={(value) => {
  //             handleFilterChange(value, "adv_name");
  //             confirm();
  //           }}>
  //           {safeArray("adv_name").map((val) => (
  //             <Select.Option key={val} value={val}>
  //               {val}
  //             </Select.Option>
  //           ))}
  //         </Select>
  //       </div>
  //     ),
  //     filtered: !!filters["adv_name"],
  //   },
  //   {
  //     title: (
  //       <div className="flex items-center justify-between">
  //         <span>Geo</span>
  //       </div>
  //     ),
  //     dataIndex: "geo",
  //     key: "geo",
  //     sorter: (a, b) => a.geo.localeCompare(b.geo),
  //     sortOrder: sortInfo.columnKey === "geo" ? sortInfo.order : null,
  //     onHeaderCell: () => ({
  //       onClick: () => {
  //         let newOrder = "ascend";

  //         if (sortInfo.columnKey === "geo") {
  //           if (sortInfo.order === "ascend") newOrder = "descend";
  //           else if (sortInfo.order === "descend")
  //             newOrder = null; // 🔹 third click removes sorting
  //           else newOrder = "ascend";
  //         }

  //         setSortInfo({
  //           columnKey: "geo",
  //           order: newOrder,
  //         });
  //       },
  //     }),
  //     filterDropdown: ({ confirm }) => (
  //       <div style={{ padding: 8 }}>
  //         <Select
  //           mode="multiple"
  //           allowClear
  //           showSearch
  //           placeholder="Select Geo"
  //           style={{ width: 200 }}
  //           value={filters["geo"] || []}
  //           onChange={(value) => {
  //             handleFilterChange(value, "geo");
  //             confirm();
  //           }}>
  //           {safeArray("geo").map((val) => (
  //             <Select.Option key={val} value={val}>
  //               {val}
  //             </Select.Option>
  //           ))}
  //         </Select>
  //       </div>
  //     ),
  //     filtered: !!filters["geo"],
  //   },
  //   {
  //     title: (
  //       <div className="flex items-center justify-between">
  //         <span>Note</span>
  //       </div>
  //     ),
  //     dataIndex: "note",
  //     key: "note",
  //     sorter: (a, b) => a.note.localeCompare(b.note),
  //     sortOrder: sortInfo.columnKey === "note" ? sortInfo.order : null,
  //     onHeaderCell: () => ({
  //       onClick: () => {
  //         let newOrder = "ascend";

  //         if (sortInfo.columnKey === "note") {
  //           if (sortInfo.order === "ascend") newOrder = "descend";
  //           else if (sortInfo.order === "descend")
  //             newOrder = null; // 🔹 third click removes sorting
  //           else newOrder = "ascend";
  //         }

  //         setSortInfo({
  //           columnKey: "note",
  //           order: newOrder,
  //         });
  //       },
  //     }),
  //     filterDropdown: ({ confirm }) => (
  //       <div style={{ padding: 8 }}>
  //         <Select
  //           mode="multiple"
  //           allowClear
  //           showSearch
  //           placeholder="Select Note"
  //           style={{ width: 200 }}
  //           value={filters["note"] || []}
  //           onChange={(value) => {
  //             handleFilterChange(value, "note");
  //             confirm();
  //           }}>
  //           {safeArray("note").map((val) => (
  //             <Select.Option key={val} value={val}>
  //               {val}
  //             </Select.Option>
  //           ))}
  //         </Select>
  //       </div>
  //     ),
  //     filtered: !!filters["note"],
  //   },
  //   {
  //     title: (
  //       <div className="flex items-center justify-between">
  //         <span>Target</span>
  //       </div>
  //     ),
  //     dataIndex: "target",
  //     key: "target",
  //     sorter: (a, b) => a.target.localeCompare(b.target),
  //     sortOrder: sortInfo.columnKey === "target" ? sortInfo.order : null,
  //     onHeaderCell: () => ({
  //       onClick: () => {
  //         let newOrder = "ascend";

  //         if (sortInfo.columnKey === "target") {
  //           if (sortInfo.order === "ascend") newOrder = "descend";
  //           else if (sortInfo.order === "descend")
  //             newOrder = null; // 🔹 third click removes sorting
  //           else newOrder = "ascend";
  //         }

  //         setSortInfo({
  //           columnKey: "target",
  //           order: newOrder,
  //         });
  //       },
  //     }),
  //     filterDropdown: ({ confirm }) => (
  //       <div style={{ padding: 8 }}>
  //         <Select
  //           mode="multiple"
  //           allowClear
  //           showSearch
  //           placeholder="Select Target"
  //           style={{ width: 200 }}
  //           value={filters["target"] || []}
  //           onChange={(value) => {
  //             handleFilterChange(value, "target");
  //             confirm();
  //           }}>
  //           {safeArray("target").map((val) => (
  //             <Select.Option key={val} value={val}>
  //               {val}
  //             </Select.Option>
  //           ))}
  //         </Select>
  //       </div>
  //     ),
  //     filtered: !!filters["target"],
  //   },
  //   {
  //     title: "Acc Email",
  //     dataIndex: "acc_email",
  //     key: "acc_email",
  //     sorter: (a, b) => a.acc_email.localeCompare(b.acc_email),
  //     sortOrder: sortInfo.columnKey === "acc_email" ? sortInfo.order : null,
  //     onHeaderCell: () => ({
  //       onClick: () => {
  //         let newOrder = "ascend";

  //         if (sortInfo.columnKey === "acc_email") {
  //           if (sortInfo.order === "ascend") newOrder = "descend";
  //           else if (sortInfo.order === "descend")
  //             newOrder = null; // 🔹 third click removes sorting
  //           else newOrder = "ascend";
  //         }

  //         setSortInfo({
  //           columnKey: "acc_email",
  //           order: newOrder,
  //         });
  //       },
  //     }),
  //     render: (text) => (user?.role === "advertiser" ? "*****" : text),
  //   },
  //   {
  //     title: "POC Email",
  //     dataIndex: "poc_email",
  //     key: "poc_email",
  //     sorter: (a, b) => a.poc_email.localeCompare(b.poc_email),
  //     sortOrder: sortInfo.columnKey === "poc_email" ? sortInfo.order : null,
  //     onHeaderCell: () => ({
  //       onClick: () => {
  //         let newOrder = "ascend";

  //         if (sortInfo.columnKey === "poc_email") {
  //           if (sortInfo.order === "ascend") newOrder = "descend";
  //           else if (sortInfo.order === "descend")
  //             newOrder = null; // 🔹 third click removes sorting
  //           else newOrder = "ascend";
  //         }

  //         setSortInfo({
  //           columnKey: "poc_email",
  //           order: newOrder,
  //         });
  //       },
  //     }),
  //     render: (text) => (user?.role === "advertiser" ? "*****" : text),
  //   },

  //   {
  //     title: "Assign User",
  //     key: "assign_user",
  //     dataIndex: "assign_user",
  //     sorter: (a, b) => a.assign_user.localeCompare(b.assign_user),
  //     sortOrder: sortInfo.columnKey === "assign_user" ? sortInfo.order : null,
  //     onHeaderCell: () => ({
  //       onClick: () => {
  //         let newOrder = "ascend";

  //         if (sortInfo.columnKey === "assign_user") {
  //           if (sortInfo.order === "ascend") newOrder = "descend";
  //           else if (sortInfo.order === "descend")
  //             newOrder = null; // 🔹 third click removes sorting
  //           else newOrder = "ascend";
  //         }

  //         setSortInfo({
  //           columnKey: "assign_user",
  //           order: newOrder,
  //         });
  //       },
  //     }),
  //     filterDropdown: ({ confirm }) => (
  //       <div style={{ padding: 8 }}>
  //         <Select
  //           mode="multiple"
  //           allowClear
  //           showSearch
  //           placeholder="Select Assign User"
  //           style={{ width: 200 }}
  //           value={filters["assign_user"] || []}
  //           onChange={(value) => {
  //             handleFilterChange(value, "assign_user");
  //             confirm();
  //           }}>
  //           {safeArray("assign_user").map((val) => (
  //             <Select.Option key={val} value={val}>
  //               {val}
  //             </Select.Option>
  //           ))}
  //         </Select>
  //       </div>
  //     ),
  //     filtered: !!filters["assign_user"],
  //   },
  //   {
  //     title: "Transfer Adv AM",
  //     key: "user_id",
  //     render: (_, record) => {
  //       const isEditing = editingAssignRowId === record.adv_id;

  //       if (isEditing) {
  //         return (
  //           <Select
  //             autoFocus
  //             value={record.username}
  //             onChange={async (newUserId) => {
  //               try {
  //                 const response = await axios.put(`${apiUrl}/update-advid`, {
  //                   ...record,
  //                   user_id: newUserId,
  //                 });

  //                 if (response.data.success) {
  //                   Swal.fire(
  //                     "Success",
  //                     "User transferred successfully!",
  //                     "success"
  //                   );

  //                   // ✅ Update local tableData to reflect changes
  //                   setTableData((prev) =>
  //                     prev.map((item) =>
  //                       item.adv_id === record.adv_id
  //                         ? {
  //                             ...item,
  //                             user_id: newUserId,
  //                           }
  //                         : item
  //                     )
  //                   );
  //                 } else {
  //                   Swal.fire("Error", "Failed to transfer user", "error");
  //                 }
  //               } catch (error) {
  //                 console.error("User transfer error:", error);
  //                 Swal.fire("Error", "Something went wrong", "error");
  //               } finally {
  //                 setEditingAssignRowId(null);
  //               }
  //             }}
  //             onBlur={() => setEditingAssignRowId(null)} // Close if user clicks away
  //             className="min-w-[150px]">
  //             <Option value="">Select Sub Admin</Option>
  //             {subAdmins.map((admin) => (
  //               <Option key={admin.id} value={admin.id.toString()}>
  //                 {admin.username}
  //               </Option>
  //             ))}
  //           </Select>
  //         );
  //       }

  //       // Show normal text, and enter edit mode on click
  //       return (
  //         <span
  //           onClick={() => setEditingAssignRowId(record.adv_id)}
  //           className="cursor-pointer hover:underline"
  //           title="Click to change user">
  //           {"-"}
  //         </span>
  //       );
  //     },
  //   },
  //   {
  //     title: (
  //       <div className="flex items-center justify-between">
  //         <span>Postback URL</span>
  //       </div>
  //     ),
  //     dataIndex: "postback_url",
  //     key: "postback_url",
  //     sorter: (a, b) => a.postback_url.localeCompare(b.postback_url),
  //     sortOrder: sortInfo.columnKey === "postback_url" ? sortInfo.order : null,
  //     onHeaderCell: () => ({
  //       onClick: () => {
  //         let newOrder = "ascend";

  //         if (sortInfo.columnKey === "postback_url") {
  //           if (sortInfo.order === "ascend") newOrder = "descend";
  //           else if (sortInfo.order === "descend")
  //             newOrder = null; // 🔹 third click removes sorting
  //           else newOrder = "ascend";
  //         }

  //         setSortInfo({
  //           columnKey: "geo",
  //           order: newOrder,
  //         });
  //       },
  //     }),
  //     filterDropdown: ({ confirm }) => (
  //       <div style={{ padding: 8 }}>
  //         <Select
  //           mode="multiple"
  //           allowClear
  //           showSearch
  //           placeholder="Select Postback URL"
  //           style={{ width: 200 }}
  //           value={filters["postback_url"] || []}
  //           onChange={(value) => {
  //             handleFilterChange(value, "postback_url");
  //             confirm();
  //           }}>
  //           {safeArray("postback_url").map((val) => (
  //             <Select.Option key={val} value={val}>
  //               {val}
  //             </Select.Option>
  //           ))}
  //         </Select>
  //       </div>
  //     ),
  //     filtered: !!filters["postback_url"],
  //   },
  //   {
  //     title: "Actions",
  //     key: "actions",
  //     render: (_, record) => (
  //       <Space size="middle">
  //         <Tooltip title="Edit">
  //           <EditOutlined
  //             onClick={() => handleEdit(record)}
  //             style={{
  //               color: "#2F5D99",
  //               fontSize: "18px",
  //               cursor: "pointer",
  //             }}
  //           />
  //         </Tooltip>
  //       </Space>
  //     ),
  //   },
  // ];
  const createExcelColumn = ({
    key,
    title,
    filters,
    setFilters,
    uniqueValues,
    filterSearch,
    setFilterSearch,
    pinnedColumns,
    togglePin,
    sortInfo,
    setSortInfo,
  }) => {
    const isFiltered = !!filters[key]?.length;
    const isPinned = pinnedColumns[key];
    const isSorted = sortInfo.columnKey === key;

    return {
      title: (
        <div className="flex items-center justify-between gap-2">
          <span
            style={{
              color: isFiltered ? "#1677ff" : "inherit",
              fontWeight: isFiltered ? "bold" : "normal",
            }}>
            {title}
          </span>

          <PushpinOutlined
            onClick={(e) => {
              e.stopPropagation();
              togglePin(key);
            }}
            style={{
              color: isPinned ? "#1677ff" : "#aaa",
              cursor: "pointer",
            }}
          />
        </div>
      ),

      key,
      dataIndex: key,
      fixed: isPinned ? "left" : false,

      sorter: (a, b) =>
        (a[key] || "").toString().localeCompare((b[key] || "").toString()),

      sortOrder: isSorted ? sortInfo.order : null,

      onHeaderCell: () => ({
        onClick: () => {
          let newOrder = "ascend";

          if (sortInfo.columnKey === key) {
            if (sortInfo.order === "ascend") newOrder = "descend";
            else if (sortInfo.order === "descend") newOrder = null;
          }

          setSortInfo({ columnKey: key, order: newOrder });
        },
      }),

      filterDropdown: () => {
        const allValues = Array.isArray(uniqueValues[key])
          ? uniqueValues[key]
          : [];

        const selectedValues = Array.isArray(filters[key])
          ? filters[key]
          : allValues;

        const searchVal = filterSearch[key] || "";

        const visibleValues = allValues.filter((v) =>
          v.toLowerCase().includes(searchVal.toLowerCase())
        );

        const isAllSelected = selectedValues.length === allValues.length;
        const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

        return (
          <div className="w-[260px]" onClick={(e) => e.stopPropagation()}>
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

            <div className="px-3 py-2">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={(e) => {
                  setFilters((prev) => {
                    const next = { ...prev };
                    if (e.target.checked) delete next[key];
                    else next[key] = [];
                    return next;
                  });
                }}>
                Select All
              </Checkbox>
            </div>

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
      },

      filtered: isFiltered,
    };
  };
  const columnConfig = {
    username: "Username",
    adv_id: "Advertiser ID",
    adv_name: "Advertiser Name",
    geo: "Geo",
    note: "Note",
    target: "Target",
  };
  const columns = [
    ...Object.entries(columnConfig).map(([key, label]) =>
      createExcelColumn({
        key,
        title: label,
        filters,
        setFilters,
        uniqueValues,
        filterSearch,
        setFilterSearch,
        pinnedColumns,
        togglePin,
        sortInfo,
        setSortInfo,
      })
    ),
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
      key: "assign_user",
      dataIndex: "assign_user",
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
                  const response = await axios.put(`${apiUrl}/update-advid`, {
                    ...record,
                    user_id: newUserId,
                  });

                  if (response.data.success) {
                    Swal.fire(
                      "Success",
                      "User transferred successfully!",
                      "success"
                    );

                    // ✅ Update local tableData to reflect changes
                    setTableData((prev) =>
                      prev.map((item) =>
                        item.adv_id === record.adv_id
                          ? {
                              ...item,
                              user_id: newUserId,
                            }
                          : item
                      )
                    );
                  } else {
                    Swal.fire("Error", "Failed to transfer user", "error");
                  }
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
      title: (
        <div className="flex items-center justify-between">
          <span>Postback URL</span>
        </div>
      ),
      dataIndex: "postback_url",
      key: "postback_url",
    },
  ];

  return (
    <div className="m-6 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Advertisers</h2>

      {/* Show Form Only in Edit Mode */}
      {editingAdv && (
        <form
          onSubmit={handleUpdate}
          className="bg-white shadow-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Update Advertiser
          </h2>

          {/* Grid layout for two-column structure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Advertiser Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Advertiser Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter advertiser name"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99] transition-all"
                required
              />
            </div>

            {/* Advertiser ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Advertiser ID (Cannot be modified)
              </label>
              <input
                type="text"
                value={selectedId}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                disabled
              />
            </div>

            {/* Select Geo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Geo
              </label>
              <select
                showSearch
                value={geo}
                onChange={(value) => setGeo(value)}
                placeholder="Select Geo"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99]"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.label?.toLowerCase().includes(input.toLowerCase())
                }>
                {geoData.geo?.map((geo) => (
                  <option key={geo.code} value={geo.code} label={`${geo.code}`}>
                    {geo.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Enter target value"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99]"
              />
            </div>

            {/* Account Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account Email
              </label>
              <input
                type="text"
                value={acc_email}
                onChange={(e) => setAcc_email(e.target.value)}
                placeholder="Enter account email"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99]"
              />
            </div>

            {/* POC Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                POC Email
              </label>
              <input
                type="text"
                value={poc_email}
                onChange={(e) => setPoc_email(e.target.value)}
                placeholder="Enter POC email"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99]"
              />
            </div>

            {/* Assign User */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assign User
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99]"
                value={assign_id}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedUser = subAdmins.find(
                    (admin) => admin.id.toString() === selectedId
                  );
                  setAssign_id(selectedId);
                  setAssign_user(selectedUser ? selectedUser.username : "");
                }}>
                <option value="">Select Sub Admin</option>
                {subAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Note (Full Width on 2 columns) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="3"
                placeholder="Enter any note"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:!border-[#2F5D99] focus:!ring-1 focus:!ring-[#2F5D99] transition-all"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="submit"
              className="w-full sm:w-1/2 bg-[#2F5D99] hover:bg-[#24487A] text-white font-medium py-3 rounded-lg shadow-md transition-all">
              Update Advertiser
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-1/2 bg-gray-400 hover:bg-gray-500 text-white font-medium py-3 rounded-lg shadow-md transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* 🔍 Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        {/* Search Section */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search by Advertiser Name, Geo, or Note"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined className="text-gray-400" />}
            className="!w-72 !rounded-lg !border-gray-300 hover:!border-[#2F5D99] focus:!border-[#2F5D99] !shadow-sm transition-all"
          />

          <Button
            type="default"
            onClick={() => handleSearch?.()} // optional if you have a search handler
            className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-6 !py-2 !h-10 !text-sm !border-none !shadow-md flex items-center gap-2">
            <SearchOutlined /> Search
          </Button>

          <Button
            onClick={() => {
              setSearchTerm("");
              setFilters({});
              setPinnedColumns({});
            }}
            className="!bg-gray-400 hover:!bg-gray-500 !text-white !rounded-lg !px-6 !py-2 !h-10 !text-sm !border-none !shadow-md flex items-center gap-2"
            disabled={Object.keys(filters).length === 0 && !searchTerm}>
            <ReloadOutlined /> Clear Filters
          </Button>
        </div>
      </div>

      {/* Table Component */}
      <StyledTable
        dataSource={finalFilteredData}
        columns={columns}
        rowKey="id"
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
    </div>
  );
};

export default AdvnameData;
