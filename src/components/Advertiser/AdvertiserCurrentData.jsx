// import React, { useState, useEffect, useMemo, use } from "react";
// import axios from "axios";
// import Swal from "sweetalert2";
// import {
//   Table,
//   Input,
//   Button,
//   Select,
//   DatePicker,
//   message,
//   Checkbox,
//   Tooltip,
// } from "antd";
// import { PlusOutlined, DeleteOutlined, CopyOutlined } from "@ant-design/icons";
// import dayjs from "dayjs";
// import isBetween from "dayjs/plugin/isBetween";
// import { useSelector } from "react-redux";
// import geoData from "../../Data/geoData.json";
// import { exportToExcel } from "../exportExcel";
// import MainComponent from "./ManagerAllData";
// import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
// import Validation from "../Validation";
// dayjs.extend(isBetween);
// const { RangePicker } = DatePicker;
// const { Option } = Select;
// const apiUrl =
//   import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

// const AdvertiserData = () => {
//   const user = useSelector((state) => state.auth.user);
//   const [sortInfo, setSortInfo] = useState({
//     columnKey: null,
//     order: null,
//   });
//   const [savingTable, setSavingTable] = useState(false);
//   const userId = user?.id || null;
//   const [data, setData] = useState([]);
//   const [editedRow, setEditedRow] = useState({});
//   const [searchTerm, setSearchTerm] = useState("");
//   const [uniqueValues, setUniqueValues] = useState({});
//   const [showValidation, setShowValidation] = useState(false);
//   const [editingCell, setEditingCell] = useState({ key: null, field: null });
//   const [stickyColumns, setStickyColumns] = useState([]);

//   const [selectedDateRange, setSelectedDateRange] = useState([
//     dayjs().startOf("month"),
//     dayjs().endOf("month"),
//   ]);
//   const [showSubadminData, setShowSubadminData] = useState(false);
//   const [dropdownOptions, setDropdownOptions] = useState({
//     os: ["Android", "APK", "iOS"],
//     fa: ["Quality", "No Quality", "No Live"], // Step 1
//     fa1: ["Optimised", "Not Optimised"],
//     vertical: [
//       "E-commerce",
//       "Betting Casino",
//       "Betting Sports",
//       "Utilities",
//       "Finance",
//       "Food Delivery",
//     ],
//   });
//   const [filters, setFilters] = useState({});
//   useEffect(() => {
//     if (user?.id) {
//       fetchData();
//       fetchDropdowns();
//     }
//   }, [user]);
//   const clearAllFilters = () => {
//     setFilters({});
//     setSortInfo({ columnKey: null, order: null }); // 🔁 reset sorting
//   };

//   const toggleStickyColumn = (key) => {
//     setStickyColumns((prev) =>
//       prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
//     );
//   };
//   const fetchData = async () => {
//     try {
//       // setLoading(true);
//       const response = await axios.get(`${apiUrl}/advdata-byuser/${user.id}`);
//       const formatted = response.data.reverse().map((item) => ({
//         ...item,
//         key: item.id,
//       }));
//       // Store all data, no filtering yet
//       // setData(
//       //   response.data.reverse().map((item) => ({
//       //     ...item,
//       //     key: item.id,
//       //   }))
//       // );
//       setData(formatted);
//     } catch (error) {
//       message.error("Failed to fetch data");
//     }
//   };

//   const generateUniqueValues = (data) => {
//     const uniqueVals = {};

//     data.forEach((item) => {
//       Object.keys(item).forEach((key) => {
//         if (!uniqueVals[key]) uniqueVals[key] = new Set();

//         const rawVal = item[key];
//         const normalizedValue =
//           rawVal === null ||
//           rawVal === undefined ||
//           rawVal.toString().trim() === ""
//             ? "-"
//             : rawVal.toString().trim();

//         uniqueVals[key].add(normalizedValue);
//       });
//     });

//     const formattedValues = {};
//     Object.keys(uniqueVals).forEach((key) => {
//       formattedValues[key] = Array.from(uniqueVals[key]);
//     });

//     setUniqueValues(formattedValues);
//   };

//   const fetchDropdowns = async () => {
//     try {
//       const [advmName, payableEvent, mmpTracker, pid, pub_id, adv_id] =
//         await Promise.all([
//           axios.get(`${apiUrl}/get-subadmin`),
//           axios.get(`${apiUrl}/get-paybleevernt`),
//           axios.get(`${apiUrl}/get-mmptracker`),
//           axios.get(`${apiUrl}/get-pid`),
//           axios.get(`${apiUrl}/get-allpub`),
//           axios.get(`${apiUrl}/advid-data/${userId}`),
//         ]);

//       setDropdownOptions((prev) => ({
//         ...prev,
//         pub_name: [
//           ...new Set(
//             advmName?.data?.data
//               ?.filter(
//                 (item) =>
//                   (item.role === "publisher_manager" ||
//                     item.role === "publisher") &&
//                   !["AtiqueADV", "AnveshaADV"].includes(item.username)
//               )
//               .map((item) => item.username) ||
//               prev.pub_name ||
//               []
//           ),
//         ],
//         payable_event: [
//           ...new Set(
//             payableEvent?.data?.data?.map((i) => i.payble_event) ||
//               prev.payable_event ||
//               []
//           ),
//         ],
//         mmp_tracker: [
//           ...new Set(
//             mmpTracker?.data?.data?.map((i) => i.mmptext) ||
//               prev.mmp_tracker ||
//               []
//           ),
//         ],
//         pid: [...new Set(pid?.data?.data?.map((i) => i.pid) || prev.pid || [])],
//         pub_id: [
//           ...new Set(
//             pub_id?.data?.data?.map((i) => i.pub_id) || prev.pub_id || []
//           ),
//         ],
//         geo: [...new Set(geoData.geo?.map((i) => i.code) || prev.geo || [])],
//         adv_id: [
//           ...new Set(
//             adv_id?.data?.advertisements?.map((i) => i.adv_id) ||
//               prev.adv_id ||
//               []
//           ),
//         ],
//       }));
//     } catch (error) {
//       message.error("Failed to fetch dropdown options");
//     }
//   };

//   // Add new row
//   const handleAddRow = async () => {
//     try {
//       if (!user?.id) {
//         message.error("User ID is missing. Please login again.");
//         return;
//       }

//       const newRow = {
//         ...editedRow,
//         user_id: user.id, // Ensure user_id is included
//         createdAt: new Date().toISOString(),
//       };
//       await axios.post(`${apiUrl}/add-advdata`, newRow, {
//         headers: { "Content-Type": "application/json" },
//       });

