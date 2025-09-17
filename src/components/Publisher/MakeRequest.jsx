import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Checkbox,
  notification,
} from "antd";
import Swal from "sweetalert2";
import { exportToExcel } from "../exportExcel";
import { debounce } from "lodash";
import axios from "axios";
import { subscribeToNotifications } from "./Socket";
import { PushpinOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { AutoComplete } from "antd";
const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in";
const apiUrl1 =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";
const columnHeadingsMap = {
  pub_name: "Publisher",
  adv_name: "Advertiser",
  campaign_name: "Campaign",
  note: "Note",
  payout: "PUB Payout $",
  os: "OS",
  pid: "PID",
  pub_id: "PUB ID",
  geo: "Geo",
  created_at: "Created At",
};
const PublisherRequest = () => {
  const user = useSelector((state) => state.auth.user);
  const username = user?.username || null;
  const userRole = user?.role;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const [requests, setRequests] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [searchText, setSearchText] = useState("");
  const [blacklistPIDs, setBlacklistPIDs] = useState([]);
  const [filters, setFilters] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});

  // ✅ Callbacks to prevent re-creation on each render
  const clearAllFilters = useCallback(() => setFilters({}), []);
  const togglePin = useCallback((key) => {
    setPinnedColumns((prev) => {
      let next;
      if (!prev[key]) next = "left";
      else if (prev[key] === "left") next = "right";
      else next = null;
      return { ...prev, [key]: next };
    });
  }, []);
  const handleFilterChange = useCallback((value, key) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((val) => {
        setSearchText(val);
      }, 400),
    []
  );

  // 🚀 Fetchers
  const fetchDropdowns = useCallback(async () => {
    try {
      const [pidRes, pubRes] = await Promise.all([
        axios.get(`${apiUrl1}/get-pid`),
        axios.get(`${apiUrl1}/get-allpub`),
      ]);
      setDropdownOptions({
        pid: pidRes.data?.data?.map((item) => item.pid) || [],
        pub_id: pubRes.data?.data?.map((item) => item.pub_id) || [],
      });
    } catch {
      message.error("Failed to fetch dropdown options");
    }
  }, [apiUrl1]);

  const fetchAdvertisers = useCallback(async () => {
    try {
      const { data } = await axios.get(`${apiUrl1}/get-subadmin`);
      const names =
        data?.data
          ?.filter((a) => ["advertiser_manager", "advertiser"].includes(a.role))
          .map((a) => a.username) || [];
      setAdvertisers(names);
    } catch {
      message.error("Failed to load advertiser names");
    }
  }, [apiUrl1]);

  const fetchBlacklistPIDs = useCallback(async () => {
    try {
      const { data } = await axios.get(`${apiUrl1}/get-blacklist`);
      setBlacklistPIDs(data?.map((item) => item.blacklistID) || []);
    } catch {
      console.error("Failed to fetch blacklist PIDs");
    }
  }, [apiUrl1]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/getAllPubRequests`);
      const sortedData = (res.data?.data || []).sort((a, b) => b.id - a.id);
      setRequests(sortedData);
    } catch {
      message.error("Failed to load requests");
      setRequests([]);
    }
  }, [apiUrl]);
  const showModal = () => {
    setIsModalVisible(true);
  };
  // 🚀 Initial Load
  useEffect(() => {
    fetchBlacklistPIDs();
    fetchDropdowns();
    fetchAdvertisers();
    subscribeToNotifications(() => fetchRequests());
  }, [
    fetchBlacklistPIDs,
    fetchDropdowns,
    fetchAdvertisers,
    fetchRequests,
    subscribeToNotifications,
  ]);

  // 🔍 Filtered Requests
  const filteredRequests = useMemo(() => {
    if (!requests.length) return [];
    return requests.filter((item) => {
      const matchesSearch = Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchText.toLowerCase())
      );
      if (!matchesSearch) return false;

      for (const [key, selected] of Object.entries(filters)) {
        if (selected?.length && !selected.includes(item[key])) {
          return false;
        }
      }
      return true;
    });
  }, [requests, filters, searchText]);

  // ✅ Unique filter values
  const uniqueValues = useMemo(() => {
    const values = {};
    for (const item of requests) {
      for (const key of Object.keys(columnHeadingsMap)) {
        if (!values[key]) values[key] = new Set();
        if (item[key] !== null && item[key] !== undefined) {
          values[key].add(item[key]);
        }
      }
      if (!values["adv_res"]) values["adv_res"] = new Set();
      if (item.adv_res !== null && item.adv_res !== undefined) {
        values["adv_res"].add(item.adv_res);
      }
    }
    return Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, [...v]])
    );
  }, [requests, columnHeadingsMap]);

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };
  const handleOk = async () => {
    try {
      setIsSubmitting(true);
      const values = await form.validateFields();

      // ⛔ Check if the PID is blacklisted
      if (blacklistPIDs.includes(values.pid)) {
        Swal.fire({
          icon: "error",
          title: "Submission Blocked",
          text: `The selected PID "${values.pid}" is blacklisted and cannot be submitted.`,
        });
        return; // prevent submission
      }

      const requestData = {
        adv_name: values.advertiserName,
        pub_name: username,
        campaign_name: values.campaignName,
        payout: values.payout,
        os: values.os,
        pid: values.pid,
        pub_id: values.pub_id,
        geo: values.geo,
        note: values.note,
      };

      const response = await axios.post(`${apiUrl}/addPubRequest`, requestData);

      if (response.status === 201) {
        const newRequest = {
          key: Date.now(),
          advertiserName: values.advertiserName,
          campaignName: values.campaignName,
          payout: values.payout,
          os: values.os,
          link: "Pending",
        };
        setRequests([...requests, newRequest]);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Request submitted successfully!",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to submit request!",
        });
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: "Failed to submit request",
      });
      console.error(error);
    } finally {
      setIsSubmitting(false); // re-enable button
    }
  };

  // 🚀 Update Permission / Priority
  const handleUpdatePrm = useCallback(
    async (record, values) => {
      try {
        const payload = {
          id: record.id,
          campaign_name: record.campaign_name,
          pid: record.pid,
          priority: values.priority,
          prm: values.prm,
        };

        const res = await axios.put(`${apiUrl}/updatePubprm`, payload);

        if (res.data?.success) {
          // Update only the specific row in local state
          setRequests((prev) =>
            prev.map((item) =>
              item.id === record.id
                ? { ...item, priority: values.priority, prm: values.prm }
                : item
            )
          );

          Swal.fire({
            icon: "success",
            title: "Success",
            text: res.data.message || "Updated successfully",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: res.data.message || "Update failed",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Server Error",
          text: "Failed to update record",
        });
      }
    },
    [apiUrl]
  );

  // ✅ Optimized Columns (with Priority & Permission merged)
  // const columns = useMemo(() => {
  //   const baseCols = Object.keys(columnHeadingsMap).map((key) => ({
  //     title: (
  //       <div className="flex items-center justify-between">
  //         <span
  //           style={{
  //             color: filters[key]?.length > 0 ? "#1677ff" : "inherit",
  //             fontWeight: filters[key]?.length > 0 ? "bold" : "normal",
  //           }}>
  //           {columnHeadingsMap[key] || key}
  //         </span>
  //         <PushpinOutlined
  //           onClick={() => togglePin(key)}
  //           rotate={pinnedColumns[key] === "right" ? 180 : 0}
  //           style={{
  //             color: pinnedColumns[key] ? "#1677ff" : "#aaa",
  //             cursor: "pointer",
  //           }}
  //         />
  //       </div>
  //     ),
  //     key,
  //     dataIndex: key,
  //     fixed: pinnedColumns[key] || undefined,
  //     render: (value) =>
  //       key === "created_at" ? new Date(value).toLocaleString("en-IN") : value,
  //     filterDropdown:
  //       uniqueValues[key]?.length > 0
  //         ? () => (
  //             <div style={{ padding: 8 }}>
  //               <Select
  //                 mode="multiple"
  //                 allowClear
  //                 style={{ width: 250 }}
  //                 value={filters[key] || []}
  //                 onChange={(v) => handleFilterChange(v, key)}>
  //                 {uniqueValues[key]
  //                   ?.slice() // create a copy to avoid mutating original
  //                   .sort((a, b) => a.localeCompare(b)) // alphabetical order
  //                   .map((val) => (
  //                     <Option key={val} value={val}>
  //                       {val}
  //                     </Option>
  //                   ))}
  //               </Select>
  //             </div>
  //           )
  //         : null,
  //     filtered: filters[key]?.length > 0,
  //   }));

  //   // Priority column
  //   baseCols.push({
  //     title: "Priority",
  //     key: "priority",
  //     dataIndex: "priority",
  //     fixed: pinnedColumns["priority"] || undefined,
  //     render: (_, record) =>
  //       userRole === "publisher_manager" ? (
  //         <Select
  //           value={record.priority}
  //           style={{ width: 80 }}
  //           onChange={(val) =>
  //             handleUpdatePrm(record, { priority: val, prm: record.prm })
  //           }>
  //           {Array.from({ length: 15 }, (_, i) => (
  //             <Option key={i + 1} value={i + 1}>
  //               {i + 1}
  //             </Option>
  //           ))}
  //         </Select>
  //       ) : (
  //         record.priority || "N/A"
  //       ),
  //   });

  //   // Permission column
  //   baseCols.push({
  //     title: "Permission",
  //     key: "prm",
  //     dataIndex: "prm",
  //     fixed: pinnedColumns["prm"] || undefined,
  //     render: (_, record) =>
  //       userRole === "publisher_manager" ? (
  //         <Select
  //           value={record.prm}
  //           style={{
  //             width: 120,
  //             fontWeight: 600,
  //             backgroundColor: record.prm === 1 ? "#e6ffed" : "#ffe6e6",
  //             color: record.prm === 1 ? "green" : "red",
  //           }}
  //           onChange={(val) =>
  //             handleUpdatePrm(record, { priority: record.priority, prm: val })
  //           }>
  //           <Option value={1}>✅ Allow</Option>
  //           <Option value={0}>❌ Disallow</Option>
  //         </Select>
  //       ) : (
  //         <span
  //           style={{
  //             color: record.prm === 1 ? "green" : "red",
  //             fontWeight: 600,
  //           }}>
  //           {record.prm === 1 ? "✅ Allow" : "❌ Disallow"}
  //         </span>
  //       ),
  //   });

  //   return baseCols;
  // }, [
  //   filters,
  //   pinnedColumns,
  //   togglePin,
  //   uniqueValues,
  //   userRole,
  //   handleFilterChange,
  //   handleUpdatePrm,
  // ]);
  const buildColumns = ({
    filters,
    pinnedColumns,
    togglePin,
    uniqueValues,
    userRole,
    handleFilterChange,
    handleUpdatePrm,
  }) => {
    const cols = Object.keys(columnHeadingsMap).map((key) => ({
      title: (
        <div className="flex items-center justify-between">
          <span
            style={{
              color: filters[key]?.length > 0 ? "#1677ff" : "inherit",
              fontWeight: filters[key]?.length > 0 ? "bold" : "normal",
            }}>
            {columnHeadingsMap[key] || key}
          </span>
          <PushpinOutlined
            onClick={() => togglePin(key)}
            rotate={pinnedColumns[key] === "right" ? 180 : 0}
            style={{
              color: pinnedColumns[key] ? "#1677ff" : "#aaa",
              cursor: "pointer",
            }}
          />
        </div>
      ),
      key,
      dataIndex: key,
      fixed: pinnedColumns[key] || undefined,
      render: (value) =>
        key === "created_at" ? new Date(value).toLocaleString("en-IN") : value,
      filterDropdown:
        uniqueValues[key]?.length > 0
          ? () => (
              <div style={{ padding: 8 }}>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: 250 }}
                  value={filters[key] || []}
                  onChange={(v) => handleFilterChange(v, key)}>
                  {uniqueValues[key]
                    .slice()
                    .sort((a, b) => a.localeCompare(b))
                    .map((val) => (
                      <Option key={val} value={val}>
                        {val}
                      </Option>
                    ))}
                </Select>
              </div>
            )
          : null,
      filtered: filters[key]?.length > 0,
    }));

    cols.push(
      {
        title: "Priority",
        key: "priority",
        dataIndex: "priority",
        fixed: pinnedColumns["priority"] || undefined,
        render: (_, record) =>
          userRole === "publisher_manager" ? (
            <Select
              value={record.priority}
              style={{ width: 80 }}
              onChange={(val) =>
                handleUpdatePrm(record, { priority: val, prm: record.prm })
              }>
              {Array.from({ length: 15 }, (_, i) => (
                <Option key={i + 1} value={i + 1}>
                  {i + 1}
                </Option>
              ))}
            </Select>
          ) : (
            record.priority || "N/A"
          ),
      },
      {
        title: "Permission",
        key: "prm",
        dataIndex: "prm",
        fixed: pinnedColumns["prm"] || undefined,
        render: (_, record) =>
          userRole === "publisher_manager" ? (
            <Select
              value={record.prm}
              style={{
                width: 120,
                fontWeight: 600,
                backgroundColor: record.prm === 1 ? "#e6ffed" : "#ffe6e6",
                color: record.prm === 1 ? "green" : "red",
              }}
              onChange={(val) =>
                handleUpdatePrm(record, { priority: record.priority, prm: val })
              }>
              <Option value={1}>✅ Allow</Option>
              <Option value={0}>❌ Disallow</Option>
            </Select>
          ) : (
            <span
              style={{
                color: record.prm === 1 ? "green" : "red",
                fontWeight: 600,
              }}>
              {record.prm === 1 ? "✅ Allow" : "❌ Disallow"}
            </span>
          ),
      }
    );

    return cols;
  };

  const columns = useMemo(
    () =>
      buildColumns({
        filters,
        pinnedColumns,
        togglePin,
        uniqueValues,
        userRole,
        handleFilterChange,
        handleUpdatePrm,
      }),
    [
      filters,
      pinnedColumns,
      uniqueValues,
      userRole,
      handleFilterChange,
      handleUpdatePrm,
    ]
  );

  return (
    <div className="p-4">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: 20,
        }}>
        <div>
          <Button type="primary" onClick={showModal}>
            ➕ Request New Campaign Link
          </Button>
          <Button
            onClick={clearAllFilters}
            type="default"
            className="bg-gray-200 ml-5 hover:bg-gray-300 text-gray-700 font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400">
            Remove All Filters
          </Button>
          <Button
            type="primary"
            onClick={() => {
              const tableDataToExport = filteredRequests.map((item) => {
                const filteredItem = {};
                Object.keys(columnHeadings).forEach((key) => {
                  filteredItem[columnHeadings[key]] = item[key]; // Custom column names
                });
                return filteredItem;
              });
              exportToExcel(tableDataToExport, "advertiser-data.xlsx");
            }}
            className="flex items-center gap-2 ml-5 mr-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500">
            📥 <span>Download Excel</span>
          </Button>
        </div>

        <Input.Search
          placeholder="Search by Advertiser, Campaign, PID, etc."
          allowClear
          enterButton
          onChange={(e) => debouncedSearch(e.target.value)}
          style={{ width: 400, maxWidth: "100%", borderRadius: 6 }}
        />
      </div>

      <Modal
        title="Request New Link"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={isSubmitting ? "Processing..." : "Submit"}
        confirmLoading={isSubmitting}>
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Advertiser Name"
            name="advertiserName"
            rules={[
              { required: true, message: "Please select an advertiser" },
            ]}>
            <Select placeholder="Select Advertiser">
              {advertisers.map((name, index) => (
                <Option key={index} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Campaign Name"
            name="campaignName"
            rules={[{ required: true, message: "Please enter campaign name" }]}>
            <Input placeholder="Enter campaign name" />
          </Form.Item>
          <Form.Item label="Note" name="note" rules={[{ required: false }]}>
            <Input.TextArea placeholder="Enter note (optional)" rows={3} />
          </Form.Item>
          <Form.Item
            label="Payout"
            name="payout"
            rules={[
              { required: true, message: "Please enter payout amounts" },
            ]}>
            <Input
              style={{ width: "100%" }}
              placeholder="Enter payout values (e.g., 100, 200, 300)"
            />
          </Form.Item>

          <Form.Item
            label="OS"
            name="os"
            rules={[{ required: true, message: "Please select an OS" }]}>
            <Select placeholder="Select OS">
              <Option value="Android">Android</Option>
              <Option value="iOS">iOS</Option>
              <Option value="apk">apk</Option>
              <Option value="both">Both</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Geo"
            name="geo"
            rules={[{ required: true, message: "Please enter geo location" }]}>
            <Input placeholder="Enter Geo (e.g., US, IN, UK)" />
          </Form.Item>

          <Form.Item
            label="PID"
            name="pid"
            rules={[
              { required: true, message: "Please enter or select a PID" },
            ]}>
            <AutoComplete
              options={dropdownOptions.pid?.map((pid) => ({ value: pid }))}
              placeholder="Enter or select PID"
              filterOption={(inputValue, option) =>
                option.value.toLowerCase().includes(inputValue.toLowerCase())
              }
              onChange={(value) => {
                if (blacklistPIDs.includes(value)) {
                  Swal.fire({
                    icon: "warning",
                    title: "Blacklisted PID",
                    text: `The PID "${value}" is blacklisted.`,
                  });
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label="PUB ID"
            name="pub_id"
            rules={[
              { required: true, message: "Please enter or select a PUB ID" },
            ]}>
            <AutoComplete
              options={dropdownOptions.pub_id?.map((pubId) => ({
                value: pubId,
              }))}
              placeholder="Enter or select PUB ID"
              filterOption={(inputValue, option) =>
                option.value.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>
      <Table
        rowKey="id"
        className="mt-4"
        dataSource={filteredRequests} // show latest data directly
        columns={columns}
        scroll={{ x: "max-content" }}
        pagination={{
          pageSizeOptions: ["10", "20", "50", "100", "200", "300", "500"],
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
      />
    </div>
  );
};

export default PublisherRequest;
