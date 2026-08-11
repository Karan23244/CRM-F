import React, { useEffect, useState } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Divider,
  Empty,
  Spin,
} from "antd";
import {
  HistoryOutlined,
  AppstoreOutlined,
  BugOutlined,
} from "@ant-design/icons";
import axios from "axios";
import StyledTable from "../../Utils/StyledTable";

const { Title } = Typography;

const apiUrl = import.meta.env.VITE_API_URL2;

const PidHistoryModal = ({ open, pid, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState({
    summary: {},
    campaigns: [],
  });
  const [pauseHistory, setPauseHistory] = useState([]);
  useEffect(() => {
    if (!open || !pid) return;

    fetchHistory();
  }, [pid, open]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const [historyRes, pauseRes] = await Promise.all([
        axios.get(`${apiUrl}/analytics/pid-history/${pid}`),
        axios.get(
          `https://chat.pidmetric.com/api/campaigns/pause-history/${pid}`,
        ),
      ]);
      console.log("historyRes", historyRes);
      console.log("pauseRes", pauseRes.data);
      setHistory({
        summary: historyRes.data.summary || {},
        campaigns: historyRes.data.campaigns || [],
      });

      // Flatten campaigns -> entries
      const pauseRows = (pauseRes.data.campaigns || []).map(
        (campaign, index) => ({
          key: `${campaign.campaignid}_${index}`,
          campaign_name: campaign.campaign_name,
          os: campaign.os,
          vertical: campaign.vertical,
          reason: campaign.reason,
          date: campaign.date,
        }),
      );

      setPauseHistory(pauseRows);
    } catch (err) {
      console.log(err);

      setHistory({
        summary: {},
        campaigns: [],
      });

      setPauseHistory([]);
    } finally {
      setLoading(false);
    }
  };
  const totalCampaigns = new Set(
    history.campaigns.map((item) => item.campaign_name),
  ).size;
  const campaignColumns = [
    {
      title: `PID (${totalCampaigns})`,
      render: () => pid,
      width: 140,
    },
    {
      title: "Campaign",
      dataIndex: "campaign_name",
    },
    {
      title: "OS",
      dataIndex: "os",
      width: 180,
      render: (os) => <Tag color="blue">{os}</Tag>,
    },
    {
      title: "Vertical",
      dataIndex: "vertical",
      width: 150,
    },
    {
      title: "Fraud %",
      dataIndex: "fraud_percentage",
      width: 120,
      align: "center",
      render: (value) => (
        <Tag color={Number(value) >= 5 ? "red" : "green"}>{value}%</Tag>
      ),
    },
  ];
  const pauseColumns = [
    {
      title: "Campaign Name",
      dataIndex: "campaign_name",
    },
    {
      title: "OS",
      dataIndex: "os",
      width: 140,
      render: (os) => <Tag color="blue">{os}</Tag>,
    },
    {
      title: "Vertical",
      dataIndex: "vertical",
      width: 200,
    },
    {
      title: "Reason",
      dataIndex: "reason",
    },
  ];
  const groupedCampaigns = Object.values(
    history.campaigns.reduce((acc, item) => {
      const key = item.campaign_name;

      if (!acc[key]) {
        acc[key] = {
          campaign_name: item.campaign_name,
          campaign_id: item.campaign_id,
          vertical: item.vertical || "-",
          records: [],
        };
      }

      acc[key].records.push(item);

      return acc;
    }, {}),
  ).map((campaign) => {
    const fraudAvg =
      campaign.records.reduce(
        (sum, r) => sum + Number(r.fraud_percentage || 0),
        0,
      ) / campaign.records.length;

    return {
      ...campaign,
      count: campaign.records.length,
      os: campaign.records.map((r) => r.os).join(", "),
      fraud_percentage: fraudAvg.toFixed(2),
    };
  });
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      destroyOnClose
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
          <HistoryOutlined />
          <span>
            PID History : <b>{pid}</b>
          </span>
        </div>
      }>
      <Spin spinning={loading}>
        <Title level={5}>Campaign History (Last 30 Days)</Title>

        <StyledTable
          rowKey="campaign_name"
          columns={campaignColumns}
          dataSource={groupedCampaigns}
          pagination={false}
          size="small"
          expandable={{
            rowExpandable: (record) => record.records.length > 1,

            expandedRowRender: (record) => (
              <Table
                rowKey={(r) => `${r.campaign_id}_${r.os}`}
                pagination={false}
                size="small"
                showHeader={false}
                columns={campaignColumns}
                dataSource={record.records.map((item) => ({
                  ...item,
                  pid_unique: pid,
                }))}
              />
            ),
          }}
          locale={{
            emptyText: <Empty description="No campaign history found" />,
          }}
        />
      </Spin>
      <Divider />

      <Title level={5}>Pause History (Last 30 Days)</Title>

      <StyledTable
        rowKey="key"
        columns={pauseColumns}
        dataSource={pauseHistory}
        pagination={false}
        size="small"
        locale={{
          emptyText: <Empty description="No pause history found" />,
        }}
      />
    </Modal>
  );
};

export default PidHistoryModal;