//       setEditedRow({});
//       fetchData();
//       Swal.fire("Success", "Data added successfully", "success");
//     } catch (error) {
//       Swal.fire("Error", "Failed to add data", "error");
//     }
//   };
//   const handleCopyRow = async (record) => {
//     try {
//       if (!user?.id) {
//         Swal.fire({
//           icon: "error",
//           title: "User ID missing",
//           text: "Please login again.",
//         });
//         return;
//       }

//       const copiedRow = {
//         ...record,
//         id: undefined, // Remove existing ID
//         user_id: user.id,
//         createdAt: new Date().toISOString(),
//       };

//       await axios.post(`${apiUrl}/add-advdata`, copiedRow, {
//         headers: { "Content-Type": "application/json" },
//       });

//       fetchData();

//       Swal.fire({
//         icon: "success",
//         title: "Copied!",
//         text: "Row copied successfully.",
//         timer: 2000,
//         showConfirmButton: false,
//       });
//     } catch (error) {
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: "Failed to copy row.",
//       });
//     }
//   };

//   const handleDelete = async (id) => {
//     const result = await Swal.fire({
//       title: "Are you sure?",
//       text: "This action cannot be undone.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, delete it!",
//       cancelButtonText: "Cancel",
//     });

//     if (result.isConfirmed) {
//       try {
//         await axios.post(`${apiUrl}/advdata-delete-data/${id}`);
//         fetchData();
//         Swal.fire("Deleted!", "Data has been deleted.", "success");
//       } catch (error) {
//         Swal.fire("Error", "Failed to delete data", "error");
//       }
//     }
//   };
//   const columnHeadings = {
//     pub_name: "PUBM Name",
//     campaign_name: "Campaign Name",
//     vertical: "Vertical",
//     geo: "GEO",
//     city: "State Or City",
//     os: "OS",
//     payable_event: "Payable Event",
//     mmp_tracker: "MMP Tracker",
//     adv_id: "ADV ID",
//     adv_payout: "ADV Payout $",
//     pub_am: "Pub AM",
//     pub_id: "PubID",
//     pid: "PID",
//     pay_out: "PUB Payout $",
//     shared_date: "Shared Date",
//     paused_date: "Paused Date",
//     fp: "FP",
//     fa: "FA (Step 1)",
//     fa1: "FA (Step 2)",
//     adv_total_no: "ADV Total Numbers",
//     adv_deductions: "ADV Deductions",
//     adv_approved_no: "ADV Approved Numbers",
//   };

//   const allowedFieldsAfter3Days = [
//     "adv_id",
//     "campaign_name",
//     "vertical",
//     "geo",
//     "city",
//     "os",
//     "payable_event",
//     "mmp_tracker",
//     "adv_payout",
//     "pub_name",
//     "pub_id",
//     "pub_am",
//     "pid",
//     "pay_out",
//     "shared_date",
//     "fa",
//     "fa1",
//     "paused_date",
//     "adv_total_no",
//     "adv_deductions",
//     "adv_approved_no",
//     // "paused_date",
//     // "adv_total_no",
//     // "adv_deductions",
//     // "adv_approved_no",
//     // "pay_out",
//   ];
//   const handleFilterChange = (value, key) => {
//     setFilters((prev) => ({ ...prev, [key]: value }));
//   };

//   const finalFilteredData = useMemo(() => {
//     let filtered = [...data];

//     // Date range filter for shared_date
//     if (
//       selectedDateRange &&
//       selectedDateRange.length === 2 &&
//       selectedDateRange[0] &&
//       selectedDateRange[1]
//     ) {
//       const [start, end] = selectedDateRange;
//       filtered = filtered.filter((item) =>
//         dayjs(item.shared_date).isBetween(start, end, null, "[]")
//       );
//     }

//     // Advanced filters
//     Object.keys(filters).forEach((key) => {
//       const filterValue = filters[key];
//       if (!filterValue || filterValue.length === 0) return;

//       // Date range filter on specific columns
//       if (
//         Array.isArray(filterValue) &&
//         filterValue.length === 2 &&
//         dayjs(filterValue[0]).isValid()
//       ) {
//         const [start, end] = filterValue;
//         filtered = filtered.filter((item) =>
//           dayjs(item[key]).isBetween(start, end, null, "[]")
//         );
//         return;
//       }

//       const normalize = (val) =>
//         val === null || val === undefined || val.toString().trim() === ""
//           ? "-"
//           : val.toString().trim().toLowerCase();

//       if (Array.isArray(filterValue)) {
//         filtered = filtered.filter((item) =>
//           filterValue.some(
//             (val) =>
//               normalize(item[key]) === val.toString().trim().toLowerCase()
//           )
//         );
//       } else {
//         filtered = filtered.filter(
//           (item) =>
//             normalize(item[key]) === filterValue.toString().trim().toLowerCase()
//         );
//       }
//     });

//     // Search term filter
//     if (searchTerm.trim()) {
//       const lowerSearchTerm = searchTerm.toLowerCase();
//       filtered = filtered.filter((item) =>
//         Object.values(item).some((value) =>
//           String(value || "")
//             .toLowerCase()
//             .includes(lowerSearchTerm)
//         )
//       );
//     }

//     return filtered;
//   }, [data, selectedDateRange, filters, searchTerm]);

//   // Step 4: Generate unique values for filters
//   useEffect(() => {
//     generateUniqueValues(finalFilteredData);
//   }, [finalFilteredData]);

//   // Define the desired order of columns
//   const desiredOrder = [
//     "adv_id",
//     "campaign_name",
//     "vertical",
//     "geo",
//     "city",
//     "os",
//     "payable_event",
//     "mmp_tracker",
//     "adv_payout",
//     "pub_name",
//     "pub_id",
//     "pub_am",
//     "pid",
//     "pay_out",
//     "shared_date",
//     "paused_date",
//     "fp",
//     "fa",
//     "fa1",
//     "adv_total_no",
//     "adv_deductions",
//     "adv_approved_no",
//   ];

//   const isEmpty = (val) => val === null || val === undefined || val === "";

//   const calculatePubApno = (record) => {
//     const { adv_deductions, adv_approved_no, adv_payout, pay_out } = record;
//     if (
//       isEmpty(adv_deductions) ||
//       isEmpty(adv_approved_no) ||
//       isEmpty(adv_payout) ||
//       isEmpty(pay_out)
//     ) {
//       throw new Error("Missing or empty required fields in the record.");
//     }

//     const approved = Number(adv_approved_no);
//     const payout = Number(adv_payout);
//     const pub = Number(pay_out);

//     const advAmount = approved * payout;
//     const pubAmount = approved * pub;
//     const seventyPercent = advAmount * 0.7;

//     return pubAmount > seventyPercent
//       ? Number(((0.7 * approved * payout) / pub).toFixed(1))
//       : approved;
//   };

