import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  notification,
} from "antd";
import axios from "axios";
import { subscribeToNotifications } from "./Socket";
import { useSelector } from "react-redux";
import { AutoComplete } from "antd";
const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in";
const apiUrl1 =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";
const PublisherRequest = () => {
  const user = useSelector((state) => state.auth.user);
  const username = user?.username || null;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [requests, setRequests] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [searchText, setSearchText] = useState("");
  const [filteredRequests, setFilteredRequests] = useState([]);

  console.log(dropdownOptions);
  useEffect(() => {
    fetchAdvertisers();
    fetchRequests();
    fetchDropdowns();

    // Socket notification setup
    subscribeToNotifications((data) => {
      console.log(data);
      if (data?.payout !== null) {
        fetchRequests(); // Optional: refresh data
      }
    });
  }, []);
  useEffect(() => {
    const filtered = requests.filter((item) =>
      Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
    setFilteredRequests(filtered);
  }, [requests, searchText]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getPubRequest/${username}`);
      setRequests(res.data?.data || []);
    } catch (error) {
      message.error("Failed to fetch requests");
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [pid, pub_id] = await Promise.all([
        axios.get(`${apiUrl1}/get-pid`),
        axios.get(`${apiUrl1}/get-allpub`),
      ]);
      setDropdownOptions((prev) => ({
        ...prev,
        pid: pid.data?.data?.map((item) => item.pid) || [],
        pub_id: pub_id.data?.data?.map((item) => item.pub_id) || [],
      }));
    } catch (error) {
      message.error("Failed to fetch dropdown options");
    }
  };

  const fetchAdvertisers = async () => {
    try {
      const advmName = await axios.get(`${apiUrl1}/get-subadmin`);
      const filteredNames =
        advmName.data?.data
          ?.filter(
            (item) =>
              item.role === "advertiser_manager" || item.role === "advertiser"
          )
          .map((item) => item.username) || [];
      setAdvertisers(filteredNames);
    } catch (error) {
      message.error("Failed to load advertiser names");
      console.error(error);
    }
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const requestData = {
        adv_name: values.advertiserName,
        pub_name: username,
        campaign_name: values.campaignName,
        payout: values.payout,
        os: values.os,
        pid: values.pid,
        pub_id: values.pub_id,
        geo: values.geo, // ✅ Add this line
      };

      console.log(requestData);
      // Sending the form data to the API endpoint
      const response = await axios.post(`${apiUrl}/addPubRequest`, requestData);
      console.log(response);
      if (response.status === 201) {
        // Update the local state with the new request (optional, depending on your needs)
        const newRequest = {
          key: Date.now(),
          advertiserName: values.advertiserName,
          campaignName: values.campaignName,
          payout: values.payout,
          os: values.os,
          link: "Pending",
        };
        setRequests([...requests, newRequest]);
        alert("Request submitted successfully");
      } else {
        alert("Failed to submit request");
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Failed to submit request");
      console.error(error);
    }
  };

  const columns = [
    {
      title: "Advertiser Name",
      dataIndex: "adv_name",
      key: "adv_name",
    },
    {
      title: "Campaign Name",
      dataIndex: "campaign_name",
      key: "campaign_name",
    },
    {
      title: "PUB Payout ($)",
      dataIndex: "payout",
      key: "payout",
    },
    {
      title: "OS",
      dataIndex: "os",
      key: "os",
    },
    {
      title: "Geo",
      dataIndex: "geo",
      key: "geo",
    },

    {
      title: "PID",
      dataIndex: "pid",
      key: "pid",
    },
    {
      title: "PUB ID",
      dataIndex: "pub_id",
      key: "pub_id",
    },
    {
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
    },
  ];

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
        <Button type="primary" onClick={showModal}>
          ➕ Request New Campaign Link
        </Button>

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
        okText="Submit">
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
        columns={columns}
        pagination={{ pageSize: 15 }}
      />
    </div>
  );
};

export default PublisherRequest;
