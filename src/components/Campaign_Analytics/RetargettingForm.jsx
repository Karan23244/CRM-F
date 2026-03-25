import React, { useState, useEffect, useRef } from "react";
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
import { joinRoom, joinUserRoom, socket } from "../Socket/Socket.jsx";
import { useSelector } from "react-redux";

const apiUrl = import.meta.env.VITE_API_URL2;

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Option } = Select;

const RetargettingForm = () => {
  const joinedRef = useRef(false);
  const user = useSelector((state) => state.auth?.user);

  useEffect(() => {
    if (!user?.id) return;
    if (joinedRef.current) return;

    joinedRef.current = true;
    joinUserRoom(user.id);
  }, [user]);

  const [form] = Form.useForm();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false); // ✅ prevent double submit
  const [socketId, setSocketId] = useState(null);

  // ✅ Socket connect
  useEffect(() => {
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
      setSocketId(socket.id);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    return () => {
      socket.off("connect", handleConnect);
    };
  }, []);

  // ✅ HANDLE SUBMIT
  const onFinish = async (values) => {
    if (submitted) return;

    if (!files.length) {
      Swal.fire("Error", "Please upload at least one file", "error");
      return;
    }

    setLoading(true);
    setSubmitted(true);

    const formData = new FormData();

    formData.append("campaignname", values.campaignname.trim());
    formData.append("os", values.os);

    formData.append(
      "daterange",
      `${values.daterange[0].format("YYYY-MM-DD")} to ${values.daterange[1].format("YYYY-MM-DD")}`,
    );

    formData.append("geo", values.geo);

    // ✅ FIXED (was wrong earlier)
    if (socketId) {
      formData.append("socketId", socketId);
    }

    files.forEach((file) => {
      formData.append("files", file);
    });

    // ✅ SHOW PROCESSING SWAL
    Swal.fire({
      title: "⏳ Processing...",
      text: "Your file is being processed. You'll be notified once it's done.",
      icon: "info",
      allowOutsideClick: true,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      // ❗ DO NOT reset here (wait for socket event)
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "Upload failed", "error");
      setSubmitted(false);
      setLoading(false);
    }
  };

  // ✅ SOCKET LISTENER (MOST IMPORTANT PART)
  useEffect(() => {
    const handler = (data) => {
      Swal.close();

      if (data.status === "success") {
        Swal.fire({
          title: "✅ Upload Completed!",
          text: `${data.message} for ${data.campaignName}`,
          icon: "success",
        });

        // ✅ RESET FORM HERE
        form.resetFields();
        setFiles([]);
      } else {
        Swal.fire({
          title: "❌ Upload Failed",
          text: `${data.message} for ${data.campaignName}`,
          icon: "error",
        });
      }

      setSubmitted(false);
      setLoading(false);
    };

    socket.on("uploadComplete", handler);

    return () => socket.off("uploadComplete", handler);
  }, []);

  const uploadProps = {
    multiple: true, // ✅ allow multiple files
    beforeUpload: (file) => {
      setFiles((prev) => [...prev, file]);
      return false; // prevent auto upload
    },
    onRemove: (file) => {
      setFiles((prev) => prev.filter((f) => f.uid !== file.uid));
    },
    fileList: files, // ✅ control file list UI
    accept: ".xlsx,.xls,.csv",
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-[#EAF1FA] via-[#F6F9FC] to-[#FFFFFF] p-8">
      <Card
        className="w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-100 bg-white/90 backdrop-blur-sm"
        bodyStyle={{ padding: "2.5rem" }}>
        <Title level={3} style={{ textAlign: "center" }}>
          Retargetting Form Upload
        </Title>

        <Form form={form} layout="vertical" onFinish={onFinish}>
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
          <Form.Item label="Upload Excel Files" required>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Select Multiple Files</Button>
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
