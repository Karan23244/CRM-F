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
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileUpload = async (e) => {
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "No file selected",
        text: "Please choose an Excel file first.",
      });
      return;
    }

    setLoading(true);
    setChartData([]);
    chartRefs.current = [];

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sheetName", sheetName);

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
          className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-all duration-300 border border-gray-100"
          ref={(el) => chartRefs.current.push(el)}>
          <h3 className="text-[#2F5D99] text-base font-semibold mb-3 text-center">
            PID: {chart.pid} — {chart.labels.join(" / ")}
          </h3>
          <div className="h-[400px]">
            <Bar
              data={{
                labels: chart.labels,
                datasets: chart.datasets,
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: "#2F5D99", font: { size: 13 } } },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const actual =
                          context.dataset.actualValues?.[context.dataIndex] ??
                          context.raw;
                        return `${context.dataset.label}: ${actual}`;
                      },
                    },
                  },
                  datalabels: {
                    display: true,
                    color: "#1F2937",
                    font: { weight: "500", size: 12 },
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
                      color: "#2F5D99",
                      font: { size: 13, weight: "600" },
                    },
                    ticks: { color: "#555" },
                    grid: { color: "#E5E7EB" },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { color: "#555", stepSize: 10 },
                    grid: { color: "#E5E7EB" },
                  },
                },
                elements: {
                  bar: { borderRadius: 6 },
                },
              }}
            />
          </div>
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
    const pubidToPDF = new Map();

    for (let i = 0; i < chartRefs.current.length; i++) {
      const chartNode = chartRefs.current[i];
      const chartInfo = charts[i];
      if (!chartNode || !chartInfo) continue;

      const { pubid } = chartInfo;
      const canvas = await html2canvas(chartNode);
      const imgData = canvas.toDataURL("image/png");

      let pdf = pubidToPDF.get(pubid);
      if (!pdf) {
        pdf = new jsPDF("p", "mm", "a4");
        pubidToPDF.set(pubid, pdf);
      } else pdf.addPage();

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(
        pageWidth / canvas.width,
        pageHeight / canvas.height
      );
      const finalWidth = canvas.width * ratio;
      const finalHeight = canvas.height * ratio;

      pdf.addImage(
        imgData,
        "PNG",
        (pageWidth - finalWidth) / 2,
        10,
        finalWidth,
        finalHeight
      );
    }

    for (const [pubid, pdf] of pubidToPDF.entries()) {
      const pdfBlob = pdf.output("blob");
      zip.folder(pubid).file(`${pubid}.pdf`, pdfBlob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "charts.zip");
    setZipLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-10 px-4">
      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <h2 className="text-3xl font-semibold text-center text-[#2F5D99] mb-8">
          Excel Graph Comparison
        </h2>

        {/* Upload Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Enter Sheet Name (optional)"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#2F5D99] focus:border-transparent outline-none transition-all"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
          />

          <label className="flex-1 flex flex-col items-center justify-center px-6 py-4 border-2 border-dashed rounded-xl bg-[#F9FBFF] border-[#2F5D99]/40 cursor-pointer hover:border-[#2F5D99] transition-all">
            <span className="text-[#2F5D99] font-medium text-sm">
              Click to choose Excel file
            </span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="hidden"
            />
          </label>

          <button
            onClick={() => handleFileUpload()}
            disabled={!selectedFile || loading}
            className={`px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 ${
              !selectedFile || loading
                ? "bg-[#2F5D99] cursor-not-allowed"
                : "bg-[#2F5D99] hover:bg-[#24487A] shadow-md"
            }`}>
            {loading ? "⏳ Uploading..." : "Submit"}
          </button>
        </div>

        {loading && (
          <p className="text-center text-[#2F5D99] font-medium">
            Processing Excel file...
          </p>
        )}

        {/* Charts Section */}
        {chartData.length > 0 && (
          <>
            <div className="text-center mb-6">
              <button
                onClick={handleDownloadZip}
                disabled={zipLoading}
                className={`px-8 py-3 rounded-xl text-white font-semibold transition-all duration-300 ${
                  zipLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#2F5D99] hover:bg-[#24487A] shadow-md"
                }`}>
                {zipLoading ? "⏳ Preparing ZIP..." : "⬇️ Download All Charts"}
              </button>
              {zipLoading && (
                <p className="mt-2 text-sm text-gray-600">
                  Please wait, this may take a few seconds...
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {chartData}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExcelGraphCompare;
