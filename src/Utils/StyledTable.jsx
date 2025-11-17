import React from "react";
import { Table, Card } from "antd";

/**
 * Universal Styled Table Component
 *
 * Props:
 *  - title?: string — Optional table heading
 *  - dataSource: array — Table data
 *  - columns: array — Column definitions
 *  - rowKey?: string — Unique key for each row (default: "id")
 *  - pagination?: object — AntD pagination config
 *  - scroll?: object — AntD scroll config
 *  - summary?: function — AntD summary row renderer
 *  - bordered?: boolean — Default false (styled border used)
 *  - className?: string — Optional Tailwind/extra classes
 */

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
  scroll = { x: "max-content" },
  summary,
  bordered = false,
  className = "",
}) => {
  return (
    <div className={` ${className}`}>
      {title && (
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      )}

      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey={rowKey}
        pagination={pagination}
        scroll={scroll}
        summary={summary}
        className="custom-table overflow-hidden"
      />

      {/* ✅ Universal Table Styling */}
      <style jsx>{`
        .custom-table .ant-table {
          overflow: hidden;
        }
        .custom-table .ant-table-thead > tr > th {
          background-color: #f3f6fb !important;
          color: #2f5d99 !important;
          font-weight: 600 !important;
          font-size: 14px !important;
          text-align: center;
          border-bottom: 1px solid #e5eaf2 !important;
          height:"100%";
        }
        .custom-table .ant-table-tbody > tr > td {
          text-align: center;
          font-size: 13px;
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background-color: #f9fbff !important;
          transition: background 0.3s ease;
        }
        .ant-table-summary {
          background-color: #f8fafc !important;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default StyledTable;
