import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Upload,
  Button,
  Card,
  InputNumber,
  Row,
  Col,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";
import countries from "../../Data/geoData.json";
import { CurrencySymbolMap } from "./Currency.js";
const currencyOptions = Object.entries(CurrencySymbolMap).map(
  ([code, symbol]) => ({
    label: `${code} (${symbol})`,
    value: symbol, // backend gets only symbol
  }),
);
const apiUrl = import.meta.env.VITE_API_URL4;

const { TextArea } = Input;
const trimValues = (values) => {
  const trimmed = {};
  Object.keys(values).forEach((key) => {
    trimmed[key] =
      typeof values[key] === "string" ? values[key].trim() : values[key];
  });
  return trimmed;
};

const CreateOffer = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form] = Form.useForm();
  const [type, setType] = useState("deal");
  const [logo, setLogo] = useState(null);
  const [existingLogo, setExistingLogo] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState(null);
  const handleUpload = (file) => {
    setLogo(file);
    return false; // stop auto upload
  };
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/categories`, {
        withCredentials: true,
      });
      setCategories(res.data.data || []);
    } catch (error) {
      Swal.fire("Error", "Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };
  const fetchOffer = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/deals/${id}`, {
        withCredentials: true,
      });

      const offer = res.data.data;
      const isCoupon = !!offer.coupon_code; // 👈 detect coupon
      console.log(offer);
      form.setFieldsValue({
        type: offer.type,
        title: offer.title,
        description: offer.description,
        categories: offer.category,
        tracking_link: offer.url,
        code: offer.coupon_code, // 👈 set coupon code
        about: offer.about,
        payout: offer.offer,
        discount_payout: offer.discount_payout,
        currency: offer.currency,
        countries: offer.geo,
      });

      // 👇 FORCE coupon UI if coupon exists
      setType(isCoupon ? "coupon" : "deal");

      setExistingLogo(offer.img);
    } catch {
      Swal.fire("Error", "Failed to load offer data", "error");
    }
  };

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchOffer();
    }
  }, [id]);
  const handleSubmit = async (values) => {
    values = trimValues(values);
    if (!isEdit && !logo) {
      message.error("Logo is required");
      return;
    }

    const formData = new FormData();

    Object.keys(values).forEach((key) => {
      if (key === "code" && type !== "coupon") return;
      formData.append(key, values[key]);
    });

    if (logo) {
      formData.append("logo", logo);
    }

    formData.append("type", type);
    formData.append("slider", 0);
    console.log(isEdit);
    try {
      const url = isEdit
        ? `${apiUrl}/api/deals/${id}`
        : `${apiUrl}/api/create-deal`;

      const method = isEdit ? "put" : "post";
      await axios({
        method,
        url,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      Swal.fire(
        "Success",
        isEdit ? "Offer updated successfully" : "Offer created successfully",
        "success",
      );

      if (!isEdit) {
        form.resetFields();
        setLogo(null);
        setExistingLogo("");
        setLogoPreview(null);
      }
    } catch (err) {
      console.log(err);
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <Card title={isEdit ? "Edit Offer" : "Create Offer"}>
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{
            currency: "₹",
            countries: "IN",
          }}>
          <Row gutter={24}>
            {/* Offer Type (only on create) */}
            {!isEdit && (
              <Col xs={24} md={12}>
                <Form.Item label="Offer Type" name="type">
                  <Select onChange={setType}>
                    <Select.Option value="deal">Deal</Select.Option>
                    <Select.Option value="coupon">Coupon</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
            {/* Title */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: "Title is required" }]}>
                <Input />
              </Form.Item>
            </Col>

            {/* Description */}
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
                rules={[
                  { required: true, message: "Tracking link is required" },
                ]}>
                <Input />
              </Form.Item>
            </Col>

            {/* Coupon Code */}
            {type === "coupon" && (
              <Col xs={24} md={24}>
                <Form.Item
                  label="Coupon Code"
                  name="code"
                  rules={[{ required: true, message: "Coupon code required" }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}

            {/* About */}
            <Col xs={24}>
              <Form.Item label="About Store" name="about">
                <TextArea rows={3} />
              </Form.Item>
            </Col>

            {/* Payout */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Payout"
                name="payout"
                rules={[{ required: true, message: "Payout is required" }]}>
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            {/* Discount Payout */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Discount Payout"
                name="discount_payout"
                rules={[
                  { required: true, message: "Discount payout required" },
                ]}>
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

            {/* Logo Upload */}
            <Col xs={24}>
              <Form.Item label="Logo" required={!isEdit}>
                {(logoPreview || existingLogo) && (
                  <img
                    src={logoPreview || existingLogo}
                    alt="Offer Logo"
                    className="mb-3 h-20 object-contain border rounded"
                  />
                )}

                <Upload
                  beforeUpload={(file) => {
                    setLogo(file);
                    setLogoPreview(URL.createObjectURL(file)); // 👈 instant preview
                    return false;
                  }}
                  maxCount={1}
                  showUploadList={false}
                  accept="image/*">
                  <Button icon={<UploadOutlined />}>
                    {existingLogo || logoPreview
                      ? "Change Logo"
                      : "Upload Logo"}
                  </Button>
                </Upload>
              </Form.Item>
            </Col>

            {/* Submit */}
            <Col xs={24}>
              <Button type="primary" htmlType="submit" size="large" block>
                {isEdit ? "Update Offer" : "Create Offer"}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default CreateOffer;
