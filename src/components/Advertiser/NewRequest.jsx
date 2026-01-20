import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Checkbox,
  Tooltip,
  message,
  Modal,
  Dropdown,
} from "antd";
import { PushpinFilled, PushpinOutlined } from "@ant-design/icons";
import axios from "axios";
import { subscribeToNotifications } from "../Publisher/Socket";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { exportToExcel } from "../exportExcel";
import { createNotification } from "../../Utils/Notification";
import StyledTable from "../../Utils/StyledTable";
import { RiFileExcel2Line } from "react-icons/ri";
import { FaFilterCircleXmark } from "react-icons/fa6";
import dayjs from "dayjs";
import { DatePicker } from "antd";
const { RangePicker } = DatePicker;
const { Option } = Select;

const apiUrl = import.meta.env.VITE_API_URL1;
const apiUrl1 = import.meta.env.VITE_API_URL;

const statuses = [
  "waiting",
  "shared",
  "rejected",
  "Handshake Pending",
  "in-use",
  "poor performance",
];

const columnHeadings = {
  pub_name: "Publisher",
  campaign_name: "Campaign",
  note: "Note",
  adv_name: "Advertiser",
  payout: "PUB Payout $",
  os: "OS",
  pid: "PID",
  pub_id: "PUB ID",
  geo: "Geo",
  priority: "Priority",
  created_at: "Created At",
};

