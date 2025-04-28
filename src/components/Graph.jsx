import { useState, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import Chart from "chart.js/auto";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
Chart.register(ChartDataLabels);
const ExcelGraphCompare = () => {
  const [chartData, setChartData] = useState([]);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sheetName, setSheetName] = useState("");
  const chartRefs = useRef([]);
  const [zipLoading, setZipLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setChartData([]);
    chartRefs.current = [];

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sheetName", sheetName);

    try {
      const res = await fetch("http://localhost:4001/process-excel", {
        method: "POST",
        body: formData,
      });

      const { charts } = await res.json();
      setCharts(charts);
      const newCharts = charts.map((chart, index) => (
        <div
          key={`${chart.pid}-${chart.type}`}
          className="p-4 w-full h-[500px]"
          ref={(el) => chartRefs.current.push(el)}>
          <h3 className="text-base font-semibold mb-2">{`PID: ${
            chart.pid
          } - ${chart.labels.join("/")}`}</h3>
          <Bar
            data={{
              labels: chart.labels,
              datasets: chart.datasets,
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const actual =
                        context.dataset.actualValues?.[context.dataIndex] ??
                        context.raw;
                      return `${context.dataset.label}: ${actual}`;
                    },
                  },
                },
                datalabels: {
                  display: true,
                  formatter: function (value, context) {
                    const actual =
                      context.dataset.actualValues?.[context.dataIndex] ??
                      value;
                    return `${actual}`; // Display the actual value
                  },
                  color: "black", // Label color inside bars
                  font: {
                    weight: "medium",
                    size: 14,
                  },
                  anchor: "center",
                  align: "center",
                  offset: 4,
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text:
                      chart.labels[0] === "Install"
                        ? "Install vs Realtime"
                        : "Event vs Realtime",
                  },
                  grid: {
                    display: true, // Show grid lines for x-axis
                  },
                },
                y: {
                  beginAtZero: true, // Ensure the y-axis starts from 0
                  max: 100, // Set max to the highest value + padding
                  ticks: {
                    stepSize: 10, // Adjust step size to create more tick marks
                    min: 0, // Ensure the y-axis starts from 0
                    max: 100, // Set the max value based on the data
                  },
                  grid: {
                    color: "#BFBFBF", // Light grid color for a cleaner look
                  },
                },
              },
              elements: {
                bar: {
                  borderRadius: 5, // Rounded corners for bars
                  borderWidth: 1, // Optional: Border width around bars
                },
              },
              layout: {
                padding: 10, // Padding around the chart for a cleaner look
              },
            }}
          />
        </div>
      ));

      setChartData(newCharts);
    } catch (error) {
      console.error("❌ Error processing file:", error);
      alert("❌ Failed to process file.");
    } finally {
      setLoading(false);
    }
  };
  const handleDownloadZip = async () => {
    setZipLoading(true);
    const zip = new JSZip();
    const folder = zip.folder("charts");

    for (let i = 0; i < chartRefs.current.length; i++) {
      const chartNode = chartRefs.current[i];
      if (!chartNode) continue;

      const canvas = await html2canvas(chartNode);
      const imgData = canvas.toDataURL("image/png");
      const imgBase64 = imgData.split(",")[1];

      // Corrected line: using backticks for template literals
      folder.file(`chart_${i + 1}.png`, imgBase64, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "charts.zip");
    setZipLoading(false);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h2 className="text-xl font-bold mb-4">
        📊 Upload Excel File to Compare
      </h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Enter Sheet Name (optional)"
          className="border px-3 py-2 rounded w-full sm:w-1/2"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
        />
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="w-full sm:w-1/2"
        />
      </div>

      {loading && (
        <p className="text-blue-600 font-medium">⏳ Processing Excel file...</p>
      )}

      {chartData.length > 0 && (
        <>
          <div className="mb-6 flex flex-col gap-4">
            <button
              className={`px-4 py-2 rounded text-white font-semibold ${
                zipLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              onClick={handleDownloadZip}
              disabled={zipLoading}>
              {zipLoading
                ? "⏳ Preparing ZIP..."
                : "⬇️ Download All Charts as ZIP"}
            </button>
            {zipLoading && (
              <span className="text-sm text-gray-600">
                This might take a few seconds...
              </span>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {chartData}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExcelGraphCompare;
