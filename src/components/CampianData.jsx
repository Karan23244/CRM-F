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
} from "antd";
import { FilterOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import "../index.css";
import geoData from "../Data/geoData.json";
import { exportToExcel } from "./exportExcel";
import Swal from "sweetalert2";
import { PushpinOutlined, PushpinFilled } from "@ant-design/icons";
const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

// Publisher Column Headings
const columnHeadingsPub = {
  username: "Input UserName",
  adv_name: "ADVM Name",
  campaign_name: "Campaign Name",
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
  geo: "GEO",
  city: "State Or City",
  os: "OS",
  payable_event: "Payable Event",
  mmp_tracker: "MMP Tracker",
  adv_id: "ADV ID",
  adv_payout: "ADV Payout $",
  pub_id: "PubID",
  pay_out: "Pub Payout $",
  pid: "PID",
  shared_date: "Shared Date",
  paused_date: "Paused Date",
  adv_total_no: "ADV Total Numbers",
  adv_deductions: "ADV Deductions",
  adv_approved_no: "ADV Approved Numbers",
};

const CampianData = () => {
  const [advData, setAdvData] = useState([]);
  const [pubData, setPubData] = useState([]);
  const [selectedType, setSelectedType] = useState("advertiser");
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [uniqueValues, setUniqueValues] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [stickyColumns, setStickyColumns] = useState([]);
  const [editingCell, setEditingCell] = useState({ key: null, field: null });
  const [dropdownOptions, setDropdownOptions] = useState({
    os: ["Android", "APK", "iOS"],
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
  });
  const [searchTerm, setSearchTerm] = useState("");
  const clearAllFilters = () => {
    setFilters({});
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

  // Set initial data based on selection
  // useEffect(() => {
  //   const data = selectedType === "publisher" ? pubData : advData;
  //   setFilteredData(data.filter((row) => !isRowEmpty(row)));
  //   generateUniqueValues(data);
  // }, [selectedType, pubData, advData]);

  useEffect(() => {
    const data = selectedType === "publisher" ? pubData : advData;
    generateUniqueValues(data);
    const filtered = data.filter((item) => {
      const sharedDate = new Date(item.shared_date);
      const itemMonth = sharedDate.getMonth();
      const itemYear = sharedDate.getFullYear();

      const selectedDate = selectedMonth ? new Date(selectedMonth) : new Date();
      const selectedMonthValue = selectedDate.getMonth();
      const selectedYear = selectedDate.getFullYear();

      if (itemMonth !== selectedMonthValue || itemYear !== selectedYear) {
        return false;
      }

      const passesAdvancedFilters = Object.keys(filters).every((key) => {
        if (!filters[key]) return true;

        // Range filter (e.g. date)
        if (Array.isArray(filters[key]) && filters[key].length === 2) {
          const [start, end] = filters[key];
          return dayjs(item[key]).isBetween(start, end, null, "[]");
        }

        return (
          item[key]?.toString().toLowerCase() ===
          filters[key].toString().toLowerCase()
        );
      });

      if (!passesAdvancedFilters) return false;

      if (!searchTerm.trim()) return true;

      const lowerSearch = searchTerm.toLowerCase();
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(lowerSearch)
      );
    });

    setFilteredData(filtered.filter((row) => !isRowEmpty(row)));
  }, [pubData, advData, selectedType, selectedMonth, filters, searchTerm]);

  // Generate unique values for filtering
  const generateUniqueValues = (data) => {
    const uniqueVals = {};
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (!uniqueVals[key]) {
          uniqueVals[key] = new Set();
        }
        uniqueVals[key].add(item[key]);
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
            ?.filter(
              (item) => item.role === "manager" || item.role === "advertiser"
            )
            .map((item) => item.username) || [],
        pub_name:
          advmName.data?.data
            ?.filter(
              (item) => item.role === "manager" || item.role === "publisher"
            )
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
  // Handle Checkbox Change
  const handleCheckboxChange = (type) => {
    setSelectedType(type);
    setFilters({});
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
  // Handle Filter Change
  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value?.length ? value : undefined,
    }));
  };

  // Apply filters
  useEffect(() => {
    const data = selectedType === "publisher" ? pubData : advData;
    const filtered = data.filter((item) =>
      Object.keys(filters).every((key) => {
        if (!filters[key]) return true;
        if (Array.isArray(filters[key])) {
          return filters[key].includes(item[key]);
        }
        return item[key] === filters[key];
      })
    );
    setFilteredData(filtered.filter((row) => !isRowEmpty(row)));
  }, [filters, pubData, advData, selectedType]);

  // Handle Edit
  const handleEdit = (id) => {
    setEditingKey(id);
    setEditedRow(filteredData.find((row) => row.id === id) || {});
  };

  // Handle Change in Input / Dropdown
  const handleChange = (value, key) => {
    setEditedRow((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle Save
  const handleSave = async () => {
    try {
      const updateUrl =
        selectedType === "publisher"
          ? `${apiUrl}/pubdata-update/${editingKey}`
          : `${apiUrl}/advdata-update/${editingKey}`;
      await axios.post(updateUrl, editedRow, {
        headers: { "Content-Type": "application/json" },
      });
      setEditingKey(null);
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Data updated successfully",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchPubData();
      fetchAdvData();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update data",
        confirmButtonText: "OK",
      });
    }
  };

  // Generate Columns Dynamically with Edit + Filters
  // const getColumns = (columnHeadings) => {
  //   return [
  //     ...Object.keys(columnHeadings).map((key) => ({
  //       title: (
  //         <div className="flex items-center justify-between">
  //           <span
  //             style={{
  //               color: filters[key] ? "#1677ff" : "inherit",
  //               fontWeight: filters[key] ? "bold" : "normal",
  //             }}>
  //             {columnHeadings[key] || key}
  //           </span>
  //           <Tooltip
  //             title={stickyColumns.includes(key) ? "Unpin" : "Pin"}
  //             className="p-3">
  //             <Button
  //               size="small"
  //               icon={
  //                 stickyColumns.includes(key) ? (
  //                   <PushpinFilled style={{ color: "#1677ff" }} />
  //                 ) : (
  //                   <PushpinOutlined />
  //                 )
  //               }
  //               onClick={() => toggleStickyColumn(key)}
  //             />
  //           </Tooltip>
  //           {uniqueValues[key]?.length > 1 && (
  //             <Dropdown
  //               overlay={
  //                 <Menu>
  //                   <div className="p-3 w-48">
  //                     <Select
  //                       allowClear
  //                       showSearch
  //                       className="w-full"
  //                       placeholder={`Filter ${key}`}
  //                       value={filters[key]}
  //                       onChange={(value) => handleFilterChange(value, key)}>
  //                       {uniqueValues[key]
  //                         ?.filter((val) => val !== null && val !== undefined)
  //                         .sort((a, b) => {
  //                           const aNum = parseFloat(a);
  //                           const bNum = parseFloat(b);
  //                           const isNumeric = !isNaN(aNum) && !isNaN(bNum);

  //                           if (isNumeric) return aNum - bNum;
  //                           return a.toString().localeCompare(b.toString());
  //                         })
  //                         .map((val) => (
  //                           <Option key={val} value={val}>
  //                             {val}
  //                           </Option>
  //                         ))}
  //                     </Select>
  //                   </div>
  //                 </Menu>
  //               }
  //               trigger={["click"]}
  //               placement="bottomRight">
  //               <FilterOutlined className="cursor-pointer text-gray-500 hover:text-black ml-2" />
  //             </Dropdown>
  //           )}
  //         </div>
  //       ),
  //       dataIndex: key,
  //       fixed: stickyColumns.includes(key) ? "left" : undefined,
  //       key,
  //       render: (text, record) => {
  //         return editingKey === record.id ? (
  //           dropdownOptions[key] ? (
  //             <Select
  //               showSearch
  //               value={editedRow[key]}
  //               onChange={(value) => handleChange(value, key)}
  //               style={{ width: "100%" }}>
  //               {dropdownOptions[key]?.map((option) => (
  //                 <Option key={option} value={option}>
  //                   {option}
  //                 </Option>
  //               ))}
  //             </Select>
  //           ) : key.toLowerCase().includes("date") ? (
  //             <DatePicker
  //               value={editedRow[key] ? dayjs(editedRow[key]) : null}
  //               onChange={(date, dateString) => handleChange(dateString, key)}
  //               style={{ width: "100%" }}
  //             />
  //           ) : (
  //             <Input
  //               value={editedRow[key]}
  //               onChange={(e) => handleChange(e.target.value, key)}
  //             />
  //           )
  //         ) : (
  //           text
  //         );
  //       },
  //     })),
  //     {
  //       title: "Actions",
  //       fixed: "right",
  //       key: "actions",
  //       render: (record) =>
  //         editingKey === record.id ? (
  //           <Button
  //             type="primary"
  //             icon={<SaveOutlined />}
  //             onClick={handleSave}
  //             className="mr-2">
  //             Save
  //           </Button>
  //         ) : (
  //           <Button
  //             icon={<EditOutlined />}
  //             onClick={() => handleEdit(record.id)}>
  //             Edit
  //           </Button>
  //         ),
  //     },
  //   ];
  // };
  const handleAutoSave = async (newValue, record, key) => {
    console.log("Auto-saving", newValue, record, key);
    const updateUrl =
      selectedType === "publisher"
        ? `${apiUrl}/pubdata-update/${record.id}`
        : `${apiUrl}/advdata-update/${record.id}`;

    const updated = { ...record, [key]: newValue };

    // Auto-calculate adv_approved_no
    if (key === "adv_total_no" || key === "adv_deductions") {
      const total = key === "adv_total_no" ? newValue : record.adv_total_no;
      const deductions =
        key === "adv_deductions" ? newValue : record.adv_deductions;

      const parsedTotal = parseFloat(total);
      const parsedDeductions = parseFloat(deductions);

      if (!isNaN(parsedTotal) && !isNaN(parsedDeductions)) {
        updated.adv_approved_no = parsedTotal - parsedDeductions;
      }
    }

    try {
      await axios.post(updateUrl, updated, {
        headers: { "Content-Type": "application/json" },
      });
      // Swal.fire({
      //   icon: "success",
      //   title: "Auto-Saved",
      //   timer: 1000,
      //   showConfirmButton: false,
      // });
      fetchPubData();
      fetchAdvData();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Auto-Save",
      });
    }
  };

  const getColumns = (columnHeadings) => {
    return [
      ...Object.keys(columnHeadings).map((key) => ({
        title: (
          <div className="flex items-center justify-between">
            <span
              style={{
                color: filters[key] ? "#1677ff" : "inherit",
                fontWeight: filters[key] ? "bold" : "normal",
              }}>
              {columnHeadings[key] || key}
            </span>
            <Tooltip
              title={stickyColumns.includes(key) ? "Unpin" : "Pin"}
              className="p-3">
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
            {uniqueValues[key]?.length > 1 && (
              <Dropdown
                overlay={
                  <Menu>
                    <div className="p-3 w-52">
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
                            <Option key={val} value={val} label={val}>
                              <Checkbox checked={filters[key]?.includes(val)}>
                                {val}
                              </Checkbox>
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
        fixed: stickyColumns.includes(key) ? "left" : undefined,
        key,
        render: (text, record) => {
          const isEditing =
            editingCell.key === record.id && editingCell.field === key;
          const value = record[key];

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
      // {
      //   title: "Actions",
      //   fixed: "right",
      //   key: "actions",
      //   render: (record) => (
      //     <Button
      //       icon={<EditOutlined />}
      //       onClick={() =>
      //         setEditingCell({
      //           key: record.id,
      //           field: Object.keys(columnHeadings)[0],
      //         })
      //       }>
      //       Edit
      //     </Button>
      //   ),
      // },
    ];
  };
  return (
    <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
      {/* Toggle Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-xl font-bold mb-3 text-gray-700">Data Type</h2>
        <div className="flex flex-wrap gap-4">
          <Checkbox
            checked={selectedType === "advertiser"}
            onChange={() => handleCheckboxChange("advertiser")}
            className="flex items-center space-x-2">
            <span className="text-base font-medium text-gray-800">
              Advertiser Data
            </span>
          </Checkbox>
          <Checkbox
            checked={selectedType === "publisher"}
            onChange={() => handleCheckboxChange("publisher")}
            className="flex items-center space-x-2">
            <span className="text-base font-medium text-gray-800">
              Publisher Data
            </span>
          </Checkbox>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button
          // onClick={() =>
          //   exportToExcel(
          //     selectedType === "publisher" ? pubData : advData,
          //     selectedType === "publisher"
          //       ? "publisher-data.xlsx"
          //       : "advertiser-data.xlsx"
          //   )
          // }
          // onClick={() => exportToExcel(filteredData, "advertiser-data.xlsx")}
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
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded-lg font-medium shadow">
          📥 Download Excel
        </button>

        <Input
          placeholder="🔍 Search by Username, Pub Name, or Campaign Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <DatePicker
          picker="month"
          onChange={(date) => setSelectedMonth(date)}
          placeholder="🗓 Filter by Month"
          allowClear
          className="w-full md:w-56 border border-gray-300 rounded-lg shadow-sm"
        />
        <Button
          onClick={clearAllFilters}
          type="default"
          className="w-full md:w-56 border border-gray-300 rounded-lg shadow-sm">
          Remove All Filters
        </Button>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow-xl rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {selectedType === "publisher" ? "Publisher" : "Advertiser"} Report
          Table
        </h2>
        <Table
          dataSource={filteredData}
          columns={
            selectedType === "publisher"
              ? getColumns(columnHeadingsPub)
              : getColumns(columnHeadingsAdv)
          }
          rowKey="id"
          bordered
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
    </div>
  );
};

export default CampianData;
