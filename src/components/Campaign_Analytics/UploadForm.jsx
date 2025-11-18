import { useState, useEffect } from "react";
import {
  DatePicker,
  Form,
  Input,
  Button,
  Upload,
  Typography,
  Card,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import Swal from "sweetalert2";
import { socket, joinRoom } from "../Socket/Socket";
import { useSelector } from "react-redux";
import { createNotification, notifyAllUsers } from "../../Utils/Notification";

const apiUrl = "https://gapi.clickorbits.in/";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function UploadForm({ onUploadSuccess }) {
  const user = useSelector((state) => state.auth?.user);
  const [form] = Form.useForm();
  const [msg, setMsg] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false); // 🔥 loading state
  const [submitted, setSubmitted] = useState(false); // 🔥 prevent resubmit
  const [socketId, setSocketId] = useState(null);
  // 🔹 On mount, join room using socket.id
  useEffect(() => {
    if (socket.connected) {
      setSocketId(socket.id);
      joinRoom(socket.id);
    } else {
      socket.on("connect", () => {
        setSocketId(socket.id);
        joinRoom(socket.id);
      });
    }
  }, []);
  // 🔹 Register socket listener once
  useEffect(() => {
    const handler = (data) => {
      Swal.close(); // 🔹 close processing modal

      if (data.status === "success") {
        Swal.fire({
          title: "✅ Upload Completed!",
          text: `${data.message} for ${data.campaignName}`,
          icon: "success",
        });
        if (onUploadSuccess) onUploadSuccess();
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

  // useEffect(() => {
  //   const handler = async (data) => {
  //     Swal.close();

  //     if (data.status === "success") {
  //       Swal.fire({
  //         title: "✅ Upload Completed!",
  //         text: `${data.message} for ${data.campaignName}`,
  //         icon: "success",
  //       });

  //       try {
  //         // ✅ Get user info from Redux
  //         const senderId = user?.id; // sender = uploader
  //         const senderName = user?.username;

  //         const dateRange = data.dateRange || "N/A";

  //         // ✅ Fetch all users (from your Notification.js helper)
  //         const users = await fetchAllUsers();

  //         // ✅ Loop through each user and send notification
  //         await Promise.all(
  //           users.map(async (u) => {
  //             if (u.id !== senderId) {
  //               await createNotification({
  //                 sender: senderName,
  //                 receiver: u.id, // receiver user id
  //                 type: "file_upload",
  //                 message: `📁 ${data.campaignName} file uploaded for ${dateRange}`,
  //                 url: "/dashboard/analytics",
  //               });
  //             }
  //           })
  //         );

  //         console.log("✅ Notifications sent to all users!");
  //       } catch (err) {
  //         console.error("❌ Error sending notifications:", err);
  //       }

  //       if (onUploadSuccess) onUploadSuccess();
  //     } else {
  //       Swal.fire({
  //         title: "❌ Upload Failed",
  //         text: `${data.message} for ${data.campaignName}`,
  //         icon: "error",
  //       });
  //     }

  //     setSubmitted(false);
  //     setLoading(false);
  //   };

  //   socket.on("uploadComplete", handler);
  //   return () => socket.off("uploadComplete", handler);
  // }, [user]);

  const handleFinish = async (values) => {
    if (submitted) return; // prevent double submit
    setLoading(true);
    setSubmitted(true);

    const data = new FormData();
    const formattedRange = `${values.dateRange[0].format(
      "YYYY-MM-DD"
    )} - ${values.dateRange[1].format("YYYY-MM-DD")}`;

    const cleanedCampaignName = values.campaignName.trim().replace(/\s+/g, " ");
    data.append("campaignName", cleanedCampaignName);
    data.append("os", values.os.trim());

    const geoInput = values.geo.includes("[")
      ? values.geo
      : JSON.stringify(values.geo.split(",").map((g) => g.trim()));
    data.append("geo", geoInput);
    data.append("dateRange", formattedRange);

    // 🔹 Append socketId to identify user
    if (socketId) {
      data.append("socketId", socketId);
    }
    fileList.forEach((file) => {
      data.append("files", file.originFileObj);
    });

    // 🔹 Show processing Swal immediately BEFORE axios call
    Swal.fire({
      title: "⏳ Processing...",
      text: "Your file is being processed. You'll be notified once it's done.",
      icon: "info",
      allowOutsideClick: true, // 🔹 allow socket events to update Swal
      allowEscapeKey: true,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await axios.post(`${apiUrl}api/metrics`, data);

      // 🔹 Clear form immediately after request is sent
      form.resetFields();
      setFileList([]);
    } catch (err) {
      Swal.close(); // 🔹 close processing Swal if failed
      Swal.fire({
        title: "❌ Upload Failed",
        text: err.response?.data?.msg || "Something went wrong.",
        icon: "error",
      });
      setSubmitted(false);
      setLoading(false);
    }
  };

  return (
    <div className=" flex items-center justify-center bg-gradient-to-br from-[#EAF1FA] via-[#F6F9FC] to-[#FFFFFF] p-8">
      <Card
        className="w-full max-w-6xl rounded-2xl shadow-2xl border border-gray-100 bg-white/90 backdrop-blur-sm"
        bodyStyle={{ padding: "2.5rem" }}>
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#2F5D99] mb-2">
            Campaign Metrics Upload
          </h2>
          <p className="text-gray-500">
            Fill in the campaign details and upload your metric files below.
          </p>
        </div>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          className="space-y-5">
          {/* Campaign Name */}
          <Form.Item
            name="campaignName"
            label={
              <span className="font-medium text-[#2F5D99]">Campaign Name</span>
            }
            rules={[{ required: true, message: "Please enter campaign name" }]}>
            <Input
              size="large"
              placeholder="Enter campaign name"
              className="rounded-lg border-gray-300 focus:border-[#2F5D99] focus:ring-[#2F5D99]/40 transition-all"
            />
          </Form.Item>

          {/* Operating System */}
          <Form.Item
            name="os"
            label={
              <span className="font-medium text-[#2F5D99]">
                Operating System
              </span>
            }
            rules={[{ required: true, message: "Please enter OS" }]}>
            <Input
              size="large"
              placeholder="e.g. iOS, Android"
              className="rounded-lg border-gray-300 focus:border-[#2F5D99] focus:ring-[#2F5D99]/40 transition-all"
            />
          </Form.Item>

          {/* Geo */}
          <Form.Item
            name="geo"
            label={<span className="font-medium text-[#2F5D99]">Geo</span>}
            tooltip="Comma-separated list or JSON array"
            rules={[{ required: true, message: "Please enter geo" }]}>
            <Input
              size="large"
              placeholder="e.g. US, UK, IN"
              className="rounded-lg border-gray-300 focus:border-[#2F5D99] focus:ring-[#2F5D99]/40 transition-all"
            />
          </Form.Item>

          {/* Date Range */}
          <Form.Item
            name="dateRange"
            label={
              <span className="font-medium text-[#2F5D99]">Date Range</span>
            }
            rules={[{ required: true, message: "Please select date range" }]}>
            <RangePicker
              className="w-full rounded-lg border-gray-300 hover:border-[#2F5D99] focus:border-[#2F5D99] focus:ring-[#2F5D99]/40 transition-all"
              size="large"
            />
          </Form.Item>

          {/* File Upload */}
          <Form.Item
            label={
              <span className="font-medium text-[#2F5D99]">Upload Files</span>
            }
            rules={[{ required: true, message: "Please upload files" }]}>
            <Upload
              beforeUpload={() => false}
              multiple
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              accept=".xlsx,.xls,.csv"
              className="w-full">
              <Button
                icon={<UploadOutlined />}
                size="large"
                className="w-full flex items-center justify-center rounded-lg !bg-[#2F5D99] hover:!bg-[#24487A] !text-white !border-none !shadow-md transition-transform hover:scale-[1.02]">
                Select Files
              </Button>
            </Upload>
          </Form.Item>

          {/* Submit */}
          <Button
            type="default"
            htmlType="submit"
            size="large"
            loading={loading}
            disabled={submitted}
            className="w-full !bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !py-6 !h-12 !text-lg !border-none !shadow-lg hover:scale-[1.02] transition-transform">
            Upload & Process
          </Button>
        </Form>

        {/* Result / Message */}
        {msg && (
          <pre className="mt-8 bg-[#F4F7FB] text-gray-700 border border-gray-200 p-4 rounded-xl text-sm font-mono overflow-auto">
            {msg}
          </pre>
        )}
      </Card>
    </div>
  );
}