const NewRequest = () => {
  const user = useSelector((state) => state.auth.user);
  const username = user?.username || null;
  const userId = user?.id;
  const [requests, setRequests] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});
  const [campaignList, setCampaignList] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  // 📅 Date range filter state
  const [dateRange, setDateRange] = useState(() => {
    return [dayjs().startOf("month"), dayjs().endOf("month")];
  });

  // const [stickyColumns, setStickyColumns] = useState([]); // for pin/unpin columns
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    const saved = localStorage.getItem("hiddenCampaignColumns");
    return saved ? JSON.parse(saved) : [];
  });
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [sortInfo, setSortInfo] = useState({});
  const [firstFilteredColumn, setFirstFilteredColumn] = useState(null);
  const normalize = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    return val.toString().trim();
  };
  const handlePinColumn = (key) => {
    setPinnedColumns((prev) => {
      const current = prev[key];

      let next;
      if (!current) next = "left";
      else if (current === "left") next = "right";
      else next = null;

      return { ...prev, [key]: next };
    });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setSortInfo(sorter);
  };
  // persist hidden columns
  useEffect(() => {
    localStorage.setItem(
      "hiddenCampaignColumns",
      JSON.stringify(hiddenColumns)
    );
  }, [hiddenColumns]);

  // ✅ Fetch campaigns list (for shared popup)
  const fetchCampaignList = async () => {
    try {
      const res = await axios.get(`${apiUrl1}/campaigns`, {
        params: {
          user_id: user?.id || user?._id, // <-- sending user ID here
        },
      });
      console.log(res.data.data);
      if (res?.data && Array.isArray(res?.data?.data)) {
        // Filter out campaigns with null names
        const validCampaigns = res.data.data.filter(
          (c) => c.campaign_name && c.campaign_name.trim() !== ""
        );
        console.log(validCampaigns);
        setCampaignList(validCampaigns);
      } else {
        setCampaignList([]);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch campaign list");
    }
  };

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setSortInfo({}); // FIX: remove sorting
    setPinnedColumns({}); // FIX: remove pinning
    setHiddenColumns([]);
    // 🔁 Reset to current month again
    setDateRange([dayjs().startOf("month"), dayjs().endOf("month")]);
    localStorage.removeItem("hiddenCampaignColumns");
  }, []);

  useEffect(() => {
    fetchRequests();

    subscribeToNotifications((data) => {
      if (data?.id !== null) {
        fetchRequests();
      }
    });
  }, [dateRange]);

  const fetchRequests = async () => {
    try {
      const [startDate, endDate] = dateRange;
      const params = {
        id: userId,
        start_Date: startDate.format("YYYY-MM-DD"),
        end_Date: endDate.format("YYYY-MM-DD"),
      };
      const fullUrl = `${apiUrl1}/newPrmadvRequests?${new URLSearchParams(
        params
      ).toString()}`;

      console.log("API URL:", fullUrl);
      const res = await axios.get(`${apiUrl1}/newPrmadvRequests`, {
        params: {
          id: userId,
          start_date: startDate.format("YYYY-MM-DD"),
          end_date: endDate.format("YYYY-MM-DD"),
        }, // <-- userId sent in params
      });

      const result = res.data?.data;
      console.log(res);
      // Sort by id DESC (newest first)
      let sortedData = (Array.isArray(result) ? result : []).sort(
        (a, b) => b.id - a.id
      );

      // advertiser_manager → no filter

      setRequests(sortedData);
    } catch (error) {
      message.error("Failed to fetch requests");
      setRequests([]); // fallback on error
    }
  };

  const getExcelFilteredDataForColumn = (columnKey) => {
    return requests.filter((row) => {
      return Object.entries(filters).every(([key, values]) => {
        if (key === columnKey) return true; // ignore self
        if (!values || values.length === 0) return true;
        return values.includes(normalize(row[key]));
      });
    });
  };
  useEffect(() => {
    const valuesObj = {};

    Object.keys(columnHeadings).forEach((col) => {
      const source = getExcelFilteredDataForColumn(col);

      valuesObj[col] = [
        ...new Set(source.map((row) => normalize(row[col]))),
      ].sort((a, b) => a.localeCompare(b));
    });

    setUniqueValues(valuesObj);
  }, [requests, filters]);

  const handleFilterChange = useCallback((value, key) => {
    // detect the first filter applied
    setFilters((prev) => {
      const isFirstFilter = Object.values(prev).every((arr) => !arr?.length);

      if (isFirstFilter) {
        setFirstFilteredColumn(key); // ⭐ store first filtered column
      }

      return { ...prev, [key]: value };
    });
  }, []);
  // Filter requests based on filters and search text
  const filteredRequests = useMemo(() => {
    return requests.filter((row) => {
      // 🔍 Global search
      const matchesSearch = Object.values(row)
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase());

      if (!matchesSearch) return false;

      // 📅 Date range filter (created_at)
      if (dateRange?.length === 2 && row.created_at) {
        const rowDate = dayjs(row.created_at);
        if (
          !rowDate.isAfter(dateRange[0].startOf("day")) ||
          !rowDate.isBefore(dateRange[1].endOf("day"))
        ) {
          return false;
        }
      }

      // 🎯 Excel-style column filters
      return Object.entries(filters).every(([key, values]) => {
        if (!values || values.length === 0) return true;
        return values.includes(normalize(row[key]));
      });
    });
  }, [requests, filters, searchText, dateRange]);

  // Unique values based on filtered data (except first filtered column)
  const uniqueValuesFiltered = useMemo(() => {
    const values = {};

    for (const item of filteredRequests) {
      for (const key of Object.keys(columnHeadings)) {
        if (!values[key]) values[key] = new Set();

        if (item[key] !== null && item[key] !== undefined) {
          values[key].add(item[key]);
        }
      }
    }

    return Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, [...v]])
    );
  }, [filteredRequests, columnHeadings]);
  // Compose columns with filterDropdown, filter icon state, sorting & column pinning
  const getColumns = (columnHeadings) => {
    return Object.keys(columnHeadings).map((key) => {
      const isPinned = pinnedColumns[key];
      const isSorted = sortInfo?.columnKey === key;

      return {
        title: (
          <div className="flex items-center justify-between gap-2">
            <span
              style={{
                color: filters[key]?.length > 0 ? "#1677ff" : "inherit",
                fontWeight: filters[key]?.length > 0 ? "bold" : "normal",
                cursor: "pointer",
                userSelect: "none",
              }}>
              {columnHeadings[key] || key}
            </span>

            {/* Pin Button */}
            <span
              className="cursor-pointer text-gray-500 hover:text-black"
              onClick={(e) => {
                e.stopPropagation();
                handlePinColumn(key);
              }}>
              {isPinned ? (
                <PushpinFilled rotate={isPinned === "right" ? 90 : 0} />
              ) : (
                <PushpinOutlined />
              )}
            </span>
          </div>
        ),

        key,
        dataIndex: key,

        sorter: (a, b) => {
          const valA = a[key];
          const valB = b[key];

          return !isNaN(valA) && !isNaN(valB)
            ? valA - valB
            : (valA || "").toString().localeCompare((valB || "").toString());
        },

        /** IMPORTANT: single source of truth */
        sortOrder: isSorted ? sortInfo.order : null,

        /** Header Click Sorting Logic (ASC → DESC → NONE) */
        onHeaderCell: () => ({
          onClick: () => {
            setSortInfo((prev) => {
              if (prev.columnKey !== key) {
                return { columnKey: key, order: "ascend" };
              }
              if (prev.order === "ascend") {
                return { columnKey: key, order: "descend" };
              }
              if (prev.order === "descend") {
                return {}; // remove sorting completely
              }
              return { columnKey: key, order: "ascend" };
            });
          },
        }),

        fixed: isPinned || undefined,

        render: (value) => {
          if (key === "created_at" && value) {
            const date = new Date(value);
            return date.toLocaleString("en-IN", {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            });
          }
          if (key === "geo") {
            try {
              // Case 1: Already an array
              if (Array.isArray(value)) return value.join(", ");

              // Case 2: Value is a JSON string like "[\"IN\",\"PK\"]"
              if (typeof value === "string" && value.startsWith("[")) {
                return JSON.parse(value).join(", ");
              }

              return value || "";
            } catch {
              return value || "";
            }
          }
          return value;
        },

        // Filters: KEEP YOUR EXISTING CODE
        filterDropdown: () => {
          const allValues = uniqueValues[key] || [];
          const selectedValues = filters[key] ?? allValues;
          const searchText = filterSearch[key] || "";

          const visibleValues = allValues.filter((val) =>
            val.toLowerCase().includes(searchText.toLowerCase())
          );

          const isAllSelected = selectedValues.length === allValues.length;
          const isIndeterminate = selectedValues.length > 0 && !isAllSelected;

          return (
            <div
              className="w-[260px] rounded-xl"
              onClick={(e) => e.stopPropagation()}>
              {/* 🔍 Search */}
              <div className="sticky top-0 bg-white p-2 border-b">
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
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFilters((prev) => {
                      const updated = { ...prev };
                      if (checked) delete updated[key];
                      else updated[key] = [];
                      return updated;
                    });
                  }}>
                  Select All
                </Checkbox>
              </div>

              {/* 📋 Values */}
              <div className="max-h-[220px] overflow-y-auto px-2 pb-2 space-y-1">
                {visibleValues.map((val) => (
                  <label
                    key={val}
                    className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-blue-50">
                    <Checkbox
                      checked={selectedValues.includes(val)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selectedValues, val]
                          : selectedValues.filter((v) => v !== val);

                        setFilters((prev) => ({
                          ...prev,
                          [key]: next,
                        }));
                      }}
                    />
                    <span className="truncate">{val}</span>
                  </label>
                ))}

                {visibleValues.length === 0 && (
                  <div className="py-4 text-center text-gray-400 text-sm">
                    No matching values
                  </div>
                )}
              </div>
            </div>
          );
        },
        filtered: !!filters[key],
      };
    });
  };

  // Action column for Status update select dropdown
  const actionColumn = {
    title: "Action",
    key: "action",
    render: (text, record) => {
      // ✅ Web OS bypass permission & priority
      const isWebOS = record.os?.toLowerCase() === "web";

      // ✅ Permission required only for non-web
      const isDisabled = !isWebOS && record.prm !== 1;

      return (
        <Tooltip
          title={
            isDisabled
              ? "Status can only be changed when Permission is Allowed"
              : ""
          }>
          <Select
            value={record.adv_res}
            style={{ width: 160 }}
            disabled={isDisabled}
            onChange={(value) => {
              if (value === "shared") {
                setSelectedRequestId(record.id);
                fetchCampaignList();
                setShareModalVisible(true);
              } else {
                handleStatusUpdate(record.id, value);
              }
            }}>
            {statuses.map((status) => (
              <Option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Option>
            ))}
          </Select>
        </Tooltip>
      );
    },
  };

  // ✅ Handle Status Update
  const handleStatusUpdate = async (id, status) => {
    if (status === "shared") {
      setSelectedRequestId(id);
      await fetchCampaignList();
      setShareModalVisible(true);
      return; // don't update backend yet
    }

    try {
      await axios.put(`${apiUrl}/updateAdvRes`, {
        id,
        adv_res: status,
      });

      // Find record to get receiver info
      const updatedRecord = requests.find((r) => r.id === id);
      const receiverName = updatedRecord?.pub_name;
      const campaignName = updatedRecord?.campaign_name;

      // 📨 Send notification dynamically
      await createNotification({
        sender: username, // logged-in user
        receiver: receiverName,
        type: "status_update",
        message: `📢 ${username} updated status of campaign "${campaignName}" → ✅ ${status.toUpperCase()}`,
        url: "/dashboard/makerequest",
      });

      // // ✅ Replace message.success with Swal
      // Swal.fire({
      //   icon: "success",
      //   title: "Status Updated!",
      //   text: `✅ Status changed to "${status.toUpperCase()}" successfully.`,
      //   showConfirmButton: false,
      //   timer: 2000,
      // });

      fetchRequests();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update status",
      });
    }
  };

  // ✅ Handle Shared Campaign Selection and Copy
  const handleShareConfirm = async () => {
    if (!selectedCampaignId) {
      message.warning("Please select a campaign first");
      return;
    }
    const sharedRecord = requests.find((r) => r.id === selectedRequestId);
    try {
      const res = await axios.post(
        `${apiUrl}/api/campaigns/copynew/${selectedCampaignId}`,
        {
          user_id: userId,
          pid: sharedRecord?.pid,
          pub_id: sharedRecord?.pub_id,
          pub_name: sharedRecord?.pub_name,
          pay_out: sharedRecord?.payout,
        }
      );
      // ✅ Dynamic sender (logged-in user)
      const senderName = username; // from Redux
      const sharedCampaign = res.data?.campaignName;
      // ✅ Find receiver (advertiser name)
      // you already have `selectedRequestId` — use it to find the record

      const receiverName = sharedRecord?.adv_name;

      // 📨 Send notification dynamically
      await createNotification({
        sender: senderName, // resolved to sender_id internally
        receiver: receiverName, // resolved to receiver_id internally
        type: "status_update",
        message: `📢 ${senderName} updated status of campaign "${sharedCampaign}" → SHARED`,
        url: "/dashboard/makerequest",
      });
      if (res.data?.success) {
        // ✅ Show success alert
        // Swal.fire({
        //   icon: "success",
        //   title: "Success!",
        //   text: res.data.message || "✅ Campaign shared successfully!",
        //   showConfirmButton: false,
        //   timer: 2000,
        // });

        // Update status to shared after success
        await axios.put(`${apiUrl}/updateAdvRes`, {
          id: selectedRequestId,
          adv_res: "shared",
        });

        setShareModalVisible(false);
        setSelectedCampaignId(null);
        setSelectedRequestId(null);
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to share campaign. Please try again.",
      });
    }
  };
  const visibleColumns = getColumns(columnHeadings).filter(
    (col) => !hiddenColumns.includes(col.key)
  );
  return (
    <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        All Campaign Requests
      </h2>
      {/* Campaign Share Modal */}
      <Modal
        title="Select Campaign to Share"
        open={shareModalVisible}
        onOk={handleShareConfirm}
        onCancel={() => {
          setShareModalVisible(false);
          setSelectedCampaignId(null);
          setSelectedRequestId(null);
        }}
        okText="Share"
        cancelText="Cancel">
        <Select
          showSearch
          placeholder="Select a Campaign"
          style={{ width: "100%" }}
          value={selectedCampaignId}
          onChange={(val) => setSelectedCampaignId(val)}
          filterOption={(input, option) =>
            option?.label.toLowerCase().includes(input.toLowerCase())
          }
          optionLabelProp="label">
          {campaignList.map((c) => (
            <Select.Option
              key={c.id}
              value={c.id}
              label={`${c.id} / ${c.campaign_name} / ${c.os} / ${c.Adv_name}`}>
              {`${c.id} / ${c.campaign_name}  / ${c.os} / ${c.Adv_name}`}
            </Select.Option>
          ))}
        </Select>
      </Modal>

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg p-5 mb-6 flex flex-wrap items-end justify-between gap-4 md:gap-6 lg:gap-4">
        {/* Left Section - Search + Filters */}
        <div className="flex flex-row items-end gap-3">
          {/* Search Input */}
          <Input
            placeholder="Search across all fields..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="max-w-[260px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            prefix={<span className="text-gray-400">🔍</span>}
          />
          {/* 📅 Created At Date Range */}
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            allowClear
            format="DD MMM YYYY"
            className="rounded-lg shadow-sm"
          />
        </div>

        {/* Right Section - Actions */}
        <div className="flex flex-wrap items-end gap-2">
          {/* 🧩 Hide / Show Columns */}
          <Tooltip title="Hide / Show Columns" placement="top">
            <Select
              mode="multiple"
              allowClear
              placeholder="Select columns"
              value={hiddenColumns}
              onChange={(selected) => setHiddenColumns(selected)}
              style={{ minWidth: 220 }}
              maxTagCount="responsive"
              className="rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition">
              {Object.entries(columnHeadings).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
          </Tooltip>
          {/* 📥 Download Excel */}
          <Tooltip title="Download Excel" placement="top">
            <Button
              type="primary"
              onClick={() => {
                const tableDataToExport = filteredRequests.map((item) => {
                  const filteredItem = {};
                  Object.keys(columnHeadings).forEach((key) => {
                    if (key === "created_at" && item[key]) {
                      filteredItem[columnHeadings[key]] = new Date(
                        item[key]
                      ).toLocaleString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      });
                    } else {
                      filteredItem[columnHeadings[key]] = item[key];
                    }
                  });
                  return filteredItem;
                });
                exportToExcel(tableDataToExport, "advertiser-data.xlsx");
              }}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white !rounded-lg !px-3 !py-4 !shadow-md flex items-center justify-center">
              <RiFileExcel2Line size={20} />
            </Button>
          </Tooltip>

          {/* ❌ Remove Filters */}
          <Tooltip title="Remove All Filters" placement="top">
            <Button
              onClick={clearAllFilters}
              type="default"
              className="!bg-red-600 hover:!bg-red-700 !border-gray-300 !rounded-lg !px-2 !py-4 shadow-sm hover:shadow-md transition-all duration-200">
              <FaFilterCircleXmark size={20} color="white" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="overflow-auto border border-gray-300 rounded-lg shadow-sm">
        <StyledTable
          bordered
          dataSource={filteredRequests}
          columns={[
            ...visibleColumns,
            {
              title: (
                <span
                  style={{
                    color: filters["prm"]?.length > 0 ? "#1677ff" : "inherit",
                    fontWeight: filters["prm"]?.length > 0 ? "bold" : "normal",
                  }}>
                  Permission
                </span>
              ),
              key: "prm",
              dataIndex: "prm",
              render: (value) => {
                if (value === 1)
                  return (
                    <span style={{ color: "green", fontWeight: 600 }}>
                      ✅ Allow
                    </span>
                  );
                if (value === 2)
                  return (
                    <span style={{ color: "red", fontWeight: 600 }}>
                      ❌ Disallow
                    </span>
                  );
                return (
                  <span style={{ color: "#b8860b", fontWeight: 600 }}>
                    🟡 Hold
                  </span>
                );
              },
              filterDropdown: () => (
                <div style={{ padding: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Checkbox
                      indeterminate={
                        filters["prm"]?.length > 0 && filters["prm"]?.length < 3
                      }
                      checked={filters["prm"]?.length === 3}
                      onChange={(e) =>
                        handleFilterChange(
                          e.target.checked ? [0, 1, 2] : [],
                          "prm"
                        )
                      }>
                      Select All
                    </Checkbox>
                  </div>
                  <Select
                    mode="multiple"
                    allowClear
                    style={{ width: 200 }}
                    placeholder="Select Permission"
                    value={filters["prm"] || []}
                    onChange={(value) => handleFilterChange(value, "prm")}>
                    <Option value={0}>🟡 Hold</Option>
                    <Option value={1}>✅ Allow</Option>
                    <Option value={2}>❌ Disallow</Option>
                  </Select>
                </div>
              ),
              filtered: filters["prm"]?.length > 0,
            },
            // ✅ Priority + Action columns remain as before
            {
              title: (
                <span
                  style={{
                    color:
                      filters["priority"]?.length > 0 ? "#1677ff" : "inherit",
                    fontWeight:
                      filters["priority"]?.length > 0 ? "bold" : "normal",
                  }}>
                  Priority
                </span>
              ),
              key: "priority",
              dataIndex: "priority",
              render: (value) =>
                value ? value : <span style={{ color: "#999" }}>N/A</span>,
              filterDropdown: () =>
                uniqueValues["priority"]?.length > 0 ? (
                  <div style={{ padding: 8 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Checkbox
                        indeterminate={
                          filters["priority"]?.length > 0 &&
                          filters["priority"]?.length <
                            uniqueValues["priority"]?.length
                        }
                        checked={
                          filters["priority"]?.length ===
                          uniqueValues["priority"]?.length
                        }
                        onChange={(e) =>
                          handleFilterChange(
                            e.target.checked
                              ? [...uniqueValues["priority"]]
                              : [],
                            "priority"
                          )
                        }>
                        Select All
                      </Checkbox>
                    </div>
                    <Select
                      mode="multiple"
                      allowClear
                      showSearch
                      placeholder="Select Priority"
                      style={{ width: 200 }}
                      value={filters["priority"] || []}
                      onChange={(value) =>
                        handleFilterChange(value, "priority")
                      }
                      optionLabelProp="label">
                      {[...uniqueValues["priority"]]
                        .filter((val) => val !== null && val !== undefined)
                        .map((val) => (
                          <Option key={val} value={val} label={val}>
                            <Checkbox
                              checked={filters["priority"]?.includes(val)}>
                              {val}
                            </Checkbox>
                          </Option>
                        ))}
                    </Select>
                  </div>
                ) : null,
              filtered: filters["priority"]?.length > 0,
            },
            actionColumn,
          ]}
          rowKey="id"
          scroll={{ x: "max-content" }}
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          onChange={handleTableChange}
          className="min-w-full"
        />
      </div>
    </div>
  );
};

export default NewRequest;
