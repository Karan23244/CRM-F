import React, { useMemo } from "react";
import { Table } from "antd";

const StyledTable = ({
  title,
  dataSource,
  columns,
  rowKey = "id",
  pagination = {
    pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
    showSizeChanger: true,
    defaultPageSize: 10,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
  },
  summary,
  bordered = false,
  className = "",
  defaultColWidth = 230,
  maxColWidth = 300,
  minColWidth = 120,
}) => {
  const normalizedColumns = useMemo(() => {
    return columns.map((col) => {
      const width = Math.min(
        Math.max(col.width ?? defaultColWidth, minColWidth),
        maxColWidth
      );

      return {
        ...col,
        width,
        ellipsis: false, // ❌ disable AntD ellipsis
        title: (
          <div
            className="header-cell-wrapper"
            title={typeof col.title === "string" ? col.title : undefined}>
            {col.title}
          </div>
        ),
      };
    });
  }, [columns, defaultColWidth, minColWidth, maxColWidth]);

  return (
    <div className={className}>
      {title && (
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      )}

      <Table
        bordered
        dataSource={dataSource}
        columns={normalizedColumns}
        rowKey={rowKey}
        pagination={pagination}
        summary={summary}
        tableLayout="fixed"
        scroll={{
          x: normalizedColumns.reduce((sum, col) => sum + col.width, 0), // 🔥 hard table width
          y: 600,
        }}
        className="custom-table"
      />

      <style jsx>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: #f3f6fb !important;
          color: #2f5d99 !important;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
          white-space: nowrap;
        }

        .custom-table .ant-table-tbody > tr > td {
          text-align: center;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .custom-table .ant-table-tbody > tr:hover > td {
          background-color: #f9fbff !important;
        }

        .custom-table .ant-table-summary {
          background-color: #f8fafc !important;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default StyledTable;
