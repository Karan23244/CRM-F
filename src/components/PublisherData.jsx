// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import {
//   Table,
//   Input,
//   Button,
//   Select,
//   DatePicker,
//   message,
//   Tooltip,
// } from "antd";
// import {
//   EditOutlined,
//   SaveOutlined,
//   PlusOutlined,
//   SearchOutlined,
//   CopyOutlined,
//   DeleteOutlined,
// } from "@ant-design/icons";
// import dayjs from "dayjs";
// import { useSelector } from "react-redux";
// import geoData from "../Data/geoData.json";
// import { exportToExcel } from "./exportExcel";

// const { Option } = Select;
// const apiUrl =
//   import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

// const PublisherData = () => {
//   const user = useSelector((state) => state.auth.user);
//   const [data, setData] = useState([]);
//   const [editingKey, setEditingKey] = useState(null);
//   const [editedRow, setEditedRow] = useState({});
//   const [selectedMonth, setSelectedMonth] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [finalFilteredData, setFinalFilteredData] = useState([]);
//   const [dropdownOptions, setDropdownOptions] = useState({
//     os: ["Android", "APK", "iOS"],
//   });
//   const [loading, setLoading] = useState(false);
//   const [filters, setFilters] = useState({});
//   useEffect(() => {
//     if (user?.id) {
//       fetchData();
//       fetchDropdowns();
//     }
//   }, [user]);
//   console.log(data);
//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get(`${apiUrl}/pubdata-byuser/${user.id}`);
//       setData(
//         response.data.reverse().map((item) => ({
//           ...item,
//           key: item.id,
//         }))
//       );
//     } catch (error) {
//       message.error("Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const fetchDropdowns = async () => {
//     try {
//       const [advmName, payableEvent, mmpTracker, pid, pubID, review] =
//         await Promise.all([
//           axios.get(`${apiUrl}/get-subadmin`),
//           axios.get(`${apiUrl}/get-paybleevernt`),
//           axios.get(`${apiUrl}/get-mmptracker`),
//           axios.get(`${apiUrl}/get-pid`),
//           axios.get(`${apiUrl}/pubid-data/${user.id}`),
//           axios.get(`${apiUrl}/get-reviews`),
//         ]);
//       setDropdownOptions((prev) => ({
//         ...prev,
//         adv_name:
//           advmName.data?.data
//             ?.filter(
//               (item) => item.role === "manager" || item.role === "advertiser"
//             )
//             .map((item) => item.username) || [],
//         payable_event:
//           payableEvent.data?.data?.map((item) => item.payble_event) || [],
//         mmp_tracker: mmpTracker.data?.data?.map((item) => item.mmptext) || [],
//         p_id: pid.data?.data?.map((item) => item.pid) || [],
//         pub_id: pubID.data?.Publisher?.map((item) => item.pub_id) || [],
//         geo: geoData.geo?.map((item) => item.code) || [],
//         review: review.data?.data?.map((item) => item.review_text) || [],
//       }));
//     } catch (error) {
//       message.error("Failed to fetch dropdown options");
//     }
//   };

//   const handleEdit = (id) => {
//     setEditingKey(id);
//     setEditedRow(data.find((row) => row.id === id) || {});
//   };

//   const handleSave = async () => {
//     const excludedFields = [
//       "paused_date",
//       "review",
//       "pub_total_numbers",
//       "pub_deductions",
//       "pub_approved_numbers",
//     ];
//     const isEmptyField = Object.entries(editedRow)
//       .filter(([key]) => !excludedFields.includes(key)) // Exclude specific fields
//       .some(([_, value]) => !value); // Check for empty values

//     if (isEmptyField) {
//       alert("All required fields must be filled!");
//       return;
//     }
//     try {
//       await axios.post(`${apiUrl}/pubdata-update/${editingKey}`, editedRow, {
//         headers: { "Content-Type": "application/json" },
//       });
//       setEditingKey(null);
//       fetchData();
//       alert("Data updated successfully");
//     } catch (error) {
//       alert("Failed to update data");
//     }
//   };
//   const handleAddRow = async () => {
//     try {
//       if (!user?.id) {
//         message.error("User ID is missing. Please login again.");
//         return;
//       }

