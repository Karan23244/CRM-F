import React, { useEffect, useState } from "react";
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
dayjs.extend(isBetween);
const { RangePicker } = DatePicker;
const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL;

const PublisherPayoutData = () => {
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
  const [advData, setAdvData] = useState([]);
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
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
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    const saved = localStorage.getItem("hiddenPublisherColumns");
    return saved ? JSON.parse(saved) : [];
  });
  console.log(advData);
  useEffect(() => {
    localStorage.setItem(
      "hiddenPublisherColumns",
      JSON.stringify(hiddenColumns)
    );
  }, [hiddenColumns]);

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
      console.log("saveNote data:", data);

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

  // 🔹 Save Vertical
  const saveVertical = async (record, newVertical) => {
    try {
      const resp = await fetch(`${apiUrl}/adv_update/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vertical: newVertical }),
      });

      const data = await resp.json();
      if (data.success) {
        setAdvData((prev) =>
          prev.map((item) =>
            item.id === record.id ? { ...item, vertical: newVertical } : item
          )
        );
        Swal.fire({
          icon: "success",
          title: "Vertical Updated",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error updating vertical:", error);
    }
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

  const user = useSelector((state) => state.auth.user);
  console.log("Current User:", user);
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
    setHiddenColumns([]);
    setSortInfo({ columnKey: null, order: null }); // 🔁 reset sorting
  };
  const columnHeadingsAdv = {
    ...(selectedSubAdmins?.length > 0 && { pub_am: "PUBM Name" }),
    pub_am: "PUB AM",
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
    da: "DA",
    pay_out: "PUB Payout $",
    shared_date: "Shared Date",
    fa: "FA (Advertiser Side)",
    fa1: "FA1 (Advertiser Side)",
    fp: "FP (Publisher Side)",
    paused_date: "Paused Date",
    adv_total_no: "PUB Total Numbers",
    pub_Apno: "PUB Approved Numbers",
  };
  const toggleStickyColumn = (key) => {
    setStickyColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
  };
  const fetchAdvData = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-advdata`);
      console.log("Fetched advertiser data:", response);
      setAdvData([...response.data.data].reverse());
    } catch (error) {
      console.error("Error fetching advertiser data:", error);
    }
  };

  const assignedSubAdmins = user?.assigned_subadmins || [];

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
    // Fetch initially
    fetchAdvData();

    // Set interval to fetch every 10 seconds
    const intervalId = setInterval(() => {
      fetchAdvData();
    }, 10000); // 10000 ms = 10 seconds

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);
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

  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value?.length ? value : undefined,
    }));
  };

  useEffect(() => {
    const currentMonth = dayjs().month();
    const currentYear = dayjs().year();

    const normalize = (val) =>
      val === null || val === undefined || val.toString().trim() === ""
        ? "-"
        : val.toString().trim().toLowerCase();

    const filtered = advData.filter((item) => {
      const sharedDate = dayjs(item.shared_date);

      // 🔹 Match by publisher
      const normalizedPubName = normalize(item.pub_am);
      const matchesPub = [
        user?.username?.toString().trim().toLowerCase(),
        ...(selectedSubAdmins || []).map((sub) =>
          sub?.toString().trim().toLowerCase()
        ),
      ].includes(normalizedPubName);

      // 🔹 Match by date range
      const matchesDate =
        selectedDateRange?.length === 2 &&
        selectedDateRange[0] &&
        selectedDateRange[1]
          ? sharedDate.isBetween(
              selectedDateRange[0],
              selectedDateRange[1],
              null,
              "[]"
            )
          : sharedDate.month() === currentMonth &&
            sharedDate.year() === currentYear;

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

      return matchesPub && matchesDate && matchesFilters && matchesSearch;
    });

    setFilteredData(filtered);
  }, [
    advData,
    filters,
    searchTerm,
    selectedDateRange,
    selectedSubAdmins,
    user,
  ]);
  useEffect(() => {
    // if (
    //   selectedDateRange &&
    //   selectedDateRange.length === 2 &&
    //   selectedDateRange[0] &&
    //   selectedDateRange[1] &&
    //   advData &&
    //   advData.length > 0 // <--- important
    // ) {
    //   const [start, end] = selectedDateRange;

    //   const dateFiltered = filteredData.filter((item) =>
    //     dayjs(item.shared_date).isBetween(start, end, null, "[]")
    //   );

      generateUniqueValues(filteredData);
    // }
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
        filterDropdown:
          uniqueValues[key]?.length > 0
            ? () => (
                <div style={{ padding: 8 }}>
                  {/* Select All Checkbox */}
                  <div style={{ marginBottom: 8 }}>
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

                  {/* Multi Select Dropdown */}
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
              )
            : null,

        // This controls whether the filter icon is shown in the header
        filtered: filters[key]?.length > 0,
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
            bordered={false}
            optionFilterProp="children"
            dropdownMatchSelectWidth={false}
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
          record.pub_am?.toLowerCase() === user?.username?.toLowerCase();

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
              {/* Hide Columns Dropdown */}
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
              </Select>
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
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          dataSource={processedData}
          rowKey="id"
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: "max-content" }}
          // Dynamically apply row class based on `flag` and `shared_date` month
          rowClassName={(record) => {
            return record.flag === "1" ? "light-yellow-row" : "";
          }}
          className="mt-5"
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
