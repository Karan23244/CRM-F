import React, { useEffect, useState, useMemo } from "react";
import { Table, Checkbox, Select, Button, Input, Tooltip } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import ColumnSettings from "../../Utils/ColumnSettings";
import "../../index.css";
import geoData from "../../Data/geoData.json";
import { exportToExcel } from "../exportExcel";
import Validation from "../Validation";
import { LuFileSpreadsheet } from "react-icons/lu";
import { RiFileExcel2Line } from "react-icons/ri";
import { FaFilterCircleXmark } from "react-icons/fa6";
import StyledTable from "../../Utils/StyledTable";
import { sortDropdownValues } from "../../Utils/sortDropdownValues";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useColumnPresets } from "../../Utils/useColumnPresets";
import CustomRangePicker from "../../Utils/CustomRangePicker";
import { debounce } from "lodash";

const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

// Advertiser Column Headings
const columnHeadingsAdv = {
  da: "DA",
  pub_name: "PUB AM",
  campaign_name: "Campaign Name",
  vertical: "Vertical", // ✅ Added here
  geo: "GEO",
  city: "State Or City",
  os: "OS",
  payable_event: "Payable Event",
  mmp_tracker: "MMP Tracker",
  adv_payout: "ADV Payout $",
  pub_display: "PUB ID",
  pay_out: "Pub Payout $",
  pid: "PID",
  shared_date: "Shared Date",
  paused_date: "Paused Date",
  fp: "FP", // ✅ Added after paused_date
  fa: "FA", // ✅ Added after paused_date
  fa1: "FA1", // ✅ Added after paused_date
  adv_total_no: "ADV Total Numbers",
  adv_deductions: "ADV Deductions",
  adv_approved_no: "ADV Approved Numbers",
  pub_Apno: "PUB Approved Numbers",
};