//   const checkEditableAndAlert = (editable) => {
//     if (!editable) {
//       message.warning("You can't edit this field after 3 days.");
//       return false;
//     }
//     return true;
//   };

//   const columns = [
//     ...desiredOrder
//       .filter((key) => data[0] && key in data[0])
//       .map((key) => ({
//         title: (
//           <div className="flex items-center gap-2">
//             <span
//               style={{
//                 color: filters[key] ? "#1677ff" : "inherit",
//                 fontWeight: filters[key] ? "bold" : "normal",
//               }}>
//               {columnHeadings[key] || key}
//             </span>
//             <Tooltip title={stickyColumns.includes(key) ? "Unpin" : "Pin"}>
//               <Button
//                 size="small"
//                 icon={
//                   stickyColumns.includes(key) ? (
//                     <PushpinFilled style={{ color: "#1677ff" }} />
//                   ) : (
//                     <PushpinOutlined />
//                   )
//                 }
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   toggleStickyColumn(key);
//                 }}
//               />
//             </Tooltip>
//           </div>
//         ),
//         dataIndex: key,
//         fixed: stickyColumns.includes(key) ? "left" : undefined,
//         key,
//         sorter: (a, b) => {
//           const valA = a[key];
//           const valB = b[key];
//           return !isNaN(valA) && !isNaN(valB)
//             ? valA - valB
//             : (valA || "").toString().localeCompare((valB || "").toString());
//         },
//         sortOrder: sortInfo.columnKey === key ? sortInfo.order : null,
//         onHeaderCell: () => ({
//           onClick: () => {
//             const newOrder =
//               sortInfo.columnKey === key && sortInfo.order === "ascend"
//                 ? "descend"
//                 : "ascend";
//             setSortInfo({ columnKey: key, order: newOrder });
//           },
//         }),

//         render: (text, record) => {
//           const value = record[key];
//           const createdAt = dayjs(record.created_at);
//           const isWithin3Days = dayjs().diff(createdAt, "day") <= 3;
//           const editable =
//             isWithin3Days || allowedFieldsAfter3Days.includes(key);
//           const isEditing =
//             editingCell.key === record.id && editingCell.field === key;

//           // ✅ Prevent editing adv_approved_no
//           if (key === "adv_approved_no") {
//             return (
//               <div style={{ color: "gray", cursor: "not-allowed" }}>
//                 {value ?? "-"}
//               </div>
//             );
//           }

//           const handleAutoSave = async (newValue) => {
//             setSavingTable(true);
//             if (!checkEditableAndAlert(editable)) {
//               setSavingTable(false);
//               return;
//             }

//             const trimmedValue =
//               typeof newValue === "string" ? newValue.trim() : newValue;
//             if (trimmedValue === record[key]) {
//               setSavingTable(false);
//               return;
//             }

//             const updated = { ...record, [key]: newValue };

//             if (["adv_total_no", "adv_deductions"].includes(key)) {
//               const total =
//                 key === "adv_total_no"
//                   ? parseFloat(newValue)
//                   : parseFloat(record.adv_total_no);
//               const deductions =
//                 key === "adv_deductions"
//                   ? parseFloat(newValue)
//                   : parseFloat(record.adv_deductions);

//               updated.adv_approved_no =
//                 !isNaN(total) && !isNaN(deductions) ? total - deductions : null;
//             }

//             try {
//               const testRecord = { ...record, ...updated };
//               updated.pub_Apno =
//                 !isEmpty(testRecord.adv_deductions) &&
//                 !isEmpty(testRecord.adv_approved_no) &&
//                 !isEmpty(testRecord.adv_payout) &&
//                 !isEmpty(testRecord.pay_out)
//                   ? calculatePubApno(testRecord)
//                   : "";
//             } catch {
//               updated.pub_Apno = "";
//             }

//             try {
//               const res = await axios.post(
//                 `${apiUrl}/advdata-update/${record.id}`,
//                 updated,
//                 {
//                   headers: { "Content-Type": "application/json" },
//                 }
//               );

//               console.log("Response from advdata-update:", res);

//               message.success("Auto-saved");
//               fetchData();
//             } catch (err) {
//               console.error("Error while auto-saving:", err);
//               message.error("Failed to auto-save");
//             }

//             setSavingTable(false);
//           };

//           if (isEditing) {
//             if (dropdownOptions[key]) {
//               return (
//                 <Select
//                   allowClear
//                   showSearch
//                   value={value || undefined}
//                   style={{ width: 180 }}
//                   onBlur={() => setEditingCell({ key: null, field: null })}
//                   onChange={(val) => {
//                     handleAutoSave(val);
//                     setEditingCell({ key: null, field: null });
//                   }}
//                   autoFocus
//                   optionFilterProp="children"
//                   filterOption={(input, option) =>
//                     (option?.children ?? "")
//                       .toString()
//                       .toLowerCase()
//                       .includes(input.toLowerCase())
//                   }>
//                   {[...new Set(dropdownOptions[key] || [])].map((opt) => (
//                     <Select.Option key={opt} value={opt}>
//                       {opt}
//                     </Select.Option>
//                   ))}
//                 </Select>
//               );
//             }

//             if (key === "fa") {
//               return (
//                 <Select
//                   defaultValue={value}
//                   style={{ width: 150 }}
//                   onBlur={() => setEditingCell({ key: null, field: null })}
//                   onChange={(val) => {
//                     handleAutoSave(val);
//                     handleAutoSave(null, record, "fa1"); // reset fa1
//                     setEditingCell({ key: null, field: null });
//                   }}
//                   autoFocus>
//                   {dropdownOptions.fa.map((opt) => (
//                     <Select.Option key={opt} value={opt}>
//                       {opt}
//                     </Select.Option>
//                   ))}
//                 </Select>
//               );
//             }

//             if (key === "fa1") {
//               if (!record.fa1)
//                 return <span style={{ color: "gray" }}>Select FA1 first</span>;
//               return (
//                 <Select
//                   defaultValue={value}
//                   style={{ width: 150 }}
//                   onBlur={() => setEditingCell({ key: null, field: null })}
//                   onChange={(val) => {
//                     handleAutoSave(val);
//                     setEditingCell({ key: null, field: null });
//                   }}
//                   autoFocus>
//                   {dropdownOptions.fa1.map((opt) => (
//                     <Select.Option key={opt} value={opt}>
//                       {opt}
//                     </Select.Option>
//                   ))}
//                 </Select>
//               );
//             }

//             if (["shared_date", "paused_date"].includes(key)) {
//               return (
//                 <DatePicker
//                   allowClear
//                   defaultValue={value ? dayjs(value) : null}
//                   format="YYYY-MM-DD"
//                   onChange={(date) => {
//                     handleAutoSave(
//                       date ? date.format("YYYY-MM-DD") : null
//                     ).finally(() => setEditingCell({ key: null, field: null }));
//                   }}
//                   autoFocus
//                 />
//               );
//             }

