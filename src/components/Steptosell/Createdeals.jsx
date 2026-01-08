import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Upload,
  Switch,
  Button,
  Card,
  InputNumber,
  message,
  Row,
  Col,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import Swal from "sweetalert2";

const { TextArea } = Input;
const apiUrl = import.meta.env.VITE_API_URL4;

const Dashboard = () => {
  const [form] = Form.useForm();
  const [slider, setSlider] = useState(false);
  const [type, setType] = useState("deal");
  const [files, setFiles] = useState({
    logo: null,
    banner1: null,
    banner2: null,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  // ---------------- FETCH CATEGORIES ----------------
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/categories`);
      setCategories(res.data.data || []);
    } catch (error) {
      Swal.fire("Error", "Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  const handleUpload = (file, field) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
    return false;
  };

  const handleSubmit = async (values) => {
    if (!files.logo) return message.error("Logo is required");
    if (slider && (!files.banner1 || !files.banner2))
      return message.error("Both banners are required");

    const formData = new FormData();

    Object.keys(values).forEach((key) => {
      if (key === "code" && type !== "coupon") return;
      formData.append(key, values[key]);
    });
    formData.append("logo", files.logo);
    formData.append("slider", slider ? 1 : 0);

    if (slider) {
      formData.append("banner1", files.banner1);
      formData.append("banner2", files.banner2);
    }
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      const res = await axios.post(`${apiUrl}/api/create-offer`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(res);
      Swal.fire("Success", "Offer created successfully", "success");
      form.resetFields();
      setSlider(false);
      setFiles({ logo: null, banner1: null, banner2: null });
    } catch (err) {
      console.log(err);
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <Card
        title="Create Deal of the Day"
        style={{ maxWidth: 1100, margin: "auto" }}>
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{ currency: "INR", countries: "IN" }}>
          <Row gutter={24}>
            {/* Title */}
            <Col xs={24} md={24}>
              <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: "Title is required" }]}>
                <Input />
              </Form.Item>
            </Col>

            {/* Description - full width */}
            <Col xs={24}>
              <Form.Item label="Description" name="description">
                <TextArea rows={3} />
              </Form.Item>
            </Col>

            {/* Category */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Category"
                name="categories"
                rules={[{ required: true, message: "Category is required" }]}>
                <Select
                  placeholder="Select category"
                  loading={loading}
                  allowClear>
                  {categories.map((cat) => (
                    <Select.Option
                      key={cat.id || cat._id || cat.slug}
                      value={cat.categore}>
                      {cat.categore}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Tracking Link */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Tracking Link"
                name="tracking_link"
                rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>

            {/* Preview URL */}
            <Col xs={24} md={12}>
              <Form.Item label="Preview URL" name="preview_url">
                <Input />
              </Form.Item>
            </Col>

            {/* Coupon Code */}
            {type === "coupon" && (
              <Col xs={24} md={12}>
                <Form.Item
                  label="Coupon Code"
                  name="code"
                  rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}

            {/* Payout */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Payout"
                name="payout"
                rules={[{ required: true }]}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            {/* Discount Payout */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Discount Payout"
                name="discount_payout"
                rules={[{ required: true }]}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            {/* Currency */}
            <Col xs={24} md={12}>
              <Form.Item label="Currency" name="currency">
                <Select>
                  <Select.Option value="INR">INR</Select.Option>
                  <Select.Option value="USD">USD</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Country */}
            <Col xs={24} md={12}>
              <Form.Item label="Country" name="countries">
                <Select>
                  <Select.Option value="IN">India</Select.Option>
                  <Select.Option value="US">United States</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Slider */}
            <Col xs={24}>
              <Form.Item label="Show in Slider">
                <Switch checked={slider} onChange={setSlider} />
              </Form.Item>
            </Col>

            {/* Logo */}
            <Col xs={24} md={12}>
              <Form.Item label="Logo" required>
                <Upload
                  beforeUpload={(f) => handleUpload(f, "logo")}
                  maxCount={1}>
                  <Button icon={<UploadOutlined />}>Upload Logo</Button>
                </Upload>
              </Form.Item>
            </Col>

            {/* Banners */}
            {slider && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item label="Banner 1" required>
                    <Upload
                      beforeUpload={(f) => handleUpload(f, "banner1")}
                      maxCount={1}>
                      <Button icon={<UploadOutlined />}>Upload Banner 1</Button>
                    </Upload>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Banner 2" required>
                    <Upload
                      beforeUpload={(f) => handleUpload(f, "banner2")}
                      maxCount={1}>
                      <Button icon={<UploadOutlined />}>Upload Banner 2</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </>
            )}

            {/* Submit */}
            <Col xs={24}>
              <Button
                className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-6 !py-2 !h-10 !text-sm !border-none !shadow-md flex items-center gap-2"
                htmlType="submit"
                size="large"
                block>
                Create Deal
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default Dashboard;