//       const newRow = {
//         ...editedRow,
//         user_id: user.id,
//         createdAt: new Date().toISOString(),
//       };

//       await axios.post(`${apiUrl}/add-pubdata`, newRow, {
//         headers: { "Content-Type": "application/json" },
//       });

//       setEditedRow({});
//       fetchData();
//       message.success("Data added successfully");
//     } catch (error) {
//       message.error("Failed to add data");
//     }
//   };

//   const handleCopyRow = async (record) => {
//     try {
//       if (!user?.id) {
//         message.error("User ID is missing. Please login again.");
//         return;
//       }

//       const copiedRow = {
//         ...record,
//         id: undefined, // Remove the existing ID so the backend treats it as a new entry
//         user_id: user.id,
//         createdAt: new Date().toISOString(),
//       };

//       await axios.post(`${apiUrl}/add-pubdata`, copiedRow, {
//         headers: { "Content-Type": "application/json" },
//       });

//       fetchData();
//       message.success("Row copied and added successfully");
//     } catch (error) {
//       message.error("Failed to copy row");
//     }
//   };

//   const handleChange = (value, field) => {
//     setEditedRow((prev) => ({ ...prev, [field]: value }));
//   };
//   const handleDelete = (id) => {
//     const confirmDelete = window.confirm(
//       "Are you sure you want to delete this item? This action cannot be undone."
//     );
//     if (!confirmDelete) return;

//     axios
//       .post(`${apiUrl}/pubdata-delete-data/${id}`)
//       .then(() => {
//         alert("Data deleted");
//         fetchData();
//       })
//       .catch((err) => console.error("Error deleting Data:", err));
//   };
//   const columnHeadings = {
//     adv_name: "ADVM Name",
//     campaign_name: "Campaign Name",
//     geo: "GEO",
//     city: "State Or City",
//     os: "OS",
//     payable_event: "Payable Event",
//     mmp_tracker: "MMP Tracker",
//     pub_id: "Pub ID",
//     p_id: "PID",
//     pub_payout: "Pub Payout $",
//     shared_date: "Shared Date",
//     paused_date: "Paused Date",
//     review: "Review",
//     pub_total_numbers: "PUB Total Numbers",
//     pub_deductions: "PUB Deductions",
//     pub_approved_numbers: "PUB Approved Numbers",
//   };

//   const allowedFields = {
//     manager: [
//       "paused_date",
//       "pub_total_numbers",
//       "pub_deductions",
//       "pub_approved_numbers",
//     ],
//     publisher: ["paused_date"],
//   };

//   const handleFilterChange = (value, key) => {
//     setFilters((prev) => ({ ...prev, [key]: value }));
//   };

//   // const filteredRecords = data.filter((item) => {
//   //   return Object.keys(filters).every((key) => {
//   //     if (!filters[key]) return true;

//   //     // Date range filter
//   //     if (Array.isArray(filters[key]) && filters[key].length === 2) {
//   //       const [start, end] = filters[key];
//   //       return dayjs(item[key]).isBetween(start, end, null, "[]");
//   //     }

//   //     return item[key]
//   //       ?.toString()
//   //       .toLowerCase()
//   //       .includes(filters[key].toString().toLowerCase());
//   //   });
//   // });

//   const filteredRecords = data.filter((item) => {
//     // Apply existing filters
//     const matchesFilters = Object.keys(filters).every((key) => {
//       if (!filters[key]) return true;

//       // Date range filter
//       if (Array.isArray(filters[key]) && filters[key].length === 2) {
//         const [start, end] = filters[key];
//         return dayjs(item[key]).isBetween(start, end, null, "[]");
//       }

