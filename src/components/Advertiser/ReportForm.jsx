import React, { useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const ExcelUploader = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "https://apii.clickorbits.in";
  const [files, setFiles] = useState([]);
  const [inputText, setInputText] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => {
      const allFiles = [...prevFiles, ...selectedFiles];
      const uniqueFiles = Array.from(
        new Map(allFiles.map((file) => [file.name, file])).values()
      );
      return uniqueFiles;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedColumn = inputText.trim();
    const trimmedCampaign = campaignName.trim();

    if (files.length === 0 || !trimmedColumn || !trimmedCampaign) {
      Swal.fire({
        icon: "warning",
        title: "Missing Input",
        text: "Please provide a campaign name, at least one file, and a column name.",
      });
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("column", trimmedColumn);
    formData.append("campaign_name", trimmedCampaign);

    setLoading(true);
    const startTime = Date.now();

    try {
      const uploadRes = await axios.post(`${apiUrl}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (uploadRes.status !== 200 || !uploadRes.data.zips?.length) {
        throw new Error("Upload succeeded but no zip files returned.");
      }

      for (const zipFile of uploadRes.data.zips) {
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
        title: "Success!",
        text: `Files processed and downloaded in ${totalTime} seconds.`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
      setFiles([]);
      setInputText("");
      setCampaignName("");
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F5F7FA] px-4">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl p-10">
        <h2 className="text-3xl font-semibold text-center text-[#2F5D99] mb-8">
          Generate Reports
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div>
            <label className="block text-[#2F5D99] font-medium mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Enter campaign name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2F5D99] focus:border-transparent outline-none transition-all duration-200"
            />
          </div>

          {/* Column Name */}
          <div>
            <label className="block text-[#2F5D99] font-medium mb-2">
              Column Name
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter column name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2F5D99] focus:border-transparent outline-none transition-all duration-200"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-[#2F5D99] font-medium mb-2">
              Upload Excel Files
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-[#F9FBFF] border-[#2F5D99]/40 hover:border-[#2F5D99] transition-all duration-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-3 text-[#2F5D99]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                    />
                  </svg>
                  <p className="text-sm text-[#2F5D99]/80 font-medium">
                    Click to upload or drag & drop files
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    .xlsx, .xls, .csv allowed
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {files.length > 0 && (
              <ul className="mt-3 text-sm text-[#2F5D99] list-disc pl-5 space-y-1">
                {files.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2F5D99] hover:bg-[#24487A] text-white font-semibold rounded-xl shadow-md transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Processing..." : "Upload Files"}
          </button>
        </form>

        {/* Loading Spinner */}
        {loading && (
          <div className="mt-6 text-center">
            <div className="animate-spin inline-block w-10 h-10 border-4 border-[#2F5D99] border-t-transparent rounded-full"></div>
            <p className="mt-3 text-[#2F5D99] font-medium">Please wait...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUploader;