//             return (
//               <Input
//                 defaultValue={value}
//                 autoFocus
//                 onBlur={(e) => {
//                   handleAutoSave(e.target.value.trim());
//                   setEditingCell({ key: null, field: null });
//                 }}
//                 onPressEnter={(e) => {
//                   handleAutoSave(e.target.value.trim());
//                   setEditingCell({ key: null, field: null });
//                 }}
//               />
//             );
//           }

//           if (key === "fp") return <span>{value}</span>;

//           return (
//             <div
//               style={{ cursor: editable ? "pointer" : "default" }}
//               onClick={() => {
//                 if (!checkEditableAndAlert(editable)) return;
//                 setEditingCell({ key: record.id, field: key });
//               }}>
//               {value || "-"}
//             </div>
//           );
//         },

//         filterDropdown: () =>
//           uniqueValues[key]?.length > 0 ? (
//             <div style={{ padding: 8 }}>
//               <div style={{ marginBottom: 8 }}>
//                 <Checkbox
//                   indeterminate={
//                     filters[key]?.length > 0 &&
//                     filters[key]?.length < uniqueValues[key]?.length
//                   }
//                   checked={filters[key]?.length === uniqueValues[key]?.length}
//                   onChange={(e) =>
//                     handleFilterChange(
//                       e.target.checked ? [...uniqueValues[key]] : [],
//                       key
//                     )
//                   }>
//                   Select All
//                 </Checkbox>
//               </div>
//               <Select
//                 mode="multiple"
//                 allowClear
//                 showSearch
//                 placeholder={`Select ${columnHeadings[key]}`}
//                 style={{ width: 250 }}
//                 value={filters[key] || []}
//                 onChange={(val) => handleFilterChange(val, key)}
//                 optionLabelProp="label"
//                 maxTagCount="responsive"
//                 filterOption={(input, option) =>
//                   (option?.label ?? "")
//                     .toString()
//                     .toLowerCase()
//                     .includes(input.toLowerCase())
//                 }>
//                 {[...uniqueValues[key]]
//                   .filter((val) => !isEmpty(val))
//                   .sort((a, b) =>
//                     !isNaN(a) && !isNaN(b)
//                       ? a - b
//                       : a.toString().localeCompare(b.toString())
//                   )
//                   .map((val) => (
//                     <Select.Option key={val} value={val} label={val}>
//                       <Checkbox checked={filters[key]?.includes(val)}>
//                         {val}
//                       </Checkbox>
//                     </Select.Option>
//                   ))}
//               </Select>
//             </div>
//           ) : null,
//       })),
//     {
//       title: "Actions",
//       fixed: "right",
//       render: (_, record) => {
//         const createdAt = dayjs(record.created_at);
//         const hoursSinceCreation = dayjs().diff(createdAt, "hour");
//         const remainingHours = Math.max(24 - hoursSinceCreation, 0);
//         const isDeletable = hoursSinceCreation < 24;

//         return (
//           <div style={{ display: "flex", gap: "8px" }}>
//             {isDeletable && (
//               <Tooltip title={`Delete option available for ${remainingHours}h`}>
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
//     <>
//       <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
//         <div className="w-full bg-white p-6 rounded shadow-md relative">
//           {/* Sticky Top Bar */}
//           <div className="sticky top-0 left-0 right-0 z-20 bg-white p-4 rounded shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-200">
//             {/* Buttons Section */}
//             <div className="flex items-center gap-4">
//               {!showSubadminData && !showValidation ? (
//                 <>
//                   <Button
//                     type="primary"
//                     // onClick={() =>
//                     //   exportToExcel(finalFilteredData, "advertiser-data.xlsx")
//                     // }
//                     onClick={() => {
//                       const tableDataToExport = finalFilteredData.map(
//                         (item) => {
//                           const filteredItem = {};
//                           Object.keys(columnHeadings).forEach((key) => {
//                             filteredItem[columnHeadings[key]] = item[key]; // Custom column names
//                           });
//                           return filteredItem;
//                         }
//                       );
//                       exportToExcel(tableDataToExport, "advertiser-data.xlsx");
//                     }}
//                     className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
//                     📥 Download Excel
//                   </Button>

//                   {user?.role === "advertiser_manager" && (
//                     <>
//                       <Button
//                         type="primary"
//                         onClick={() => setShowSubadminData(true)}
//                         className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
//                         📊 Assigned Sub-Admin Data
//                       </Button>
//                       <Button
//                         onClick={() => setShowValidation(true)}
//                         type="primary"
//                         className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
//                         ✅ Start Validation
//                       </Button>
//                     </>
//                   )}

//                   <Button
//                     type="primary"
//                     icon={<PlusOutlined />}
//                     onClick={handleAddRow}
//                     className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
//                     Add Row
//                   </Button>

//                   <RangePicker
//                     value={selectedDateRange}
//                     onChange={(dates) => {
//                       if (!dates || dates.length === 0) {
//                         const start = dayjs().startOf("month");
//                         const end = dayjs().endOf("month");
//                         setSelectedDateRange([start, end]);
//                       } else {
//                         setSelectedDateRange(dates);
//                       }
//                     }}
//                   />

//                   <Button
//                     onClick={clearAllFilters}
//                     type="default"
//                     className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
//                     Remove All Filters
//                   </Button>
//                 </>
//               ) : showSubadminData ? (
//                 <Button
//                   type="primary"
//                   onClick={() => setShowSubadminData(false)}
//                   className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
//                   ← Back to Table
//                 </Button>
//               ) : (
//                 // Validation View with Back Button
//                 <Button
//                   type="primary"
//                   onClick={() => setShowValidation(false)}
//                   className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
//                   ← Back to Table
//                 </Button>
//               )}
//             </div>

//             {/* Search Input */}
//             <div className="w-full md:w-auto">
//               <Input
//                 placeholder="Search by Username, Pub Name, or Campaign Name"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//               />
//             </div>
//           </div>

//           {/* Table or Component View */}
//           <div className="overflow-auto max-h-[70vh] mt-4">
//             {showValidation ? (
//               <div className="w-full">
//                 <Validation />
//               </div>
//             ) : !showSubadminData ? (
//               <Table
//                 loading={savingTable} // 🔄 Loading state here
//                 columns={columns}
//                 dataSource={finalFilteredData}
//                 rowKey="id"
//                 onChange={(pagination, filters, sorter) => {
//                   if (!Array.isArray(sorter)) {
//                     setSortInfo({
//                       columnKey: sorter.columnKey,
//                       order: sorter.order,
//                     });
//                   }
//                 }}
//                 pagination={{
//                   pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
//                   showSizeChanger: true,
//                   defaultPageSize: 10,
//                   showTotal: (total, range) =>
//                     `${range[0]}-${range[1]} of ${total} items`,
//                 }}
//                 bordered
//                 scroll={{ x: "max-content" }}
//                 rowClassName={(record) => {
//                   return record.flag === "1" ? "light-yellow-row" : "";
//                 }}
//                 summary={(pageData) => {
//                   let totalAdvTotalNo = 0;
//                   let totalAdvDeductions = 0;
//                   let totalAdvApprovedNo = 0;

