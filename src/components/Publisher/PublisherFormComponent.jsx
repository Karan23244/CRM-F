import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  Spin,
  Alert,
  Select,
  Button,
  Space,
  Input,
  Tooltip,
} from "antd";
import { useSelector } from "react-redux";
import StyledTable from "../../Utils/StyledTable";
import {
  SearchOutlined,
  UserOutlined,
  DatabaseOutlined,
  EditOutlined,
} from "@ant-design/icons";
import geoData from "../../Data/geoData.json";
import SubAdminPubnameData from "./SubAdminPubnameData";
import Swal from "sweetalert2";
const { Option } = Select;

const apiUrl = import.meta.env.VITE_API_URL;

const PublisherIDDashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState("yourData");

  const showAssignPubTab = user?.role?.includes("publisher_manager");

  return (
    <div className="p-6 bg-[#F4F7FB] min-h-screen rounded-xl shadow-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#2F5D99] mb-4 md:mb-0">
          Publisher Dashboard
        </h2>
      </div>

      {/* Tabs Section — only show if user is publisher_manager */}
      {showAssignPubTab && (
        <div className="flex flex-wrap gap-3 mb-6 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <Button
            icon={<UserOutlined />}
            type="default"
            onClick={() => setActiveTab("yourData")}
            className={`!rounded-lg !px-6 !py-2 !text-base font-semibold ${
              activeTab === "yourData"
                ? "!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !border-none !shadow-md"
                : "!bg-gray-100 hover:!bg-gray-200 !text-[#2F5D99]"
            }`}>
            Your Data
          </Button>

          <Button
            icon={<DatabaseOutlined />}
            type="default"
            onClick={() => setActiveTab("assignPub")}
            className={`!rounded-lg !px-6 !py-2 !text-base font-semibold ${
              activeTab === "assignPub"
                ? "!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !border-none !shadow-md"
                : "!bg-gray-100 hover:!bg-gray-200 !text-[#2F5D99]"
            }`}>
            Assign Pub Data
          </Button>
        </div>
      )}

      {/* Active Tab Content */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        {activeTab === "yourData" ? (
          <PublisherEditForm />
        ) : showAssignPubTab ? (
          <SubAdminPubnameData />
        ) : null}
      </div>
    </div>
  );
};

export default PublisherIDDashboard;

// const PublisherCreateForm = () => {
//   const user = useSelector((state) => state.auth.user);
//   const userId = user?.id || null;
//   const [name, setName] = useState("");
//   const [selectedId, setSelectedId] = useState("");
//   const [geo, setGeo] = useState("");
//   const [note, setNote] = useState("");
//   const [publishers, setPublishers] = useState([]);
//   const [availableIds, setAvailableIds] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [usedIds, setUsedIds] = useState(new Set());
//   const [editingPub, setEditingPub] = useState(null);
//   const [level, setLevel] = useState("");
//   const [target, setTarget] = useState("");
//   const [searchTextPub, setSearchTextPub] = useState("");
//   const [showForm, setShowForm] = useState(false);

//   // **Initialize available IDs**
//   useEffect(() => {
//     if (user && Array.isArray(user.single_ids)) {
//       const allAvailableIds = user.single_ids.map((id) => id.toString());
//       setAvailableIds(allAvailableIds);
//     }
//   }, [user]);

//   // Fetch publishers
//   useEffect(() => {
//     const fetchPublishers = async () => {
//       if (!userId) return;
//       setLoading(true);
//       try {
//         const { data } = await axios.get(`${apiUrl}/pubid-data/${userId}`);
//         if (data.success && Array.isArray(data.Publisher)) {
//           setPublishers(data.Publisher);

//           const usedIdsSet = new Set(data.Publisher.map((adv) => adv.pub_id));
//           setUsedIds(usedIdsSet);
//           setAvailableIds((prevIds) =>
//             prevIds.filter((id) => !usedIdsSet.has(id))
//           );
//         }
//       } catch (error) {
//         console.error("Error fetching publishers:", error);
//         setError("Failed to fetch publishers. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPublishers();
//   }, [userId]);

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     e.preventDefault();

