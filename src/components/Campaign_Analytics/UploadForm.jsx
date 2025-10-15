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
import { socket } from "../Socket/Socket";

const apiUrl = "https://gapi.clickorbits.in/";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function UploadForm({ onUploadSuccess }) {
  const [form] = Form.useForm();
  const [msg, setMsg] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false); // 🔥 loading state
  const [submitted, setSubmitted] = useState(false); // 🔥 prevent resubmit

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <Card
        className="w-full rounded-2xl shadow-lg border border-gray-200"
        bodyStyle={{ padding: "2rem" }}>
        {/* Header */}
        <div className="text-center mb-6">
          <Title level={3} className="!mb-2">
            📊 Campaign Metrics Upload
          </Title>
          <Text type="secondary">
            Fill in campaign details and upload your files to process metrics.
          </Text>
        </div>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          className="space-y-4">
          <Form.Item
            name="campaignName"
            label="Campaign Name"
            rules={[{ required: true, message: "Please enter campaign name" }]}>
            <Input size="large" placeholder="Enter campaign name" />
          </Form.Item>

          <Form.Item
            name="os"
            label="Operating System"
            rules={[{ required: true, message: "Please enter OS" }]}>
            <Input size="large" placeholder="e.g. iOS, Android" />
          </Form.Item>

          <Form.Item
            name="geo"
            label="Geo (comma-separated or JSON array)"
            rules={[{ required: true, message: "Please enter geo" }]}>
            <Input size="large" placeholder="e.g. US, UK, IN" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: "Please select date range" }]}>
            <RangePicker className="w-full" size="large" />
          </Form.Item>

          <Form.Item
            label="Upload Files"
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
                className="w-full flex items-center justify-center"
                size="large">
                Select Files
              </Button>
            </Upload>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="w-full rounded-lg shadow-md hover:scale-[1.01] transition-transform"
            loading={loading} // 🔥 spinner
            disabled={submitted} // 🔥 disable after submit
          >
            🚀 Upload & Process
          </Button>
        </Form>

        {msg && (
          <pre className="mt-6 bg-gray-50 p-4 rounded-lg border text-sm whitespace-pre-wrap">
            {msg}
          </pre>
        )}
      </Card>
    </div>
  );
}
