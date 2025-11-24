import React, { useEffect, useState } from "react";
import {
  Table,
  Checkbox,
  Select,
  Button,
  Input,
  DatePicker,
  Dropdown,
  Menu,
  message,
  Tooltip,
  Card,
} from "antd";
import {
  FilterOutlined,
  EditOutlined,
  SaveOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../../index.css";
import geoData from "../../Data/geoData.json";
import { exportToExcel } from "../exportExcel";
import Validation from "../Validation";
import { LuFileSpreadsheet } from "react-icons/lu";
import { RiFileExcel2Line } from "react-icons/ri";
import { FaFilterCircleXmark } from "react-icons/fa6";
import StyledTable from "../../Utils/StyledTable";

import Swal from "sweetalert2";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
const { Option } = Select;
const { RangePicker } = DatePicker;

const apiUrl = import.meta.env.VITE_API_URL;

// Publisher Column Headings
const columnHeadingsPub = {
  username: "Input UserName",
  adv_name: "ADVM Name",
  campaign_name: "Campaign Name",
  vertical: "Vertical", // ✅ Added here
  geo: "GEO",
  city: "State Or City",
  os: "OS",
  payable_event: "Payable Event",
  mmp_tracker: "MMP Tracker",
  pub_id: "Pub ID",
  p_id: "PID",
  pub_payout: "Pub Payout $",
  shared_date: "Shared Date",
  paused_date: "Paused Date",
  pa: "PA", // ✅ Added after paused_date
  fa: "FA", // ✅ Added after paused_date
  fa1: "FA1", // ✅ Added after paused_date
  review: "Review",
  pub_total_numbers: "PUB Total Numbers",
  pub_deductions: "PUB Deductions",
  pub_approved_numbers: "PUB Approved Numbers",
};

// Advertiser Column Headings
const columnHeadingsAdv = {
  username: "Input UserName",
  pub_name: "PUBM Name",
  campaign_name: "Campaign Name",
  vertical: "Vertical", // ✅ Added here
  geo: "GEO",
  city: "State Or City",
  os: "OS",
  payable_event: "Payable Event",
  mmp_tracker: "MMP Tracker",
  adv_display: "ADV ID",
  adv_payout: "ADV Payout $",
  pub_display: "PUB ID",
  pay_out: "Pub Payout $",
  pid: "PID",
  da: "DA",
  shared_date: "Shared Date",
  paused_date: "Paused Date",
  fp: "FP", // ✅ Added after paused_date
  fa: "FA", // ✅ Added after paused_date
  fa1: "FA1", // ✅ Added after paused_date
  adv_total_no: "ADV Total Numbers",
  adv_deductions: "ADV Deductions",
  adv_approved_no: "ADV Approved Numbers",
  pub_Apno: "PUB Approved Numbers",
  adv_payout_total: "ADV Payout Total ($)",
};

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
const CampianData = () => {
  const [advData, setAdvData] = useState([]);
  const [pubData, setPubData] = useState([]);
  const [selectedType, setSelectedType] = useState("advertiser");
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [stickyColumns, setStickyColumns] = useState([]);
  const [editingCell, setEditingCell] = useState({ key: null, field: null });
  const [dropdownOptions, setDropdownOptions] = useState({
    os: ["Android", "APK", "iOS"],
  });
  // 🔹 Manage hidden columns (saved per table type)
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    const saved = localStorage.getItem("hiddenColumns");
    return saved ? JSON.parse(saved) : { publisher: [], advertiser: [] };
  });

  useEffect(() => {
    localStorage.setItem("hiddenColumns", JSON.stringify(hiddenColumns));
  }, [hiddenColumns]);

  const handleHiddenColumnsChange = (values) => {
    setHiddenColumns((prev) => ({
      ...prev,
      [selectedType]: values,
    }));
  };
  const getVisibleColumnKeys = (columnHeadings) => {
    return Object.keys(columnHeadings).filter(
      (key) => !hiddenColumns[selectedType]?.includes(key)
    );
  };
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  const [selectedDateRange, setSelectedDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const clearAllFilters = () => {
    setFilters({});
    setSortInfo({ columnKey: null, order: null }); // 🔁 reset sorting

    // 🔹 Reset hidden columns for current table type
    setHiddenColumns((prev) => ({
      ...prev,
      [selectedType]: [],
    }));

    // 🔹 Also remove from localStorage for persistence
    localStorage.setItem(
      "hiddenColumns",
      JSON.stringify({
        ...hiddenColumns,
        [selectedType]: [],
      })
    );
  };

  // Fetch Publisher Data
  const fetchPubData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/all-pubdata`);
      if (response.data.success) {
        setPubData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching publisher data:", error);
    }
  };
  const toggleStickyColumn = (key) => {
    setStickyColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
  };
  // Fetch Advertiser Data
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

  // Fetch data on load
  useEffect(() => {
    fetchPubData();
    fetchAdvData();
    fetchDropdowns();
  }, []);

  useEffect(() => {
    const data = selectedType === "publisher" ? pubData : advData;

    const filtered = data.filter((item) => {
      // 🔹 Normalize Date Range filter for shared_date
      if (
        selectedDateRange &&
        selectedDateRange.length === 2 &&
        dayjs(selectedDateRange[0]).isValid() &&
        dayjs(selectedDateRange[1]).isValid()
      ) {
        const start = dayjs(selectedDateRange[0]).startOf("day");
        const end = dayjs(selectedDateRange[1]).endOf("day");
        const shared = dayjs(item.shared_date);
        if (!shared.isBetween(start, end, null, "[]")) {
          return false;
        }
      }

      // 🔹 Normalize Advanced filters
      // const passesAdvancedFilters = Object.keys(filters).every((key) => {
      //   const filterVal = filters[key];
      //   if (!filterVal || filterVal.length === 0) return true;

      //   const itemVal = item[key]?.toString().trim().toLowerCase();

      //   // Array or multi-select filters
      //   if (Array.isArray(filterVal)) {
      //     return filterVal.some(
      //       (val) => itemVal === val?.toString().trim().toLowerCase()
      //     );
      //   }

      //   // Single value comparison
      //   return itemVal === filterVal?.toString().trim().toLowerCase();
      // });
      const passesAdvancedFilters = Object.keys(filters).every((key) => {
        const filterVal = filters[key];
        if (!filterVal || filterVal.length === 0) return true;

        const rawVal = item[key];
        const itemVal =
          rawVal === null ||
          rawVal === undefined ||
          rawVal.toString().trim() === ""
            ? "-"
            : rawVal.toString().trim().toLowerCase();

        if (Array.isArray(filterVal)) {
          return filterVal.some(
            (val) => itemVal === val?.toString().trim().toLowerCase()
          );
        }

        return itemVal === filterVal?.toString().trim().toLowerCase();
      });

      if (!passesAdvancedFilters) return false;

      // 🔹 Normalize Search term
      if (!searchTerm.trim()) return true;
      const lowerSearch = searchTerm.trim().toLowerCase();

      return Object.values(item).some((val) =>
        val?.toString().trim().toLowerCase().includes(lowerSearch)
      );
    });

    setFilteredData(filtered.filter((row) => !isRowEmpty(row)));
  }, [pubData, advData, selectedType, filters, searchTerm, selectedDateRange]);
  useEffect(() => {
    if (
      selectedDateRange &&
      selectedDateRange.length === 2 &&
      selectedDateRange[0] &&
      selectedDateRange[1] &&
      advData &&
      advData.length > 0 // <--- important
    ) {
      const [start, end] = selectedDateRange;

      const dateFiltered = advData.filter((item) =>
        dayjs(item.shared_date).isBetween(start, end, null, "[]")
      );

      generateUniqueValues(dateFiltered);
    }
  }, [selectedDateRange, advData]);
  // useEffect(() => {
  //   generateUniqueValues(advData);
  // }, [advData]);
  // Generate unique values for filtering
  const generateUniqueValues = (data) => {
    const uniqueVals = {};
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (!uniqueVals[key]) {
          uniqueVals[key] = new Set();
        }

        let value = item[key];

        // Normalize value
        if (
          value === null ||
          value === undefined ||
          value.toString().trim() === ""
        ) {
          uniqueVals[key].add("-"); // Treat empty/null/undefined as "-"
        } else {
          value = value.toString().trim();
          uniqueVals[key].add(value);
        }
      });
    });

    const formattedValues = Object.keys(uniqueVals).reduce((acc, key) => {
      acc[key] = Array.from(uniqueVals[key]);
      return acc;
    }, {});

    setUniqueValues(formattedValues);
  };

  // Fetch Dropdown Options
  const fetchDropdowns = async () => {
    try {
      const [advmName, payableEvent, mmpTracker, pid, review, adv_id] =
        await Promise.all([
          axios.get(`${apiUrl}/get-subadmin`),
          axios.get(`${apiUrl}/get-paybleevernt`),
          axios.get(`${apiUrl}/get-mmptracker`),
          axios.get(`${apiUrl}/get-pid`),
          axios.get(`${apiUrl}/get-reviews`),
          axios.get(`${apiUrl}/get-NameAdv`),
        ]);
      setDropdownOptions((prev) => ({
        ...prev,
        adv_name:
          advmName.data?.data
            ?.filter((item) => {
              let roles = [];

              if (typeof item.role === "string") {
                // Try to parse if it looks like a JSON array (starts with [)
                if (item.role.trim().startsWith("[")) {
                  try {
                    roles = JSON.parse(item.role);
                  } catch {
                    roles = [];
                  }
                } else {
                  // Otherwise, split by comma if it’s a comma-separated string
                  roles = item.role
                    .replace(/"/g, "") // remove quotes if present
                    .split(",")
                    .map((r) => r.trim());
                }
              } else if (Array.isArray(item.role)) {
                roles = item.role;
              } else {
                roles = [item.role];
              }

              return roles.some((r) =>
                ["advertiser_manager", "advertiser", "operations"].includes(r)
              );
            })
            .map((item) => item.username) || [],

        pub_name:
          advmName.data?.data
            ?.filter((item) => {
              let roles = [];

              if (typeof item.role === "string") {
                if (item.role.trim().startsWith("[")) {
                  try {
                    roles = JSON.parse(item.role);
                  } catch {
                    roles = [];
                  }
                } else {
                  roles = item.role
                    .replace(/"/g, "")
                    .split(",")
                    .map((r) => r.trim());
                }
              } else if (Array.isArray(item.role)) {
                roles = item.role;
              } else {
                roles = [item.role];
              }

              return roles.some((r) =>
                ["publisher_manager", "publisher"].includes(r)
              );
            })
            .map((item) => item.username) || [],

        payable_event:
          payableEvent.data?.data?.map((item) => item.payble_event) || [],
        mmp_tracker: mmpTracker.data?.data?.map((item) => item.mmptext) || [],
        pid: pid.data?.data?.map((item) => item.pid) || [],
        review: review.data?.data?.map((item) => item.review_text) || [],
        geo: geoData.geo?.map((item) => item.code) || [],
        adv_id: adv_id?.data?.data?.map((item) => item.adv_id) || [],
      }));
    } catch (error) {
      message.error("Failed to fetch dropdown options");
    }
  };
  // Check if all values in a row are empty
  // Check if the row has empty pub_name or adv_name
  const isRowEmpty = (row) => {
    if (selectedType === "publisher") {
      return !row.adv_name || row.adv_name === null || row.adv_name === "";
    } else {
      return !row.pub_name || row.pub_name === null || row.pub_name === "";
    }
  };
  // Handle Filter Change
  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  function isEmpty(value) {
    return value === null || value === undefined || value === "";
  }
  function calculatePubApno(record) {
    const { adv_deductions, adv_approved_no, adv_payout, pay_out } = record;

    if (
      isEmpty(adv_deductions) ||
      isEmpty(adv_approved_no) ||
      isEmpty(adv_payout) ||
      isEmpty(pay_out)
    ) {
      throw new Error("Missing or empty required fields in the record.");
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
  const handleAutoSave = async (newValue, record, key) => {
    const updateUrl =
      selectedType === "publisher"
        ? `${apiUrl}/pubdata-update/${record.id}`
        : `${apiUrl}/advdata-update/${record.id}`;

    const updated = { ...record, [key]: newValue };
    // Auto-calculate adv_approved_no
    // if (key === "adv_total_no" || key === "adv_deductions") {
    //   const total = key === "adv_total_no" ? newValue : record.adv_total_no;
    //   const deductions =
    //     key === "adv_deductions" ? newValue : record.adv_deductions;

    //   const parsedTotal = parseFloat(total);
    //   const parsedDeductions = parseFloat(deductions);

    //   if (!isNaN(parsedTotal) && !isNaN(parsedDeductions)) {
    //     updated.adv_approved_no = parsedTotal - parsedDeductions;
    //   }
    // }
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
        console.warn("⚠️ Skipped pub_Apno calculation due to missing fields.");
        updated.pub_Apno = "";
      }
    } catch (calcError) {
      console.error("❌ Error in pub_Apno calculation:", calcError.message);
      updated.pub_Apno = "";
    }
    try {
      await axios.post(updateUrl, updated, {
        headers: { "Content-Type": "application/json" },
      });
      Swal.fire({
        icon: "success",
        title: "Auto-Saved",
        timer: 1000,
        showConfirmButton: false,
      });
      fetchPubData();
      fetchAdvData();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Auto-Save",
      });
    }
  };
  const processedData = filteredData.map((item) => {
    const missingLabels = [];

    if (!item?.adv_payout || item.adv_payout === "0") {
      missingLabels.push("ADV Payout");
    }

    if (!item?.pay_out || item.pay_out === "0") {
      missingLabels.push("PUB Payout");
    }

    return {
      ...item,
      pub_Apno:
        missingLabels.length > 0
          ? `Missing: ${missingLabels.join(", ")}`
          : item.pub_Apno?.trim() || "-",
    };
  });
  const getColumns = (columnHeadings) => {
    return [
      ...getVisibleColumnKeys(columnHeadings).map((key) => ({
        title: (
          <div className="flex">
            <span
              style={{
                color: filters[key] ? "#1677ff" : "inherit",
                fontWeight: filters[key] ? "bold" : "normal",
              }}>
              {columnHeadings[key] || key}
            </span>
            <Tooltip title={stickyColumns.includes(key) ? "Unpin" : "Pin"}>
              <span
                onClick={(e) => {
                  e.stopPropagation(); // stop sort
                  toggleStickyColumn(key);
                }}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}>
                {stickyColumns.includes(key) ? (
                  <PushpinFilled style={{ color: "#1677ff" }} />
                ) : (
                  <PushpinOutlined />
                )}
              </span>
            </Tooltip>
            {uniqueValues[key]?.length > 0 && (
              <Dropdown
                overlay={
                  <Menu>
                    <div
                      className="p-3 w-52"
                      onClick={(e) => e.stopPropagation()}>
                      <div className="mb-2">
                        <Checkbox
                          indeterminate={
                            filters[key]?.length > 0 &&
                            filters[key]?.length < uniqueValues[key]?.length
                          }
                          checked={
                            filters[key]?.length === uniqueValues[key]?.length
                          }
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
                        className="w-full"
                        placeholder={`Filter ${key}`}
                        value={filters[key] || []}
                        onChange={(value) => handleFilterChange(value, key)}
                        optionLabelProp="label">
                        {uniqueValues[key]
                          ?.filter((val) => val !== null && val !== undefined)
                          .sort((a, b) => {
                            const aNum = parseFloat(a);
                            const bNum = parseFloat(b);
                            const isNumeric = !isNaN(aNum) && !isNaN(bNum);
                            if (isNumeric) return aNum - bNum;
                            return a.toString().localeCompare(b.toString());
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
                  </Menu>
                }
                trigger={["click"]}
                placement="bottomRight">
                <span
                  onClick={(e) => e.stopPropagation()} // ✅ Prevent sorting or parent click
                >
                  <FilterOutlined className="cursor-pointer text-gray-500 hover:text-black ml-2" />
                </span>
              </Dropdown>
            )}
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
          const isEditing =
            editingCell.key === record.id && editingCell.field === key;
          const value = record[key];
          // 🔒 Make adv_approved_no and pub_Apno non-editable
          if (key === "adv_approved_no" || key === "pub_Apno") {
            return (
              <div style={{ color: "gray", cursor: "not-allowed" }}>
                {value ?? "-"}
              </div>
            );
          }
          if (key === "adv_payout_total") {
            const total =
              (Number(record.adv_payout) || 0) *
              (Number(record.adv_approved_no) || 0);
            return (
              <span>
                <p>{isNaN(total) ? "-" : total}</p>
              </span>
            );
          }
          if (isEditing) {
            if (dropdownOptions[key]) {
              return (
                <Select
                  defaultValue={value}
                  autoFocus
                  style={{ width: "100%" }}
                  onChange={(val) => {
                    handleAutoSave(val, record, key);
                    setEditingCell({ key: null, field: null });
                  }}
                  onBlur={() => setEditingCell({ key: null, field: null })}>
                  {dropdownOptions[key].map((opt) => (
                    <Option key={opt} value={opt}>
                      {opt}
                    </Option>
                  ))}
                </Select>
              );
            } else if (key === "pa") {
              // ✅ PA Dropdown
              return (
                <Select
                  defaultValue={value}
                  autoFocus
                  style={{ width: "100%" }}
                  onChange={(val) => {
                    handleAutoSave(val, record, key);
                    setEditingCell({ key: null, field: null });
                  }}
                  onBlur={() => setEditingCell({ key: null, field: null })}>
                  <Option value="Live">Live</Option>
                  <Option value="Not Live">Not Live</Option>
                </Select>
              );
            } else if (key === "fa") {
              // Step 1 dropdown for FA
              const step1 = (value || "").split(" - ")[0]; // Only first part

              return (
                <Select
                  value={step1 || undefined}
                  placeholder="Select FA"
                  style={{ width: "100%" }}
                  onChange={(val) => {
                    const step2 = (value || "").split(" - ")[1] || ""; // Preserve FA1 if already selected
                    const newVal = step2 ? `${val} - ${step2}` : val;
                    handleAutoSave(newVal, record, key);
                  }}>
                  <Option value="Quality">Quality</Option>
                  <Option value="No Quality">No Quality</Option>
                  <Option value="No Live">No Live</Option>
                </Select>
              );
            } else if (key === "fa1") {
              // Step 2 dropdown for FA1
              const step2 = (value || "").split(" - ")[1]; // Only second part
              const step1 = (value || "").split(" - ")[0] || ""; // Preserve FA if already selected

              return (
                <Select
                  value={step2 || undefined}
                  placeholder="Select FA1"
                  style={{ width: "100%" }}
                  onChange={(val) => {
                    const newVal = step1 ? `${step1} - ${val}` : val;
                    handleAutoSave(newVal, record, key);
                  }}>
                  <Option value="Optimised">Optimised</Option>
                  <Option value="Not Optimised">Not Optimised</Option>
                </Select>
              );
            } else if (key === "vertical") {
              // ✅ Vertical Dropdown
              return (
                <Select
                  defaultValue={value}
                  autoFocus
                  style={{ width: "100%" }}
                  onChange={(val) => {
                    handleAutoSave(val, record, key);
                    setEditingCell({ key: null, field: null });
                  }}
                  onBlur={() => setEditingCell({ key: null, field: null })}>
                  <Option value="E-commerce- E">E-commerce- E</Option>
                  <Option value="Betting Casino- BC">Betting Casino- BC</Option>
                  <Option value="Betting Sports- BS">Betting Sports- BS</Option>
                  <Option value="Utilities- U">Utilities- U</Option>
                  <Option value="Finance- F">Finance- F</Option>
                  <Option value="Food Delivery- FD">Food Delivery- FD</Option>
                </Select>
              );
            } else if (key.toLowerCase().includes("date")) {
              return (
                <DatePicker
                  allowClear
                  value={value ? dayjs(value) : null}
                  format="YYYY-MM-DD"
                  onChange={(date) => {
                    const formattedDate = date ? date.format("YYYY-MM-DD") : "";
                    handleAutoSave(formattedDate, record, key); // ✅ Now record/key passed correctly
                    setEditingCell({ key: null, field: null });
                  }}
                  autoFocus
                />
              );
            } else {
              return (
                <Input
                  defaultValue={value}
                  autoFocus
                  onBlur={(e) => {
                    handleAutoSave(e.target.value.trim(), record, key);
                    setEditingCell({ key: null, field: null });
                  }}
                  onPressEnter={(e) => {
                    handleAutoSave(e.target.value.trim(), record, key);
                    setEditingCell({ key: null, field: null });
                  }}
                />
              );
            }
          }
          return (
            <div
              style={{ cursor: "pointer" }}
              onClick={() => setEditingCell({ key: record.id, field: key })}>
              {value || "-"}
            </div>
          );
        },
      })),
    ];
  };
  return (
    <div className="p-5 min-h-screen">
      {/* Toggle Section */}
      <div className="">
        <h2 className="text-xl font-bold mb-3 text-gray-700">PID Data</h2>
      </div>
      {/* Controls Section */}
      {!showValidation ? (
        <div className="bg-white rounded-xl shadow-lg p-5 mb-6 flex flex-wrap items-end justify-between gap-4 md:gap-6 lg:gap-4">
          {/* Left Section - Validation Button */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <Input
              placeholder="Search Username, Pub Name, or Campaign"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[240px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              prefix={<span className="text-gray-400">🔍</span>}
            />

            {/* Date Range Picker */}
            <div className="flex flex-col items-start gap-1">
              <RangePicker
                allowClear
                value={selectedDateRange}
                onChange={(dates) => {
                  if (!dates || dates.length === 0) {
                    const start = dayjs().startOf("month");
                    const end = dayjs().endOf("month");
                    setSelectedDateRange([start, end]);
                  } else {
                    setSelectedDateRange([dates[0].clone(), dates[1].clone()]);
                  }
                }}
                placeholder={["Start Date", "End Date"]}
                className="w-[250px] rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition"
              />
            </div>
          </div>

          {/* Right Section - Filters and Actions */}
          <div className="flex flex-wrap items-end gap-2">
            {/* Hide Columns Dropdown */}
            <div className="flex flex-col items-start gap-1">
              <Select
                mode="multiple"
                allowClear
                placeholder="Select columns to hide"
                style={{ minWidth: 220 }}
                value={hiddenColumns[selectedType] || []}
                onChange={handleHiddenColumnsChange}
                maxTagCount="responsive">
                {Object.keys(
                  selectedType === "publisher"
                    ? columnHeadingsPub
                    : columnHeadingsAdv
                ).map((key) => (
                  <Option key={key} value={key}>
                    {selectedType === "publisher"
                      ? columnHeadingsPub[key]
                      : columnHeadingsAdv[key]}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Remove Filters Button */}
            <Tooltip title="Remove Filters" placement="top">
              <Button
                onClick={clearAllFilters}
                type="default"
                className="!bg-red-600 hover:!bg-red-700 !border-gray-300 !rounded-lg !px-2 !py-4 shadow-sm hover:shadow-md transition-all duration-200">
                <FaFilterCircleXmark size={20} color="white" />
              </Button>
            </Tooltip>
            <Tooltip title="Start Validation" placement="top">
              <Button
                onClick={() => setShowValidation(true)}
                type="primary"
                className="!bg-green-600 hover:!bg-green-700 text-white !rounded-lg !px-2 !py-4 !shadow-md flex items-center justify-center"
                title="Start Validation">
                <LuFileSpreadsheet size={20} />
              </Button>
            </Tooltip>
            {/* Download Excel Button */}
            <Tooltip title="Download Excel" placement="top">
              <Button
                onClick={() => {
                  const columnHeadings =
                    selectedType === "publisher"
                      ? columnHeadingsPub
                      : columnHeadingsAdv;
                  const visibleKeys = Object.keys(columnHeadings);
                  const cleanedData = filteredData.map((row) => {
                    const cleanedRow = {};
                    visibleKeys.forEach((key) => {
                      cleanedRow[columnHeadings[key]] = row[key];
                    });
                    return cleanedRow;
                  });
                  exportToExcel(cleanedData, `${selectedType}-data.xlsx`);
                }}
                type="primary"
                className="!bg-blue-600 hover:!bg-blue-700 !text-white !rounded-lg !px-2 !py-4 shadow-md flex items-center justify-center"
                title="Download Excel">
                <RiFileExcel2Line size={20} />
              </Button>
            </Tooltip>
          </div>
        </div>
      ) : (
        <Button
          type="primary"
          onClick={() => setShowValidation(false)}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-5 py-2 rounded shadow-sm transition-all duration-200">
          ← Back to Table
        </Button>
      )}

      {/* Table Section */}

      <div className="bg-white shadow-xl rounded-xl p-6">
        {showValidation ? (
          // Validation Component
          <div className="w-full">
            <Validation />
          </div>
        ) : (
          <>
            <Card className="shadow-md rounded-2xl border border-gray-100 bg-white mt-6 p-4 md:p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {selectedType === "publisher"
                  ? "Publisher Data"
                  : "Advertiser Data"}
              </h2>

              <StyledTable
                className="custom-table shadow-sm rounded-lg overflow-hidden"
                dataSource={processedData}
                columns={
                  selectedType === "publisher"
                    ? getColumns(columnHeadingsPub)
                    : getColumns(columnHeadingsAdv)
                }
                rowKey="id"
                bordered={false}
                pagination={{
                  pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
                  showSizeChanger: true,
                  defaultPageSize: 10,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                }}
                scroll={{ x: "max-content" }}
                rowClassName={(record) =>
                  record.flag === "1" ? "light-yellow-row" : ""
                }
                summary={(pageData) => {
                  let totalAdvTotalNo = 0;
                  let totalAdvDeductions = 0;
                  let totalAdvApprovedNo = 0;
                  let totalpubApprovedNo = 0;
                  let totalAdvPayoutTotal = 0;

                  pageData.forEach(
                    ({
                      adv_total_no,
                      adv_deductions,
                      adv_approved_no,
                      pub_Apno,
                      adv_payout_total,
                    }) => {
                      totalAdvTotalNo += Number(adv_total_no) || 0;
                      totalAdvDeductions += Number(adv_deductions) || 0;
                      totalAdvApprovedNo += Number(adv_approved_no) || 0;
                      totalpubApprovedNo += Number(pub_Apno) || 0;
                      totalAdvPayoutTotal += Number(adv_payout_total) || 0;
                    }
                  );

                  return (
                    <Table.Summary.Row>
                      {Object.keys(columnHeadingsAdv).map((key) => {
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
                        } else if (key === "pub_Apno") {
                          return (
                            <Table.Summary.Cell key={key}>
                              <b>{totalpubApprovedNo}</b>
                            </Table.Summary.Cell>
                          );
                        } else if (key === "adv_payout_total") {
                          return (
                            <Table.Summary.Cell key={key}>
                              <b>{totalAdvPayoutTotal}</b>
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
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default CampianData;