//     // Trim values before validation & submission
//     const trimmedName = name.trim();
//     const trimmedId = selectedId.trim();
//     const trimmedGeo = geo.trim();
//     const trimmedNote = note.trim();
//     const trimmedTarget = target.trim();
//     const trimmedLevel = level.trim();

//     if (!trimmedName || !trimmedId || !trimmedGeo) {
//       Swal.fire({
//         icon: "error",
//         title: "Validation Error",
//         text: "Publisher Name, Publisher ID, and Geo are required.",
//       });
//       return;
//     }

//     const updatedPub = {
//       pub_name: trimmedName,
//       pub_id: trimmedId,
//       geo: trimmedGeo,
//       user_id: userId,
//       note: trimmedNote || "",
//       target: trimmedTarget || "",
//       level: trimmedLevel || "",
//     };
//     setLoading(true);
//     try {
//       if (editingPub) {
//         await axios.put(`${apiUrl}/update-pubid`, updatedPub);
//         Swal.fire({
//           icon: "success",
//           title: "Updated!",
//           text: "Publisher updated successfully",
//           timer: 2000,
//           showConfirmButton: false,
//         });
//         setEditingPub(null);
//       } else {
//         await axios.post(`${apiUrl}/create-pubid`, updatedPub);
//         Swal.fire({
//           icon: "success",
//           title: "Created!",
//           text: "Publisher created successfully",
//           timer: 2000,
//           showConfirmButton: false,
//         });
//       }

//       const { data } = await axios.get(`${apiUrl}/pubid-data/${userId}`);
//       if (data.success && Array.isArray(data.Publisher)) {
//         setPublishers(data.Publisher);
//         const usedIds = new Set(data.Publisher.map((pub) => pub.pub_id));
//         setAvailableIds((prevIds) => prevIds.filter((id) => !usedIds.has(id)));
//       }

//       resetForm();
//       setShowForm(false); // 👈 hide form after submit
//     } catch (error) {
//       console.error("Error creating/updating publisher:", error);
//       setError("Failed to create/update publisher. Please try again.");
//       Swal.fire({
//         icon: "error",
//         title: "Oops...",
//         text: "Failed to create/update publisher. Please try again.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle Edit
//   const handleEdit = (record) => {
//     setEditingPub(record);
//     setName(record.pub_name);
//     setSelectedId(record.pub_id);
//     setGeo(record.geo);
//     setNote(record.note);
//     setTarget(record.target || "");
//     setLevel(record.level || "");
//     setShowForm(true); // 👈 show form when editing
//   };

//   // Reset
//   const resetForm = () => {
//     setName("");
//     setSelectedId("");
//     setGeo("");
//     setNote("");
//     setEditingPub(null);
//     setTarget("");
//     setError("");
//     setLevel("");
//   };

//   // Filter
//   const filteredPublishers = publishers.filter((item) =>
//     Object.values(item).some((value) =>
//       String(value).toLowerCase().includes(searchTextPub.toLowerCase())
//     )
//   );

//   const columns = [
//     { title: "Publisher ID", dataIndex: "pub_id", key: "pub_id" },
//     { title: "Publisher Name", dataIndex: "pub_name", key: "pub_name" },
//     { title: "Geo", dataIndex: "geo", key: "geo" },
//     { title: "Note", dataIndex: "note", key: "note" },
//     { title: "Target", dataIndex: "target", key: "target" },
//     { title: "Rating", dataIndex: "level", key: "level" },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_, record) => (
//         <Space size="middle">
//           <Button type="link" onClick={() => handleEdit(record)}>
//             Edit
//           </Button>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="m-6 p-6 bg-white shadow-md rounded-lg">
//       {/* Toggle button */}
//       {!showForm && !editingPub && (
//         <button
//           onClick={() => setShowForm(true)}
//           className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer">
//           Add Publisher
//         </button>
//       )}

//       {/* Form */}
//       {showForm && (
//         <>
//           <h2 className="text-2xl font-bold mb-4">
//             {editingPub ? "Edit Publisher" : "Create Publisher"}
//           </h2>

