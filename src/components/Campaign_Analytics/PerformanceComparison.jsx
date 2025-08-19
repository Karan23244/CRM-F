import React, { useMemo, useState, useEffect } from "react";
import { Card, Select, Typography } from "antd";
import { Line } from "react-chartjs-2";

const { Title } = Typography;
const { Option } = Select;

export default function PerformanceComparison({ rawData, selectedCampaign }) {
  const [selectedPid, setSelectedPid] = useState("");
  // Get all PIDs for the selected campaign
  const pids = useMemo(() => {
    return [
      ...new Set(
        rawData
          .filter((r) => r.campaign_name === selectedCampaign)
          .map((r) => r.pid)
      ),
    ];
  }, [rawData, selectedCampaign]);

  // Set default PID on first load
  useEffect(() => {
    if (pids.length > 0 && !selectedPid) {
      setSelectedPid(pids[0]);
    }
  }, [pids, selectedPid]);

  // Filter data for selected PID
  const pidData = useMemo(() => {
    return rawData.filter(
      (r) =>
        r.campaign_name === selectedCampaign &&
        (!selectedPid || r.pid === selectedPid)
    );
  }, [rawData, selectedCampaign, selectedPid]);

  // Build chart data → x-axis = date ranges
  const chartData = useMemo(() => {
    return {
      labels: pidData.map((r) => r.date_range), // 👈 x-axis = date ranges
      datasets: [
        {
          label: "NOE",
          data: pidData.map((r) => r.noe ?? r.clicks ?? 0),
          borderColor: "hsl(200, 70%, 50%)",
          backgroundColor: "hsl(200, 70%, 70%)",
          fill: false,
        },
      ],
    };
  }, [pidData]);

  return (
    <Card className="mt-6 rounded-xl shadow-md">
      <Title level={4}>Performance Comparison</Title>

      {/* PID Dropdown */}
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-700">
          Select PID
        </label>
        <Select
          value={selectedPid}
          onChange={setSelectedPid}
          size="large"
          className="w-full"
          placeholder="Choose PID"
          allowClear
          showSearch
          optionFilterProp="children" // filters based on option text
          filterOption={(input, option) =>
            option?.children?.toLowerCase().includes(input.toLowerCase())
          }>
          {pids.map((pid) => (
            <Option key={pid} value={pid}>
              {pid}
            </Option>
          ))}
        </Select>
      </div>

      {/* Chart */}
      {pidData.length > 0 ? (
        <div style={{ height: "700px" }}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: {
                padding: { top: 30, right: 20, left: 20, bottom: 20 },
              },
              plugins: {
                legend: {
                  display: true,
                  position: "bottom",
                  labels: {
                    font: {
                      size: 14,
                      weight: "bold",
                    },
                    padding: 15,
                  },
                },
                title: {
                  display: true,
                  text: "Campaign Performance by Date Range",
                  font: { size: 18, weight: "bold" },
                  color: "#333",
                  padding: { bottom: 20 },
                },
                tooltip: {
                  backgroundColor: "rgba(0,0,0,0.8)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                  padding: 12,
                  borderColor: "#ddd",
                  borderWidth: 1,
                  callbacks: {
                    label: (ctx) => `NOE: ${ctx.raw}`,
                  },
                },
              },
              scales: {
                x: {
                  offset: true, // 👈 adds space before first & after last label
                  ticks: {
                    autoSkip: false,
                    maxRotation: 30,
                    minRotation: 30,
                    font: { size: 12 },
                  },
                  grid: {
                    drawOnChartArea: false, // cleaner x grid
                  },
                },
                y: {
                  beginAtZero: true,
                  suggestedMax: Math.max(...pidData.map((r) => r.noe)) + 100, // 👈 add breathing room above max
                  grid: {
                    borderDash: [5, 5],
                  },
                  ticks: {
                    font: { size: 12 },
                  },
                },
              },
              elements: {
                line: {
                  tension: 0.4, // smooth curve
                  borderWidth: 3,
                  borderColor: "rgba(54, 162, 235, 1)",
                },
                point: {
                  radius: 6,
                  hoverRadius: 8,
                  backgroundColor: "#fff",
                  borderColor: "rgba(54, 162, 235, 1)",
                  borderWidth: 2,
                },
              },
            }}
            height={50}
          />
        </div>
      ) : (
        <p className="text-gray-500">No data available</p>
      )}
    </Card>
  );
}
