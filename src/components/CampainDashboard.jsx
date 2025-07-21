import React, { useEffect, useState } from "react";
import { Table, DatePicker, Select } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const sampleData = [
  { key: 1, campaign: "Campaign A", date: "2025-07-01", value: 400 },
  { key: 2, campaign: "Campaign B", date: "2025-07-02", value: 300 },
  { key: 3, campaign: "Campaign A", date: "2025-07-03", value: 200 },
  { key: 4, campaign: "Campaign C", date: "2025-07-04", value: 150 },
  { key: 5, campaign: "Campaign A", date: "2025-07-05", value: 250 },
  { key: 6, campaign: "Campaign B", date: "2025-07-06", value: 120 },
  { key: 7, campaign: "Campaign C", date: "2025-07-07", value: 180 },
  { key: 8, campaign: "Campaign B", date: "2025-07-08", value: 270 },
  { key: 9, campaign: "Campaign C", date: "2025-07-09", value: 90 },
  { key: 10, campaign: "Campaign A", date: "2025-07-10", value: 320 },
];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

const CampaignDashboard = () => {
  const [data] = useState(sampleData);
  const [filteredData, setFilteredData] = useState(sampleData);
  const [selectedCampaign, setSelectedCampaign] = useState([]);
  const [dateRange, setDateRange] = useState(null);

  const handleCampaignChange = (value) => {
    setSelectedCampaign(value);
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
  };

  useEffect(() => {
    let updatedData = [...data];

    if (selectedCampaign.length > 0) {
      updatedData = updatedData.filter((item) =>
        selectedCampaign.includes(item.campaign)
      );
    }

    if (dateRange && dateRange.length === 2) {
      updatedData = updatedData.filter((item) => {
        const itemDate = dayjs(item.date);
        return (
          itemDate.isAfter(dateRange[0].subtract(1, "day")) &&
          itemDate.isBefore(dateRange[1].add(1, "day"))
        );
      });
    }

    setFilteredData(updatedData);
  }, [selectedCampaign, dateRange, data]);

  const tableColumns = [
    { title: "Campaign", dataIndex: "campaign", key: "campaign" },
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Value", dataIndex: "value", key: "value" },
  ];

  const pieData = Object.values(
    filteredData.reduce((acc, cur) => {
      acc[cur.campaign] = acc[cur.campaign] || { name: cur.campaign, value: 0 };
      acc[cur.campaign].value += cur.value;
      return acc;
    }, {})
  );

  const getWaveChartData = (data) => {
    const groupedByDate = {};

    data.forEach(({ date, campaign, value }) => {
      const key = campaign.replace(" ", "");
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date };
      }
      groupedByDate[date][key] = (groupedByDate[date][key] || 0) + value;
    });

    return Object.values(groupedByDate).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  };

  const waveData = getWaveChartData(filteredData);

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        📊 Campaign Dashboard
      </h2>

      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-8">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Select Campaign</label>
          <Select
            showSearch
            mode="multiple"
            className="w-60"
            placeholder="Choose Campaign"
            allowClear
            onChange={handleCampaignChange}
            value={selectedCampaign}>
            {[...new Set(data.map((d) => d.campaign))].map((camp) => (
              <Option key={camp} value={camp}>
                {camp}
              </Option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">
            Select Date Range
          </label>
          <RangePicker onChange={handleDateChange} value={dateRange} />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          📄 Filtered Campaign Data
        </h3>
        <Table
          columns={tableColumns}
          dataSource={filteredData}
          pagination={{ pageSize: 5 }}
          className="bg-white"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full">
        <div className="flex-1 bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            📈 Pie Chart Overview
          </h3>
          <div className="w-full h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

          <div className="flex-1 bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              📌 Detailed Data for:{" "}
              <span className="text-blue-600">
                {selectedCampaign.join(", ")}
              </span>
            </h3>
            <Table
              columns={tableColumns}
              dataSource={filteredData}
              pagination={{ pageSize: 3 }}
              className="bg-white"
            />
          </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 mt-10">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          🌊 Wavelength-style Campaign Trends
        </h3>
        <div className="w-full h-80">
          <ResponsiveContainer>
            <AreaChart
              data={waveData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ffc658" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="CampaignA"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorA)"
              />
              <Area
                type="monotone"
                dataKey="CampaignB"
                stroke="#82ca9d"
                fillOpacity={1}
                fill="url(#colorB)"
              />
              <Area
                type="monotone"
                dataKey="CampaignC"
                stroke="#ffc658"
                fillOpacity={1}
                fill="url(#colorC)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CampaignDashboard;
