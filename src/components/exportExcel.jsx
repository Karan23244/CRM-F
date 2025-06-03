import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";

export const exportToExcel = (roleData, fileName = "data.xlsx") => {
  if (!roleData || roleData.length === 0) {
    console.error("❌ No data available for export.");
    Swal.fire({
      icon: "warning",
      title: "No Data",
      text: "⚠️ There is no data available to export!",
    });
    return;
  }

  try {
    // ✅ Convert JSON data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(roleData);

    // ✅ Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // ✅ Write the workbook and create a Blob
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const excelFile = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // ✅ Trigger file download
    saveAs(excelFile, fileName);

    Swal.fire({
      icon: "success",
      title: "Export Successful",
      text: "✅ Excel file has been exported successfully!",
    });
  } catch (error) {
    console.error("❌ Error exporting to Excel:", error);
    Swal.fire({
      icon: "error",
      title: "Export Failed",
      text: "❌ Something went wrong while exporting the Excel file.",
    });
  }
};
