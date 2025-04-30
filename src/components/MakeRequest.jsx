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
  notification
} from "antd";
import axios from "axios";
import { subscribeToNotifications } from "./Socket";

const { Option } = Select;
const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in";
const apiUrl1 =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";
const PublisherRequest = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [requests, setRequests] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);

  useEffect(() => {
    fetchAdvertisers();
    fetchRequests();
  
    // Socket notification setup
    subscribeToNotifications((data) => {
      console.log(data);
      if (data?.payout !== null) {
        notification.success({
          message: '✅ Link Updated',
          description: 'A request link has been updated successfully.',
          placement: 'topRight',
          duration: 3,
        });
        fetchRequests(); // Optional: refresh data
      }
    });
  }, []);
  

  console.log(requests);
  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getAllPubRequests`);
      setRequests(res.data?.data || []);
    } catch (error) {
      message.error("Failed to fetch requests");
    }
  };
  const fetchAdvertisers = async () => {
    try {
      const advmName = await axios.get(`${apiUrl1}/get-subadmin`);
      const filteredNames =
        advmName.data?.data
          ?.filter(
            (item) => item.role === "manager" || item.role === "advertiser"
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
        campaign_name: values.campaignName,
        payout: values.payout,
        os: values.os,
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
      title: "Payout ($)",
      dataIndex: "payout",
      key: "payout",
    },
    {
      title: "OS",
      dataIndex: "os",
      key: "os",
    },
    {
      title: "Link",
      dataIndex: "adv_res",
      key: "adv_res",
      render: (text) => (
        <span style={{ color: text === "Pending" ? "gray" : "blue" }}>
          {text}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Button type="primary" onClick={showModal}>
        Request New Campaign Link
      </Button>

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
            rules={[{ required: true, message: "Please enter payout amount" }]}>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter payout in USD"
            />
          </Form.Item>

          <Form.Item
            label="OS"
            name="os"
            rules={[{ required: true, message: "Please select an OS" }]}>
            <Select placeholder="Select OS">
              <Option value="Android">Android</Option>
              <Option value="iOS">iOS</Option>
              <Option value="Windows">Windows</Option>
              <Option value="macOS">macOS</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Table
        className="mt-4"
        dataSource={requests}
        columns={columns}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default PublisherRequest;
