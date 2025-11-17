import React, { useMemo, useState } from "react";
import { Card, Select, Typography } from "antd";
import { Line } from "react-chartjs-2";

const { Title, Text } = Typography;
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

  const colorPalette = [
    "#2F5D99",
    "#5B8DEF",
    "#46C2CB",
    "#F6C90E",
    "#FF785A",
    "#9B5DE5",
    "#00BFA6",
    "#FF66A6",
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
        backgroundColor: color + "40", // translucent fill
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: "#fff",
        pointBorderColor: color,
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: getPointStyleForIndex(idx),
      };
    });
  }, [selectedPids, rawData, selectedCampaign, allDates]);

  const chartData = {
    labels: allDates,
    datasets,
  };

  return (
    <Card
      className="mt-8 rounded-2xl shadow-xl border border-gray-100 bg-white/90 backdrop-blur-sm transition-transform"
      bodyStyle={{ padding: "2rem" }}>
      {/* Header */}
      <div className=" mb-6">
        <Title level={4} className="!m-0 text-[#2F5D99] font-semibold">
         Performance Comparison
        </Title>
      </div>

      {/* PID Multi-Select */}
      <div className="mb-6">
        <label className="block mb-2 font-medium text-[#2F5D99]">
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
          }
          dropdownStyle={{
            borderRadius: "0.75rem",
            padding: "0.5rem",
          }}>
          {pids.map((pid) => (
            <Option key={pid} value={pid}>
              {pid}
            </Option>
          ))}
        </Select>
      </div>

      {/* Chart Area */}
      {datasets.length > 0 ? (
        <div className="bg-gradient-to-br from-[#F8FAFD] to-[#EFF3FA] p-4 rounded-xl shadow-inner border border-gray-100">
          <div style={{ height: "500px" }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: "bottom",
                    labels: {
                      color: "#2F5D99",
                      font: { size: 12 },
                    },
                  },
                  title: {
                    display: true,
                    text: "NOE per Date by PID",
                    color: "#2F5D99",
                    font: { size: 16, weight: "bold" },
                    padding: { top: 10, bottom: 20 },
                  },
                  tooltip: {
                    backgroundColor: "rgba(47,93,153,0.9)",
                    titleFont: { weight: "bold" },
                    bodyFont: { size: 12 },
                    cornerRadius: 6,
                    padding: 10,
                  },
                },
                interaction: {
                  mode: "nearest",
                  axis: "x",
                  intersect: false,
                },
                scales: {
                  x: {
                    ticks: { color: "#4B5563", font: { size: 12 } },
                    grid: { color: "#E5E7EB" },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { color: "#4B5563", font: { size: 12 } },
                    grid: { color: "#E5E7EB" },
                  },
                },
              }}
            />
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-4">
          Select one or more PIDs to view comparison data.
        </p>
      )}
    </Card>
  );
}
