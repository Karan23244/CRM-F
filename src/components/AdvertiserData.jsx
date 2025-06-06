import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Table,
  Input,
  Button,
  Select,
  DatePicker,
  message,
  Tooltip,
  Checkbox,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useSelector } from "react-redux";
import geoData from "../Data/geoData.json";
import { exportToExcel } from "./exportExcel";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const AdvertiserData = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const [data, setData] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [selectedDateRange, setSelectedDateRange] = useState([]); // [startDate, endDate]
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCell, setEditingCell] = useState({ key: null, field: null });
  const [stickyColumns, setStickyColumns] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({
    os: ["Android", "APK", "iOS"],
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  useEffect(() => {
    if (user?.id) {
      fetchData();
      fetchDropdowns();
    }
  }, [user]);
  const clearAllFilters = () => {
    setFilters({});
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/advdata-byuser/${user.id}`);
      const formatted = response.data.reverse().map((item) => ({
        ...item,
        key: item.id,
      }));
      // Store all data, no filtering yet
      // setData(
      //   response.data.reverse().map((item) => ({
      //     ...item,
      //     key: item.id,
      //   }))
      // );
      setData(formatted);
      generateUniqueValues(formatted);
    } catch (error) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };
  const generateUniqueValues = (data) => {
    const uniqueVals = {};
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (!uniqueVals[key]) uniqueVals[key] = new Set();
        uniqueVals[key].add(item[key]);
      });
    });

    const formattedValues = {};
    Object.keys(uniqueVals).forEach((key) => {
      formattedValues[key] = Array.from(uniqueVals[key]);
    });

    setUniqueValues(formattedValues);
  };
  const fetchDropdowns = async () => {
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
        // pub_name: advmName.data?.data?.map((item) => item.username) || [],
        pub_name:
          advmName.data?.data
            ?.filter(
              (item) =>
                (item.role === "publisher_manager" ||
                  item.role === "publisher") &&
                item.username !== "AtiqueADV" &&
                item.username !== "AnveshaADV"
            )
            .map((item) => item.username) || [],
        payable_event:
          payableEvent.data?.data?.map((item) => item.payble_event) || [],
        mmp_tracker: mmpTracker.data?.data?.map((item) => item.mmptext) || [],
        pid: pid.data?.data?.map((item) => item.pid) || [],
        pub_id: pub_id.data?.data?.map((item) => item.pub_id) || [],
        geo: geoData.geo?.map((item) => item.code) || [],
        adv_id: adv_id?.data?.advertisements?.map((item) => item.adv_id) || [],
      }));
    } catch (error) {
      message.error("Failed to fetch dropdown options");
    }
  };

  const handleEdit = (id) => {
    setEditingKey(id);
    setEditedRow(data.find((row) => row.id === id) || {});
  };

  const handleSave = async () => {
    const excludedFields = [
      "paused_date",
      "adv_total_no",
      "adv_deductions",
      "adv_approved_no",
      "pay_out",
    ];

    const isEmptyField = Object.entries(editedRow)
      .filter(([key]) => !excludedFields.includes(key)) // Exclude specific fields
      .some(([_, value]) => !value); // Check for empty values

    if (isEmptyField) {
      alert("All required fields must be filled!");
      return;
    }
    try {
      await axios.post(`${apiUrl}/advdata-update/${editingKey}`, editedRow, {
        headers: { "Content-Type": "application/json" },
      });
      setEditingKey(null);
      fetchData();
      alert("Data updated successfully");
    } catch (error) {
      alert("Failed to update data");
    }
  };
  // Add new row
  const handleAddRow = async () => {
    try {
      if (!user?.id) {
        message.error("User ID is missing. Please login again.");
        return;
      }

      const newRow = {
        ...editedRow,
        user_id: user.id, // Ensure user_id is included
        createdAt: new Date().toISOString(),
      };
      await axios.post(`${apiUrl}/add-advdata`, newRow, {
        headers: { "Content-Type": "application/json" },
      });

      setEditedRow({});
      fetchData();
      alert("Data added successfully");
    } catch (error) {
      alert("Failed to add data");
    }
  };

  const handleCopyRow = async (record) => {
    try {
      if (!user?.id) {
        Swal.fire({
          icon: "error",
          title: "User ID missing",
          text: "Please login again.",
        });
        return;
      }

      const copiedRow = {
        ...record,
        id: undefined, // Remove existing ID
        user_id: user.id,
        createdAt: new Date().toISOString(),
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
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to copy row.",
      });
    }
  };

  const handleChange = (value, field) => {
    setEditedRow((prev) => ({ ...prev, [field]: value }));
  };
  const toggleStickyColumn = (key) => {
    setStickyColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
  };
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`${apiUrl}/advdata-delete-data/${id}`);
        fetchData();
        Swal.fire("Deleted!", "Data has been deleted.", "success");
      } catch (error) {
        Swal.fire("Error", "Failed to delete data", "error");
      }
    }
  };
  const columnHeadings = {
    pub_name: "PUBM Name",
    campaign_name: "Campaign Name",
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
    adv_total_no: "ADV Total Numbers",
    adv_deductions: "ADV Deductions",
    adv_approved_no: "ADV Approved Numbers",
  };
  const desiredOrder = [
    "pub_name",
    "campaign_name",
    "geo",
    "city",
    "os",
    "payable_event",
    "mmp_tracker",
    "adv_id",
    "adv_payout",
    "pub_am",
    "pub_id",
    "pid",
    "pay_out",
    "shared_date",
    "paused_date",
    "adv_total_no",
    "adv_deductions",
    "adv_approved_no",
  ];
  const allowedFieldsAfter3Days = [
    "pub_name",
    "campaign_name",
    "geo",
    "city",
    "os",
    "payable_event",
    "mmp_tracker",
    "adv_id",
    "adv_payout",
    "pub_am",
    "pub_id",
    "pid",
    "pay_out",
    "shared_date",
    "paused_date",
    "adv_total_no",
    "adv_deductions",
    "adv_approved_no",
    // "paused_date",
    // "adv_total_no",
    // "adv_deductions",
    // "adv_approved_no",
    // "pay_out",
  ];
  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // const finalFilteredData = data.filter((item) => {
  //   const sharedDate = dayjs(item.shared_date);

  //   if (
  //     selectedDateRange &&
  //     selectedDateRange.length === 2 &&
  //     selectedDateRange[0] &&
  //     selectedDateRange[1]
  //   ) {
  //     const [start, end] = selectedDateRange;
  //     if (!sharedDate.isBetween(start, end, null, "[]")) {
  //       return false;
  //     }
  //   }

  //   // Apply advanced filters
  //   // const passesAdvancedFilters = Object.keys(filters).every((key) => {
  //   //   if (!filters[key]) return true;

  //   //   // Date range filter
  //   //   if (Array.isArray(filters[key]) && filters[key].length === 2) {
  //   //     const [start, end] = filters[key];
  //   //     return dayjs(item[key]).isBetween(start, end, null, "[]");
  //   //   }

  //   //   return (
  //   //     item[key]?.toString().toLowerCase() ===
  //   //     filters[key].toString().toLowerCase()
  //   //   );
  //   // });
  //   const passesAdvancedFilters = Object.keys(filters).every((key) => {
  //     const filterValue = filters[key];
  //     if (!filterValue || filterValue.length === 0) return true;

  //     // Date range filter
  //     if (
  //       Array.isArray(filterValue) &&
  //       filterValue.length === 2 &&
  //       dayjs(filterValue[0]).isValid()
  //     ) {
  //       const [start, end] = filterValue;
  //       return dayjs(item[key]).isBetween(start, end, null, "[]");
  //     }

  //     // Multi-select support
  //     if (Array.isArray(filterValue)) {
  //       return filterValue.some(
  //         (val) =>
  //           item[key]?.toString().toLowerCase() === val.toString().toLowerCase()
  //       );
  //     }

  //     // Single value match
  //     return (
  //       item[key]?.toString().toLowerCase() ===
  //       filterValue.toString().toLowerCase()
  //     );
  //   });

  //   if (!passesAdvancedFilters) return false;

  //   // Search term filter
  //   if (!searchTerm.trim()) return true;

  //   const lowerSearchTerm = searchTerm.toLowerCase();
  //   return Object.values(item).some((value) =>
  //     String(value).toLowerCase().includes(lowerSearchTerm)
  //   );
  // });

  let filteredData = [...data]; // Start from original

  // Step 1: Apply date range filter (sharedDate)
  if (
    selectedDateRange &&
    selectedDateRange.length === 2 &&
    selectedDateRange[0] &&
    selectedDateRange[1]
  ) {
    const [start, end] = selectedDateRange;
    filteredData = filteredData.filter((item) =>
      dayjs(item.shared_date).isBetween(start, end, null, "[]")
    );
  }

  // Step 2: Apply advanced filters (dropdown filters)
  Object.keys(filters).forEach((key) => {
    const filterValue = filters[key];
    if (!filterValue || filterValue.length === 0) return;

    // If filter is date range
    if (
      Array.isArray(filterValue) &&
      filterValue.length === 2 &&
      dayjs(filterValue[0]).isValid()
    ) {
      const [start, end] = filterValue;
      filteredData = filteredData.filter((item) =>
        dayjs(item[key]).isBetween(start, end, null, "[]")
      );
      return;
    }

    // If filter is multi-select
    if (Array.isArray(filterValue)) {
      filteredData = filteredData.filter((item) =>
        filterValue.some(
          (val) =>
            item[key]?.toString().toLowerCase() === val.toString().toLowerCase()
        )
      );
      return;
    }

    // Single value match
    filteredData = filteredData.filter(
      (item) =>
        item[key]?.toString().toLowerCase() ===
        filterValue.toString().toLowerCase()
    );
  });

  // Step 3: Apply search filter
  if (searchTerm.trim()) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    filteredData = filteredData.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(lowerSearchTerm)
      )
    );
  }

  const finalFilteredData = filteredData;
  const columns = [
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
                onClick={() => toggleStickyColumn(key)}
              />
            </Tooltip>
          </div>
        ),
        dataIndex: key,
        fixed: stickyColumns.includes(key) ? "left" : undefined,
        key,
        render: (text, record) => {
          const value = record[key];
          const createdAt = dayjs(record.created_at);
          const isWithin3Days = dayjs().diff(createdAt, "day") <= 3;
          const isAllowedField = allowedFieldsAfter3Days.includes(key);
          const editable = isWithin3Days || isAllowedField;

          const isEditing =
            editingCell.key === record.id && editingCell.field === key;

          const checkEditableAndAlert = () => {
            if (!editable) {
              message.warning("You can't edit this field after 3 days.");
              return false;
            }
            return true;
          };

          function isEmpty(value) {
            return value === null || value === undefined || value === "";
          }

          function calculatePubApno(record) {
            const { adv_deductions, adv_approved_no, adv_payout, pub_payout } =
              record;

            if (
              isEmpty(adv_deductions) ||
              isEmpty(adv_approved_no) ||
              isEmpty(adv_payout) ||
              isEmpty(pub_payout)
            ) {
              throw new Error(
                "Missing or empty required fields in the record."
              );
            }

            const approved = Number(adv_approved_no);
            const payout = Number(adv_payout);
            const pub = Number(pub_payout);

            const advAmount = approved * payout;
            const pubAmount = approved * pub;
            const seventyPercent = advAmount * 0.7;
            let pub_Apno;

            if (pubAmount > seventyPercent) {
              pub_Apno = (0.7 * approved * payout) / pub; // Float value
            } else {
              pub_Apno = approved;
            }

            return pub_Apno;
          }
          // Handle auto-save logic
          const handleAutoSave = async (newValue, record, key) => {
            if (!checkEditableAndAlert()) return;
            if (newValue === record[key]) return;

            const updated = { ...record, [key]: newValue };

            if (key === "adv_total_no" || key === "adv_deductions") {
              const total =
                key === "adv_total_no" ? newValue : record.adv_total_no;
              const deductions =
                key === "adv_deductions" ? newValue : record.adv_deductions;

              const parsedTotal = parseFloat(total);
              const parsedDeductions = parseFloat(deductions);

              if (!isNaN(parsedTotal) && !isNaN(parsedDeductions)) {
                updated.adv_approved_no = parsedTotal - parsedDeductions;
              } else {
                console.warn(
                  "⚠️ Invalid total or deductions; skipping adv_approved_no calc."
                );
              }
            }

            try {
              const testRecord = { ...record, ...updated };

              if (
                !isEmpty(testRecord.adv_deductions) &&
                !isEmpty(testRecord.adv_approved_no) &&
                !isEmpty(testRecord.adv_payout) &&
                !isEmpty(testRecord.pub_payout)
              ) {
                updated.pub_Apno = calculatePubApno(testRecord);
              } else {
                console.warn(
                  "⚠️ Skipped pub_Apno calculation due to missing fields."
                );
              }
            } catch (calcError) {
              console.error(
                "❌ Error in pub_Apno calculation:",
                calcError.message
              );
            }

            try {
              await axios.post(
                `${apiUrl}/advdata-update/${record.id}`,
                updated,
                {
                  headers: { "Content-Type": "application/json" },
                }
              );
              message.success("Auto-saved");
              fetchData();
            } catch (err) {
              console.error("❌ Auto-save failed:", err);
              message.error("Failed to auto-save");
            }
          };

          // Dropdown Field Editing
          if (isEditing && dropdownOptions[key]) {
            return (
              <Select
                allowClear
                showSearch
                defaultValue={value}
                style={{ width: 120 }}
                onBlur={() => setEditingCell({ key: null, field: null })}
                onChange={(val) => {
                  handleAutoSave(val);
                  setEditingCell({ key: null, field: null });
                }}
                autoFocus>
                {dropdownOptions[key].map((opt) => (
                  <Select.Option key={opt} value={opt}>
                    {opt}
                  </Select.Option>
                ))}
              </Select>
            );
          }
          // Text Input Field Editing
          // Date Field Editing
          if (isEditing) {
            if (["shared_date", "paused_date"].includes(key)) {
              return (
                <DatePicker
                  allowClear
                  defaultValue={value ? dayjs(value) : null}
                  format="YYYY-MM-DD"
                  onChange={(date) => {
                    if (date) {
                      handleAutoSave(date.format("YYYY-MM-DD")).finally(() => {
                        setEditingCell({ key: null, field: null });
                      });
                    } else {
                      setEditingCell({ key: null, field: null });
                    }
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
                  handleAutoSave(e.target.value.trim());
                  setEditingCell({ key: null, field: null });
                }}
                onPressEnter={(e) => {
                  handleAutoSave(e.target.value.trim());
                  setEditingCell({ key: null, field: null });
                }}
              />
            );
          }
          // Display-only Cell (Click to Edit)
          return (
            <div
              style={{ cursor: editable ? "pointer" : "default" }}
              onClick={() => {
                if (!checkEditableAndAlert()) return;
                setEditingCell({ key: record.id, field: key });
              }}>
              {value || "-"}
            </div>
          );
        },

        filterDropdown: () =>
          uniqueValues[key]?.length > 0 ? (
            <div style={{ padding: 8 }}>
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder={`Select ${columnHeadings[key]}`}
                style={{ width: 250 }}
                value={filters[key] || []}
                onChange={(value) => handleFilterChange(value, key)}
                optionLabelProp="label"
                maxTagCount="responsive"
                // Use `option.label` for search instead of `children`
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }>
                {[...uniqueValues[key]]
                  .filter((val) => val !== null && val !== undefined)
                  .sort((a, b) => {
                    const aNum = parseFloat(a);
                    const bNum = parseFloat(b);
                    const isNumeric = !isNaN(aNum) && !isNaN(bNum);
                    return isNumeric
                      ? aNum - bNum
                      : a.toString().localeCompare(b.toString());
                  })
                  .map((val) => (
                    <Select.Option key={val} value={val} label={val}>
                      <Checkbox checked={filters[key]?.includes(val)}>
                        {val}
                      </Checkbox>
                    </Select.Option>
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
        const isEditable = dayjs().diff(createdAt, "day") <= 3;
        const isDeletable = hoursSinceCreation < 24;

        return (
          <div style={{ display: "flex", gap: "8px" }}>
            {isDeletable && (
              <Tooltip title={`Delete option available for ${remainingHours}h`}>
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
  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
      {/* Fixed Button Container */}
      <div className="w-full bg-white p-6 rounded-xl shadow-lg relative">
        {/* Sticky Top Bar */}
        <div className="sticky top-0 left-0 right-0 z-20 bg-white shadow-md rounded-md p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left Section: Buttons */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <Button
              type="primary"
              onClick={() =>
                exportToExcel(finalFilteredData, "advertiser-data.xlsx")
              }
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition-all duration-200">
              📥 Download Excel
            </Button>

            {/* Optional Add Row Button */}
            {/*
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddRow}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition-all duration-200"
      >
        ➕ Add Row
      </Button>
      */}
          </div>

          {/* Right Section: Filters */}
          <div className="flex flex-col md:flex-row items-start gap-4 w-full md:w-auto">
            <RangePicker
              onChange={(dates) => setSelectedDateRange(dates)}
              allowClear
              style={{ marginBottom: 16 }}
              placeholder={["Start Date", "End Date"]}
              className="w-full md:w-80 rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition"
            />
            <div className="flex justify-end mb-2">
              <Button onClick={clearAllFilters} type="default">
                Remove All Filters
              </Button>
            </div>

            <Input
              placeholder="🔍 Search Username / Publisher / Campaign"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div className="overflow-auto max-h-[70vh] mt-2">
          <Table
            columns={columns}
            dataSource={finalFilteredData}
            rowKey="id"
            pagination={{
              pageSizeOptions: ["10", "20", "50", "100"],
              showSizeChanger: true,
              defaultPageSize: 10,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            bordered
            loading={loading}
            scroll={{ x: "max-content" }}
            summary={(pageData) => {
              let totalAdvTotalNo = 0;
              let totalAdvDeductions = 0;
              let totalAdvApprovedNo = 0;

              pageData.forEach(
                ({ adv_total_no, adv_deductions, adv_approved_no }) => {
                  totalAdvTotalNo += Number(adv_total_no) || 0;
                  totalAdvDeductions += Number(adv_deductions) || 0;
                  totalAdvApprovedNo += Number(adv_approved_no) || 0;
                }
              );

              return (
                <Table.Summary.Row>
                  {columns.map((col) => {
                    const key = col.dataIndex;

                    if (key === "adv_total_no") {
                      return (
                        <Table.Summary.Cell key={key}>
                          <b>{totalAdvTotalNo}</b>
                        </Table.Summary.Cell>
                      );
                    } else if (key === "adv_deductions") {
                      return (
                        <Table.Summary.Cell key={key}>
                          <b>{totalAdvDeductions}</b>
                        </Table.Summary.Cell>
                      );
                    } else if (key === "adv_approved_no") {
                      return (
                        <Table.Summary.Cell key={key}>
                          <b>{totalAdvApprovedNo}</b>
                        </Table.Summary.Cell>
                      );
                    } else {
                      return <Table.Summary.Cell key={key} />;
                    }
                  })}
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvertiserData;
