import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";

export const exportToExcel = async (rows, fileName = "data.xlsx") => {
  if (!rows?.length) {
    Swal.fire({
      icon: "warning",
      title: "No Data",
      text: "No data available",
    });
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const headers = Object.keys(rows[0].data);

    worksheet.columns = headers.map((h) => ({
      header: h,
      key: h,
      width: 18,
    }));

    // header style
    worksheet.getRow(1).font = {
      bold: true,
    };

    rows.forEach((rowObj) => {
      const row = worksheet.addRow(rowObj.data);

      headers.forEach((header, index) => {
        const style = rowObj.styles?.[header];

        if (!style) return;

        const cell = row.getCell(index + 1);

        // background color
        if (style.fill) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: `FF${style.fill.replace("#", "")}`,
            },
          };
        }

        // text color
        if (style.font) {
          cell.font = {
            bold: true,
            color: {
              argb: `FF${style.font.replace("#", "")}`,
            },
          };
        } else {
          cell.font = {
            bold: true,
          };
        }

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(new Blob([buffer]), fileName);

    Swal.fire({
      icon: "success",
      title: "Export Successful",
    });
  } catch (err) {
    console.error(err);

    Swal.fire({
      icon: "error",
      title: "Export Failed",
      text: err.message,
    });
  }
};
