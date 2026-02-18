import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Space,
  Divider,
  message,
  Tabs,
  Table,
  Typography,
  Tag,
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined,
  SettingOutlined,
  FilterOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import axios from "axios";
import Swal from "sweetalert2";

const apiUrl = import.meta.env.VITE_API_URL3;
const { Option } = Select;
const { Title, Text } = Typography;
const SettingsPage = ({ campaignId, adv_id }) => {
  const [eventsData, setEventsData] = useState([]);
  const [samplingData, setSamplingData] = useState([]);
  const [postbackData, setPostbackData] = useState([]);

  /* ================= FETCH EVENTS ONLY ================= */

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${apiUrl}/events/${campaignId}`);
      const events = res.data || [];
      console.log("Fetched Events Data:", events);
      setEventsData(events);

      /* Sampling from event response */
      setSamplingData(
        events?.data?.map((e) => ({
          event_name: e.event_name,
          percentage:
            e.sampling_percentage !== null &&
            e.sampling_percentage !== undefined
              ? Number(e.sampling_percentage)
              : null,
        })),
      );
    } catch (err) {
      console.error(err);
      message.error("Failed to load events");
    }
  };
  const fetchPostbacks = async () => {
    try {
      const res = await axios.get(
        `https://track.pidmetric.com/pass-postback/${campaignId}`,
      );
      console.log("Fetched Postback Data:", res);
      setPostbackData(
        (res.data?.data || []).map((p) => ({
          id: p.id,
          event_name: p.event_name,
          is_pass: Number(p.is_pass),
        })),
      );
    } catch (err) {
      console.error(err);
      message.error("Failed to load pass postback data");
    }
  };
  /* ================= SAMPLING ================= */
  const fetchSampling = async () => {
    try {
      const res = await axios.get(`${apiUrl}/sampling/${campaignId}`);

      if (res.data?.success) {
        setSamplingData(
          res.data.data.map((s) => ({
            id: s.id,
            event_name: s.event_name,
            percentage: Number(s.sampling_percentage ?? 0),
          })),
        );
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load sampling data");
    }
  };

  useEffect(() => {
    if (!campaignId) return;
    fetchEvents();
    fetchPostbacks();
    fetchSampling();
  }, [campaignId]);

  /* ================= EVENT CREATE ================= */
  const handleEventSubmit = async (values) => {
    if (!values?.events?.length) {
      message.warning("Please add at least one event");
      return;
    }

    const payload = {
      campaign_id: campaignId,
      adv_id,
      event_name: values.events.map((e) => e.name),
      event_value: values.events.map((e) => e.value),
      event_payout: values.events.map((e) => e.payout),
    };

    try {
      await axios.post(`${apiUrl}/events`, payload);
      Swal.fire("Saved", "Event settings saved", "success");
    } catch {
      Swal.fire("Error", "Failed to save events", "error");
    }
  };

  /* ================= SAMPLING ================= */
  const handleSamplingChange = (value, index) => {
    const updated = [...samplingData];
    updated[index].percentage = value;
    setSamplingData(updated);
  };
  const handleSamplingBlur = async (row) => {
    try {
      const res = await axios.post(`${apiUrl}/sampling`, {
        id: row.id,
        sampling_percentage: row.percentage,
      });

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: `Sampling updated for "${row.event_name}"`,
          timer: 1200,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update sampling",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  };

  /* ================= POSTBACK ================= */
  const handlePostbackChange = async (value, index) => {
    const row = postbackData[index];
    try {
      const res = await axios.post(`${apiUrl}/pass-postback`, {
        id: row.id, // ✅ update using id
        is_pass: value,
      });

      if (res?.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: `Postback updated for "${row.event_name}"`,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });

        fetchPostbacks(); // refresh
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err?.response?.data?.message ||
          "Server error while updating postback",
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  };

  return (
    <Card bordered={false}>
      <Title level={3} style={{ marginBottom: 4 }}>
        Campaign Settings
      </Title>
      <Text type="secondary">
        Manage events, postbacks, and sampling for this campaign
      </Text>

      <Divider />

      <Tabs
        defaultActiveKey="1"
        size="large"
        items={[
          {
            key: "1",
            label: <span>Events</span>,
            children: (
              <Card bordered={false}>
                <Form layout="vertical" onFinish={handleEventSubmit}>
                  <Form.List name="events">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...rest }) => (
                          <Card
                            key={key}
                            size="small"
                            style={{ marginBottom: 12 }}>
                            <Space align="baseline" wrap>
                              <Form.Item
                                {...rest}
                                name={[name, "name"]}
                                label="Event Name"
                                rules={[{ required: true }]}>
                                <Input placeholder="install / signup" />
                              </Form.Item>

                              <Form.Item
                                {...rest}
                                name={[name, "value"]}
                                label="Value"
                                rules={[{ required: true }]}>
                                <Input placeholder="1" />
                              </Form.Item>

                              <Form.Item
                                {...rest}
                                name={[name, "payout"]}
                                label="Payout"
                                rules={[{ required: true }]}>
                                <InputNumber placeholder="10" min={0} />
                              </Form.Item>

                              <Button
                                danger
                                type="text"
                                icon={<MinusCircleOutlined />}
                                onClick={() => remove(name)}
                              />
                            </Space>
                          </Card>
                        ))}

                        <Button
                          type="dashed"
                          block
                          icon={<PlusOutlined />}
                          onClick={() => add()}>
                          Add Event
                        </Button>
                      </>
                    )}
                  </Form.List>

                  <Divider />

                  <Button type="primary" size="large" htmlType="submit">
                    Save Events
                  </Button>
                </Form>
              </Card>
            ),
          },

          {
            key: "2",
            label: <span>Pass Postback</span>,
            children: (
              <>
                <Table
                  rowKey="event_name"
                  pagination={false}
                  dataSource={postbackData}
                  columns={[
                    {
                      title: "Event",
                      dataIndex: "event_name",
                      render: (v) => <Tag color="blue">{v}</Tag>,
                    },
                    {
                      title: "Pass Postback",
                      dataIndex: "is_pass",
                      render: (_, row, i) => (
                        <Select
                          value={row.is_pass}
                          style={{ width: 120 }}
                          onChange={(v) => handlePostbackChange(v, i)}>
                          <Option value={1}>Yes</Option>
                          <Option value={0}>No</Option>
                        </Select>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },

          {
            key: "3",
            label: <span>Sampling</span>,
            children: (
              <Table
                rowKey="id"
                pagination={false}
                dataSource={samplingData}
                columns={[
                  {
                    title: "Event",
                    dataIndex: "event_name",
                    render: (v) => <Tag color="purple">{v}</Tag>,
                  },
                  {
                    title: "Sampling %",
                    dataIndex: "percentage",
                    render: (_, row, i) => (
                      <InputNumber
                        min={0}
                        max={100}
                        value={row.percentage}
                        style={{ width: 120 }}
                        onChange={(v) => handleSamplingChange(v, i)}
                        onBlur={() => handleSamplingBlur(row)} // ✅ auto save
                      />
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </Card>
  );
};

export default SettingsPage;
