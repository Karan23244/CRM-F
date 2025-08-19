import React, { useEffect, useState, useMemo } from "react";
import Zone from "./Zone";
import PidsOnAlert from "./PidAlert";
import PidStable from "./PidStable";
import { Select, Card, Space, Typography, Spin, Row, Col } from "antd";
import UploadForm from "./UploadForm";
import { useSelector } from "react-redux";
import PerformanceComparison from "./PerformanceComparison";
const { Title } = Typography;
const { Option } = Select;
const cardStyle = {
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  border: "1px solid #f0f0f0",
};
const apiUrl = "https://gapi.clickorbits.in";

export default function OptimizationPage() {
  const user = useSelector((state) => state.auth.user);
  console.log("User in OptimizationPage:", user);
  const [rawData, setRawData] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("");
  const [loading, setLoading] = useState(true);
  console.log("Raw data in OptimizationPage:", rawData);
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/campaign-metrics`);
      const json = await res.json();
      setRawData(json);

      const campaigns = [...new Set(json.map((r) => r.campaign_name))];
      if (campaigns.length) {
        setSelectedCampaign(campaigns[0]);
      }
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const campaigns = useMemo(
    () => [...new Set(rawData.map((r) => r.campaign_name))],
    [rawData]
  );

  // Date ranges only for the selected campaign
  const dateRanges = useMemo(() => {
    return [
      ...new Set(
        rawData
          .filter((r) => r.campaign_name === selectedCampaign)
          .map((r) => r.date_range)
      ),
    ];
  }, [rawData, selectedCampaign]);

  // When selectedCampaign changes, auto-select first date range
  useEffect(() => {
    if (dateRanges.length) {
      setSelectedDateRange(dateRanges[0]);
    }
  }, [dateRanges]);

  const filteredData = useMemo(() => {
    return rawData.filter(
      (r) =>
        (!selectedCampaign || r.campaign_name === selectedCampaign) &&
        (!selectedDateRange || r.date_range === selectedDateRange)
    );
  }, [rawData, selectedCampaign, selectedDateRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Upload Form */}
      <Card style={cardStyle} className="mb-6">
        <UploadForm onUploadSuccess={fetchData} />
      </Card>

      {/* Header & Filters */}
      <Space direction="vertical" size="large" className="w-full pt-5">
        <Title level={3} className="!m-0 !text-gray-800">
          Optimization Dashboard
        </Title>

        <Card style={cardStyle}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <label className="block mb-1 font-medium text-gray-700">
                Select Campaign
              </label>
              <Select
                value={selectedCampaign}
                onChange={setSelectedCampaign}
                size="large"
                className="w-full"
                placeholder="Choose a campaign"
                allowClear>
                {campaigns.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} md={12}>
              <label className="block mb-1 font-medium text-gray-700">
                Select Date Range
              </label>
              <Select
                value={selectedDateRange}
                onChange={setSelectedDateRange}
                size="large"
                className="w-full"
                placeholder="Choose a date range"
                allowClear>
                {dateRanges.map((dr) => (
                  <Option key={dr} value={dr}>
                    {dr}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Card>
      </Space>

      {/* Data Sections */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col span={24}>
          <Card style={cardStyle} className="rounded-xl shadow-md">
            <Zone data={filteredData} />
          </Card>
        </Col>
        <Col span={24}>
          <PerformanceComparison
            rawData={rawData}
            selectedCampaign={selectedCampaign}
          />
        </Col>

        <Col xs={24} md={12}>
          <Card
            style={cardStyle}
            className="rounded-xl shadow-md"
            title="PIDs on Alert">
            <PidsOnAlert />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            style={cardStyle}
            className="rounded-xl shadow-md"
            title="Stable PIDs">
            <PidStable />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
