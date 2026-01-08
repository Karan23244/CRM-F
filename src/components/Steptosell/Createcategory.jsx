import { useState } from "react";
import { Form, Input, Button, Upload, Card, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL4;

const CreateCategory = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const onFinish = async (values) => {
    if (!file) {
      message.error("Please upload an icon");
      return;
    }

    const formData = new FormData();
    formData.append("categore", values.categore);
    formData.append("icon", file);

    try {
      setLoading(true);

      await axios.post(`${apiUrl}/api/create-category`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("Category created successfully");
      form.resetFields();
      setFile(null);
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <Card title="Create Category" bordered={false}>
        <Form layout="vertical" form={form} onFinish={onFinish}>
          {/* Category Name */}
          <Form.Item
            label="Category Name"
            name="categore"
            rules={[{ required: true, message: "Please enter category name" }]}>
            <Input placeholder="Enter category name" />
          </Form.Item>

          {/* Icon Upload */}
          <Form.Item label="Category Icon" required>
            <Upload
              beforeUpload={(file) => {
                setFile(file);
                return false; // prevent auto upload
              }}
              maxCount={1}
              accept="image/*">
              <Button icon={<UploadOutlined />}>Upload Icon</Button>
            </Upload>
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button
              className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-6 !py-2 !h-10 !text-sm !border-none !shadow-md flex items-center gap-2"
              htmlType="submit"
              loading={loading}
              block>
              Create Category
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateCategory;