//       return item[key]
//         ?.toString()
//         .toLowerCase()
//         .includes(filters[key].toString().toLowerCase());
//     });

//     // Apply monthly filter (checks created_at field)
//     const matchesMonth = selectedMonth
//       ? dayjs(item.created_at).isSame(selectedMonth, "month")
//       : true;

//     return matchesFilters && matchesMonth;
//   });
//   useEffect(() => {
//     const lowerSearch = searchTerm.toLowerCase();
//     const result = filteredRecords?.filter(
//       (item) =>
//         item.adv_name?.toLowerCase().includes(lowerSearch) ||
//         item.campaign_name?.toLowerCase().includes(lowerSearch)
//     );
//     setFinalFilteredData(result);
//   }, [searchTerm, filteredRecords]);
//   const columns = [
//     ...Object.keys(data[0] || {})
//       .filter((key) => !["id", "user_id", "key", "created_at"].includes(key))
//       .map((key) => {
//         const isDateField = key.toLowerCase().includes("date");

//         return {
//           title: columnHeadings[key] || key.replace(/([A-Z])/g, " $1").trim(),
//           dataIndex: key,
//           key,
//           filters: isDateField
//             ? undefined
//             : data
//                 .map((item) => item[key])
//                 .filter(Boolean)
//                 .map((val) => ({ text: val, value: val })),
//           filterDropdown: () =>
//             isDateField ? (
//               <DatePicker
//                 onChange={(date, dateString) =>
//                   handleFilterChange(dateString, key)
//                 }
//                 style={{ width: "100%" }}
//               />
//             ) : dropdownOptions[key] ? (
//               <Select
//                 showSearch
//                 onChange={(value) => handleFilterChange(value, key)}
//                 style={{ width: "100%" }}
//                 allowClear
//                 placeholder="Search..."
//                 filterOption={(input, option) =>
//                   option.children.toLowerCase().includes(input.toLowerCase())
//                 }>
//                 {dropdownOptions[key].map((option) => (
//                   <Option key={option} value={option}>
//                     {option}
//                   </Option>
//                 ))}
//               </Select>
//             ) : (
//               <Input
//                 onChange={(e) => handleFilterChange(e.target.value, key)}
//                 placeholder={`Search ${columnHeadings[key] || key}`}
//               />
//             ),
//           render: (text, record) => {
//             const createdAt = dayjs(record.created_at);
//             const isEditable = dayjs().diff(createdAt, "day") <= 3;
//             const allowedAfter3Days =
//               allowedFields[user?.role.toLowerCase()] || [];
//             const canEditAfter3Days =
//               dayjs().diff(createdAt, "day") > 3 &&
//               allowedAfter3Days.includes(key);

//             if (editingKey === record.id) {
//               return isEditable || canEditAfter3Days ? (
//                 isDateField ? (
//                   <DatePicker
//                     value={editedRow[key] ? dayjs(editedRow[key]) : null} // Ensure correct date parsing
//                     onChange={(date, dateString) =>
//                       handleChange(dateString, key)
//                     }
//                     style={{ width: "100%" }}
//                   />
//                 ) : dropdownOptions[key] ? (
//                   <Select
//                     showSearch
//                     value={editedRow[key]}
//                     onChange={(value) => handleChange(value, key)}
//                     style={{ width: "100%" }}
//                     allowClear
//                     placeholder="Search..."
//                     dropdownMatchSelectWidth={false}
//                     filterOption={(input, option) =>
//                       option.children
//                         .toLowerCase()
//                         .includes(input.toLowerCase())
//                     }>
//                     {dropdownOptions[key].map((option) => (
//                       <Option key={option} value={option}>
//                         {option}
//                       </Option>
//                     ))}
//                   </Select>
//                 ) : (
//                   <Input
//                     value={editedRow[key]}
//                     onChange={(e) => handleChange(e.target.value, key)}
//                   />
//                 )
//               ) : (
//                 text
//               );
//             }
//             return isDateField && text
//               ? dayjs(text).format("YYYY-MM-DD")
//               : text;
//           },
//         };
//       }),
//     {
//       title: "Actions",
//       fixed: "right",
//       render: (_, record) => {
//         const createdAt = dayjs(record.created_at);
//         const now = dayjs();
//         const isEditable = now.diff(createdAt, "day") <= 3;
//         const allowedAfter3Days = allowedFields[user?.role.toLowerCase()] || [];
//         const canEditAfter3Days =
//           now.diff(createdAt, "day") > 3 && allowedAfter3Days.length > 0;

