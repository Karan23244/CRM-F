import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Select,
  Button,
  Input,
  DatePicker,
  Checkbox,
  Tooltip,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import "../../index.css";
import isBetween from "dayjs/plugin/isBetween";
import { useSelector } from "react-redux";
import { exportToExcel } from "../exportExcel";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
import StyledTable from "../../Utils/StyledTable";
import { LuEye } from "react-icons/lu";
import { RiFileExcel2Line } from "react-icons/ri";
import { FaFilterCircleXmark } from "react-icons/fa6";
import { sortDropdownValues } from "../../Utils/sortDropdownValues";
import ColumnSettings from "../../Utils/ColumnSettings";
import { useColumnPresets } from "../../Utils/useColumnPresets";

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

const PublisherPayoutData = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = useSelector((state) => state.auth.user.id);
  const assignedSubAdmins = user?.assigned_subadmins || [];
  const [advData, setAdvData] = useState([]);
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [stickyColumns, setStickyColumns] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubAdmins, setSelectedSubAdmins] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [sortInfo, setSortInfo] = useState({
    columnKey: null,
    order: null,
  });
  const [editingKey, setEditingKey] = useState(""); // which row is being edited
  const isEditing = (record) => record.id === editingKey;
  // 🔹 Save Note
  const saveNote = async (record, newNote) => {
    try {
      const resp = await fetch(`${apiUrl}/adv_update/${record.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: newNote }),
      });

      const data = await resp.json();

      if (data.success && data.data) {
        // ✅ Replace the row with fresh data from backend
        setAdvData((prev) =>
          prev.map((item) => (item.id === record.id ? data.data : item))
        );

        Swal.fire({
          icon: "success",
          title: "Note Updated",
          text: data.message || "Your note has been saved.",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: data.message || "Record not found or nothing changed.",
        });
      }
    } catch (error) {
      console.error("Error saving note:", error);
      Swal.fire({
        icon: "error",
        title: "Request Error",
        text: "Something went wrong while updating the note.",
      });
    }

    setEditingKey("");
  };
  // 🔹 Save FP
  const saveFP = async (record, newFP) => {
    try {
      const resp = await fetch(`${apiUrl}/adv_update/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fp: newFP }),
      });

      const data = await resp.json();
      if (data.success && data.updatedRow) {
        setFilteredData((prev) =>
          prev.map((item) => (item.id === record.id ? data.updatedRow : item))
        );
        Swal.fire({
          icon: "success",
          title: "FP Status Updated",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error updating FP:", error);
    }
  };
  const handleDateRangeChange = (dates) => {
    if (!dates || dates.length === 0) {
      // Reset to current month
      setSelectedDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    } else {
      setSelectedDateRange(dates);
    }
  };
  const clearAllFilters = () => {
    setFilters({});
    setSortInfo({ columnKey: null, order: null }); // 🔁 reset sorting
  };
  const columnHeadingsAdv = {
    ...(selectedSubAdmins?.length > 0 && { pub_name: "PUBM Name" }),
    da: "DA",
    pub_name: "PUB AM",
    username: "Adv AM",
    campaign_name: "Campaign Name",
    vertical: "Vertical",
    geo: "GEO",
    city: "State Or City",
    os: "OS",
    payable_event: "Payable Event",
    mmp_tracker: "MMP Tracker",
    pub_display: "PubID",
    pid: "PID",
    pay_out: "PUB Payout $",
    shared_date: "Shared Date",
    fa: "FA (Advertiser Side)",
    fa1: "FA1 (Advertiser Side)",
    fp: "FP (Publisher Side)",
    paused_date: "Paused Date",
    adv_total_no: "PUB Total Numbers",
    pub_Apno: "PUB Approved Numbers",
  };
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
  const toggleStickyColumn = (key) => {
    setStickyColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
  };
  const fetchAdvData = async () => {
    try {
      const [startDate, endDate] = selectedDateRange;
      const response = await axios.get(`${apiUrl}/get-advdata`, {
        params: {
          startDate: startDate.format("YYYY-MM-DD"),
          endDate: endDate.format("YYYY-MM-DD"),
        },
      });
      console.log(response);
      setAdvData([...response.data.data].reverse());
    } catch (error) {
      console.error("Error fetching advertiser data:", error);
    }
  };
  // Fetch sub-admins for the dropdown
  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const response = await axios.get(`${apiUrl}/get-subadmin`);
        if (response.data.success) {
          const subAdminOptions = response.data.data
            .filter((subAdmin) => assignedSubAdmins.includes(subAdmin.id)) // Filter only assigned sub-admins
            .map((subAdmin) => ({
              value: subAdmin.id,
              label: subAdmin.username,
              role: subAdmin.role,
            }));
          setSubAdmins(subAdminOptions);
        }
      } catch (error) {
        console.error("Error fetching sub-admins:", error);
      }
    };

    fetchSubAdmins();
  }, [assignedSubAdmins]); // Refetch if assigned sub-admins change
  useEffect(() => {
    if (
      !selectedDateRange ||
      selectedDateRange.length !== 2 ||
      !selectedDateRange[0] ||
      !selectedDateRange[1]
    ) {
      return;
    }
    // Fetch initially
    fetchAdvData();

    // Set interval to fetch every 10 seconds
    const intervalId = setInterval(() => {
      fetchAdvData();
    }, 10000); // 10000 ms = 10 seconds

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [selectedDateRange]);

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

  useEffect(() => {
    const normalize = (val) =>
      val === null || val === undefined || val.toString().trim() === ""
        ? "-"
        : val.toString().trim().toLowerCase();

    const filtered = advData.filter((item) => {
      const sharedDate = dayjs(item.shared_date);

      // 🔹 Match by publisher
      const normalizedPubName = normalize(item.pub_name);
      const matchesPub = [
        user?.username?.toString().trim().toLowerCase(),
        ...(selectedSubAdmins || []).map((sub) =>
          sub?.toString().trim().toLowerCase()
        ),
      ].includes(normalizedPubName);

      // // 🔹 Match by date range
      // const matchesDate =
      //   selectedDateRange?.length === 2 &&
      //   selectedDateRange[0] &&
      //   selectedDateRange[1]
      //     ? sharedDate.isBetween(
      //         selectedDateRange[0],
      //         selectedDateRange[1],
      //         null,
      //         "[]"
      //       )
      //     : sharedDate.month() === currentMonth &&
      //       sharedDate.year() === currentYear;

      // 🔹 Match by filters
      const matchesFilters = Object.keys(filters).every((key) => {
        const filterValues = filters[key];
        if (!filterValues || filterValues.length === 0) return true;

        const itemVal = normalize(item[key]);

        if (Array.isArray(filterValues)) {
          return filterValues.some(
            (filterVal) => itemVal === normalize(filterVal)
          );
        }

        return itemVal === normalize(filterValues);
      });

      // 🔹 Match by search
      const matchesSearch = !searchTerm.trim()
        ? true
        : Object.values(item).some((val) =>
            val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          );

      return matchesPub && matchesFilters && matchesSearch;
    });

    setFilteredData(filtered);
  }, [advData, filters, searchTerm, selectedSubAdmins, user]);
  const getExcelFilteredDataForColumn = (columnKey) => {
    const normalize = (val) =>
      val === null || val === undefined || val.toString().trim() === ""
        ? "-"
        : val.toString().trim().toLowerCase();

    return advData.filter((row) => {
      // publisher access check
      const matchesPub = [
        user?.username?.toLowerCase(),
        ...selectedSubAdmins.map((x) => x.toLowerCase()),
      ].includes(normalize(row.pub_name));

      if (!matchesPub) return false;

      // apply ALL filters except current column
      return Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true;
        if (!values || values.length === 0) return true;

        return values.some((v) => normalize(row[key]) === normalize(v));
      });
    });
  };
  // regenerate unique values when filtered data changes
  useEffect(() => {
    const valuesObj = {};

    // For each column:
    Object.keys(columnHeadingsAdv).forEach((col) => {
      const source = getExcelFilteredDataForColumn(col);
      valuesObj[col] = sortDropdownValues(
        Array.from(
          new Set(
            source.map((row) => {
              let v;
              // ✅ format pub_Apno to 2 decimals
              if (col === "pub_Apno") {
                v = row.pub_Apno;
                return isNaN(v) ? "-" : Number(v).toFixed(2);
              }
              v = row[col];
              return v === null || v === undefined || v === ""
                ? "-"
                : v.toString().trim();
            })
          )
        )
      );
    });

    setUniqueValues(valuesObj);
  }, [selectedDateRange, filteredData]);
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
    const baseCols = Object.keys(columnHeadings)
      .filter((key) => !hiddenColumns.includes(key))
      .map((key) => ({
        title: (
          <div className="flex items-center justify-between">
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
          </div>
        ),

        key,
        dataIndex: key,
        render: (text, record) => {
          const value = record[key];

          // Check for null/undefined/empty string
          if (value === null || value === undefined || value === "") {
            return <span style={{ color: "gray" }}>-</span>; // You can add Tooltip if needed
          }
          // ✅ Format only these two columns to 2 decimals
          if (key === "adv_total_no" || key === "pub_Apno") {
            const num = Number(value);
            return isNaN(num) ? "-" : num.toFixed(2);
          }
          return value;
        },

        fixed: stickyColumns.includes(key) ? "left" : undefined,
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
        // Add filterDropdown to show the custom filter UI (Select All + Select multiple)
        filterDropdown: () => {
          const allValues = uniqueValues[key] || [];
          const selectedValues = filters[key] ?? allValues;
          const searchText = filterSearch[key] || "";

          const visibleValues = sortDropdownValues(
            allValues.filter((val) =>
              val.toString().toLowerCase().includes(searchText.toLowerCase())
            )
          );
          console.log(visibleValues);
          const isAllSelected = selectedValues.length === allValues.length;
          const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

          return (
            <div className="w-[280px] rounded-3xl">
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
                  style={{ height: 34, fontSize: 16 }}
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
                  <span className="font-medium text-base text-gray-700">
                    Select All
                  </span>
                </Checkbox>
              </div>

              {/* 📋 Values */}
              <div className="max-h-[220px] overflow-y-auto p-2 space-y-1">
                {visibleValues.map((val) => (
                  <label
                    key={val}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                       hover:bg-blue-50 transition">
                    <Checkbox
                      checked={selectedValues.includes(val)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selectedValues, val]
                          : selectedValues.filter((v) => v !== val);

                        handleFilterChange(next, key);
                      }}
                    />
                    <span className="text-base text-gray-800 truncate">
                      {val}
                    </span>
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
      }));

    // 🔹 Insert FP after paused_date
    const pauseIdx = baseCols.findIndex((col) => col.key === "paused_date");
    // ✅ Remove existing FP if found
    const existingFpIdx = baseCols.findIndex((col) => col.key === "fp");
    if (existingFpIdx !== -1) {
      baseCols.splice(existingFpIdx, 1);
    }

    // ✅ Insert FP column BEFORE paused_date instead of after
    if (pauseIdx > -1) {
      baseCols.splice(pauseIdx, 0, {
        title: (
          <div className="flex items-center justify-between">
            <span
              style={{
                color: filters["fp_status"] ? "#1677ff" : "inherit",
                fontWeight: filters["fp_status"] ? "bold" : "normal",
              }}>
              FP (Publisher Side)
            </span>
            <Tooltip
              title={stickyColumns.includes("fp_status") ? "Unpin" : "Pin"}>
              <Button
                size="small"
                icon={
                  stickyColumns.includes("fp_status") ? (
                    <PushpinFilled style={{ color: "#1677ff" }} />
                  ) : (
                    <PushpinOutlined />
                  )
                }
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStickyColumn("fp_status");
                }}
              />
            </Tooltip>
          </div>
        ),
        dataIndex: "fp",
        key: "fp",
        sorter: (a, b) => (a.fp_status || "").localeCompare(b.fp_status || ""),
        fixed: stickyColumns.includes("fp_status") ? "left" : undefined,

        // 🔹 Custom filter dropdown like other headers
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
          <Select
            mode="multiple"
            allowClear
            showSearch
            placeholder="Select Status"
            style={{ width: 200 }}
            value={selectedKeys}
            onChange={(value) => {
              setSelectedKeys(value);
              handleFilterChange(value, "fp_status");
              confirm();
            }}
            optionLabelProp="label"
            maxTagCount="responsive"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }>
            {["Live", "Not Live"].map((val) => (
              <Select.Option key={val} value={val} label={val}>
                <Checkbox checked={selectedKeys.includes(val)}>{val}</Checkbox>
              </Select.Option>
            ))}
          </Select>
        ),
        onFilter: (value, record) =>
          record.fp_status?.toString().toLowerCase() === value.toLowerCase(),

        // Inline editing
        render: (text, record) => (
          <Select
            value={text || undefined}
            style={{ width: 140 }}
            showSearch
            allowClear
            variant={false}
            optionFilterProp="children"
            popupMatchSelectWidth={false}
            placeholder="Select Status"
            onChange={(val) => saveFP(record, val)}>
            <Option value="Live">Live</Option>
            <Option value="Not Live">Not Live</Option>
          </Select>
        ),
      });
    }
    // 🔹 Add Note column
    baseCols.push({
      title: "Note",
      dataIndex: "note",
      key: "note",
      render: (text, record) => {
        const canEdit =
          user?.role === "publisher_manager" ||
          record.pub_name?.toLowerCase() === user?.username?.toLowerCase();

        if (!canEdit) return <span>{text || "-"}</span>;

        return isEditing(record) ? (
          <span>{text}</span>
        ) : (
          <span
            style={{ cursor: "pointer", color: text ? "inherit" : "gray" }}
            onClick={() => {
              setEditingKey(record.id);
            }}>
            {text || "Click to add note"}
          </span>
        );
      },
      onCell: (record) => ({
        record,
        dataIndex: "note",
        editing: isEditing(record),
        saveNote,
      }),
    });

    return baseCols;
  };
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center">
      <div className="w-full bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <div className="sticky top-0 z-30 bg-white -mx-6 px-6 pt-4 pb-4 border-b border-gray-200">
          <div className="bg-white rounded-xl shadow-md p-5 mb-6 flex flex-wrap items-end justify-between gap-4 md:gap-6 lg:gap-4">
            {/* Left Section - Filters and Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Input */}
              <Input
                placeholder="Search Publisher, Campaign, or Username"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<span className="text-gray-400">🔍</span>}
                className="!w-[200px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Date Range Picker */}
              <RangePicker
                onChange={handleDateRangeChange}
                allowClear
                placeholder={["Start Date", "End Date"]}
                className="w-[250px] rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition"
              />
            </div>

            {/* Right Section - Actions */}
            <div className="flex flex-wrap items-end gap-2">
              {/* Hide Columns Dropdown
              <Select
                mode="multiple"
                allowClear
                placeholder="Select columns to hide"
                style={{ minWidth: 250 }}
                value={hiddenColumns}
                onChange={(values) => setHiddenColumns(values)}
                maxTagCount="responsive">
                {Object.keys(columnHeadingsAdv).map((key) => (
                  <Option key={key} value={key}>
                    {columnHeadingsAdv[key] || key}
                  </Option>
                ))}
              </Select> */}
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
              {/* Subadmins Dropdown */}
              {user?.role?.includes("publisher_manager") && (
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Select Subadmins"
                  value={selectedSubAdmins}
                  onChange={setSelectedSubAdmins}
                  onClear={() => setFilters({})}
                  className="min-w-[150px] md:min-w-[250px] border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition">
                  {subAdmins?.map((subAdmin) => (
                    <Option key={subAdmin.label} value={subAdmin.label}>
                      {subAdmin.label}
                    </Option>
                  ))}
                </Select>
              )}
              {/* Remove All Filters Button */}
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
                    const tableDataToExport = filteredData.map((item) => {
                      const filteredItem = {};
                      Object.keys(columnHeadingsAdv).forEach((key) => {
                        filteredItem[columnHeadingsAdv[key]] = item[key];
                      });
                      return filteredItem;
                    });
                    exportToExcel(tableDataToExport, "advertiser-data.xlsx");
                  }}
                  type="primary"
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white !rounded-lg !px-2 !py-4 shadow-md flex items-center justify-center">
                  <RiFileExcel2Line size={20} />
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
        <StyledTable
          bordered
          columns={getColumns(columnHeadingsAdv)}
          dataSource={processedData}
          rowKey="id"
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
            showSizeChanger: true,
            defaultPageSize: 10,
          }}
          scroll={{ x: "max-content" }}
          summary={(pageData) => {
            const pageTotals = pageData.reduce(
              (acc, row) => {
                acc.adv_total_no += Number(row.adv_total_no) || 0;
                acc.pub_Apno += Number(row.pub_Apno) || 0;
                return acc;
              },
              { adv_total_no: 0, pub_Apno: 0 }
            );

            return (
              <Table.Summary fixed>
                <Table.Summary.Row
                  style={{ background: "#fafafa", fontWeight: "bold" }}>
                  {getColumns(columnHeadingsAdv).map((col, index) => {
                    if (col.key === "adv_total_no") {
                      return (
                        <Table.Summary.Cell
                          key={col.key}
                          index={index}
                          className="text-center">
                          {pageTotals.adv_total_no.toFixed(2)}
                        </Table.Summary.Cell>
                      );
                    }

                    if (col.key === "pub_Apno") {
                      return (
                        <Table.Summary.Cell
                          key={col.key}
                          index={index}
                          className="text-center">
                          {pageTotals.pub_Apno.toFixed(2)}
                        </Table.Summary.Cell>
                      );
                    }

                    // TOTAL label in first column
                    if (index === 0) {
                      return (
                        <Table.Summary.Cell
                          key="total-label"
                          index={index}
                          className="text-center">
                          TOTAL
                        </Table.Summary.Cell>
                      );
                    }

                    return <Table.Summary.Cell key={col.key} index={index} />;
                  })}
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </div>
    </div>
  );
};

const EditableCell = ({
  editing,
  dataIndex,
  record,
  children,
  saveNote,
  ...restProps
}) => {
  // fallback to empty string if anything is undefined
  const initialValue =
    record && dataIndex && record[dataIndex] ? record[dataIndex] : "";

  const [localValue, setLocalValue] = useState(initialValue);

  // reset whenever editing starts or record changes
  useEffect(() => {
    if (editing) {
      setLocalValue(initialValue);
    }
  }, [editing, initialValue]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveNote(record, localValue);
    }
  };

  return (
    <td {...restProps}>
      {editing ? (
        <Input.TextArea
          value={localValue}
          autoSize={{ minRows: 1, maxRows: 3 }}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => saveNote(record, localValue)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        children
      )}
    </td>
  );
};

export default PublisherPayoutData;
