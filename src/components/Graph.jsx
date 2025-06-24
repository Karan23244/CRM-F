import { useState, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import jsPDF from "jspdf";
import Chart from "chart.js/auto";
import Swal from "sweetalert2";
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
const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in";

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
    console.log(sheetName)
    try {
      const res = await fetch(`${apiUrl}/process-excel`, {
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
      Swal.fire({
        icon: "error",
        title: "File Processing Failed",
        text: "❌ Failed to process the uploaded Excel file. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDownloadZip = async () => {
    setZipLoading(true);
    const zip = new JSZip();

    // Map of pubid → jsPDF instance
    const pubidToPDF = new Map();

    for (let i = 0; i < chartRefs.current.length; i++) {
      const chartNode = chartRefs.current[i];
      const chartInfo = charts[i];

      if (!chartNode || !chartInfo) continue;

      const { pubid, pid, labels } = chartInfo;
      const chartType = labels?.[0] === "Install" ? "Install" : "Event";

      // Render canvas and convert to image
      const canvas = await html2canvas(chartNode);
      const imgData = canvas.toDataURL("image/png");

      // Create or get jsPDF for this pubid
      let pdf = pubidToPDF.get(pubid);
      if (!pdf) {
        pdf = new jsPDF("p", "mm", "a4");
        pubidToPDF.set(pubid, pdf);
      } else {
        pdf.addPage();
      }

      // Calculate dimensions to fit A4
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;

      pdf.addImage(
        imgData,
        "PNG",
        (pageWidth - finalWidth) / 2,
        10, // top margin
        finalWidth,
        finalHeight
      );
    }

    // Save all PDFs in ZIP under respective pubid folder
    for (const [pubid, pdf] of pubidToPDF.entries()) {
      const pdfBlob = pdf.output("blob");
      const folder = zip.folder(pubid);
      folder.file(`${pubid}.pdf`, pdfBlob);
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
