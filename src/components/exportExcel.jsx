import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportToExcel = (roleData, fileName = "data.xlsx") => {
    if (!roleData || roleData.length === 0) {
        console.error("❌ No data available for export.");
        return;
    }

    try {
        // ✅ Convert JSON data to a worksheet
        const worksheet = XLSX.utils.json_to_sheet(roleData);

        // ✅ Create a new workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        // ✅ Write the workbook and create a Blob
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const excelFile = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

        // ✅ Trigger file download
        saveAs(excelFile, fileName);

        console.log("✅ Excel file exported successfully!");
    } catch (error) {
        console.error("❌ Error exporting to Excel:", error);
    }
};