import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import Swal from "sweetalert2";
const ExcelUploader = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in";
  const [files, setFiles] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => {
      const allFiles = [...prevFiles, ...selectedFiles];
      // Remove duplicates by file name
      const uniqueFiles = Array.from(
        new Map(allFiles.map((file) => [file.name, file])).values()
      );
      return uniqueFiles;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0 || !inputText) {
      Swal.fire({
        icon: "warning",
        title: "Missing Input",
        text: "Please provide both at least one file and a column name.",
      });
      return;
    }

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append("files", file);
      console.log(`Added file ${index + 1}:`, file.name);
    });
    formData.append("column", inputText);

    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const uploadRes = await axios.post(`${apiUrl}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.status !== 200 || !uploadRes.data.zips?.length) {
        throw new Error("Upload succeeded but no zip files returned.");
      }

      const zipFiles = uploadRes.data.zips;

      for (const zipFile of zipFiles) {
        console.log(`Downloading: ${zipFile}`);
        const downloadRes = await axios.get(`${apiUrl}/download/${zipFile}`, {
          responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([downloadRes.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", zipFile);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

      Swal.fire({
        icon: "success",
        title: "Done!",
        text: `File(s) processed and downloaded in ${totalTime} seconds.`,
      });
    } catch (error) {
      console.error("Upload or download failed:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong. Check the console for details.",
      });
    } finally {
      setLoading(false);
      setFiles([]);
      setInputText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  };
  return (
    <div className="mt-[10%] flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white shadow-2xl rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">
          📥 Excel File Uploader
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-blue-800 font-semibold mb-2">
              Column Name
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter column name"
              className="w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-blue-800 font-semibold mb-2">
              Upload Excel Files
            </label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="w-full p-2 border border-dashed border-blue-400 rounded-md bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              multi
            />
            {files.length > 0 && (
              <ul className="mt-2 text-sm text-blue-600 list-disc pl-5">
                {files.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
            disabled={loading}>
            🚀 Submit
          </button>
        </form>

        {loading && (
          <div className="mt-4 text-center">
            <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="mt-2 text-blue-700">Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUploader;
