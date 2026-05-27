// pages/CampaignConfigPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Select,
  InputNumber,
  Checkbox,
  Button,
  Form,
  message,
  Divider,
  Card,
  Tag,
  Tooltip,
  Tabs,
  Badge,
} from "antd";
import {
  SaveOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  FunnelPlotOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  FireOutlined,
} from "@ant-design/icons";

import { useSelector } from "react-redux";
import EventConfiguration from "./EventConfiguration";
import CRParameterCard from "./CRParameterCard";

import {
  createCampaignConfig,
  getCampaignConfig,
  updateCampaignConfig,
} from "../../Utils/campaign-config-api";

import axios from "axios";
import Swal from "sweetalert2";

const apiUrl = import.meta.env.VITE_API_URL;
const { Option } = Select;

const IGNORE_METRICS = ["C2I", "Install Fraud", "I2E2", "PA E2"];

const RULE1_BASE_PARAMS = ["CTI", "ITE1", "ITE2"];
const RULE2_PARAMS = ["RI", "PI", "Total Install Fraud", "PA E2"];

// ─────────────────────────────────────────────────────────────
// Premium Section Wrapper
// ─────────────────────────────────────────────────────────────
const Section = ({
  icon,
  title,
  badge,
  children,
  gradient = "from-white to-gray-50",
}) => (
  <Card
    bordered={false}
    className={`mb-6 rounded-[28px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 bg-gradient-to-br ${gradient}`}>
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xl shadow-lg">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>

          {badge && (
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {badge}
            </p>
          )}
        </div>
      </div>
    </div>

    {children}
  </Card>
);

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
const CampaignConfigPage = () => {
  const user = useSelector((state) => state.auth.user);

  const [form] = Form.useForm();

  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  const [selectedCampaigns, setSelectedCampaigns] = useState([]);

  const [events, setEvents] = useState(["E1", "E2"]);

  const [rule1Params, setRule1Params] = useState(() =>
    Object.fromEntries(RULE1_BASE_PARAMS.map((p) => [p, {}])),
  );

  const [rule2Params, setRule2Params] = useState(() =>
    Object.fromEntries(RULE2_PARAMS.map((p) => [p, {}])),
  );

  const [ignoreMetrics, setIgnoreMetrics] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  const [existingConfigId, setExistingConfigId] = useState(null);

  // ─────────────────────────────────────────────────────────
  // Fetch Campaigns
  // ─────────────────────────────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/campaigns`, {
        params: {
          user_id: user?.id || user?._id,
        },
      });

      const campaignsData = res.data.data || [];

      setCampaigns(campaignsData);

      return campaignsData;
    } catch (err) {
      console.error(err);

      Swal.fire("Error", "Failed to fetch campaigns", "error");

      return [];
    }
  }, [user]);

  // ─────────────────────────────────────────────────────────
  // Load Campaigns
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setCampaignsLoading(true);

      try {
        await fetchCampaigns();
      } catch (err) {
        message.error("Failed to load campaigns");
      } finally {
        setCampaignsLoading(false);
      }
    };

    if (user) {
      load();
    }
  }, [fetchCampaigns, user]);

  // ─────────────────────────────────────────────────────────
  // Sync Dynamic Events
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    setRule1Params((prev) => {
      const next = { ...prev };

      events.forEach((_, i) => {
        if (i >= 2) {
          const key = `ITE${i + 1}`;

          if (!next[key]) next[key] = {};
        }
      });

      Object.keys(next).forEach((key) => {
        if (key.startsWith("ITE") && !["ITE1", "ITE2"].includes(key)) {
          const idx = parseInt(key.replace("ITE", ""), 10) - 1;

          if (idx >= events.length) delete next[key];
        }
      });

      return next;
    });
  }, [events]);

  // ─────────────────────────────────────────────────────────
  // Load Existing Config
  // ─────────────────────────────────────────────────────────
  // const handleCampaignChange = useCallback(
  //   async (campaignIds) => {
  //     const foundCampaigns = campaigns.filter((c) =>
  //       campaignIds.includes(c.id),
  //     );

  //     setSelectedCampaigns(foundCampaigns);

  //     // Optional:
  //     // Load config only when single campaign selected
  //     if (campaignIds.length !== 1) {
  //       setExistingConfigId(null);
  //       return;
  //     }

  //     try {
  //       const config = await getCampaignConfig(campaignIds[0]);

  //       if (config) {
  //         setExistingConfigId(config.id);

  //         form.setFieldsValue({
  //           clicks_per_day: config.clicks_per_day,
  //           installs_per_day: config.installs_per_day,
  //         });

  //         if (config.events) setEvents(config.events);

  //         if (config.rule1_params) setRule1Params(config.rule1_params);

  //         if (config.rule2_params) setRule2Params(config.rule2_params);

  //         if (config.ignore_metrics) setIgnoreMetrics(config.ignore_metrics);

  //         message.success("Existing configuration loaded");
  //       }
  //     } catch {
  //       setExistingConfigId(null);

  //       form.resetFields(["clicks_per_day", "installs_per_day"]);

  //       setEvents(["E1", "E2"]);

  //       setRule1Params(
  //         Object.fromEntries(RULE1_BASE_PARAMS.map((p) => [p, {}])),
  //       );

  //       setRule2Params(Object.fromEntries(RULE2_PARAMS.map((p) => [p, {}])));

  //       setIgnoreMetrics([]);
  //     }
  //   },
  //   [campaigns, form],
  // );
  const handleCampaignChange = useCallback(
    async (campaignIds) => {
      const foundCampaigns = campaigns.filter((c) =>
        campaignIds.includes(c.id),
      );

      setSelectedCampaigns(foundCampaigns);

      // Reset when nothing selected
      if (!campaignIds.length) {
        setExistingConfigId(null);

        form.resetFields(["clicks_per_day", "installs_per_day"]);

        setEvents(["E1", "E2"]);

        setRule1Params(
          Object.fromEntries(RULE1_BASE_PARAMS.map((p) => [p, {}])),
        );

        setRule2Params(Object.fromEntries(RULE2_PARAMS.map((p) => [p, {}])));

        setIgnoreMetrics([]);

        return;
      }

      try {
        // IMPORTANT
        // send ALL selected campaign ids
        const config = await getCampaignConfig(campaignIds);

        if (config) {
          setExistingConfigId(config.id);

          // VERY IMPORTANT
          // restore ALL campaign ids
          form.setFieldsValue({
            campaign_ids: config.campaign_ids,
            clicks_per_day: config.clicks_per_day,
            installs_per_day: config.installs_per_day,
          });

          setSelectedCampaigns(
            campaigns.filter((c) => config.campaign_ids.includes(c.id)),
          );

          if (config.events) setEvents(config.events);

          if (config.rule1_params) setRule1Params(config.rule1_params);

          if (config.rule2_params) setRule2Params(config.rule2_params);

          if (config.ignore_metrics) setIgnoreMetrics(config.ignore_metrics);

          message.success("Existing configuration loaded");
        }
      } catch (err) {
        setExistingConfigId(null);
      }
    },
    [campaigns, form],
  );

  // ─────────────────────────────────────────────────────────
  // Build Payload
  // ─────────────────────────────────────────────────────────
  const buildPayload = (values) => ({
    campaign_ids: selectedCampaigns.map((c) => c.id),
    campaign_names: [...new Set(selectedCampaigns.map((c) => c.campaign_name))],
    os: selectedCampaigns?.[0]?.os,
    clicks_per_day: values.clicks_per_day,
    installs_per_day: values.installs_per_day,
    events,
    rule1_params: rule1Params,
    rule2_params: rule2Params,
    ignore_metrics: ignoreMetrics,
  });

  // ─────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────
  // const handleSubmit = async () => {
  //   try {
  //     const values = await form.validateFields();

  //     setSubmitting(true);

  //     const payload = buildPayload(values);

  //     if (existingConfigId) {
  //       await updateCampaignConfig(existingConfigId, payload);

  //       message.success("Campaign configuration updated!");
  //     } else {
  //       await createCampaignConfig(payload);

  //       message.success("Campaign configuration saved!");
  //     }
  //   } catch (err) {
  //     if (err?.errorFields) {
  //       message.warning("Please fill all required fields");
  //     } else {
  //       message.error("Failed to save configuration");
  //     }
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };
  // ─────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setSubmitting(true);

      const payload = buildPayload(values);

      if (existingConfigId) {
        await updateCampaignConfig(existingConfigId, payload);

        await Swal.fire({
          icon: "success",
          title: "Configuration Updated",
          text: "Campaign configuration updated successfully.",
          confirmButtonColor: "#6366f1",
        });
      } else {
        await createCampaignConfig(payload);

        await Swal.fire({
          icon: "success",
          title: "Configuration Saved",
          text: "Campaign configuration saved successfully.",
          confirmButtonColor: "#6366f1",
        });
      }

      // ─────────────────────────────────────────
      // Reset Everything
      // ─────────────────────────────────────────
      form.resetFields();

      setSelectedCampaigns([]);

      setEvents(["E1", "E2"]);

      setRule1Params(Object.fromEntries(RULE1_BASE_PARAMS.map((p) => [p, {}])));

      setRule2Params(Object.fromEntries(RULE2_PARAMS.map((p) => [p, {}])));

      setIgnoreMetrics([]);

      setExistingConfigId(null);
    } catch (err) {
      if (err?.errorFields) {
        message.warning("Please fill all required fields");
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Failed to save configuration",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };
  const rule1Keys = ["CTI", ...events.map((_, i) => `ITE${i + 1}`)];
  // Add above return()
  const selectedIds = form.getFieldValue("campaign_ids") || [];

  const sortedCampaigns = React.useMemo(() => {
    const firstSelected = campaigns.find((x) => selectedIds.includes(x.id));

    return [...campaigns].sort((a, b) => {
      // no selection yet
      if (!firstSelected) {
        return `${a.campaign_name} ${a.os}`.localeCompare(
          `${b.campaign_name} ${b.os}`,
        );
      }

      const aRelated =
        a.campaign_name === firstSelected.campaign_name &&
        a.os === firstSelected.os;

      const bRelated =
        b.campaign_name === firstSelected.campaign_name &&
        b.os === firstSelected.os;

      // selected always first
      if (selectedIds.includes(a.id) && !selectedIds.includes(b.id)) return -1;

      if (!selectedIds.includes(a.id) && selectedIds.includes(b.id)) return 1;

      // related campaigns next
      if (aRelated && !bRelated) return -1;
      if (!aRelated && bRelated) return 1;

      // alphabetical
      return `${a.campaign_name} ${a.os}`.localeCompare(
        `${b.campaign_name} ${b.os}`,
      );
    });
  }, [campaigns, selectedIds]);
  // ─────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-5 px-3 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
            Campaign Configuration
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Configure campaign rules, targets and fraud settings
          </p>
        </div>

        {/* Main Form Container */}
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="
          bg-white
          border border-gray-200
          rounded-3xl
          shadow-sm
          overflow-hidden
        ">
          {/* Top Section */}
          <div className="p-5 md:p-6 space-y-5">
            {/* Campaign Selection */}
            <Form.Item
              name="campaign_ids"
              label={
                <span className="text-sm font-semibold text-gray-700">
                  Campaign
                </span>
              }
              className="mb-0"
              rules={[
                {
                  required: true,
                  message: "Please select a campaign",
                },
              ]}>
              <Select
                mode="multiple"
                showSearch
                allowClear
                size="large"
                loading={campaignsLoading}
                placeholder="Search campaign name or ID..."
                onChange={handleCampaignChange}
                optionFilterProp="label"
                maxTagCount="responsive"
                className="campaign-select"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }>
                {sortedCampaigns.map((c) => {
                  const selectedCampaigns =
                    campaigns.filter((x) =>
                      form.getFieldValue("campaign_ids")?.includes(x.id),
                    ) || [];

                  const firstSelected = selectedCampaigns[0];

                  const disabled =
                    firstSelected &&
                    (c.campaign_name !== firstSelected.campaign_name ||
                      c.os !== firstSelected.os);

                  const isSelected = selectedIds.includes(c.id);

                  const isRelated =
                    firstSelected &&
                    c.campaign_name === firstSelected.campaign_name &&
                    c.os === firstSelected.os;

                  return (
                    <Option
                      key={c.id}
                      value={c.id}
                      disabled={disabled}
                      label={`${c.campaign_name} (${c.id}) ${c.os}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800 truncate">
                            {c.campaign_name} ({c.id})
                          </div>

                          <div className="text-xs text-gray-400 mt-1">
                            {c.os}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">

                          {!isSelected && isRelated && !disabled && (
                            <Tag color="blue">Related</Tag>
                          )}

                          {disabled && (
                            <Tag color="red">Different Campaign / OS</Tag>
                          )}
                        </div>
                      </div>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>

            {/* Daily Targets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="clicks_per_day"
                className="mb-0"
                label={
                  <span className="text-sm font-semibold text-gray-700">
                    Clicks Per Day
                  </span>
                }
                rules={[{ required: true }]}>
                <InputNumber
                  size="large"
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="5000"
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                name="installs_per_day"
                className="mb-0"
                label={
                  <span className="text-sm font-semibold text-gray-700">
                    Installs Per Day
                  </span>
                }
                rules={[{ required: true }]}>
                <InputNumber
                  size="large"
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="200"
                  className="w-full"
                />
              </Form.Item>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200" />

            {/* Event Configuration */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">
                  Event Configuration
                </h3>

                <p className="text-xs text-gray-400 mt-1">
                  Manage custom events used in rules
                </p>
              </div>

              <EventConfiguration value={events} onChange={setEvents} />
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200" />

            {/* Rules */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">
                  Rule Parameters
                </h3>

                <p className="text-xs text-gray-400 mt-1">
                  Configure thresholds and ranges
                </p>
              </div>

              <Tabs
                defaultActiveKey={`rule1-${rule1Keys[0]}`}
                type="card"
                size="middle"
                className="campaign-config-tabs"
                items={[
                  // Rule 1
                  ...rule1Keys.map((param) => ({
                    key: `rule1-${param}`,
                    label: (
                      <div className="px-1 text-[13px] font-medium">
                        {param}
                      </div>
                    ),

                    children: (
                      <div className="pt-2">
                        <CRParameterCard
                          label={param}
                          rule="rule1"
                          value={rule1Params[param] || {}}
                          onChange={(v) =>
                            setRule1Params((prev) => ({
                              ...prev,
                              [param]: v,
                            }))
                          }
                        />
                      </div>
                    ),
                  })),

                  // Rule 2
                  ...RULE2_PARAMS.map((param) => ({
                    key: `rule2-${param}`,
                    label: (
                      <div className="px-1 text-[13px] font-medium">
                        {param}
                      </div>
                    ),

                    children: (
                      <div className="pt-2">
                        <CRParameterCard
                          label={param}
                          rule="rule2"
                          value={rule2Params[param] || {}}
                          onChange={(v) =>
                            setRule2Params((prev) => ({
                              ...prev,
                              [param]: v,
                            }))
                          }
                        />
                      </div>
                    ),
                  })),
                ]}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200" />

            {/* Ignore Metrics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Ignore Metrics
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Exclude metrics from calculations
                  </p>
                </div>

                <Badge
                  count={ignoreMetrics.length}
                  className="site-badge-count-4"
                />
              </div>

              <Checkbox.Group
                value={ignoreMetrics}
                onChange={setIgnoreMetrics}
                className="
                grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4
                gap-3 w-full
              ">
                {IGNORE_METRICS.map((metric) => {
                  const active = ignoreMetrics.includes(metric);

                  return (
                    <label
                      key={metric}
                      className={`
                      flex items-center gap-3
                      rounded-2xl border
                      px-4 py-3
                      cursor-pointer
                      transition-all duration-200
                      ${
                        active
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300 bg-white"
                      }
                    `}>
                      <Checkbox value={metric} />

                      <div
                        className={`
                        text-sm font-medium transition-colors
                        ${active ? "text-indigo-700" : "text-gray-700"}
                      `}>
                        {metric}
                      </div>
                    </label>
                  );
                })}
              </Checkbox.Group>
            </div>
          </div>

          {/* Sticky Footer */}
          <div
            className="
            sticky bottom-0 z-40
            border-t border-gray-200
            bg-white/95 backdrop-blur-md
            px-5 py-4
          ">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800">
                  Ready to save configuration?
                </div>

                <div className="text-sm text-gray-500">
                  Settings will apply instantly after save.
                </div>
              </div>

              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={submitting}
                onClick={handleSubmit}
                className="
                h-12 px-8 rounded-2xl
                bg-gradient-to-r from-indigo-600 to-purple-600
                border-0 shadow-lg
                text-sm font-semibold
              ">
                {existingConfigId
                  ? "Update Configuration"
                  : "Save Configuration"}
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CampaignConfigPage;
