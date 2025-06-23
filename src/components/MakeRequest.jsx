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
import { exportToExcel } from "./exportExcel";
import axios from "axios";
import { subscribeToNotifications } from "./Socket";
import { useSelector } from "react-redux";
import { AutoComplete } from "antd";
const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in";
const apiUrl1 =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";
const columnHeadings = {
  pub_name: "Publisher",
  campaign_name: "Campaign",
  payout: "PUB Payout $",
  os: "OS",
  pid: "PID",
  pub_id: "PUB ID",
  geo: "Geo",
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
  const [selectedSubAdmins, setSelectedSubAdmins] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  console.log(requests);
  const [filters, setFilters] = useState({});
  const clearAllFilters = () => {
    setFilters({});
  };
  const assignedSubAdmins = useMemo(
    () => user?.assigned_subadmins || [],
    [user]
  );

  // 🚀 Fetch SubAdmins (for dropdown)
  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const { data } = await axios.get(`${apiUrl1}/get-subadmin`);
        if (data.success) {
          const filtered = data.data
            .filter((s) => assignedSubAdmins.includes(s.id))
            .map((s) => ({ value: s.id, label: s.username, role: s.role }));
          setSubAdmins(filtered);
        }
      } catch (error) {
        console.error("Error fetching sub-admins:", error);
      }
    };

    if (assignedSubAdmins.length > 0) fetchSubAdmins();
  }, [assignedSubAdmins]);

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
      message.error("Failed to load advertiser names");
    }
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

  // 🚀 Fetch Requests - Based on Role & Selection
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        let usernamesToFetch = [];

        if (userRole === "publisher_manager" && selectedSubAdmins.length > 0) {
          usernamesToFetch = selectedSubAdmins;
        } else if (username) {
          usernamesToFetch = [username];
        }

        if (usernamesToFetch.length === 0) {
          setRequests([]);
          return;
        }

        const results = await Promise.all(
          usernamesToFetch.map(async (u) => {
            const res = await axios.get(`${apiUrl}/getPubRequest/${u}`);
            return res.data?.data || [];
          })
        );

        setRequests(results.flat());
      } catch (err) {
        console.error("Error fetching requests:", err);
        message.error("Failed to load requests");
        setRequests([]);
      }
    };

    fetchRequests();
  }, [username, selectedSubAdmins, userRole]);

  // 🚀 Initial Fetch on Load
  useEffect(() => {
    fetchBlacklistPIDs();
    fetchAdvertisers();
    fetchDropdowns();

    subscribeToNotifications((data) => {
      if (data?.payout !== null) {
        if (userRole === "publisher_manager" && selectedSubAdmins.length > 0) {
          // Re-fetch current subadmin data
          fetchRequests();
        } else {
          // Default re-fetch for logged-in user
          fetchRequests();
        }
      }
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
        </div>
      ),
      key,
      dataIndex: key,

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
      title: "Action",
      key: "action",
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
          {/* Subadmins Dropdown */}
          {user?.role === "publisher_manager" && (
            <Select
              mode="multiple"
              allowClear
              placeholder="Select Subadmins"
              value={selectedSubAdmins}
              onChange={setSelectedSubAdmins}
              onClear={() => setFilters({})}
              className="min-w-[200px] md:min-w-[250px] border border-gray-300 rounded-lg py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition">
              {subAdmins?.map((subAdmin) => (
                <Option key={subAdmin.label} value={subAdmin.label}>
                  {subAdmin.label}
                </Option>
              ))}
            </Select>
          )}
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
        dataSource={filteredRequests}
        columns={[...getColumns(columnHeadings)]}
        pagination={{
          pageSizeOptions: ["10", "20", "50", "100"],
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
