import React, { useMemo, useState } from "react";
import { Card, Select, Typography } from "antd";
import { Line } from "react-chartjs-2";

const { Title } = Typography;
const { Option } = Select;

export default function PerformanceComparison({ rawData, selectedCampaign }) {
  const [selectedPids, setSelectedPids] = useState([]);

  // Unique PIDs for selected campaign
  const pids = useMemo(() => {
    return [
      ...new Set(
        rawData
          .filter((r) => r.campaign_name === selectedCampaign)
          .map((r) => r.pid)
      ),
    ];
  }, [rawData, selectedCampaign]);

  // All available dates (sorted)
  const allDates = useMemo(() => {
    const dates = [
      ...new Set(
        rawData
          .filter((r) => r.campaign_name === selectedCampaign)
          .map((r) => r.metrics_date)
      ),
    ];
    return dates.sort((a, b) => new Date(a) - new Date(b));
  }, [rawData, selectedCampaign]);

  // Fixed color palette
  const colorPalette = [
    "rgba(255, 99, 132, 0.8)", // pink
    "rgba(54, 162, 235, 0.8)", // blue
    "rgba(255, 206, 86, 0.8)", // yellow
    "rgba(75, 192, 192, 0.8)", // teal
    "rgba(153, 102, 255, 0.8)", // purple
    "rgba(255, 159, 64, 0.8)", // orange
    "rgba(46, 204, 113, 0.8)", // green
    "rgba(231, 76, 60, 0.8)", // red
    "rgba(52, 152, 219, 0.8)", // light blue
    "rgba(241, 196, 15, 0.8)", // gold
  ];

  const pointStyles = [
    "circle",
    "rect",
    "triangle",
    "rectRot",
    "cross",
    "star",
    "line",
    "dash",
  ];

  const getColorForIndex = (index) => colorPalette[index % colorPalette.length];
  const getPointStyleForIndex = (index) =>
    pointStyles[index % pointStyles.length];

  // Build datasets for each selected PID
  const datasets = useMemo(() => {
    return selectedPids.map((pid, idx) => {
      const pidRecords = rawData.filter(
        (r) => r.campaign_name === selectedCampaign && r.pid === pid
      );

      const dateToNoe = {};
      pidRecords.forEach((r) => {
        dateToNoe[r.metrics_date] =
          (dateToNoe[r.metrics_date] || 0) + (r.noe || 0);
      });

      const color = getColorForIndex(idx);

      return {
        label: `PID: ${pid}`,
        data: allDates.map((d) => dateToNoe[d] || 0),
        borderColor: color,
        backgroundColor: color,
        fill: false,
        tension: 0.3,
        borderWidth: 3, // thicker lines
        pointBackgroundColor: "#fff",
        pointBorderColor: color,
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: getPointStyleForIndex(idx), // unique point shapes
      };
    });
  }, [selectedPids, rawData, selectedCampaign, allDates]);

  const chartData = {
    labels: allDates,
    datasets,
  };

  return (
    <Card className="mt-6 rounded-xl shadow-md">
      <Title level={4}>Performance Comparison</Title>

      {/* PID Multi-Select */}
      <div className="mb-4">
        <label className="block mb-1 font-medium text-gray-700">
          Select PID(s)
        </label>
        <Select
          mode="multiple"
          value={selectedPids}
          onChange={setSelectedPids}
          size="large"
          className="w-full"
          placeholder="Choose one or more PIDs"
          allowClear
          showSearch
          optionFilterProp="children"
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
      {datasets.length > 0 ? (
        <div style={{ height: "700px" }}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, position: "bottom" },
                title: {
                  display: true,
                  text: "NOE per Date by PID",
                  font: { size: 18, weight: "bold" },
                },
                tooltip: {
                  mode: "index",
                  intersect: false, // show all overlapping lines
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}`,
                  },
                },
              },
              interaction: {
                mode: "nearest",
                axis: "x",
                intersect: false,
              },
              scales: {
                x: {
                  ticks: { font: { size: 12 } },
                },
                y: {
                  beginAtZero: true,
                  ticks: { font: { size: 12 } },
                },
              },
            }}
          />
        </div>
      ) : (
        <p className="text-gray-500">Select PID(s) to view data</p>
      )}
    </Card>
  );
}
