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
const { Option } = Select;

const apiUrl = "https://apii.clickorbits.in";

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
  const [campaignList, setCampaignList] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  // const [stickyColumns, setStickyColumns] = useState([]); // for pin/unpin columns
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    const saved = localStorage.getItem("hiddenCampaignColumns");
    return saved ? JSON.parse(saved) : [];
  });
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [sortInfo, setSortInfo] = useState({});
  console.log("🚀 sortInfo:", requests);
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
      const res = await axios.get(`${apiUrl}/api/campaigns_list`);
      if (res.data && Array.isArray(res.data)) {
        // Filter out campaigns with null names
        const validCampaigns = res.data.filter(
          (c) => c.campaign_name && c.campaign_name.trim() !== ""
        );
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
    localStorage.removeItem("hiddenCampaignColumns");
  }, []);

  useEffect(() => {
    fetchRequests();

    subscribeToNotifications((data) => {
      if (data?.id !== null) {
        fetchRequests();
      }
    });
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${apiUrl}/PrmadvRequests`);
      const result = res.data?.data;
      // Sort by id DESC (newest first)
      let sortedData = (Array.isArray(result) ? result : []).sort(
        (a, b) => b.id - a.id
      );

      // Role-based filtering
      if (user?.role === "advertiser") {
        sortedData = sortedData.filter(
          (item) => item.adv_name === user.username
        );
      }
      // if role is advertiser_manager -> no filtering needed

      setRequests(sortedData);
    } catch (error) {
      message.error("Failed to fetch requests");
      setRequests([]); // fallback on error
    }
  };

  // Get unique values for each column for filter options
  const uniqueValues = useMemo(() => {
    const values = {};
    requests.forEach((item) => {
      Object.keys(columnHeadings).forEach((key) => {
        if (!values[key]) values[key] = new Set();
        if (item[key] !== null && item[key] !== undefined)
          values[key].add(item[key]);
      });
    });
    // Convert sets to arrays
    Object.keys(values).forEach((key) => {
      values[key] = Array.from(values[key]);
    });
    return values;
  }, [requests]);

  // Handle filter change for a column
  const handleFilterChange = (value, key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Filter requests based on filters and search text
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      // Search text across all fields
      const matchesSearch = Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchText.toLowerCase())
      );
      if (!matchesSearch) return false;

      // Apply filters: if filter array for column is empty or undefined => no filter for that column
      for (const [key, selected] of Object.entries(filters)) {
        if (selected && selected.length > 0 && !selected.includes(item[key])) {
          return false;
        }
      }
      return true;
    });
  }, [requests, filters, searchText]);

  // Compose columns with filterDropdown, filter icon state, and sticky column pin button
  // const getColumns = (columnHeadings) => {
  //   return Object.keys(columnHeadings).map((key) => ({
  //     title: (
  //       <div className="flex items-center justify-between">
  //         <span
  //           style={{
  //             color: filters[key]?.length > 0 ? "#1677ff" : "inherit",
  //             fontWeight: filters[key]?.length > 0 ? "bold" : "normal",
  //             cursor: "pointer",
  //             userSelect: "none",
  //           }}>
  //           {columnHeadings[key] || key}
  //         </span>
  //       </div>
  //     ),
  //     key,
  //     dataIndex: key,

  //     render: (value) => {
  //       if (key === "created_at" && value) {
  //         const date = new Date(value);
  //         return date.toLocaleString("en-IN", {
  //           year: "numeric",
  //           month: "short",
  //           day: "2-digit",
  //           hour: "2-digit",
  //           minute: "2-digit",
  //           second: "2-digit",
  //           hour12: true,
  //         });
  //       }
  //       return value;
  //     },

  //     filterDropdown:
  //       uniqueValues[key]?.length > 0
  //         ? () => (
  //             <div style={{ padding: 8 }}>
  //               {/* Select All Checkbox */}
  //               <div style={{ marginBottom: 8 }}>
  //                 <Checkbox
  //                   indeterminate={
  //                     filters[key]?.length > 0 &&
  //                     filters[key]?.length < uniqueValues[key]?.length
  //                   }
  //                   checked={filters[key]?.length === uniqueValues[key]?.length}
  //                   onChange={(e) => {
  //                     const checked = e.target.checked;
  //                     handleFilterChange(
  //                       checked ? [...uniqueValues[key]] : [],
  //                       key
  //                     );
  //                   }}>
  //                   Select All
  //                 </Checkbox>
  //               </div>

  //               {/* Multi Select Dropdown */}
  //               <Select
  //                 mode="multiple"
  //                 allowClear
  //                 showSearch
  //                 placeholder={`Select ${columnHeadings[key]}`}
  //                 style={{ width: 250 }}
  //                 value={filters[key] || []}
  //                 onChange={(value) => handleFilterChange(value, key)}
  //                 optionLabelProp="label"
  //                 maxTagCount="responsive"
  //                 filterOption={(input, option) =>
  //                   (option?.label ?? "")
  //                     .toString()
  //                     .toLowerCase()
  //                     .includes(input.toLowerCase())
  //                 }>
  //                 {[...uniqueValues[key]]
  //                   .filter((val) => val !== null && val !== undefined)
  //                   .map((val) => (
  //                     <Option key={val} value={val} label={val}>
  //                       <Checkbox checked={filters[key]?.includes(val)}>
  //                         {key === "created_at"
  //                           ? new Date(val).toLocaleDateString("en-IN")
  //                           : val}
  //                       </Checkbox>
  //                     </Option>
  //                   ))}
  //               </Select>
  //             </div>
  //           )
  //         : null,

  //     filtered: filters[key]?.length > 0,
  //   }));
  // };

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
          return value;
        },

        // Filters: KEEP YOUR EXISTING CODE
        filterDropdown:
          uniqueValues[key] && uniqueValues[key].length > 0 ? (
            <div style={{ padding: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <Checkbox
                  indeterminate={
                    filters[key]?.length > 0 &&
                    filters[key]?.length < uniqueValues[key]?.length
                  }
                  checked={filters[key]?.length === uniqueValues[key]?.length}
                  onChange={(e) => {
                    handleFilterChange(
                      e.target.checked ? [...uniqueValues[key]] : [],
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
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }>
                {uniqueValues[key].map((val) => (
                  <Option key={val} value={val} label={val}>
                    <Checkbox checked={filters[key]?.includes(val)}>
                      {val}
                    </Checkbox>
                  </Option>
                ))}
              </Select>
            </div>
          ) : null,

        filtered: filters[key]?.length > 0,
      };
    });
  };

  // Action column for Status update select dropdown
  const actionColumn = {
    title: "Action",
    key: "action",
    render: (text, record) => (
      <Tooltip
        title={
          record.prm !== 1
            ? "Status can only be changed when Permission is Allowed"
            : ""
        }>
        <Select
          value={record.adv_res} // ✅ controlled by actual DB value
          style={{ width: 160 }}
          onChange={(value) => {
            if (value === "shared") {
              // ✅ open modal but revert dropdown visually
              setSelectedRequestId(record.id);
              fetchCampaignList();
              setShareModalVisible(true);
            } else {
              handleStatusUpdate(record.id, value);
            }
          }}
          disabled={record.prm !== 1}>
          {statuses.map((status) => (
            <Option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Option>
          ))}
        </Select>
      </Tooltip>
    ),
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
      console.log("🚀 Updated Record:", updatedRecord);
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

      // ✅ Replace message.success with Swal
      Swal.fire({
        icon: "success",
        title: "Status Updated!",
        text: `✅ Status changed to "${status.toUpperCase()}" successfully.`,
        showConfirmButton: false,
        timer: 2000,
      });

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

    try {
      const res = await axios.post(
        `${apiUrl}/api/campaigns/copy/${selectedCampaignId}`,
        { user_id: userId }
      );
      // ✅ Dynamic sender (logged-in user)
      const senderName = username; // from Redux
      const sharedCampaign = res.data?.campaignName || "Unknown Campaign";
      // ✅ Find receiver (advertiser name)
      // you already have `selectedRequestId` — use it to find the record
      const sharedRecord = requests.find((r) => r.id === selectedRequestId);
      const receiverName = sharedRecord?.adv_name || "Unknown Advertiser";

      // 📨 Send notification dynamically
      await createNotification({
        sender: senderName, // resolved to sender_id internally
        receiver: receiverName, // resolved to receiver_id internally
        type: "status_update",
        message: `📢 ${senderName} updated status of campaign "${sharedCampaign}" → SHARED`,
        url: "/makerequest",
      });
      if (res.data?.success) {
        // ✅ Show success alert
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: res.data.message || "✅ Campaign shared successfully!",
          showConfirmButton: false,
          timer: 2000,
        });

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
              label={`${c.id} / ${c.campaign_name}`}>
              {`${c.id} / ${c.campaign_name}`}
            </Select.Option>
          ))}
        </Select>
      </Modal>

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg p-5 mb-6 flex flex-wrap items-end justify-between gap-4 md:gap-6 lg:gap-4">
        {/* Left Section - Search + Filters */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Search Input */}
          <Input
            placeholder="Search across all fields..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="w-[260px] px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            prefix={<span className="text-gray-400">🔍</span>}
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

// import React, { useEffect, useState, useMemo } from "react";
// import {
//   Table,
//   Button,
//   Input,
//   Select,
//   Checkbox,
//   Tooltip,
//   message,
//   Modal,
// } from "antd";
// import { PushpinFilled, PushpinOutlined } from "@ant-design/icons";
// import axios from "axios";
// import { subscribeToNotifications } from "../Publisher/Socket";
// import { useSelector } from "react-redux";
// import Swal from "sweetalert2";
// import { exportToExcel } from "../exportExcel";

// const { Option } = Select;

// const apiUrl = "https://apii.clickorbits.in";

// const statuses = [
//   "waiting",
//   "shared",
//   "rejected",
//   "Handshake Pending",
//   "in-use",
//   "poor performance",
// ];

// const columnHeadings = {
//   pub_name: "Publisher",
//   campaign_name: "Campaign",
//   note: "Note",
//   adv_name: "Advertiser",
//   payout: "PUB Payout $",
//   os: "OS",
//   pid: "PID",
//   pub_id: "PUB ID",
//   geo: "Geo",
//   priority: "Priority",
//   created_at: "Created At",
// };

// const NewRequest = () => {
//   const user = useSelector((state) => state.auth.user);
//   const username = user?.username || null;
//   const userId = user?.id;
//   const [requests, setRequests] = useState([]);
//   const [searchText, setSearchText] = useState("");
//   const [filters, setFilters] = useState({});
//   const [campaignList, setCampaignList] = useState([]);
//   const [selectedCampaignId, setSelectedCampaignId] = useState(null);
//   const [shareModalVisible, setShareModalVisible] = useState(false);
//   const [selectedRequestId, setSelectedRequestId] = useState(null);

//   // ✅ Fetch campaigns list (for shared popup)
//   const fetchCampaignList = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/api/campaigns_list`);
//       console.log(res);
//       if (res.data && Array.isArray(res.data)) {
//         // Filter out campaigns with null names
//         const validCampaigns = res.data.filter(
//           (c) => c.campaign_name && c.campaign_name.trim() !== ""
//         );
//         setCampaignList(validCampaigns);
//       } else {
//         setCampaignList([]);
//       }
//     } catch (err) {
//       console.error(err);
//       message.error("Failed to fetch campaign list");
//     }
//   };

//   const clearAllFilters = () => {
//     setFilters({});
//   };

//   useEffect(() => {
//     fetchRequests();
//     subscribeToNotifications((data) => {
//       if (data?.id !== null) {
//         fetchRequests();
//       }
//     });
//   }, []);

//   const fetchRequests = async () => {
//     try {
//       const res = await axios.get(`${apiUrl}/PrmadvRequests`);
//       const result = res.data?.data;
//       let sortedData = (Array.isArray(result) ? result : []).sort(
//         (a, b) => b.id - a.id
//       );
//       if (user?.role === "advertiser") {
//         sortedData = sortedData.filter(
//           (item) => item.adv_name === user.username
//         );
//       }
//       setRequests(sortedData);
//     } catch (error) {
//       message.error("Failed to fetch requests");
//       setRequests([]);
//     }
//   };

//   // Get unique values for filters
//   const uniqueValues = useMemo(() => {
//     const values = {};
//     requests.forEach((item) => {
//       Object.keys(columnHeadings).forEach((key) => {
//         if (!values[key]) values[key] = new Set();
//         if (item[key] !== null && item[key] !== undefined)
//           values[key].add(item[key]);
//       });
//     });
//     Object.keys(values).forEach((key) => {
//       values[key] = Array.from(values[key]);
//     });
//     return values;
//   }, [requests]);

//   const handleFilterChange = (value, key) => {
//     setFilters((prev) => ({
//       ...prev,
//       [key]: value,
//     }));
//   };

//   const filteredRequests = useMemo(() => {
//     return requests.filter((item) => {
//       const matchesSearch = Object.values(item).some((val) =>
//         String(val).toLowerCase().includes(searchText.toLowerCase())
//       );
//       if (!matchesSearch) return false;

//       for (const [key, selected] of Object.entries(filters)) {
//         if (selected && selected.length > 0 && !selected.includes(item[key])) {
//           return false;
//         }
//       }
//       return true;
//     });
//   }, [requests, filters, searchText]);

//   // ✅ Handle Status Update
//   const handleStatusUpdate = async (id, status) => {
//     if (status === "shared") {
//       setSelectedRequestId(id);
//       await fetchCampaignList();
//       setShareModalVisible(true);
//       return;
//     }

//     try {
//       await axios.put(`${apiUrl}/updateAdvRes`, {
//         id,
//         adv_res: status,
//       });
//       fetchRequests();
//     } catch (error) {
//       Swal.fire({
//         icon: "error",
//         title: "Oops...",
//         text: "Failed to update status",
//       });
//     }
//   };

//   // ✅ Handle Shared Campaign Selection and Copy
//   const handleShareConfirm = async () => {
//     if (!selectedCampaignId) {
//       message.warning("Please select a campaign first");
//       return;
//     }

//     try {
//       const res = await axios.post(
//         `${apiUrl}/api/campaigns/copy/${selectedCampaignId}`,
//         { user_id: userId }
//       );

//       if (res.data?.success) {
//         message.success(res.data.message || "Campaign shared successfully!");

//         // Update status to shared after success
//         await axios.put(`${apiUrl}/updateAdvRes`, {
//           id: selectedRequestId,
//           adv_res: "shared",
//         });

//         setShareModalVisible(false);
//         setSelectedCampaignId(null);
//         setSelectedRequestId(null);
//         fetchRequests();
//       }
//     } catch (err) {
//       console.error(err);
//       message.error("Failed to share campaign");
//     }
//   };

//   // Columns setup
//   const getColumns = (columnHeadings) => {
//     return Object.keys(columnHeadings).map((key) => ({
//       title: (
//         <div className="flex items-center justify-between">
//           <span
//             style={{
//               color: filters[key]?.length > 0 ? "#1677ff" : "inherit",
//               fontWeight: filters[key]?.length > 0 ? "bold" : "normal",
//             }}>
//             {columnHeadings[key]}
//           </span>
//         </div>
//       ),
//       key,
//       dataIndex: key,
//       render: (value) => {
//         if (key === "created_at" && value) {
//           const date = new Date(value);
//           return date.toLocaleString("en-IN", {
//             year: "numeric",
//             month: "short",
//             day: "2-digit",
//             hour: "2-digit",
//             minute: "2-digit",
//             second: "2-digit",
//             hour12: true,
//           });
//         }
//         return value;
//       },
//     }));
//   };

//   const actionColumn = {
//     title: "Action",
//     key: "action",
//     render: (text, record) => (
//       <Tooltip
//         title={
//           record.prm !== 1
//             ? "Status can only be changed when Permission is Allowed"
//             : ""
//         }>
//         <Select
//           defaultValue={record.adv_res}
//           style={{ width: 160 }}
//           onChange={(value) => handleStatusUpdate(record.id, value)}
//           disabled={record.prm !== 1}>
//           {statuses.map((status) => (
//             <Option key={status} value={status}>
//               {status.charAt(0).toUpperCase() + status.slice(1)}
//             </Option>
//           ))}
//         </Select>
//       </Tooltip>
//     ),
//   };

//   return (
//     <div className="p-6 max-w-full bg-gray-50 rounded-lg shadow-lg">
//       <h2 className="text-2xl font-bold mb-6 text-gray-900">
//         All Campaign Requests
//       </h2>

//       {/* Campaign Share Modal */}
//       <Modal
//         title="Select Campaign to Share"
//         open={shareModalVisible}
//         onOk={handleShareConfirm}
//         onCancel={() => {
//           setShareModalVisible(false);
//           setSelectedCampaignId(null);
//         }}
//         okText="Share"
//         cancelText="Cancel">
//         <Select
//           showSearch
//           placeholder="Select a Campaign"
//           style={{ width: "100%" }}
//           value={selectedCampaignId}
//           onChange={(val) => setSelectedCampaignId(val)}
//           filterOption={(input, option) =>
//             option?.label.toLowerCase().includes(input.toLowerCase())
//           }
//           optionLabelProp="label">
//           {campaignList.map((c) => (
//             <Option key={c.id} value={c.id} label={c.campaign_name}>
//               {c.campaign_name}
//             </Option>
//           ))}
//         </Select>
//       </Modal>

//       {/* Top Bar */}
//       <div className="flex flex-wrap items-center justify-start gap-4 mb-6">
//         <Button
//           type="primary"
//           onClick={() => {
//             const tableDataToExport = filteredRequests.map((item) => {
//               const filteredItem = {};
//               Object.keys(columnHeadings).forEach((key) => {
//                 filteredItem[columnHeadings[key]] = item[key];
//               });
//               return filteredItem;
//             });
//             exportToExcel(tableDataToExport, "advertiser-data.xlsx");
//           }}>
//           📥 Download Excel
//         </Button>

//         <Button onClick={clearAllFilters}>Remove All Filters</Button>

//         <Input
//           placeholder="Search across all fields..."
//           value={searchText}
//           onChange={(e) => setSearchText(e.target.value)}
//           allowClear
//           style={{ maxWidth: 300 }}
//         />
//       </div>

//       <div className="overflow-auto border border-gray-300 rounded-lg shadow-sm">
//         <Table
//           dataSource={filteredRequests}
//           columns={[...getColumns(columnHeadings), actionColumn]}
//           rowKey="id"
//           scroll={{ x: "max-content" }}
//           pagination={{
//             pageSizeOptions: ["10", "20", "50", "100"],
//             showSizeChanger: true,
//             defaultPageSize: 10,
//           }}
//         />
//       </div>
//     </div>
//   );
// };

// export default NewRequest;