//                   pageData.forEach(
//                     ({ adv_total_no, adv_deductions, adv_approved_no }) => {
//                       totalAdvTotalNo += Number(adv_total_no) || 0;
//                       totalAdvDeductions += Number(adv_deductions) || 0;
//                       totalAdvApprovedNo += Number(adv_approved_no) || 0;
//                     }
//                   );

//                   return (
//                     <Table.Summary.Row>
//                       {columns.map((col, index) => {
//                         const key = col.dataIndex || `col-${index}`;

//                         if (col.dataIndex === "adv_total_no") {
//                           return (
//                             <Table.Summary.Cell key={`total-${index}`}>
//                               <b>{totalAdvTotalNo}</b>
//                             </Table.Summary.Cell>
//                           );
//                         } else if (col.dataIndex === "adv_deductions") {
//                           return (
//                             <Table.Summary.Cell key={`deductions-${index}`}>
//                               <b>{totalAdvDeductions}</b>
//                             </Table.Summary.Cell>
//                           );
//                         } else if (col.dataIndex === "adv_approved_no") {
//                           return (
//                             <Table.Summary.Cell key={`approved-${index}`}>
//                               <b>{totalAdvApprovedNo}</b>
//                             </Table.Summary.Cell>
//                           );
//                         } else {
//                           return <Table.Summary.Cell key={`empty-${index}`} />;
//                         }
//                       })}
//                     </Table.Summary.Row>
//                   );
//                 }}
//               />
//             ) : (
//               <MainComponent />
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default AdvertiserData;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Table,
  Input,
  Button,
  Select,
  DatePicker,
  message,
  Checkbox,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  PushpinOutlined,
  PushpinFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useSelector } from "react-redux";