//           {error && (
//             <Alert message={error} type="error" showIcon className="mb-4" />
//           )}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* Publisher Name */}
//             <div>
//               <label className="block text-lg font-medium">
//                 Publisher Name
//               </label>
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className="w-full p-2 border border-gray-300 rounded-lg"
//                 required
//                 disabled={!!editingPub}
//               />
//             </div>

//             {/* Publisher ID */}
//             <div>
//               <label className="block text-lg font-medium">
//                 Select Publisher ID
//               </label>
//               <select
//                 value={selectedId}
//                 onChange={(e) => setSelectedId(e.target.value)}
//                 className="w-full p-2 border border-gray-300 rounded-lg"
//                 required
//                 disabled={!!editingPub}>
//                 <option value="">Select an ID</option>
//                 {availableIds.length > 0 || editingPub ? (
//                   (editingPub ? [editingPub.pub_id] : availableIds).map(
//                     (id) => (
//                       <option key={id} value={id}>
//                         {id}
//                       </option>
//                     )
//                   )
//                 ) : (
//                   <option disabled>No available IDs</option>
//                 )}
//               </select>
//             </div>

//             {/* Geo */}
//             <div>
//               <label className="block text-lg font-medium">Select Geo</label>
//               <Select
//                 showSearch
//                 value={geo}
//                 onChange={(value) => setGeo(value)}
//                 placeholder="Select Geo"
//                 className="w-full"
//                 optionFilterProp="children"
//                 filterOption={(input, option) =>
//                   option?.label?.toLowerCase().includes(input.toLowerCase())
//                 }
//                 required>
//                 {geoData.geo?.map((geo) => (
//                   <Select.Option
//                     key={geo.code}
//                     value={geo.code}
//                     label={`${geo.code}`}>
//                     {geo.code}
//                   </Select.Option>
//                 ))}
//               </Select>
//             </div>

//             {editingPub && user?.role === "publisher_manager" && (
//               <>
//                 <div>
//                   <label className="block text-lg font-medium">Target</label>
//                   <input
//                     type="text"
//                     value={target}
//                     onChange={(e) => setTarget(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded-lg"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-lg font-medium">Note</label>
//                   <textarea
//                     value={note}
//                     onChange={(e) => setNote(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded-lg"
//                     rows="3"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-lg font-medium">Rating</label>
//                   <input
//                     type="text"
//                     value={level}
//                     onChange={(e) => setLevel(e.target.value)}
//                     className="w-full p-2 border border-gray-300 rounded-lg"
//                   />
//                 </div>
//               </>
//             )}

//             {/* Submit */}
//             <button
//               type="submit"
//               className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 cursor-pointer"
//               disabled={loading}>
//               {loading ? (
//                 <Spin size="small" />
//               ) : editingPub ? (
//                 "Update"
//               ) : (
//                 "Create"
//               )}
//             </button>

//             <button
//               type="button"
//               onClick={() => {
//                 resetForm();
//                 setShowForm(false); // 👈 hide form on cancel
//               }}
//               className="w-full mt-2 bg-gray-400 text-white p-2 rounded-lg hover:bg-gray-500 cursor-pointer">
//               Cancel
//             </button>
//           </form>
//         </>
//       )}

//       {/* Table */}
//       <div className="bg-white rounded-2xl shadow-xl p-6 mt-4">
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
//           <h3 className="text-2xl font-bold">Existing Publishers</h3>
//           <div className="relative w-full md:w-[300px]">
//             <Input
//               placeholder="Search Publishers..."
//               prefix={<SearchOutlined style={{ color: "#999" }} />}
//               value={searchTextPub}
//               onChange={(e) => setSearchTextPub(e.target.value)}
//               allowClear
//               className="rounded-full shadow-md border-none ring-1 ring-gray-300"
//             />
//           </div>
//         </div>

//         {loading ? (
//           <div className="flex justify-center items-center py-12">
//             <Spin size="large" />
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <Table
//               dataSource={filteredPublishers}
//               columns={columns}
//               rowKey="pub_id"
//               className="mt-4"
//               pagination={{
//                 pageSizeOptions: ["10", "20", "50", "100"],
//                 showSizeChanger: true,
//                 defaultPageSize: 10,
//                 showTotal: (total, range) =>
//                   `${range[0]}-${range[1]} of ${total} items`,
//               }}
//               scroll={{ x: "max-content" }}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

