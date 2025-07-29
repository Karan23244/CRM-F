import React, { useState, useEffect, useMemo, use } from "react";
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
import { PlusOutlined, DeleteOutlined, CopyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useSelector } from "react-redux";
import geoData from "../../Data/geoData.json";
import { exportToExcel } from "../exportExcel";
import MainComponent from "./ManagerAllData";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
import Validation from "../Validation";
dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const AdvertiserData = () => {
  const monthClasses = [
    "january-row",
    "february-row",
    "march-row",
    "april-row",
    "may-row",
    "june-row",
    "july-row",
    "august-row",
    "september-row",
    "october-row",
    "november-row",
    "december-row",
  ];
  const user = useSelector((state) => state.auth.user);
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  const [savingTable, setSavingTable] = useState(false);
  const userId = user?.id || null;
  const [data, setData] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [uniqueValues, setUniqueValues] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [editingCell, setEditingCell] = useState({ key: null, field: null });
  const [stickyColumns, setStickyColumns] = useState([]);

  const [selectedDateRange, setSelectedDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [showSubadminData, setShowSubadminData] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState({
    os: ["Android", "APK", "iOS"],
  });
  const [filters, setFilters] = useState({});
  useEffect(() => {
    if (user?.id) {
      fetchData();
      fetchDropdowns();
    }
  }, [user]);
  const clearAllFilters = () => {
    setFilters({});
    setSortInfo({ columnKey: null, order: null }); // 🔁 reset sorting
  };

  const toggleStickyColumn = (key) => {
    setStickyColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
  };
  const fetchData = async () => {
    try {
      // setLoading(true);
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
    } catch (error) {
      message.error("Failed to fetch data");
    }
  };
  // const generateUniqueValues = (data) => {
  //   const uniqueVals = {};
  //   data.forEach((item) => {
  //     Object.keys(item).forEach((key) => {
  //       if (!uniqueVals[key]) uniqueVals[key] = new Set();
  //       const normalizedValue = item[key]?.toString().trim(); // normalize
  //       if (normalizedValue) uniqueVals[key].add(normalizedValue);
  //     });
  //   });

  //   const formattedValues = {};
  //   Object.keys(uniqueVals).forEach((key) => {
  //     formattedValues[key] = Array.from(uniqueVals[key]);
  //   });

  //   setUniqueValues(formattedValues);
  // };

  const generateUniqueValues = (data) => {
    const uniqueVals = {};

    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (!uniqueVals[key]) uniqueVals[key] = new Set();

        const rawVal = item[key];
        const normalizedValue =
          rawVal === null ||
          rawVal === undefined ||
          rawVal.toString().trim() === ""
            ? "-"
            : rawVal.toString().trim();

        uniqueVals[key].add(normalizedValue);
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
      Swal.fire("Success", "Data added successfully", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to add data", "error");
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

  const allowedFieldsAfter3Days = [
    "adv_id",
    "campaign_name",
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

      // Date range filter on specific columns
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

    // Search term filter
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(lowerSearchTerm)
        )
      );
    }

    return filtered;
  }, [data, selectedDateRange, filters, searchTerm]);

  // Step 4: Generate unique values for filters
  useEffect(() => {
    generateUniqueValues(finalFilteredData);
  }, [finalFilteredData]);

  // Define the desired order of columns
  const desiredOrder = [
    "adv_id",
    "campaign_name",
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
    "adv_total_no",
    "adv_deductions",
    "adv_approved_no",
  ];

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
                onClick={(e) => {
                  e.stopPropagation(); // 🛑 Prevent triggering sort
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
          const isNumeric =
            !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB));
          return isNumeric
            ? parseFloat(valA) - parseFloat(valB)
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
            const { adv_deductions, adv_approved_no, adv_payout, pay_out } =
              record;

            if (
              isEmpty(adv_deductions) ||
              isEmpty(adv_approved_no) ||
              isEmpty(adv_payout) ||
              isEmpty(pay_out)
            ) {
              throw new Error(
                "Missing or empty required fields in the record."
              );
            }

            const approved = Number(adv_approved_no);
            const payout = Number(adv_payout);
            const pub = Number(pay_out);

            const advAmount = approved * payout;
            const pubAmount = approved * pub;
            const seventyPercent = advAmount * 0.7;

            let pub_Apno;

            if (pubAmount > seventyPercent) {
              pub_Apno = Number(((0.7 * approved * payout) / pub).toFixed(1));
            } else {
              pub_Apno = approved;
            }

            return pub_Apno;
          }
          // Handle auto-save logic
          const handleAutoSave = async (newValue, record, key) => {
            setSavingTable(true); // 🟡 Start table loading
            if (!checkEditableAndAlert()) {
              setSavingTable(false);
              return;
            }
            const trimmedValue =
              typeof newValue === "string" ? newValue.trim() : newValue;
            if (trimmedValue === record[key]) {
              setSavingTable(false); // ✅ Reset loading even if no change
              return;
            }

            const updated = { ...record, [key]: newValue };

            if (key === "adv_total_no" || key === "adv_deductions") {
              const total =
                key === "adv_total_no"
                  ? parseFloat(newValue)
                  : parseFloat(record.adv_total_no);
              const deductions =
                key === "adv_deductions"
                  ? parseFloat(newValue)
                  : parseFloat(record.adv_deductions);

              const hasTotal = !isNaN(total);
              const hasDeductions = !isNaN(deductions);

              if (hasTotal && hasDeductions) {
                updated.adv_approved_no = total - deductions;
              } else {
                updated.adv_approved_no = null; // 👈 set to null if either value is missing
                console.warn(
                  "⚠️ Either total or deductions is invalid, so approved number set to null."
                );
              }
            }

            try {
              const testRecord = { ...record, ...updated };

              if (
                !isEmpty(testRecord.adv_deductions) &&
                !isEmpty(testRecord.adv_approved_no) &&
                !isEmpty(testRecord.adv_payout) &&
                !isEmpty(testRecord.pay_out)
              ) {
                updated.pub_Apno = calculatePubApno(testRecord);
              } else {
                console.warn(
                  "⚠️ Skipped pub_Apno calculation due to missing fields."
                );
                updated.pub_Apno = "";
              }
            } catch (calcError) {
              console.error(
                "❌ Error in pub_Apno calculation:",
                calcError.message
              );
              updated.pub_Apno = "";
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
            setSavingTable(false); // ✅ End loading
          };
          // ✅ Prevent editing adv_approved_no
          if (key === "adv_approved_no") {
            return (
              <div style={{ color: "gray", cursor: "not-allowed" }}>
                {value ?? "-"}
              </div>
            );
          }
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
                  handleAutoSave(val, record, key);
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
                    const newValue = date ? date.format("YYYY-MM-DD") : null;
                    handleAutoSave(newValue, record, key).finally(() => {
                      setEditingCell({ key: null, field: null });
                    });
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
                  handleAutoSave(e.target.value.trim(), record, key); // ✅
                  setEditingCell({ key: null, field: null });
                }}
                onPressEnter={(e) => {
                  handleAutoSave(e.target.value.trim(), record, key); // ✅
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
              {/* Select All Checkbox */}
              <div style={{ marginBottom: 8 }}>
                <Checkbox
                  indeterminate={
                    filters[key]?.length > 0 &&
                    filters[key]?.length < uniqueValues[key]?.length
                  }
                  checked={filters[key]?.length === uniqueValues[key]?.length}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    handleFilterChange(
                      checked ? [...uniqueValues[key]] : [],
                      key
                    );
                  }}>
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
  console.log("Final Filtered Data:", finalFilteredData);
  return (
    <>
      <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
        <div className="w-full bg-white p-6 rounded shadow-md relative">
          {/* Sticky Top Bar */}
          <div className="sticky top-0 left-0 right-0 z-20 bg-white p-4 rounded shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-200">
            {/* Buttons Section */}
            <div className="flex items-center gap-4">
              {!showSubadminData && !showValidation ? (
                <>
                  <Button
                    type="primary"
                    // onClick={() =>
                    //   exportToExcel(finalFilteredData, "advertiser-data.xlsx")
                    // }
                    onClick={() => {
                      const tableDataToExport = finalFilteredData.map(
                        (item) => {
                          const filteredItem = {};
                          Object.keys(columnHeadings).forEach((key) => {
                            filteredItem[columnHeadings[key]] = item[key]; // Custom column names
                          });
                          return filteredItem;
                        }
                      );
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
                        const start = dayjs().startOf("month");
                        const end = dayjs().endOf("month");
                        setSelectedDateRange([start, end]);
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
                // Validation View with Back Button
                <Button
                  type="primary"
                  onClick={() => setShowValidation(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
                  ← Back to Table
                </Button>
              )}
            </div>

            {/* Search Input */}
            <div className="w-full md:w-auto">
              <Input
                placeholder="Search by Username, Pub Name, or Campaign Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Table or Component View */}
          <div className="overflow-auto max-h-[70vh] mt-4">
            {showValidation ? (
              <div className="w-full">
                <Validation />
              </div>
            ) : !showSubadminData ? (
              <Table
                loading={savingTable} // 🔄 Loading state here
                columns={columns}
                dataSource={finalFilteredData}
                rowKey="id"
                onChange={(pagination, filters, sorter) => {
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
                rowClassName={(record) => {
                  return record.flag === "1" ? "light-yellow-row" : "";
                }}
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
                }}
              />
            ) : (
              <MainComponent />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvertiserData;
