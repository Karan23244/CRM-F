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
import { Table, Select, Button, Input, Dropdown, Menu, message } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../index.css";
import geoData from "../Data/geoData.json";
import { useSelector } from "react-redux";
import utc from "dayjs/plugin/utc";
import { exportToExcel } from "./exportExcel";

dayjs.extend(utc);

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const columnHeadingsAdv = {
  username: "Input Name",
  pub_name: "PUBM Name",
  campaign_name: "Campaign Name",
  geo: "GEO",
  city: "State Or City",
  os: "OS",
  payable_event: "Payable Event",
  mmp_tracker: "MMP Tracker",
  adv_id: "ADV ID",
  adv_payout: "ADV Payout $",
  pay_out: "PUB Payout $",
  pub_id: "PubID",
  pid: "PID",
  shared_date: "Shared Date",
  paused_date: "Paused Date",
  adv_total_no: "ADV Total Numbers",
  adv_deductions: "ADV Deductions",
  adv_approved_no: "ADV Approved Numbers",
};

const PublisherPayoutData = () => {
  const [advData, setAdvData] = useState([]);
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [finalFilteredData, setFinalFilteredData] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({
    os: ["Android", "APK", "iOS"],
  });
  console.log(filteredData)
  const user = useSelector((state) => state.auth.user); // Get the current logged-in user's username

  const fetchAdvData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-advdata`);
      if (response.data.success) {
        setAdvData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching advertiser data:", error);
    }
  };

  useEffect(() => {
    fetchAdvData();
    fetchDropdowns();
  }, []);

  // Filter data by excluding records from the current month and checking for matching username
  const filterDataByMonthAndUsername = () => {
    const currentMonth = dayjs().month(); // Get the current month (0-11)
    const currentYear = dayjs().year(); // Get the current year
    const filtered = advData.filter((item) => {
      const createdAt = dayjs(item.created_at); // Parse the created_at date

      // Check if the item's created_at is not in the current month
      // and if the pub_name matches the logged-in user's username
      return (
        (createdAt.month() !== currentMonth ||
          createdAt.year() !== currentYear) &&
        item.pub_name === user?.username // Match pub_name with logged-in username
      );
    });

    setFilteredData(filtered); // Set filtered data
  };
  useEffect(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const result = filteredData.filter(
      (item) =>
        item.username?.toLowerCase().includes(lowerSearch) ||
        item.pub_name?.toLowerCase().includes(lowerSearch) ||
        item.campaign_name?.toLowerCase().includes(lowerSearch)
    );
    setFinalFilteredData(result);
  }, [searchTerm, filteredData]);
  useEffect(() => {
    if (advData.length > 0) {
      filterDataByMonthAndUsername(); // Filter data after it's fetched
    }
  }, [advData, user]); // Add user to dependency array to re-filter when the username changes

  const generateUniqueValues = (data) => {
    const uniqueVals = {};
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (!uniqueVals[key]) uniqueVals[key] = new Set();
        uniqueVals[key].add(item[key]);
      });
    });
    const formattedValues = Object.keys(uniqueVals).reduce((acc, key) => {
      acc[key] = Array.from(uniqueVals[key]);
      return acc;
    }, {});
    setUniqueValues(formattedValues);
  };

  const fetchDropdowns = async () => {
    try {
      const [advmName, payableEvent, mmpTracker, pid, review] =
        await Promise.all([
          axios.get(`${apiUrl}/get-subadmin`),
          axios.get(`${apiUrl}/get-paybleevernt`),
          axios.get(`${apiUrl}/get-mmptracker`),
          axios.get(`${apiUrl}/get-pid`),
          axios.get(`${apiUrl}/get-reviews`),
        ]);
      setDropdownOptions((prev) => ({
        ...prev,
        pub_name:
          advmName.data?.data
            ?.filter(
              (item) => item.role === "manager" || item.role === "publisher"
            )
            .map((item) => item.username) || [],
        payable_event:
          payableEvent.data?.data?.map((item) => item.payble_event) || [],
        mmp_tracker: mmpTracker.data?.data?.map((item) => item.mmptext) || [],
        p_id: pid.data?.data?.map((item) => item.pid) || [],
        review: review.data?.data?.map((item) => item.review_text) || [],
        geo: geoData.geo?.map((item) => item.code) || [],
      }));
    } catch (error) {
      message.error("Failed to fetch dropdown options");
    }
  };

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
                      allowClear
                      className="w-full"
                      placeholder={`Filter ${key}`}
                      value={filters[key]}
                      onChange={(value) => handleFilterChange(value, key)}>
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
    <>
      {/* <div className="p-4">
        <Table
          dataSource={filteredData}
          columns={getColumns(columnHeadingsAdv)}
          rowKey="id"
          scroll={{ x: true }}
          pagination={{ pageSize: 10 }}
          bordered
        />
      </div> */}
      <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
        <div className="w-full bg-white p-4 rounded shadow-md relative">
          {/* Fixed Button Container */}
          <div className="sticky top-0 left-0 right-0 z-20 p-4 flex">
            <Button
              type="primary"
              onClick={() => exportToExcel(data, "publisher-data.xlsx")}
              className="px-4 py-2 mr-4 bg-blue-500 text-white rounded">
              Download Excel
            </Button>
            <Input
              placeholder="Search by Username, Pub Name, or Campaign Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-96"
            />
          </div>

          {/* Scrollable Table Container */}
          <div className="overflow-auto max-h-[70vh] mt-2">
            <Table
              columns={getColumns(columnHeadingsAdv)}
              dataSource={finalFilteredData}
              pagination={{
                pageSizeOptions: ["10", "20", "50", "100"],
                showSizeChanger: true,
                defaultPageSize: 10,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              bordered
              scroll={{ x: "max-content" }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PublisherPayoutData;