//         // Calculate remaining hours for delete button
//         const deleteTimeLimit = createdAt.add(24, "hour");
//         const remainingHours = deleteTimeLimit.diff(now, "hour");
//         const canDelete = remainingHours > 0;

//         return (
//           <div style={{ display: "flex", gap: "8px" }}>
//             {editingKey === record.id ? (
//               <Button
//                 type="primary"
//                 icon={<SaveOutlined />}
//                 onClick={() => handleSave(record.id)}
//               />
//             ) : (
//               <Tooltip
//                 title={
//                   !isEditable && !canEditAfter3Days
//                     ? "You can't edit because time is over"
//                     : ""
//                 }>
//                 <Button
//                   icon={<EditOutlined />}
//                   onClick={() => handleEdit(record.id)}
//                   disabled={!isEditable && !canEditAfter3Days}
//                 />
//               </Tooltip>
//             )}
//             {canDelete && (
//               <Tooltip title={`Delete available for ${remainingHours}h`}>
//                 <Button
//                   type="primary"
//                   danger
//                   icon={<DeleteOutlined />}
//                   onClick={() => handleDelete(record.id)}
//                 />
//               </Tooltip>
//             )}
//             <Tooltip title="Copy this row">
//               <Button
//                 icon={<CopyOutlined />}
//                 onClick={() => handleCopyRow(record)}
//               />
//             </Tooltip>
//           </div>
//         );
//       },
//     },
//   ];
//   return (
//     <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
//       <div className="w-full bg-white p-4 rounded shadow-md relative">
//         {/* Fixed Button Container */}
//         <div className="sticky top-0 left-0 right-0 z-20 p-4 flex">
//           <div>
//             <Button
//               type="primary"
//               onClick={() => exportToExcel(data, "publisher-data.xlsx")}
//               className="px-4 py-2 mr-4 bg-blue-500 text-white rounded">
//               Download Excel
//             </Button>
//           </div>
//           <div>
//             {" "}
//             <DatePicker
//               picker="month"
//               onChange={(date) => setSelectedMonth(date)}
//               placeholder="Filter by month"
//               allowClear
//             />
//           </div>
//           <div className="ml-4">
//             <Input
//               placeholder="Search by Username, Pub Name, or Campaign Name"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>

