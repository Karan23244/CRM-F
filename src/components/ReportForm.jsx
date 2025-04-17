import React, { useState } from "react";
import * as XLSX from "xlsx";

const ExcelUploader = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [inputText, setInputText] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file first.");
      return;
    }
    
  };

  return (
    <div className=" flex items-center mt-[10%] justify-center px-4">
      <div className="w-full max-w-xl bg-white shadow-2xl rounded-2xl p-8 ">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">
          📥 Excel File Uploader
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-blue-800 font-semibold mb-2">
              Title / Description
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter a title or note..."
              className="w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-blue-800 font-semibold mb-2">
              Upload Excel File
            </label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="w-full p-2 border border-dashed border-blue-400 rounded-md bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
            🚀 Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExcelUploader;
