import React, { useState } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  Card,
  Typography,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Option } = Select;

const RetargettingForm = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    if (!file) {
      Swal.fire("Error", "Please upload a file", "error");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("campaignname", values.campaignname);
      formData.append("os", values.os);
      formData.append(
        "daterange",
        `${values.daterange[0].format("YYYY-MM-DD")} to ${values.daterange[1].format("YYYY-MM-DD")}`,
      );
      formData.append("geo", values.geo);
      formData.append("file", file);

      const res = await fetch("http://localhost:2001/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Upload Successful",
          text: `Inserted ${data.inserted} rows`,
        });
        // ✅ Reset form fields
        form.resetFields();

        // ✅ Clear uploaded file
        setFile(null);
      } else {
        Swal.fire("Error", data.error || "Upload failed", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      setFile(file);
      return false; // prevent auto upload
    },
    maxCount: 1,
    accept: ".xlsx,.xls,.csv",
  };

  return (
    <div className=" flex items-center justify-center bg-gradient-to-br from-[#EAF1FA] via-[#F6F9FC] to-[#FFFFFF] p-8">
      <Card
        className="w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-100 bg-white/90 backdrop-blur-sm"
        bodyStyle={{ padding: "2.5rem" }}>
        <Title level={3} style={{ textAlign: "center" }}>
          Retargetting Form Upload
        </Title>

        <Form layout="vertical" onFinish={onFinish}>
          {/* Campaign Name */}
          <Form.Item
            label="Campaign Name"
            name="campaignname"
            rules={[{ required: true, message: "Enter campaign name" }]}>
            <Input placeholder="Enter campaign name" />
          </Form.Item>

          {/* OS */}
          <Form.Item
            label="OS"
            name="os"
            rules={[{ required: true, message: "Select OS" }]}>
            <Select placeholder="Select OS">
              <Option value="android">Android</Option>
              <Option value="ios">iOS</Option>
            </Select>
          </Form.Item>

          {/* Date Range */}
          <Form.Item
            label="Date Range"
            name="daterange"
            rules={[{ required: true, message: "Select date range" }]}>
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>

          {/* Geo */}
          <Form.Item
            label="Geo"
            name="geo"
            rules={[{ required: true, message: "Enter geo" }]}>
            <Input placeholder="e.g. IN, US, AU" />
          </Form.Item>

          {/* File Upload */}
          <Form.Item label="Upload Excel File" required>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          {/* Submit */}
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Upload Data
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RetargettingForm;