const PublisherEditForm = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;

  const [publishers, setPublishers] = useState([]);
  const [editingPub, setEditingPub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTextPub, setSearchTextPub] = useState("");
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [placeLinkValue, setPlaceLinkValue] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [pubId, setPubId] = useState("");
  const [geo, setGeo] = useState("");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("");
  // Fetch publishers list
  useEffect(() => {
    const fetchPublishers = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data } = await axios.get(`${apiUrl}/pubid-data/${userId}`);
        console.log("Fetched publishers data:", data);
        if (data.success && Array.isArray(data.Publisher)) {
          setPublishers(data.Publisher);
        }
      } catch (err) {
        console.error("Error fetching publishers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublishers();
  }, [userId]);

  // Helper: Get unique values for a column
  const getUniqueValues = (data, key) => [
    ...new Set(data.map((item) => item[key]).filter(Boolean)),
  ];
  // // Filtered data
  // const filteredPublishers = publishers.filter((item) =>
  //   Object.values(item).some((value) =>
  //     String(value).toLowerCase().includes(searchTextPub.toLowerCase())
  //   )
  // );
  // Filtered data for search
  const filteredData = publishers.filter((item) =>
    [item.pub_name, item.pub_id, item.geo, item.note, item.target].some(
      (field) =>
        field?.toString().toLowerCase().includes(searchTextPub.toLowerCase())
    )
  );

  // Handle edit click
  const handleEdit = (record) => {
    setEditingPub(record);
    setName(record.pub_name);
    setPubId(record.pub_id);
    setGeo(record.geo);
    setNote(record.note || "");
    setTarget(record.target || "");
    setLevel(record.level || "");
  };

  // Handle update
  const handleUpdate = async (e) => {
    e.preventDefault();

    const trimmed = {
      pub_name: name.trim(),
      pub_id: pubId.trim(),
      geo: geo.trim(),
      note: note.trim(),
      target: target.trim(),
      user_id: userId,
    };

    if (!trimmed.pub_name || !trimmed.pub_id || !trimmed.geo) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Publisher Name, ID, and Geo are required.",
      });
    }

    try {
      setLoading(true);
      const res = await axios.put(`${apiUrl}/update-pubid`, trimmed);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Publisher updated successfully!",
        });

        // Refresh data
        const { data } = await axios.get(`${apiUrl}/pubid-data/${userId}`);
        if (data.success && Array.isArray(data.Publisher)) {
          setPublishers(data.Publisher);
        }
        resetForm();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingPub(null);
    setName("");
    setPubId("");
    setGeo("");
    setNote("");
    setTarget("");
  };
  // Helper: Create filter dropdown with onChange
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
  // Handle place link save
  const autoSavePlaceLink = async (record, value) => {
    const trimmedValue = value.trim();

    // Skip API call if unchanged
    if ((record.place_link || "") === trimmedValue) {
      setEditingLinkId(null);
      return;
    }
    console.log("Auto-saving place link:", trimmedValue);
    console.log("For record:", record.pub_id);
    console.log("User ID:", userId);
    try {
      setLoading(true);

      const res = await axios.put(`${apiUrl}/place-link`, {
        pub_id: record.pub_id,
        user_id: userId,
        place_link: trimmedValue,
      });
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: "Postback URL saved successfully.",
        });

        // Refresh data
        const { data } = await axios.get(`${apiUrl}/pubid-data/${userId}`);
        if (data.success && Array.isArray(data.Publisher)) {
          setPublishers(data.Publisher);
        }
      }
    } catch (err) {
      // 🔥 Handle 404 specifically
      if (err.response?.status === 404) {
        Swal.fire({
          icon: "warning",
          title: "Link Not Generated",
          text: "Publisher link has not been generated.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: "Could not save Postback URL. Please try again.",
        });
      }
    } finally {
      setLoading(false);
      setEditingLinkId(null);
    }
  };

  const columns = [
    {
      title: "Publisher ID",
      dataIndex: "pub_id",
      key: "pub_id",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "pub_id",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.pub_id === value,
    },
    {
      title: "Publisher Name",
      dataIndex: "pub_name",
      key: "pub_name",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) =>
        createFilterDropdown(
          filteredData,
          "pub_name",
          setSelectedKeys,
          selectedKeys,
          confirm
        ),
      onFilter: (value, record) => record.pub_name === value,
    },
    {
      title: "Geo",
      dataIndex: "geo",
      key: "geo",
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
      title: "Rating",
      dataIndex: "level",
      key: "level",
      render: (text) => {
        if (!text) return "-";

        // Example: split by comma and process each numeric part
        return text
          .split(",")
          .map((part) => {
            // Extract number (can be negative or decimal)
            const match = part.match(/-?\d+(\.\d+)?/);
            if (match) {
              const num = parseFloat(match[0]).toFixed(2); // limit to 2 decimals
              return part.replace(match[0], num);
            }
            return part;
          })
          .join(",");
      },
    },
    {
      title: "Postback URL",
      dataIndex: "postback_url",
      key: "postback_url",
      width: 300,
      render: (text, record) => {
        const isEditing = editingLinkId === record.pub_id;

        if (isEditing) {
          return (
            <Input
              autoFocus
              value={placeLinkValue}
              placeholder="Paste Postback URL"
              onChange={(e) => setPlaceLinkValue(e.target.value)}
              onBlur={() => autoSavePlaceLink(record, placeLinkValue)}
              onPressEnter={() => autoSavePlaceLink(record, placeLinkValue)}
              className="w-full"
            />
          );
        }

        return (
          <div
            className="cursor-pointer min-h-[32px]"
            onClick={() => {
              setEditingLinkId(record.pub_id);
              setPlaceLinkValue(text || "");
            }}>
            {text ? (
              <a
                href={text}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}>
                {text}
              </a>
            ) : (
              <span className="text-gray-400">Click to add link</span>
            )}
          </div>
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
              type="text"
              icon={<EditOutlined style={{ color: "#1890ff", fontSize: 18 }} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="">
      {/* Edit Form */}
      {editingPub && (
        <form
          onSubmit={handleUpdate}
          className="bg-white p-8 rounded-2xl shadow-lg space-y-6 mb-8 border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-4">
            Update Publisher Details
          </h2>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Publisher Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Publisher Name
              </label>
              <input
                type="text"
                value={name}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
                readOnly
              />
            </div>

            {/* Publisher ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Publisher ID (Read Only)
              </label>
              <input
                type="text"
                value={pubId}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
                readOnly
              />
            </div>

            {/* Geo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Geo
              </label>
              <Select
                showSearch
                value={geo}
                onChange={(val) => setGeo(val)}
                placeholder="Select Geo"
                className="w-full !h-12"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.label?.toLowerCase().includes(input.toLowerCase())
                }
                required>
                {geoData.geo?.map((g) => (
                  <Select.Option key={g.code} value={g.code} label={g.code}>
                    {g.code}
                  </Select.Option>
                ))}
              </Select>
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
                placeholder="Enter target"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5D99] transition-all"
              />
            </div>

            {/* Note (Full Width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="3"
                placeholder="Add a note..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5D99] transition-all"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#2F5D99] hover:bg-[#24487A] text-white py-3 rounded-lg font-medium shadow-md transition-all duration-300 disabled:opacity-50">
              {loading ? <Spin size="small" /> : "Update"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-medium shadow-md transition-all duration-300">
              Cancel
            </button>
          </div>
        </form>
      )}
      {/* Search */}
      <div className="relative w-full md:w-[300px]">
        <Input
          placeholder="Search Publishers..."
          prefix={<SearchOutlined style={{ color: "#999" }} />}
          value={searchTextPub}
          onChange={(e) => setSearchTextPub(e.target.value)}
          allowClear
          className=" w-full rounded-full shadow-md border-none ring-1 ring-gray-300"
        />
      </div>
      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mt-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <StyledTable
              dataSource={filteredData}
              columns={columns}
              rowKey="pub_id"
              className="mt-4"
              pagination={{
                pageSizeOptions: ["10", "20", "50", "100"],
                showSizeChanger: true,
                defaultPageSize: 10,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: "max-content" }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