import geoData from "../../Data/geoData.json";
import { exportToExcel } from "../exportExcel";
import MainComponent from "./ManagerAllData";
import Validation from "../Validation";

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const AdvertiserData = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;

  const [data, setData] = useState([]);
  const [savingTable, setSavingTable] = useState(false);
  const [sortInfo, setSortInfo] = useState({ columnKey: null, order: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [uniqueValues, setUniqueValues] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({
    os: ["Android", "APK", "iOS"],
    fa: ["Quality", "No Quality", "No Live"],
    fa1: ["Optimised", "Not Optimised"],
    vertical: [
      "E-commerce",
      "Betting Casino",
      "Betting Sports",
      "Utilities",
      "Finance",
      "Food Delivery",
    ],
  });
  const [filters, setFilters] = useState({});
  const [selectedDateRange, setSelectedDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [showSubadminData, setShowSubadminData] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [editingCell, setEditingCell] = useState({ key: null, field: null });
  const [stickyColumns, setStickyColumns] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchData();
      fetchDropdowns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/advdata-byuser/${userId}`);
      if (response?.data) {
        const formatted = [...(response.data || [])].reverse().map((item) => ({
          ...item,
          key: item.id,
        }));
        setData(formatted);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("fetchData error:", error);
      message.error("Failed to fetch data");
    }
  }, [userId]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [advmName, payableEvent, mmpTracker, pid, pub_id, adv_id] =
        await Promise.all([
          axios.get(`${apiUrl}/get-subadmin`),
          axios.get(`${apiUrl}/get-paybleevernt`),
          axios.get(`${apiUrl}/get-mmptracker`),
          axios.get(`${apiUrl}/get-pid`),
          axios.get(`${apiUrl}/get-allpub`),
          axios.get(`${apiUrl}/advid-data/${userId}`),
        ]);

      setDropdownOptions((prev) => ({
        ...prev,
        pub_name: [
          ...new Set(
            advmName?.data?.data
              ?.filter(
                (item) =>
                  (item.role === "publisher_manager" ||
                    item.role === "publisher") &&
                  !["AtiqueADV", "AnveshaADV"].includes(item.username)
              )
              .map((item) => item.username) ||
              prev.pub_name ||
              []
          ),
        ],
        payable_event: [
          ...new Set(
            payableEvent?.data?.data?.map((i) => i.payble_event) ||
              prev.payable_event ||
              []
          ),
        ],
        mmp_tracker: [
          ...new Set(
            mmpTracker?.data?.data?.map((i) => i.mmptext) ||
              prev.mmp_tracker ||
              []
          ),
        ],
        pid: [...new Set(pid?.data?.data?.map((i) => i.pid) || prev.pid || [])],
        pub_id: [
          ...new Set(
            pub_id?.data?.data?.map((i) => i.pub_id) || prev.pub_id || []
          ),
        ],
        geo: [...new Set(geoData.geo?.map((i) => i.code) || prev.geo || [])],
        adv_id: [
          ...new Set(
            adv_id?.data?.advertisements?.map((i) => i.adv_id) ||
              prev.adv_id ||
              []
          ),
        ],
      }));
    } catch (error) {
      console.error("fetchDropdowns error:", error);
      message.error("Failed to fetch dropdown options");
    }
  }, [userId]);

  // Unique values generator for filters
  const generateUniqueValues = useCallback((dataset) => {
    const uniqueVals = {};
    dataset.forEach((item) => {
      Object.keys(item).forEach((k) => {
        if (!uniqueVals[k]) uniqueVals[k] = new Set();
        const rawVal = item[k];
        const norm =
          rawVal === null ||
          rawVal === undefined ||
          rawVal.toString().trim() === ""
            ? "-"
            : rawVal.toString().trim();
        uniqueVals[k].add(norm);
      });
    });
    const out = {};
    Object.keys(uniqueVals).forEach(
      (k) => (out[k] = Array.from(uniqueVals[k]))
    );
    setUniqueValues(out);
  }, []);

  // Filters / search / date range memoized
  const finalFilteredData = useMemo(() => {
    let filtered = [...data];

    // Date range filter for shared_date
    if (
      selectedDateRange &&
      selectedDateRange.length === 2 &&
      selectedDateRange[0] &&
      selectedDateRange[1]
    ) {
      const [start, end] = selectedDateRange;
      filtered = filtered.filter((item) =>
        dayjs(item.shared_date).isBetween(start, end, null, "[]")
      );
    }

    // Advanced filters
    Object.keys(filters).forEach((key) => {
      const filterValue = filters[key];
      if (!filterValue || filterValue.length === 0) return;

      // Date range on column
      if (
        Array.isArray(filterValue) &&
        filterValue.length === 2 &&
        dayjs(filterValue[0]).isValid()
      ) {
        const [start, end] = filterValue;
        filtered = filtered.filter((item) =>
          dayjs(item[key]).isBetween(start, end, null, "[]")
        );
        return;
      }

      const normalize = (val) =>
        val === null || val === undefined || val.toString().trim() === ""
          ? "-"
          : val.toString().trim().toLowerCase();

      if (Array.isArray(filterValue)) {
        filtered = filtered.filter((item) =>
          filterValue.some(
            (val) =>
              normalize(item[key]) === val.toString().trim().toLowerCase()
          )
        );
      } else {
        filtered = filtered.filter(
          (item) =>
            normalize(item[key]) === filterValue.toString().trim().toLowerCase()
        );
      }
    });

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(q)
        )
      );
    }

    return filtered;
  }, [data, selectedDateRange, filters, searchTerm]);

  // regenerate unique values when filtered data changes
  useEffect(() => {
    generateUniqueValues(finalFilteredData);
  }, [finalFilteredData, generateUniqueValues]);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSortInfo({ columnKey: null, order: null });
  }, []);

  const toggleStickyColumn = useCallback((key) => {
    setStickyColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  }, []);

  // Utility helpers
  const isEmpty = (val) => val === null || val === undefined || val === "";

  const calculatePubApno = useCallback((record) => {
    const { adv_deductions, adv_approved_no, adv_payout, pay_out } = record;
    if (
      isEmpty(adv_deductions) ||
      isEmpty(adv_approved_no) ||
      isEmpty(adv_payout) ||
      isEmpty(pay_out)
    ) {
      throw new Error("Missing required fields");
    }
    const approved = Number(adv_approved_no);
    const payout = Number(adv_payout);
    const pub = Number(pay_out);

    const advAmount = approved * payout;
    const pubAmount = approved * pub;
    const seventyPercent = advAmount * 0.7;

    return pubAmount > seventyPercent
      ? Number(((0.7 * approved * payout) / pub).toFixed(1))
      : approved;
  }, []);

  // Allowed editable fields after 3 days
  const allowedFieldsAfter3Days = useMemo(
    () => [
      "adv_id",
      "campaign_name",
      "vertical",
      "geo",
      "city",
      "os",
      "payable_event",
      "mmp_tracker",
      "adv_payout",
      "pub_name",
      "pub_id",
      "pub_am",
      "pid",
      "pay_out",
      "shared_date",
      "fa",
      "fa1",
      "paused_date",
      "adv_total_no",
      "adv_deductions",
      "adv_approved_no",
    ],
    []
  );

  // Columns and renderers memoized
  const columnHeadings = {
    pub_name: "PUBM Name",
    campaign_name: "Campaign Name",
    vertical: "Vertical",
    geo: "GEO",
    city: "State Or City",
    os: "OS",
    payable_event: "Payable Event",
    mmp_tracker: "MMP Tracker",
    adv_id: "ADV ID",
    adv_payout: "ADV Payout $",
    pub_am: "Pub AM",
    pub_id: "PubID",
    pid: "PID",
    pay_out: "PUB Payout $",
    shared_date: "Shared Date",
    paused_date: "Paused Date",
    fp: "FP",
    fa: "FA (Step 1)",
    fa1: "FA (Step 2)",
    adv_total_no: "ADV Total Numbers",
    adv_deductions: "ADV Deductions",
    adv_approved_no: "ADV Approved Numbers",
  };

  const desiredOrder = [
    "adv_id",
    "campaign_name",
    "vertical",
    "geo",
    "city",
    "os",
    "payable_event",
    "mmp_tracker",
    "adv_payout",
    "pub_name",
    "pub_id",
    "pub_am",
    "pid",
    "pay_out",
    "shared_date",
    "paused_date",
    "fp",
    "fa",
    "fa1",
    "adv_total_no",
    "adv_deductions",
    "adv_approved_no",
  ];

  const checkEditableAndAlert = useCallback((editable) => {
    if (!editable) {
      message.warning("You can't edit this field after 3 days.");
      return false;
    }
    return true;
  }, []);

  // Main autosave handler — updates only the returned row in state
  const handleAutoSave = useCallback(
    async (record, key, newValue) => {
      setSavingTable(true);
      try {
        const createdAt = dayjs(record.created_at);
        const isWithin3Days = dayjs().diff(createdAt, "day") <= 3;
        const editable = isWithin3Days || allowedFieldsAfter3Days.includes(key);

        if (!checkEditableAndAlert(editable)) {
          setSavingTable(false);
          return;
        }

        const trimmedValue =
          typeof newValue === "string" ? newValue.trim() : newValue;

        // if nothing changed, skip
        if (String(record[key] ?? "") === String(trimmedValue ?? "")) {
          setSavingTable(false);
          return;
        }

        const updated = { ...record, [key]: trimmedValue };

        // when fa changes, reset fa1
        if (key === "fa") {
          updated.fa1 = null;
        }

        // adv_total_no or adv_deductions should recalc adv_approved_no
        if (["adv_total_no", "adv_deductions"].includes(key)) {
          const total =
            key === "adv_total_no"
              ? parseFloat(trimmedValue)
              : parseFloat(record.adv_total_no);
          const deductions =
            key === "adv_deductions"
              ? parseFloat(trimmedValue)
              : parseFloat(record.adv_deductions);

          updated.adv_approved_no =
            !isNaN(total) && !isNaN(deductions) ? total - deductions : null;
        }

        // calculate pub_Apno safely
        try {
          const testRecord = { ...record, ...updated };
          updated.pub_Apno =
            !isEmpty(testRecord.adv_deductions) &&
            !isEmpty(testRecord.adv_approved_no) &&
            !isEmpty(testRecord.adv_payout) &&
            !isEmpty(testRecord.pay_out)
              ? calculatePubApno(testRecord)
              : "";
        } catch {
          updated.pub_Apno = "";
        }

        const res = await axios.post(
          `${apiUrl}/advdata-update/${record.id}`,
          updated,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        // log full response for debugging
        // console.log("advdata-update response:", res);

        // Prefer server-returned updated row (res.data.data). If not present, fallback to our 'updated'.
        const updatedRow = res?.data?.data || updated;

        // update only that row in state
        setData((prev) =>
          prev.map((r) =>
            r.id === updatedRow.id ? { ...r, ...updatedRow } : r
          )
        );

        message.success("Auto-saved");
      } catch (err) {
        console.error("Error while auto-saving:", err);
        message.error("Failed to auto-save");
      } finally {
        setSavingTable(false);
      }
    },
    [allowedFieldsAfter3Days, calculatePubApno, checkEditableAndAlert]
  );

  // Add Row
  const handleAddRow = useCallback(async () => {
    try {
      if (!userId) {
        message.error("User ID is missing. Please login again.");
        return;
      }
      const newRow = {
        user_id: userId,
        created_at: new Date().toISOString(),
      };
      await axios.post(`${apiUrl}/add-advdata`, newRow, {
        headers: { "Content-Type": "application/json" },
      });
      fetchData();
      Swal.fire("Success", "Data added successfully", "success");
    } catch (err) {
      console.error("handleAddRow error:", err);
      Swal.fire("Error", "Failed to add data", "error");
    }
  }, [fetchData, userId]);

  // Copy Row
  const handleCopyRow = useCallback(
    async (record) => {
      try {
        if (!userId) {
          Swal.fire({
            icon: "error",
            title: "User ID missing",
            text: "Please login again.",
          });
          return;
        }
        const copiedRow = {
          ...record,
          id: undefined,
          user_id: userId,
          created_at: new Date().toISOString(),
        };
        await axios.post(`${apiUrl}/add-advdata`, copiedRow, {
          headers: { "Content-Type": "application/json" },
        });
        fetchData();
        Swal.fire({
          icon: "success",
          title: "Copied!",
          text: "Row copied successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error("handleCopyRow error:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to copy row.",
        });
      }
    },
    [fetchData, userId]
  );

  // Delete
  const handleDelete = useCallback(async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.post(`${apiUrl}/advdata-delete-data/${id}`);
      setData((prev) => prev.filter((r) => r.id !== id));
      Swal.fire("Deleted!", "Data has been deleted.", "success");
    } catch (err) {
      console.error("handleDelete error:", err);
      Swal.fire("Error", "Failed to delete data", "error");
    }
  }, []);

  // Columns memoized
  const columns = useMemo(() => {
    return [
      ...desiredOrder
        .filter((key) => data[0] && key in data[0])
        .map((key) => ({
          title: (
            <div className="flex items-center gap-2">
              <span
                style={{
                  color: filters[key] ? "#1677ff" : "inherit",
                  fontWeight: filters[key] ? "bold" : "normal",
                }}>
                {columnHeadings[key] || key}
              </span>
              <Tooltip title={stickyColumns.includes(key) ? "Unpin" : "Pin"}>
                <Button
                  size="small"
                  icon={
                    stickyColumns.includes(key) ? (
                      <PushpinFilled style={{ color: "#1677ff" }} />
                    ) : (
                      <PushpinOutlined />
                    )
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStickyColumn(key);
                  }}
                />
              </Tooltip>
            </div>
          ),
          dataIndex: key,
          fixed: stickyColumns.includes(key) ? "left" : undefined,
          key,
          sorter: (a, b) => {
            const valA = a[key];
            const valB = b[key];
            return !isNaN(valA) && !isNaN(valB)
              ? valA - valB
              : (valA || "").toString().localeCompare((valB || "").toString());
          },
          sortOrder: sortInfo.columnKey === key ? sortInfo.order : null,
          onHeaderCell: () => ({
            onClick: () => {
              const newOrder =
                sortInfo.columnKey === key && sortInfo.order === "ascend"
                  ? "descend"
                  : "ascend";
              setSortInfo({ columnKey: key, order: newOrder });
            },
          }),
          render: (text, record) => {
            const value = record[key];
            const createdAt = dayjs(record.created_at);
            const isWithin3Days = dayjs().diff(createdAt, "day") <= 3;
            const editable =
              isWithin3Days || allowedFieldsAfter3Days.includes(key);
            const isEditing =
              editingCell.key === record.id && editingCell.field === key;

            if (key === "adv_approved_no") {
              return (
                <div style={{ color: "gray", cursor: "not-allowed" }}>
                  {value ?? "-"}
                </div>
              );
            }

            // Editor UI
            if (isEditing) {
              // Select from dropdownOptions
              if (dropdownOptions[key]) {
                return (
                  <Select
                    allowClear
                    showSearch
                    value={value || undefined}
                    style={{ width: 180 }}
                    onBlur={() => setEditingCell({ key: null, field: null })}
                    onChange={(val) => {
                      handleAutoSave(record, key, val);
                      setEditingCell({ key: null, field: null });
                    }}
                    autoFocus
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children ?? "")
                        .toString()
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }>
                    {[...new Set(dropdownOptions[key] || [])].map((opt) => (
                      <Option key={opt} value={opt}>
                        {opt}
                      </Option>
                    ))}
                  </Select>
                );
              }

              if (key === "fa") {
                return (
                  <Select
                    defaultValue={value}
                    style={{ width: 150 }}
                    onBlur={() => setEditingCell({ key: null, field: null })}
                    onChange={(val) => {
                      handleAutoSave(record, key, val);
                      // reset fa1 on server by passing null next time; we already set updated.fa1 = null in handler
                      setEditingCell({ key: null, field: null });
                    }}
                    autoFocus>
                    {dropdownOptions.fa.map((opt) => (
                      <Option key={opt} value={opt}>
                        {opt}
                      </Option>
                    ))}
                  </Select>
                );
              }

              if (key === "fa1") {
                if (!record.fa)
                  return <span style={{ color: "gray" }}>Select FA first</span>;
                return (
                  <Select
                    defaultValue={value}
                    style={{ width: 150 }}
                    onBlur={() => setEditingCell({ key: null, field: null })}
                    onChange={(val) => {
                      handleAutoSave(record, key, val);
                      setEditingCell({ key: null, field: null });
                    }}
                    autoFocus>
                    {dropdownOptions.fa1.map((opt) => (
                      <Option key={opt} value={opt}>
                        {opt}
                      </Option>
                    ))}
                  </Select>
                );
              }

              if (["shared_date", "paused_date"].includes(key)) {
                return (
                  <DatePicker
                    allowClear
                    defaultValue={value ? dayjs(value) : null}
                    format="YYYY-MM-DD"
                    onChange={(date) => {
                      handleAutoSave(
                        record,
                        key,
                        date ? date.format("YYYY-MM-DD") : null
                      ).finally(() =>
                        setEditingCell({ key: null, field: null })
                      );
                    }}
                    autoFocus
                  />
                );
              }

              return (
                <Input
                  defaultValue={value}
                  autoFocus
                  onBlur={(e) => {
                    handleAutoSave(record, key, e.target.value?.trim());
                    setEditingCell({ key: null, field: null });
                  }}
                  onPressEnter={(e) => {
                    handleAutoSave(record, key, e.target.value?.trim());
                    setEditingCell({ key: null, field: null });
                  }}
                />
              );
            }

            if (key === "fp") return <span>{value}</span>;

            return (
              <div
                style={{ cursor: editable ? "pointer" : "default" }}
                onClick={() => {
                  if (!checkEditableAndAlert(editable)) return;
                  setEditingCell({ key: record.id, field: key });
                }}>
                {value || "-"}
              </div>
            );
          },

          filterDropdown: () =>
            uniqueValues[key]?.length > 0 ? (
              <div style={{ padding: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <Checkbox
                    indeterminate={
                      filters[key]?.length > 0 &&
                      filters[key]?.length < uniqueValues[key]?.length
                    }
                    checked={filters[key]?.length === uniqueValues[key]?.length}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        [key]: e.target.checked ? [...uniqueValues[key]] : [],
                      }))
                    }>
                    Select All
                  </Checkbox>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  placeholder={`Select ${columnHeadings[key]}`}
                  style={{ width: 250 }}
                  value={filters[key] || []}
                  onChange={(val) =>
                    setFilters((prev) => ({ ...prev, [key]: val }))
                  }
                  optionLabelProp="label"
                  maxTagCount="responsive"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }>
                  {[...uniqueValues[key]]
                    .filter((val) => !isEmpty(val))
                    .sort((a, b) =>
                      !isNaN(a) && !isNaN(b)
                        ? a - b
                        : a.toString().localeCompare(b.toString())
                    )
                    .map((val) => (
                      <Option key={val} value={val} label={val}>
                        <Checkbox checked={filters[key]?.includes(val)}>
                          {val}
                        </Checkbox>
                      </Option>
                    ))}
                </Select>
              </div>
            ) : null,
        })),
      {
        title: "Actions",
        fixed: "right",
        render: (_, record) => {
          const createdAt = dayjs(record.created_at);
          const hoursSinceCreation = dayjs().diff(createdAt, "hour");
          const remainingHours = Math.max(24 - hoursSinceCreation, 0);
          const isDeletable = hoursSinceCreation < 24;

          return (
            <div style={{ display: "flex", gap: "8px" }}>
              {isDeletable && (
                <Tooltip
                  title={`Delete option available for ${remainingHours}h`}>
                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record.id)}
                  />
                </Tooltip>
              )}
              <Tooltip title="Copy this row">
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyRow(record)}
                />
              </Tooltip>
            </div>
          );
        },
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data,
    dropdownOptions,
    editingCell,
    filters,
    uniqueValues,
    stickyColumns,
    sortInfo,
    allowedFieldsAfter3Days,
  ]);

  // Summary function (memoized)
  const tableSummary = useCallback(
    (pageData) => {
      let totalAdvTotalNo = 0;
      let totalAdvDeductions = 0;
      let totalAdvApprovedNo = 0;

      pageData.forEach(({ adv_total_no, adv_deductions, adv_approved_no }) => {
        totalAdvTotalNo += Number(adv_total_no) || 0;
        totalAdvDeductions += Number(adv_deductions) || 0;
        totalAdvApprovedNo += Number(adv_approved_no) || 0;
      });

      return (
        <Table.Summary.Row>
          {columns.map((col, index) => {
            const key = col.dataIndex || `col-${index}`;

            if (col.dataIndex === "adv_total_no") {
              return (
                <Table.Summary.Cell key={`total-${index}`}>
                  <b>{totalAdvTotalNo}</b>
                </Table.Summary.Cell>
              );
            } else if (col.dataIndex === "adv_deductions") {
              return (
                <Table.Summary.Cell key={`deductions-${index}`}>
                  <b>{totalAdvDeductions}</b>
                </Table.Summary.Cell>
              );
            } else if (col.dataIndex === "adv_approved_no") {
              return (
                <Table.Summary.Cell key={`approved-${index}`}>
                  <b>{totalAdvApprovedNo}</b>
                </Table.Summary.Cell>
              );
            } else {
              return <Table.Summary.Cell key={`empty-${index}`} />;
            }
          })}
        </Table.Summary.Row>
      );
    },
    [columns]
  );

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="w-full bg-white p-6 rounded shadow-md relative">
        <div className="sticky top-0 left-0 right-0 z-20 bg-white p-4 rounded shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-200">
          <div className="flex items-center gap-4">
            {!showSubadminData && !showValidation ? (
              <>
                <Button
                  type="primary"
                  onClick={() => {
                    const tableDataToExport = finalFilteredData.map((item) => {
                      const filteredItem = {};
                      Object.keys(columnHeadings).forEach((key) => {
                        filteredItem[columnHeadings[key]] = item[key];
                      });
                      return filteredItem;
                    });
                    exportToExcel(tableDataToExport, "advertiser-data.xlsx");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
                  📥 Download Excel
                </Button>

                {user?.role === "advertiser_manager" && (
                  <>
                    <Button
                      type="primary"
                      onClick={() => setShowSubadminData(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
                      📊 Assigned Sub-Admin Data
                    </Button>
                    <Button
                      onClick={() => setShowValidation(true)}
                      type="primary"
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
                      ✅ Start Validation
                    </Button>
                  </>
                )}

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddRow}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
                  Add Row
                </Button>

                <RangePicker
                  value={selectedDateRange}
                  onChange={(dates) => {
                    if (!dates || dates.length === 0) {
                      setSelectedDateRange([
                        dayjs().startOf("month"),
                        dayjs().endOf("month"),
                      ]);
                    } else {
                      setSelectedDateRange(dates);
                    }
                  }}
                />

                <Button
                  onClick={clearAllFilters}
                  type="default"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
                  Remove All Filters
                </Button>
              </>
            ) : showSubadminData ? (
              <Button
                type="primary"
                onClick={() => setShowSubadminData(false)}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
                ← Back to Table
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => setShowValidation(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
                ← Back to Table
              </Button>
            )}
          </div>

          <div className="w-full md:w-auto">
            <Input
              placeholder="Search by Username, Pub Name, or Campaign Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="overflow-auto max-h-[70vh] mt-4">
          {showValidation ? (
            <div className="w-full">
              <Validation />
            </div>
          ) : !showSubadminData ? (
            <Table
              loading={savingTable}
              columns={columns}
              dataSource={finalFilteredData}
              rowKey="id"
              onChange={(pagination, _filters, sorter) => {
                if (!Array.isArray(sorter)) {
                  setSortInfo({
                    columnKey: sorter.columnKey,
                    order: sorter.order,
                  });
                }
              }}
              pagination={{
                pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
                showSizeChanger: true,
                defaultPageSize: 10,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              bordered
              scroll={{ x: "max-content" }}
              rowClassName={(record) =>
                record.flag === "1" ? "light-yellow-row" : ""
              }
              summary={tableSummary}
            />
          ) : (
            <MainComponent />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvertiserData;