const CampianDataOptimization = () => {
  const userId = useSelector((state) => state.auth.user.id);
  const allColumns = Object.keys(columnHeadingsAdv);

  const {
    presets,
    hiddenColumns,
    setHiddenColumns,
    activePreset,
    applyPreset,
    savePreset,
    updatePreset,
    deletePreset,
  } = useColumnPresets({ userId, allColumns });

  const [advData, setAdvData] = useState([]);
  const [filters, setFilters] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [stickyColumns, setStickyColumns] = useState([]);
  const [sortInfo, setSortInfo] = useState({ columnKey: null, order: null });
  const [showValidation, setShowValidation] = useState(false);
  console.log(advData);
  const [selectedDateRange, setSelectedDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearch = useMemo(
    () => debounce((val) => setSearchTerm(val), 300),
    [],
  );
  const getVisibleColumnKeys = (columnHeadings) => {
    return Object.keys(columnHeadings).filter(
      (key) => !hiddenColumns.includes(key),
    );
  };
  const clearAllFilters = () => {
    setFilters({});
    setSortInfo({ columnKey: null, order: null }); // 🔁 reset sorting
  };
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, []);

  const fetchAdvData = async () => {
    try {
      const [startDate, endDate] = selectedDateRange;

      const res = await axios.get(`${apiUrl}/get-advdata`, {
        params: {
          startDate: startDate.format("YYYY-MM-DD"),
          endDate: endDate.format("YYYY-MM-DD"),
        },
      });

      if (res.data.success) setAdvData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (
      !selectedDateRange ||
      selectedDateRange.length !== 2 ||
      !selectedDateRange[0] ||
      !selectedDateRange[1]
    ) {
      return;
    }

    fetchAdvData();
  }, [selectedDateRange]);
  // Check if all values in a row are empty
  const handleFilterChange = (values, key) => {
    setFilters((prev) => {
      const allValues = uniqueValues[key] || [];

      // Excel behavior:
      // If everything selected → treat as NO FILTER
      if (values.length === allValues.length) {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      }

      return { ...prev, [key]: values };
    });
  };
  const filteredData = useMemo(() => {
    return advData.filter((item) => {
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
            (val) => itemVal === val?.toString().trim().toLowerCase(),
          );
        }

        return itemVal === filterVal?.toString().trim().toLowerCase();
      });

      if (!passesAdvancedFilters) return false;

      // 🔹 Normalize Search term
      if (!searchTerm.trim()) return true;
      const lowerSearch = searchTerm.trim().toLowerCase();

      return Object.values(item).some((val) =>
        val?.toString().trim().toLowerCase().includes(lowerSearch),
      );
    });
  }, [advData, filters, searchTerm, selectedDateRange]);
  const getExcelFilteredDataForColumn = (columnKey) => {
    const normalize = (val) =>
      val === null || val === undefined || val.toString().trim() === ""
        ? "-"
        : val.toString().trim().toLowerCase();

    return advData.filter((row) => {
      /* 🔹 1. DATE RANGE FILTER (same as filteredData) */
      if (
        selectedDateRange &&
        selectedDateRange.length === 2 &&
        dayjs(selectedDateRange[0]).isValid() &&
        dayjs(selectedDateRange[1]).isValid()
      ) {
        const start = dayjs(selectedDateRange[0]).startOf("day");
        const end = dayjs(selectedDateRange[1]).endOf("day");
        const shared = dayjs(row.shared_date);

        if (!shared.isBetween(start, end, null, "[]")) {
          return false;
        }
      }

      /* 🔹 2. EXCEL-STYLE CASCADING FILTERS
       → apply ALL filters except the current column */
      return Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;
        if (!values || values.length === 0) return true;

        let rowValue;

        // 🔹 computed column support
        if (key === "adv_payout_total") {
          const total = Number(row.adv_payout) * Number(row.adv_approved_no);
          rowValue = isNaN(total) ? "-" : total.toFixed(2);
        } else if (key === "pub_Apno") {
          rowValue = isNaN(row.pub_Apno)
            ? "-"
            : Number(row.pub_Apno).toFixed(2);
        } else {
          rowValue = row[key];
        }

        const normalizedRowVal = normalize(rowValue);

        return values.some((v) => normalizedRowVal === normalize(v));
      });
    });
  };
  useEffect(() => {
    // Build unique dropdown values dynamically based on selection rules
    const valuesObj = {};

    Object.keys(columnHeadingsAdv).forEach((col) => {
      const source = getExcelFilteredDataForColumn(col);

      valuesObj[col] = sortDropdownValues(
        Array.from(
          new Set(
            source.map((row) => {
              let v;

              if (col === "adv_payout_total") {
                const total =
                  Number(row.adv_payout) * Number(row.adv_approved_no);
                return isNaN(total) ? "-" : total.toFixed(2);
              }

              if (col === "pub_Apno") {
                v = row.pub_Apno;
                return isNaN(v) ? "-" : Number(v).toFixed(2);
              }

              v = row[col];
              return v === null || v === undefined || v === ""
                ? "-"
                : v.toString().trim();
            }),
          ),
        ),
      );
    });

    setUniqueValues(valuesObj);

    // }
  }, [selectedDateRange, filteredData]);
  const toggleStickyColumn = (key) => {
    setStickyColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key],
    );
  };

  const getColumns = (columnHeadings) => {
    return [
      ...getVisibleColumnKeys(columnHeadings).map((key) => ({
        title: (
          <div className="flex items-center justify-between w-full">
            {/* LEFT: Column Title */}
            <span
              className="truncate"
              style={{
                color: filters[key] ? "#1677ff" : "inherit",
                fontWeight: filters[key] ? "bold" : "normal",
              }}>
              {columnHeadings[key] || key}
            </span>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-2">
              {/* PIN */}
              <Tooltip title={stickyColumns.includes(key) ? "Unpin" : "Pin"}>
                <span
                  onClick={(e) => {
                    e.stopPropagation(); // prevent sort
                    toggleStickyColumn(key);
                  }}
                  className="cursor-pointer flex items-center">
                  {stickyColumns.includes(key) ? (
                    <PushpinFilled style={{ color: "#1677ff" }} />
                  ) : (
                    <PushpinOutlined />
                  )}
                </span>
              </Tooltip>
            </div>
          </div>
        ),
        filterDropdown: () => {
          const allValues = uniqueValues[key] || [];
          const selectedValues = filters[key] ?? allValues;
          const searchText = filterSearch[key] || "";

          const visibleValues = sortDropdownValues(
            allValues.filter((val) =>
              val.toString().toLowerCase().includes(searchText.toLowerCase()),
            ),
          );
          const isAllSelected = selectedValues.length === allValues.length;
          const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

          return (
            <div className="w-[240px] rounded-3xl">
              {/* 🔍 Search */}
              <div className="sticky top-0 z-10 bg-white p-3 border-b">
                <Input
                  allowClear
                  placeholder="Search values"
                  value={searchText}
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
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={(e) =>
                    handleFilterChange(e.target.checked ? allValues : [], key)
                  }>
                  <span className="font-medium text-gray-700">Select All</span>
                </Checkbox>
              </div>

              {/* 📋 Values */}
              <div className="max-h-[220px] overflow-y-auto p-2 space-y-1">
                {visibleValues.map((val) => (
                  <label
                    key={val}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-blue-50">
                    <Checkbox
                      checked={selectedValues.includes(val)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selectedValues, val]
                          : selectedValues.filter((v) => v !== val);

                        handleFilterChange(next, key);
                      }}
                    />
                    <span className="truncate">{val}</span>
                  </label>
                ))}

                {visibleValues.length === 0 && (
                  <div className="py-6 text-center text-sm text-gray-400">
                    No matching values
                  </div>
                )}
              </div>
            </div>
          );
        },

        onFilterDropdownOpenChange: (open) => {
          if (!open) {
            setFilterSearch((prev) => ({
              ...prev,
              [key]: "",
            }));
          }
        },

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
              Number(record.adv_payout) * Number(record.adv_approved_no);
            return (
              <span>
                <p>{isNaN(total) ? "-" : total.toFixed(2)}</p>
              </span>
            );
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
    <div className="p-5">
      {/* Toggle Section */}
      <div className="">
        <h2 className="text-xl font-bold mb-3 text-gray-700">PID Data</h2>
      </div>
      {/* Controls Section */}
      {!showValidation ? (
        <div className="bg-white rounded-xl shadow-lg p-5 mb-6 flex flex-wrap items-end justify-between gap-4 md:gap-6 lg:gap-4">
          {/* Left Section - Validation Button */}
          <div className="flex flex-col lg:flex-row items-center gap-3">
            {/* Search Input */}
            <Input
              placeholder="Search Username, Pub Name, or Campaign"
              value={searchInput} // ✅ fast typing
              onChange={(e) => {
                const value = e.target.value;
                setSearchInput(value); // ✅ immediate UI update
                debouncedSearch(value); // ✅ delayed heavy filtering
              }}
              className="w-[240px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Date Range Picker */}
            <div className="flex flex-col items-start gap-1">
              <CustomRangePicker
                value={selectedDateRange}
                onChange={setSelectedDateRange}
              />
            </div>
          </div>

          {/* Right Section - Filters and Actions */}
          <div className="flex flex-wrap items-end gap-2">
            {/* Column Preset & Visibility Controls */}
            <ColumnSettings
              columnMap={columnHeadingsAdv}
              hiddenColumns={hiddenColumns}
              setHiddenColumns={setHiddenColumns}
              presets={presets}
              activePreset={activePreset}
              applyPreset={applyPreset}
              savePreset={savePreset}
              updatePreset={updatePreset}
              deletePreset={deletePreset}
            />

            {/* Remove Filters Button */}
            <Tooltip title="Remove Filters" placement="top">
              <Button
                onClick={clearAllFilters}
                type="default"
                className="!bg-red-600 hover:!bg-red-700 !border-gray-300 !rounded-lg !px-2 !py-4 shadow-sm hover:shadow-md transition-all duration-200">
                <FaFilterCircleXmark size={20} color="white" />
              </Button>
            </Tooltip>
            {/* Download Excel Button */}
            <Tooltip title="Download Excel" placement="top">
              <Button
                onClick={() => {
                  const columnHeadings = columnHeadingsAdv;

                  // ❌ columns to remove
                  const excludedKeys = ["adv_display", "pub_display"];

                  // ✅ extra columns to add
                  const extraColumns = {
                    adv_id: "ADV ID",
                    pub_id: "PUB ID",
                    pub_am: "PUB AM",
                  };

                  const visibleKeys = Object.keys(columnHeadings).filter(
                    (key) => !excludedKeys.includes(key),
                  );

                  const cleanedData = filteredData.map((row) => {
                    const cleanedRow = {};

                    // ✅ existing columns (except excluded)
                    visibleKeys.forEach((key) => {
                      cleanedRow[columnHeadings[key]] = row[key];
                    });

                    // ✅ manually add required fields
                    cleanedRow[extraColumns.adv_id] = row.adv_id;
                    cleanedRow[extraColumns.pub_id] = row.pub_id;
                    cleanedRow[extraColumns.pub_am] = row.pub_am;

                    return cleanedRow;
                  });

                  exportToExcel(cleanedData, `adv-data.xlsx`);
                }}>
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

      <div className="bg-white p-4 rounded shadow">
        <StyledTable
          dataSource={filteredData}
          columns={getColumns(columnHeadingsAdv)}
          rowKey="id"
        />
      </div>
    </div>
  );
};

export default CampianDataOptimization;
