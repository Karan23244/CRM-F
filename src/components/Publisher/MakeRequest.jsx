import React, { useState, useEffect, useMemo } from "react";
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
import axios from "axios";
import { subscribeToNotifications } from "./Socket";
import { PushpinOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { AutoComplete } from "antd";
const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in";
const apiUrl1 =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";
const columnHeadings = {
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
  const clearAllFilters = () => {
    setFilters({});
  };
  // 🚀 Fetch Dropdown Data
  const fetchDropdowns = async () => {
    try {
      const [pidRes, pubRes] = await Promise.all([
        axios.get(`${apiUrl1}/get-pid`),
        axios.get(`${apiUrl1}/get-allpub`),
      ]);
      setDropdownOptions({
        pid: pidRes.data?.data?.map((item) => item.pid) || [],
        pub_id: pubRes.data?.data?.map((item) => item.pub_id) || [],
      });
    } catch (error) {
      message.error("Failed to fetch dropdown options");
    }
  };
  const togglePin = (key) => {
    setPinnedColumns((prev) => {
      let next;
      if (!prev[key]) next = "left"; // not pinned → pin left
      else if (prev[key] === "left") next = "right"; // left → pin right
      else next = null; // right → unpin
      return { ...prev, [key]: next };
    });
  };

  // 🚀 Fetch Advertisers
  const fetchAdvertisers = async () => {
    try {
      const { data } = await axios.get(`${apiUrl1}/get-subadmin`);

      const names =
        data?.data
          ?.filter((a) => ["advertiser_manager", "advertiser"].includes(a.role))
          .map((a) => a.username) || [];

      setAdvertisers(names);
    } catch (error) {
      console.error("Error fetching advertisers:", error);
      message.error("Failed to load advertiser names");
    }
  };

  // 🚀 Fetch Blacklist PIDs
  const fetchBlacklistPIDs = async () => {
    try {
      const { data } = await axios.get(`${apiUrl1}/get-blacklist`);
      const list = data?.map((item) => item.blacklistID) || [];
      setBlacklistPIDs(list);
    } catch (error) {
      console.error("Failed to fetch blacklist PIDs:", error);
    }
  };
  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getAllPubRequests`);
      // Sort by id DESC (newest first)
      const sortedData = (res.data?.data || []).sort((a, b) => b.id - a.id);
      console.log(sortedData);
      setRequests(sortedData);
    } catch (err) {
      console.error("Error fetching requests:", err);
      message.error("Failed to load requests");
      setRequests([]);
    }
  };

  // 🚀 Initial Fetch on Load
  useEffect(() => {
    fetchBlacklistPIDs();
    fetchDropdowns();
    fetchAdvertisers();
    subscribeToNotifications((data) => {
      fetchRequests();
    });
  }, []);

  // 🔍 Filtered Requests
  const filteredRequests = useMemo(() => {
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
  const showModal = () => {
    setIsModalVisible(true);
  };

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

  const uniqueValues = useMemo(() => {
    const values = {};
    requests.forEach((item) => {
      // normal columns
      Object.keys(columnHeadings).forEach((key) => {
        if (!values[key]) values[key] = new Set();
        if (item[key] !== null && item[key] !== undefined) {
          values[key].add(item[key]);
        }
      });

      // ✅ include adv_res manually
      if (!values["adv_res"]) values["adv_res"] = new Set();
      if (item.adv_res !== null && item.adv_res !== undefined) {
        values["adv_res"].add(item.adv_res);
      }
    });

    // convert sets → arrays
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
  // 🚀 Update Permission/Priority
  const handleUpdatePrm = async (record, values) => {
    try {
      const payload = {
        id: record.id,
        campaign_name: record.campaign_name,
        pid: record.pid,
        priority: values.priority,
        prm: values.prm,
      };

      console.log("Updating record:", payload); // Debugging payload

      const res = await axios.put(`${apiUrl}/updatePubprm`, payload);
      console.log("Update response:", res.data); // Debugging response

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data.message || "Updated successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchRequests(); // refresh table
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data.message || "Update failed",
        });
      }
    } catch (err) {
      console.error("Update error:", err);

      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: err.response?.data?.message || "Failed to update record",
      });
    }
  };

  // Compose columns with filterDropdown, filter icon state, and sticky column pin button
  const getColumns = (columnHeadings) => {
    const columns = Object.keys(columnHeadings).map((key) => ({
      title: (
        <div className="flex items-center justify-between">
          <span
            style={{
              color: filters[key]?.length > 0 ? "#1677ff" : "inherit",
              fontWeight: filters[key]?.length > 0 ? "bold" : "normal",
              cursor: "pointer",
              userSelect: "none",
            }}>
            {columnHeadings[key] || key}
          </span>
          <PushpinOutlined
            onClick={() => togglePin(key)}
            rotate={pinnedColumns[key] === "right" ? 180 : 0} // rotate if pinned right
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
      filterDropdown:
        uniqueValues[key]?.length > 0
          ? () => (
              <div style={{ padding: 8 }}>
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
                      <Option key={val} value={val} label={val}>
                        <Checkbox checked={filters[key]?.includes(val)}>
                          {val}
                        </Checkbox>
                      </Option>
                    ))}
                </Select>
              </div>
            )
          : null,

      filtered: filters[key]?.length > 0,
    }));

    // Add Action column at the end
    columns.push({
      title: (
        <div className="flex items-center justify-between">
          <span
            style={{
              color: filters["adv_res"]?.length > 0 ? "#1677ff" : "inherit",
              fontWeight: filters["adv_res"]?.length > 0 ? "bold" : "normal",
              cursor: "pointer",
              userSelect: "none",
            }}>
            Action
          </span>
          <PushpinOutlined
            onClick={() => togglePin("adv_res")}
            rotate={pinnedColumns["adv_res"] === "right" ? 180 : 0}
            style={{
              color: pinnedColumns["adv_res"] ? "#1677ff" : "#aaa",
              cursor: "pointer",
            }}
          />
        </div>
      ),
      key: "action",
      dataIndex: "adv_res",
      fixed: pinnedColumns["adv_res"] || undefined,

      filterDropdown:
        uniqueValues["adv_res"]?.length > 0
          ? () => (
              <div style={{ padding: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <Checkbox
                    indeterminate={
                      filters["adv_res"]?.length > 0 &&
                      filters["adv_res"]?.length <
                        uniqueValues["adv_res"]?.length
                    }
                    checked={
                      filters["adv_res"]?.length ===
                      uniqueValues["adv_res"]?.length
                    }
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleFilterChange(
                        checked ? [...uniqueValues["adv_res"]] : [],
                        "adv_res"
                      );
                    }}>
                    Select All
                  </Checkbox>
                </div>
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  placeholder={`Select Action`}
                  style={{ width: 250 }}
                  value={filters["adv_res"] || []}
                  onChange={(value) => handleFilterChange(value, "adv_res")}
                  optionLabelProp="label"
                  maxTagCount="responsive"
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toString()
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }>
                  {[...uniqueValues["adv_res"]]
                    .filter((val) => val !== null && val !== undefined)
                    .map((val) => (
                      <Option key={val} value={val} label={val}>
                        <Checkbox checked={filters["adv_res"]?.includes(val)}>
                          {val.charAt(0).toUpperCase() + val.slice(1)}
                        </Checkbox>
                      </Option>
                    ))}
                </Select>
              </div>
            )
          : null,

      filtered: filters["adv_res"]?.length > 0,

      render: (_, record) => {
        const status = record.adv_res?.toLowerCase();
        let color = "default";
        if (status === "waiting") color = "warning";
        else if (status === "shared") color = "primary";
        else if (status === "rejected") color = "danger";

        return (
          <Button type={color} disabled>
            {status?.charAt(0).toUpperCase() + status?.slice(1) || "N/A"}
          </Button>
        );
      },
    });

    return columns;
  };

  // Priority Column
  const priorityColumn = {
    title: (
      <div className="flex items-center justify-between">
        <span
          style={{
            color: filters["priority"]?.length > 0 ? "#1677ff" : "inherit",
            fontWeight: filters["priority"]?.length > 0 ? "bold" : "normal",
          }}>
          Priority
        </span>
        <PushpinOutlined
          onClick={() => togglePin("priority")}
          rotate={pinnedColumns["priority"] === "right" ? 180 : 0}
          style={{
            color: pinnedColumns["priority"] ? "#1677ff" : "#aaa",
            cursor: "pointer",
          }}
        />
      </div>
    ),
    key: "priority",
    dataIndex: "priority",
    fixed: pinnedColumns["priority"] || undefined,
    filterDropdown: () => {
      const priorities = [...new Set(requests.map((r) => r.priority))];
      return (
        <div style={{ padding: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <Checkbox
              indeterminate={
                filters["priority"]?.length > 0 &&
                filters["priority"]?.length < priorities.length
              }
              checked={filters["priority"]?.length === priorities.length}
              onChange={(e) => {
                const checked = e.target.checked;
                handleFilterChange(checked ? priorities : [], "priority");
              }}>
              Select All
            </Checkbox>
          </div>
          <Select
            mode="multiple"
            allowClear
            showSearch
            style={{ width: 250 }}
            value={filters["priority"] || []}
            onChange={(val) => handleFilterChange(val, "priority")}
            optionLabelProp="label"
            maxTagCount="responsive"
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }>
            {priorities.map((p) => (
              <Option key={p} value={p} label={p}>
                <Checkbox checked={filters["priority"]?.includes(p)}>
                  {p}
                </Checkbox>
              </Option>
            ))}
          </Select>
        </div>
      );
    },
    filtered: filters["priority"]?.length > 0,
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
  };

  // Permission Column
  const permissionColumn = {
    title: (
      <div className="flex items-center justify-between">
        <span
          style={{
            color: filters["prm"]?.length > 0 ? "#1677ff" : "inherit",
            fontWeight: filters["prm"]?.length > 0 ? "bold" : "normal",
          }}>
          Permission
        </span>
        <PushpinOutlined
          onClick={() => togglePin("prm")}
          rotate={pinnedColumns["prm"] === "right" ? 180 : 0}
          style={{
            color: pinnedColumns["prm"] ? "#1677ff" : "#aaa",
            cursor: "pointer",
          }}
        />
      </div>
    ),
    key: "prm",
    dataIndex: "prm",
    fixed: pinnedColumns["prm"] || undefined,
    filterDropdown: () => {
      const permissionValues = [1, 0];
      return (
        <div style={{ padding: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <Checkbox
              indeterminate={
                filters["prm"]?.length > 0 &&
                filters["prm"]?.length < permissionValues.length
              }
              checked={filters["prm"]?.length === permissionValues.length}
              onChange={(e) => {
                const checked = e.target.checked;
                handleFilterChange(checked ? permissionValues : [], "prm");
              }}>
              Select All
            </Checkbox>
          </div>
          <Select
            mode="multiple"
            allowClear
            showSearch
            style={{ width: 250 }}
            value={filters["prm"] || []}
            onChange={(val) => handleFilterChange(val, "prm")}
            optionLabelProp="label"
            maxTagCount="responsive"
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }>
            <Option key={1} value={1} label="✅ Allow">
              <Checkbox checked={filters["prm"]?.includes(1)}>
                ✅ Allow
              </Checkbox>
            </Option>
            <Option key={0} value={0} label="❌ Disallow">
              <Checkbox checked={filters["prm"]?.includes(0)}>
                ❌ Disallow
              </Checkbox>
            </Option>
          </Select>
        </div>
      );
    },
    filtered: filters["prm"]?.length > 0,
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
            handleUpdatePrm(record, {
              priority: record.priority,
              prm: val,
            })
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
  };

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
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: 400,
            maxWidth: "100%",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            borderRadius: 6,
          }}
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
        className="mt-4"
        dataSource={filteredRequests} // show latest data directly
        columns={[
          ...getColumns(columnHeadings),
          priorityColumn,
          permissionColumn,
        ]}
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
