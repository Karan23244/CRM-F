import React, { useCallback, useEffect, useState } from "react";
import { Form, Input, Select, Button, Card } from "antd";
import {
  UserOutlined,
  AppstoreOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useSelector } from "react-redux";
import geoData from "../../Data/geoData.json";

const { Option } = Select;
const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

function CreateCampaign() {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const [form] = Form.useForm();

  const [dropdownOptions, setDropdownOptions] = useState({
    pub_name: [],
    payable_event: [],
    mmp_tracker: [],
    pid: [],
    pub_id: [],
    geo: [],
    adv_id: [],
  });

  // 🔹 Fetch dropdown data
  const fetchDropdowns = useCallback(async () => {
    try {
      const [advmName, payableEvent, mmpTracker, pid, pub_id, adv_id] =
        await Promise.all([
          axios.get(`${apiUrl}/get-subadmin`),
          axios.get(`${apiUrl}/get-paybleevernt`),
          axios.get(`${apiUrl}/get-mmptracker`),
          axios.get(`${apiUrl}/get-pid`),
          axios.get(`${apiUrl}/get-allpub`),
          axios.get(`${apiUrl}/advid-data/${userId}`),
        ]);

      setDropdownOptions((prev) => ({
        ...prev,
        pub_name: [
          ...new Set(
            advmName?.data?.data
              ?.filter(
                (item) =>
                  (item.role === "publisher_manager" ||
                    item.role === "publisher") &&
                  !["AtiqueADV", "AnveshaADV"].includes(item.username)
              )
              .map((item) => item.username) || []
          ),
        ],
        payable_event: [
          ...new Set(
            payableEvent?.data?.data?.map((i) => i.payble_event) || []
          ),
        ],
        mmp_tracker: [
          ...new Set(mmpTracker?.data?.data?.map((i) => i.mmptext) || []),
        ],
        pid: [...new Set(pid?.data?.data?.map((i) => i.pid) || [])],
        pub_id: [...new Set(pub_id?.data?.data?.map((i) => i.pub_id) || [])],
        adv_id: [
          ...new Set(adv_id?.data?.advertisements?.map((i) => i.adv_id) || []),
        ],
        geo: [...new Set(geoData.geo?.map((i) => i.code) || [])], // ✅ Geo dropdown data
      }));
    } catch (error) {
      console.error("fetchDropdowns error:", error);
      message.error("Failed to fetch dropdown options");
    }
  }, [apiUrl, userId]);

  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  // 🔹 Submit handler
  const onFinish = (values) => {
    console.log("✅ Submitted Values:", values);
    message.success("Campaign created successfully!");
    form.resetFields();
  };

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-blue-50 to-pink-50 p-4">
      <Card
        title={
          <span className="text-2xl font-bold text-gray-700">
            Create Campaign
          </span>
        }
        className="w-full max-w-6xl rounded-3xl p-6 bg-white">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          {/* Adv Id */}
          <Form.Item
            label="Adv Id"
            name="advId"
            rules={[{ required: true, message: "Please select Adv Id" }]}>
            <Select
              placeholder="Select Adv Id"
              loading={!dropdownOptions.adv_id.length}
              showSearch>
              {dropdownOptions.adv_id.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Campaign Name */}
          <Form.Item
            label="Campaign Name"
            name="campaignName"
            rules={[{ required: true, message: "Please enter Campaign Name" }]}>
            <Input placeholder="Enter Campaign Name" />
          </Form.Item>

          {/* Vertical */}
          <Form.Item
            label="Vertical"
            name="vertical"
            rules={[{ required: true, message: "Please select Vertical" }]}>
            <Select placeholder="Select Vertical" showSearch>
              <Option value="Finance">Betting Sport</Option>
              <Option value="Gaming">Betting Casino</Option>
              <Option value="E-commerce">Finance</Option>
              <Option value="Health">Utilities</Option>
            </Select>
          </Form.Item>

          {/* Geo */}
          <Form.Item
            label="Geo"
            name="geo"
            rules={[{ required: true, message: "Please select Geo" }]}>
            <Select
              placeholder="Select Geo (e.g., IN, US)"
              showSearch
              loading={!dropdownOptions.geo.length}>
              {dropdownOptions.geo.map((code) => (
                <Option key={code} value={code}>
                  {code}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* State/City */}
          <Form.Item label="State / City" name="stateCity">
            <Input placeholder="Enter State or City" />
          </Form.Item>

          {/* OS */}
          <Form.Item label="OS" name="os">
            <Select placeholder="Select OS">
              <Option value="Android">Android</Option>
              <Option value="iOS">iOS</Option>
              <Option value="Windows">Windows</Option>
            </Select>
          </Form.Item>

          {/* Payable Event */}
          <Form.Item
            label="Payable Event"
            name="payableEvent"
            rules={[
              { required: true, message: "Please select Payable Event" },
            ]}>
            <Select
              placeholder="Select Payable Event"
              loading={!dropdownOptions.payable_event.length}>
              {dropdownOptions.payable_event.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* MMP Tracker */}
          <Form.Item
            label="MMP Tracker"
            name="mmpTracker"
            rules={[{ required: true, message: "Please select MMP Tracker" }]}>
            <Select
              placeholder="Select MMP Tracker"
              loading={!dropdownOptions.mmp_tracker.length}>
              {dropdownOptions.mmp_tracker.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* PID */}
          <Form.Item label="PID" name="pid">
            <Select
              placeholder="Select PID"
              loading={!dropdownOptions.pid.length}>
              {dropdownOptions.pid.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* PUB AM */}
          <Form.Item
            label="PUB AM"
            name="pubAm"
            rules={[{ required: true, message: "Please select PUB AM" }]}>
            <Select
              placeholder="Select PUB AM"
              loading={!dropdownOptions.pub_name.length}>
              {dropdownOptions.pub_name.map((item) => (
                <Option key={item} value={item}>
                  {item}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Submit Button spans 2 columns */}
          <Form.Item className="md:col-span-2">
            <Button
              type="primary"
              htmlType="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-pink-500 hover:to-blue-500 text-white font-semibold text-lg rounded-xl shadow-md">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default CreateCampaign;