//           {/* <Button
//             type="primary"
//             icon={<PlusOutlined />}
//             onClick={handleAddRow}
//             className="px-4 py-2 mr-4 bg-green-500 text-white rounded">
//             Add Row
//           </Button> */}
//         </div>
//         {/* Scrollable Table Container */}
//         <div className="overflow-auto max-h-[70vh] mt-2">
//           <Table
//             columns={columns}
//             dataSource={finalFilteredData}
//             pagination={{
//               pageSizeOptions: ["10", "20", "50", "100"],
//               showSizeChanger: true,
//               defaultPageSize: 10,
//               showTotal: (total, range) =>
//                 `${range[0]}-${range[1]} of ${total} items`,
//             }}
//             bordered
//             loading={loading}
//             scroll={{ x: "max-content" }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PublisherData;
import React, { useEffect, useState } from "react";
import {
  Table,
  Select,
  Button,
  Input,
  Dropdown,
  Menu,
  message,
  DatePicker,
} from "antd";
import { FilterOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import utc from "dayjs/plugin/utc";
import "../index.css";
import geoData from "../Data/geoData.json";
import { useSelector } from "react-redux";
import { exportToExcel } from "./exportExcel";
dayjs.extend(isBetween);
dayjs.extend(utc);
const { RangePicker } = DatePicker;
const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const columnHeadingsAdv = {
  username: "Adv AM",
  campaign_name: "Campaign Name",
  geo: "GEO",
  city: "State Or City",
  os: "OS",
  payable_event: "Payable Event",
  mmp_tracker: "MMP Tracker",
  pub_id: "PubID",
  pid: "PID",
  pay_out: "PUB Payout $",
  shared_date: "Shared Date",
  paused_date: "Paused Date",
};

const PublisherPayoutData = () => {
  const [advData, setAdvData] = useState([]);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
  const user = useSelector((state) => state.auth.user);

  const fetchAdvData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-advdata`);
      if (response.data.success) {
        setAdvData(response.data.data);

        // Extract unique values for filters
        const unique = {};
        Object.keys(columnHeadingsAdv).forEach((key) => {
          unique[key] = [
            ...new Set(response.data.data.map((item) => item[key])),
          ].filter(Boolean);
        });
        setUniqueValues(unique);
      }
    } catch (error) {
      console.error("Error fetching advertiser data:", error);
    }
  };

  useEffect(() => {
    fetchAdvData();
  }, []);

  const filteredData = advData.filter((item) => {
    const sharedDate = dayjs(item.shared_date);
    if (
      selectedDateRange &&
      selectedDateRange.length === 2 &&
      selectedDateRange[0] &&
      selectedDateRange[1]
    ) {
      const [start, end] = selectedDateRange;
      if (!sharedDate.isBetween(start, end, null, "[]")) {
        return false;
      }
    }

    const matchesPub = item.pub_name === user?.username;

    const matchesFilters = Object.keys(filters).every((key) =>
      filters[key] ? item[key] === filters[key] : true
    );

    const matchesSearch = !searchTerm.trim()
      ? true
      : Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );

    return matchesPub && matchesFilters && matchesSearch;
  });

  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getColumns = (columnHeadings) => {
    return Object.keys(columnHeadings).map((key) => ({
      title: (
        <div className="flex items-center justify-between">
          <span className="font-medium">{columnHeadings[key]}</span>
          {uniqueValues[key]?.length > 1 && (
            <Dropdown
              overlay={
                <Menu>
                  <div className="p-3 w-48">
                    <Select
                      showSearch
                      allowClear
                      className="w-full"
                      placeholder={`Filter ${key}`}
                      value={filters[key]}
                      onChange={(value) => handleFilterChange(value, key)}
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option?.children
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }>
                      {uniqueValues[key]?.map((val) => (
                        <Option key={val} value={val}>
                          {val}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </Menu>
              }
              trigger={["click"]}
              placement="bottomRight">
              <FilterOutlined className="cursor-pointer text-gray-500 hover:text-black ml-2" />
            </Dropdown>
          )}
        </div>
      ),
      dataIndex: key,
      key,
    }));
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="w-full bg-white p-4 rounded shadow-md">
        {/* Header Bar */}
        <div className="mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <Button
            type="primary"
            onClick={() => exportToExcel(filteredData, "publisher-data.xlsx")}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            📥 Download Excel
          </Button>

          <div className="flex gap-3">
            <Input
              placeholder="🔍 Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[220px]"
            />
            <RangePicker
              onChange={(dates) => setSelectedDateRange(dates)}
              allowClear
              placeholder={["Start Date", "End Date"]}
              className="w-full md:w-48 rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-auto max-h-[70vh]">
          <Table
            dataSource={filteredData}
            columns={getColumns(columnHeadingsAdv)}
            rowKey="id"
            scroll={{ x: true }}
            pagination={{
              pageSizeOptions: ["10", "20", "50"],
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            bordered
          />
        </div>
      </div>
    </div>
  );
};

export default PublisherPayoutData;
