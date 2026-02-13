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
import { useParams, useNavigate } from "react-router-dom";
const { TextArea } = Input;
import countries from "../../Data/geoData.json";
import { CurrencySymbolMap } from "./Currency.js";
const apiUrl = import.meta.env.VITE_API_URL4;

const currencyOptions = Object.entries(CurrencySymbolMap).map(
  ([code, symbol]) => ({
    label: `${code} (${symbol})`,
    value: symbol, // backend gets only symbol
  }),
);

const Dashboard = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
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
  const [existingImages, setExistingImages] = useState({
    logo: "",
    banner1: "",
    banner2: "",
  });

  useEffect(() => {
    if (isEdit) {
      fetchDealDetails();
    }
  }, [id]);
  const fetchDealDetails = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/campaigns/${id}`, {
        withCredentials: true,
      });

      const deal = res.data.data;
      console.log(deal);
      // Fill form
      form.setFieldsValue({
        title: deal.title,
        description: deal.description,
        categories: deal.categories,
        tracking_link: deal.tracking_link,
        preview_url: deal.preview_url,
        payout: deal.payout,
        discount_payout: deal.discount_payout,
        currency: deal.currency,
        countries: deal.countries,
        code: deal.code,
      });

      setSlider(Number(deal.slider) === 1);
      // ✅ Save existing image URLs
      setExistingImages({
        logo: deal.logo_url,
        banner1: deal.banner_url,
        banner2: deal.banner_url2,
      });
      // Important: images are NOT re-uploaded automatically
      // Keep existing image URLs if needed
    } catch {
      Swal.fire("Error", "Failed to load deal data", "error");
    }
  };
  // ---------------- FETCH CATEGORIES ----------------
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/categories/`, {
        withCredentials: true,
      });
      console.log(res);
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
    const formData = new FormData();

    Object.keys(values).forEach((key) => {
      if (key === "code" && type !== "coupon") return;
      formData.append(key, values[key]);
    });

    formData.append("slider", slider ? 1 : 0);

    if (files.logo) formData.append("logo", files.logo);
    if (files.banner2) formData.append("banner2", files.banner2);
    if (slider && files.banner1) formData.append("banner1", files.banner1);

    try {
      const url = isEdit
        ? `${apiUrl}/api/campaigns/${id}`
        : `${apiUrl}/api/create-offer`;

      const method = isEdit ? "put" : "post";

      await axios({
        method,
        url,
        data: formData,
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire(
        "Success",
        isEdit ? "Deal updated successfully" : "Deal created successfully",
        "success",
      );

      if (!isEdit) {
        form.resetFields();
        setFiles({ logo: null, banner1: null, banner2: null });
        setSlider(false);
      }
    } catch {
      Swal.fire("Error", "Something went wrong", "error");
    }
  };
  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <Card title={isEdit ? "Edit Deal" : "Create Deal of the Day"}>
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
                <Select
                  showSearch
                  placeholder="Select Currency"
                  options={currencyOptions}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            </Col>

            {/* Country */}
            <Col xs={24} md={12}>
              <Form.Item label="Country" name="countries">
                <Select
                  showSearch
                  placeholder="Select Country"
                  optionFilterProp="children">
                  {countries.geo.map((country) => (
                    <Select.Option key={country.code} value={country.code}>
                      {country.name} ({country.code})
                    </Select.Option>
                  ))}
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
              <Form.Item label="Logo">
                {existingImages.logo && (
                  <img
                    src={`${existingImages.logo}`}
                    alt="Logo"
                    className="mb-2 h-20 object-contain border rounded"
                  />
                )}

                <Upload
                  beforeUpload={(f) => handleUpload(f, "logo")}
                  maxCount={1}
                  showUploadList={false}>
                  <Button icon={<UploadOutlined />}>
                    {existingImages.logo ? "Change Logo" : "Upload Logo"}
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Banner 2">
                {existingImages.banner2 && (
                  <img
                    src={`${existingImages.banner2}`}
                    alt="Banner 2"
                    className="mb-2 h-24 w-full object-cover rounded"
                  />
                )}

                <Upload
                  beforeUpload={(f) => handleUpload(f, "banner2")}
                  maxCount={1}
                  showUploadList={false}>
                  <Button icon={<UploadOutlined />}>
                    {existingImages.banner2
                      ? "Change Banner 2"
                      : "Upload Banner 2"}
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
            {/* Banners */}
            {slider && (
              <Form.Item label="Banner 1">
                {existingImages.banner1 && (
                  <img
                    src={`${existingImages.banner1}`}
                    alt="Banner 1"
                    className="mb-2 h-24 w-full object-cover rounded"
                  />
                )}

                <Upload
                  beforeUpload={(f) => handleUpload(f, "banner1")}
                  maxCount={1}
                  showUploadList={false}>
                  <Button icon={<UploadOutlined />}>
                    {existingImages.banner1
                      ? "Change Banner 1"
                      : "Upload Banner 1"}
                  </Button>
                </Upload>
              </Form.Item>
            )}

            {/* Submit */}
            <Col xs={24}>
              <Button
                className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-6 !py-2 !h-10 !text-sm !border-none !shadow-md flex items-center gap-2"
                htmlType="submit"
                size="large"
                block>
                {isEdit ? "Update Deal" : "Create Deal"}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default Dashboard;
