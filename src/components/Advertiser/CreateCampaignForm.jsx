// src/components/Campaigns/CreateCampaignForm.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Form, Input, Select, Button, Card, Table, Spin } from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import geoData from "../../Data/geoData.json";

const apiUrl = import.meta.env.VITE_API_URL;
const { Option } = Select;

const CreateCampaignForm = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id || null;
  const [form] = Form.useForm();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState({
    pub_name: [],
    payable_event: [],
    mmp_tracker: [],
    geo: [],
    adv_list: [],
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/campaigns`);
      setCampaigns(res.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch campaigns", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const liveCampaigns = campaigns.filter((c) => c.status === "Live");
  const pausedCampaigns = campaigns.filter((c) => c.status === "Pause");

  const fetchDropdowns = useCallback(async () => {
    try {
      const [advmName, payableEvent, mmpTracker, adv_id] = await Promise.all([
        axios.get(`${apiUrl}/get-subadmin`),
        axios.get(`${apiUrl}/get-paybleevernt`),
        axios.get(`${apiUrl}/get-mmptracker`),
        axios.get(`${apiUrl}/advid-data/${userId}`),
      ]);
      setDropdownOptions({
        pub_name: [
          ...new Set(
            advmName?.data?.data
              ?.filter(
                (item) =>
                  (item.role === "publisher_manager" ||
                    item.role === "publisher") &&
                  !["AtiqueADV", "AnveshaADV"].includes(item.username)
              )
              .map((item) => item.username)
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
        adv_list:
          adv_id?.data?.advertisements?.map((i) => ({
            adv_id: i.adv_id,
            adv_name: i.adv_name,
          })) || [],
        geo: [...new Set(geoData.geo?.map((i) => i.code) || [])],
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to fetch dropdown data", "error");
    }
  }, [userId]);
  useEffect(() => {
    fetchDropdowns();
  }, [fetchDropdowns]);

  const onFinish = async (values) => {
    console.log("Form Values:", values);
    try {
      const res = await axios.post(`${apiUrl}/campaigns`, values);
      if (res.data?.message === "Campaign created successfully") {
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: res.data.message,
          timer: 1200,
          showConfirmButton: false,
        });
        form.resetFields();
        fetchCampaigns();
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Error creating campaign", "error");
    }
  };

  const columns = [
    {
      title: "Campaign Name",
      dataIndex: "campaign_name",
      key: "campaign_name",
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => (
        <span
          className={`font-semibold ${
            status === "Live" ? "text-green-600" : "text-red-500"
          }`}>
          {status}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      {/* ====== FORM CARD ====== */}
      <Card className="w-full max-w-8xl rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Create New Campaign
        </h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
          <Form.Item
            label="Advertiser"
            name="advertiser"
            rules={[{ required: true, message: "Please select advertiser" }]}>
            <Select
              showSearch
              placeholder="Select Advertiser"
              className="!h-11 rounded-lg border-gray-200 bg-gray-50"
              optionFilterProp="label"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              onChange={(val) => {
                const selected = dropdownOptions.adv_list.find(
                  (i) => i.adv_id === val
                );

                form.setFieldsValue({
                  adv_d: selected?.adv_id, // 👈 will now work
                  Adv_name: selected?.adv_name,
                });
              }}>
              {dropdownOptions.adv_list.map((item) => (
                <Option
                  key={item.adv_id}
                  value={item.adv_id}
                  label={`${item.adv_name} / ${item.adv_id}`}>
                  {item.adv_name} / {item.adv_id}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 👇 REQUIRED HIDDEN FIELDS */}
          <Form.Item name="adv_d" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="Adv_name" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Campaign Name"
            name="campaign_name"
            rules={[{ required: true, message: "Please enter campaign name" }]}>
            <Input
              placeholder="Enter Campaign Name"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </Form.Item>

          <Form.Item
            label="Vertical"
            name="Vertical"
            rules={[{ required: true, message: "Please select vertical" }]}>
            <Select
              placeholder="Select Vertical"
              className="rounded-lg !h-11 border-gray-200 bg-gray-50">
              <Option value="Finance">Finance</Option>
              <Option value="Gaming">Gaming</Option>
              <Option value="E-commerce">E-commerce</Option>
              <Option value="Health">Utility</Option>
              <Option value="Health">Health</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Geo"
            name="geo"
            rules={[{ required: true, message: "Please select geo" }]}>
            <Select
              placeholder="Select Geo"
              className="rounded-lg !h-11 border-gray-200 bg-gray-50">
              {dropdownOptions.geo.map((g) => (
                <Option key={g} value={g}>
                  {g}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="State/City"
            name="state_city"
            rules={[{ required: true, message: "Please enter state or city" }]}>
            <Input
              placeholder="Enter State or City"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </Form.Item>

          <Form.Item
            label="OS"
            name="os"
            rules={[{ required: true, message: "Please select OS" }]}>
            <Select
              placeholder="Select OS"
              className="rounded-lg !h-11 border-gray-200 bg-gray-50">
              <Option value="Android">Android</Option>
              <Option value="iOS">iOS</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Payable Event"
            name="payable_event"
            rules={[
              { required: true, message: "Please select payable event" },
            ]}>
            <Select
              placeholder="Select Payable Event"
              className="rounded-lg !h-11 border-gray-200 bg-gray-50">
              {dropdownOptions.payable_event.map((e) => (
                <Option key={e} value={e}>
                  {e}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="MMP Tracker"
            name="mmp_tracker"
            rules={[{ required: true, message: "Please select MMP tracker" }]}>
            <Select
              placeholder="Select MMP Tracker"
              className="rounded-lg !h-11 border-gray-200 bg-gray-50">
              {dropdownOptions.mmp_tracker.map((e) => (
                <Option key={e} value={e}>
                  {e}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Adv Payout"
            name="adv_payout"
            rules={[{ required: true, message: "Please enter adv payout" }]}>
            <Input
              type="number"
              placeholder="Enter Adv Payout"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </Form.Item>

          <Form.Item
            label="KPI"
            name="kpi"
            rules={[{ required: true, message: "Please enter KPI" }]}>
            <Input
              placeholder="Enter KPI"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </Form.Item>
          <Form.Item
            label="LINK"
            name="link"
            rules={[{ required: true, message: "Please add Link" }]}>
            <Input
              placeholder="Enter Link"
              className="h-11 rounded-lg border-gray-200 bg-gray-50"
            />
          </Form.Item>
          <Form.Item
            label="Status"
            name="status"
            rules={[
              { required: true, message: "Please select campaign status" },
            ]}>
            <Select
              placeholder="Select Status"
              className="rounded-lg !h-11 border-gray-200 bg-gray-50">
              <Option value="Live">Live</Option>
              <Option value="Pause">Pause</Option>
            </Select>
          </Form.Item>

          <Form.Item className="md:col-span-2 flex justify-end mt-4">
            <Button
              type="default"
              htmlType="submit"
              loading={loading}
              className="!bg-[#2F5D99] hover:!bg-[#24487A] !text-white !rounded-lg !px-10 !py-5 !h-12 !text-lg !border-none !shadow-md">
              Create Campaign
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* ====== LIVE / PAUSED CAMPAIGNS ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 w-full max-w-8xl">
        <Card
          title="Live Campaigns"
          className="shadow-md border border-gray-100 rounded-2xl">
          {loading ? (
            <Spin />
          ) : (
            <Table
              columns={columns}
              dataSource={liveCampaigns}
              rowKey="id"
              pagination={false}
              className="shadow-sm rounded-lg"
            />
          )}
        </Card>

        <Card
          title="Paused Campaigns"
          className="shadow-md border border-gray-100 rounded-2xl">
          {loading ? (
            <Spin />
          ) : (
            <Table
              columns={columns}
              dataSource={pausedCampaigns}
              rowKey="id"
              pagination={{
                pageSizeOptions: ["10", "20", "50"],
                showSizeChanger: true,
                defaultPageSize: 10,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              className="shadow-sm rounded-lg"
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default CreateCampaignForm;
