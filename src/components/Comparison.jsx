import React, { useState } from "react";
import { Table, DatePicker, Row, Col, Typography, Space, Card } from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "antd/dist/reset.css";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Title } = Typography;

const campaignData = [
  {
    key: "1",
    name: "Summer Sale",
    impressions: 2000,
    clicks: 150,
    conversions: 25,
    date: "2025-07-01",
  },
  {
    key: "2",
    name: "Winter Deals",
    impressions: 3000,
    clicks: 250,
    conversions: 45,
    date: "2025-07-02",
  },
  {
    key: "3",
    name: "Holiday Campaign",
    impressions: 5000,
    clicks: 400,
    conversions: 100,
    date: "2025-07-03",
  },
  {
    key: "4",
    name: "Flash Sale",
    impressions: 1500,
    clicks: 120,
    conversions: 20,
    date: "2025-07-04",
  },
  {
    key: "5",
    name: "Diwali Blast",
    impressions: 7000,
    clicks: 600,
    conversions: 150,
    date: "2025-07-05",
  },
  {
    key: "6",
    name: "New Year Promo",
    impressions: 4000,
    clicks: 320,
    conversions: 80,
    date: "2025-07-06",
  },
  {
    key: "7",
    name: "Back to School",
    impressions: 2200,
    clicks: 180,
    conversions: 35,
    date: "2025-07-07",
  },
  {
    key: "8",
    name: "Monsoon Magic",
    impressions: 1800,
    clicks: 145,
    conversions: 30,
    date: "2025-07-08",
  },
  {
    key: "9",
    name: "Freedom Sale",
    impressions: 3600,
    clicks: 270,
    conversions: 60,
    date: "2025-07-09",
  },
  {
    key: "10",
    name: "Clearance Week",
    impressions: 2900,
    clicks: 210,
    conversions: 40,
    date: "2025-07-10",
  },
];

const CampaignTable = () => {
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRange, setSelectedRange] = useState(null);

  const columns = [
    { title: "Campaign Name", dataIndex: "name", key: "name" },
    { title: "Impressions", dataIndex: "impressions", key: "impressions" },
    { title: "Clicks", dataIndex: "clicks", key: "clicks" },
    { title: "Conversions", dataIndex: "conversions", key: "conversions" },
    { title: "Date", dataIndex: "date", key: "date" },
  ];

  const handleRangeChange = (dates) => {
    setSelectedRange(dates);

    if (dates && dates.length === 2) {
      const [start, end] = dates;
      console.log(
        "Selected Range:",
        start.format("YYYY-MM-DD"),
        "to",
        end.format("YYYY-MM-DD")
      );

      const filtered = campaignData.filter((item) => {
        const itemDate = dayjs(item.date, "YYYY-MM-DD");
        return itemDate.isBetween(start, end, "day", "[]"); // inclusive
      });

      setFilteredData(filtered);
    } else {
      setFilteredData([]);
    }
  };

  return (
    <div style={{ padding: 32, background: "#f0f2f5", minHeight: "100vh" }}>
      <Card
        style={{ marginBottom: 24, boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}>
        <Title level={3} style={{ marginBottom: 0 }}>
          📊 Campaign Report Dashboard
        </Title>
      </Card>

      {/* TOP TABLE: All Campaigns */}
      <Card
        title="📋 All Campaign Data"
        bordered
        style={{ marginBottom: 40, boxShadow: "0 3px 10px rgba(0,0,0,0.05)" }}>
        <Table
          dataSource={campaignData}
          columns={columns}
          pagination={{ pageSize: 5 }}
          bordered
        />
      </Card>

      {/* Filter Section */}
      <Card
        title="📅 Filter Campaigns by Date Range"
        bordered
        style={{ marginBottom: 20, boxShadow: "0 3px 10px rgba(0,0,0,0.05)" }}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Space direction="vertical" size="middle">
              <RangePicker onChange={handleRangeChange} />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* BOTTOM TABLE: Filtered Data */}
      {selectedRange ? (
        filteredData.length > 0 ? (
          <Card
            title="📈 Filtered Campaign Data"
            bordered
            style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.05)" }}>
            <Table
              dataSource={filteredData}
              columns={columns}
              pagination={{ pageSize: 5 }}
              bordered
            />
          </Card>
        ) : (
          <Card
            style={{
              textAlign: "center",
              backgroundColor: "#fffbe6",
              border: "1px dashed #ffc107",
              marginTop: 24,
            }}>
            <p style={{ fontSize: 16, color: "#d48806", margin: 0 }}>
              ⚠️ No campaigns found for the selected date range.
            </p>
          </Card>
        )
      ) : null}
    </div>
  );
};

export default CampaignTable;
