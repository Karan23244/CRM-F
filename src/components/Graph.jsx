import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Bar } from "react-chartjs-2";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ExcelGraphCompare = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sheetName, setSheetName] = useState("");
  const chartRefs = useRef([]);
  const [zipLoading, setZipLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setChartData([]);
    chartRefs.current = [];

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        let selectedSheetName = sheetName.trim() || wb.SheetNames[0];

        if (!wb.Sheets[selectedSheetName]) {
          alert(`❌ Sheet "${selectedSheetName}" not found.`);
          setLoading(false);
          return;
        }

        const ws = wb.Sheets[selectedSheetName];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (!rawData.length) {
          alert("❌ Empty file.");
          setLoading(false);
          return;
        }

        const headers = rawData[0];
        const dataRows = rawData.slice(1);
        const dateIndices = headers
          .map((h, i) => (String(h).toLowerCase() === "date" ? i : -1))
          .filter((i) => i !== -1);

        if (dateIndices.length < 2) {
          alert("❌ Need at least 2 'Date' blocks to compare.");
          setLoading(false);
          return;
        }

        const secondLastIndex = dateIndices[dateIndices.length - 2];
        const lastIndex = dateIndices[dateIndices.length - 1];
        const pidIndex = headers.indexOf("PID");

        const extractColumns = (rows, startIndex, keys) =>
          rows.map((row) => ({
            pid: row[pidIndex] || "Unknown",
            date: row[startIndex] || "Unknown",
            ...Object.fromEntries(
              keys.map((key, i) => [
                key.toLowerCase(),
                parseInt(row[startIndex + 1 + i], 10) || 0,
              ])
            ),
          }));

        const originalKeys = ["Install", "Realtime", "P360"];
        const newKeys = ["Event", "Realtime", "P360"];

        const secondLastBlockData = extractColumns(
          dataRows,
          secondLastIndex,
          originalKeys
        );
        const lastBlockData = extractColumns(dataRows, lastIndex, originalKeys);

        const secondLastNewData = extractColumns(
          dataRows,
          secondLastIndex + 5,
          newKeys
        );
        const lastNewData = extractColumns(dataRows, lastIndex + 5, newKeys);

        const groupedData = {};
        const groupedNewData = {};

        [...secondLastBlockData, ...lastBlockData].forEach((data) => {
          groupedData[data.pid] ||= {
            secondLast: { install: 0, realtime: 0, p360: 0 },
            last: { install: 0, realtime: 0, p360: 0 },
          };

          if (data.date === secondLastBlockData[0].date) {
            groupedData[data.pid].secondLast = {
              install: data.install,
              realtime: data.realtime,
              p360: data.p360,
            };
          } else if (data.date === lastBlockData[0].date) {
            groupedData[data.pid].last = {
              install: data.install,
              realtime: data.realtime,
              p360: data.p360,
            };
          }
        });

        [...secondLastNewData, ...lastNewData].forEach((data) => {
          groupedNewData[data.pid] ||= {
            secondLast: { event: 0, realtime: 0, p360: 0 },
            last: { event: 0, realtime: 0, p360: 0 },
          };

          groupedNewData[data.pid].secondLast = {
            event: data.event,
            realtime: data.realtime,
            p360: data.p360,
          };

          groupedNewData[data.pid].last = {
            event: data.event,
            realtime: data.realtime,
            p360: data.p360,
          };
        });

        const secondDate = secondLastBlockData[0]?.date || "Second Last";
        const lastDate = lastBlockData[0]?.date || "Last";

        const charts = [];

        Object.keys(groupedData).forEach((pid, index) => {
          const data = groupedData[pid];
          const chartData = {
            labels: ["Install", "Realtime", "P360"],
            datasets: [
              {
                label: `${pid} - ${secondDate}`,
                data: [
                  data.secondLast.install,
                  data.secondLast.realtime,
                  data.secondLast.p360,
                ],
                backgroundColor: "rgba(54, 162, 235, 0.6)",
              },
              {
                label: `${pid} - ${lastDate}`,
                data: [data.last.install, data.last.realtime, data.last.p360],
                backgroundColor: "rgba(255, 99, 132, 0.6)",
              },
            ],
          };

          charts.push(
            <div
              key={`${pid}-install`}
              className="bg-white rounded shadow p-4 w-full h-[400px]"
              ref={(el) => chartRefs.current.push(el)}>
              <h3 className="text-sm font-semibold mb-2">{`PID: ${pid} - Install/Realtime/P360`}</h3>
              <Bar
                data={chartData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          );
        });

        Object.keys(groupedNewData).forEach((pid) => {
          const data = groupedNewData[pid];
          const chartData = {
            labels: ["Event", "Realtime", "P360"],
            datasets: [
              {
                label: `${pid} - ${secondDate}`,
                data: [
                  data.secondLast.event,
                  data.secondLast.realtime,
                  data.secondLast.p360,
                ],
                backgroundColor: "rgba(153, 102, 255, 0.6)",
              },
              {
                label: `${pid} - ${lastDate}`,
                data: [data.last.event, data.last.realtime, data.last.p360],
                backgroundColor: "rgba(255, 206, 86, 0.6)",
              },
            ],
          };

          charts.push(
            <div
              key={`${pid}-event`}
              className="bg-white rounded shadow p-4 w-full h-[400px]"
              ref={(el) => chartRefs.current.push(el)}>
              <h3 className="text-sm font-semibold mb-2">{`PID: ${pid} - Event/Realtime/P360`}</h3>
              <Bar
                data={chartData}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          );
        });

        setChartData(charts);
      } catch (err) {
        console.error("❌ Error parsing Excel file:", err);
        alert("❌ An error occurred while processing the file.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
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
      folder.file(`chart_${i + 1}.png`, imgBase64, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "charts.zip");
    setZipLoading(false);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
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
          <div className="mb-6 flex items-center gap-4">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {chartData}
          </div>
        </>
      )}
    </div>
  );
};

export default ExcelGraphCompare;
