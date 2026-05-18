import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Select, DatePicker, Spin, Button, Tag, Table, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { Resizable } from "react-resizable";
import dayjs from "dayjs";
import "react-resizable/css/styles.css";

const { RangePicker } = DatePicker;
const apiUrl = import.meta.env.VITE_API_URL;

const OPTIONAL_FIELDS = [
  { key: "p1", label: "P1" },
  { key: "p2", label: "P2" },
  { key: "p3", label: "P3" },
  { key: "p4", label: "P4" },
  { key: "p5", label: "P5" },
  { key: "total_payout", label: "Payout" },
];

const ResizableTitle = ({ onResize, width, ...restProps }) => {
  if (!width) return <th {...restProps} />;
  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}>
      <th {...restProps} />
    </Resizable>
  );
};

const Conversion = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [checkedRowKeys, setCheckedRowKeys] = useState([]);
  const [visibleOptionalFields, setVisibleOptionalFields] = useState([]);
  const [colWidths, setColWidths] = useState({});
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const fetchConversions = async (startDate, endDate) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiUrl}/get-conversions?startDate=${startDate}&endDate=${endDate}`,
      );
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error("Failed to fetch conversions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dateRange?.length) return;
    fetchConversions(
      dateRange[0].format("YYYY-MM-DD"),
      dateRange[1].format("YYYY-MM-DD"),
    );
  }, [dateRange]);

  const handleDownload = async () => {
    if (checkedRowKeys.length === 0) {
      messageApi.error("Please select a campaign to download.");
      return;
    }
    if (checkedRowKeys.length > 1) {
      messageApi.error("Please select only one campaign to download.");
      return;
    }

    const campaignId = checkedRowKeys[0];
    setDownloading(true);
    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");
      const res = await fetch(
        `${apiUrl}/get-conversions/${campaignId}/export?startDate=${startDate}&endDate=${endDate}`,
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
        `campaign_${campaignId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      messageApi.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleResize = useCallback(
    (key) => (_, { size }) => {
      setColWidths((prev) => ({ ...prev, [key]: size.width }));
    },
    [],
  );

  const campaignOptions = data.map((item) => ({
    value: item.campaign_id,
    label: `${item.campaign_name} (ID: ${item.campaign_id})`,
  }));

  const displayedData = useMemo(() => {
    if (selectedCampaigns.length === 0) return [];
    return data.filter((item) => selectedCampaigns.includes(item.campaign_id));
  }, [data, selectedCampaigns]);

  const allEventKeys = useMemo(() => {
    const keys = new Set();
    displayedData.forEach((item) =>
      item.event_data?.forEach((ev) => keys.add(ev.event)),
    );
    return [...keys];
  }, [displayedData]);

  const tableData = useMemo(
    () =>
      displayedData.map((item) => {
        const eventMap = {};
        item.event_data?.forEach((ev) => {
          eventMap[ev.event] = ev.count;
        });
        const totalEvents = item.event_data?.reduce((s, e) => s + e.count, 0) ?? 0;
        return {
          key: item.campaign_id,
          campaign_id: item.campaign_id,
          campaign_name: item.campaign_name,
          total_clicks: item.total_clicks,
          total_events: totalEvents,
          conversion_rate: item.conversion_rate,
          ...eventMap,
          ...OPTIONAL_FIELDS.reduce((acc, f) => {
            acc[f.key] = item[f.key];
            return acc;
          }, {}),
        };
      }),
    [displayedData],
  );

  const rawColumns = useMemo(() => {
    const base = [
      {
        title: "Campaign ID",
        dataIndex: "campaign_id",
        key: "campaign_id",
        width: 120,
        sorter: (a, b) => a.campaign_id - b.campaign_id,
      },
      {
        title: "Campaign Name",
        dataIndex: "campaign_name",
        key: "campaign_name",
        width: 200,
        sorter: (a, b) => (a.campaign_name || "").localeCompare(b.campaign_name || ""),
      },
      {
        title: "Total Clicks",
        dataIndex: "total_clicks",
        key: "total_clicks",
        width: 130,
        sorter: (a, b) => (a.total_clicks ?? 0) - (b.total_clicks ?? 0),
      },
      ...allEventKeys.map((event) => ({
        title: <span className="capitalize">{event}</span>,
        dataIndex: event,
        key: event,
        width: 130,
        render: (val) => val ?? 0,
        sorter: (a, b) => (a[event] ?? 0) - (b[event] ?? 0),
      })),
      {
        title: "Total Events",
        dataIndex: "total_events",
        key: "total_events",
        width: 130,
        sorter: (a, b) => a.total_events - b.total_events,
      },
      {
        title: "Conversion Rate",
        dataIndex: "conversion_rate",
        key: "conversion_rate",
        width: 150,
        render: (val) => (
          <Tag color="blue">
            {val !== null && val !== undefined ? `${val}%` : "—"}
          </Tag>
        ),
        sorter: (a, b) =>
          parseFloat(a.conversion_rate ?? 0) - parseFloat(b.conversion_rate ?? 0),
      },
    ];

    const optionalCols = visibleOptionalFields.map((field) => {
      const meta = OPTIONAL_FIELDS.find((f) => f.key === field);
      return {
        title: meta?.label || field,
        dataIndex: field,
        key: field,
        width: 120,
        render: (val) => (val !== null && val !== undefined ? val : "—"),
      };
    });

    return [...base, ...optionalCols];
  }, [allEventKeys, visibleOptionalFields]);

  const columns = useMemo(
    () =>
      rawColumns.map((col) => ({
        ...col,
        width: colWidths[col.key] ?? col.width,
        onHeaderCell: (column) => ({
          width: column.width,
          onResize: handleResize(col.key),
        }),
      })),
    [rawColumns, colWidths, handleResize],
  );

  const rowSelection = {
    selectedRowKeys: checkedRowKeys,
    onChange: (keys) => setCheckedRowKeys(keys),
    columnWidth: 48,
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      {contextHolder}
      {/* Page header */}
      <div className="py-4 border-b border-gray-100 mb-5">
        <h2 className="text-2xl font-semibold text-gray-800">Conversions</h2>
        <p className="text-gray-500 text-sm mt-1">
          View and manage conversion data for publishers and campaigns.
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (!dates) return;
            setDateRange(dates);
          }}
          allowClear={false}
          style={{ width: 260 }}
        />

        <Select
          mode="multiple"
          allowClear
          placeholder="Filter by campaign(s)..."
          value={selectedCampaigns}
          onChange={(vals) => {
            setSelectedCampaigns(vals ?? []);
            setCheckedRowKeys([]);
          }}
          options={campaignOptions}
          style={{ minWidth: 280 }}
          maxTagCount="responsive"
        />

        <Select
          mode="multiple"
          allowClear
          placeholder="Show optional fields..."
          value={visibleOptionalFields}
          onChange={setVisibleOptionalFields}
          style={{ minWidth: 220 }}
          maxTagCount="responsive">
          {OPTIONAL_FIELDS.map(({ key, label }) => (
            <Select.Option key={key} value={key}>
              {label}
            </Select.Option>
          ))}
        </Select>

        <Button
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          loading={downloading}
          className="!bg-[#1d3557] hover:!bg-[#152840] !text-white !border-none">
          Download Excel
        </Button>
      </div>

      {/* Summary */}
      {displayedData.length > 0 && (
        <div className="flex gap-4 mb-4 text-sm text-gray-500">
          <span>
            Showing{" "}
            <strong className="text-gray-700">{displayedData.length}</strong>{" "}
            campaign{displayedData.length !== 1 ? "s" : ""}
          </span>
          <span>
            Total Clicks:{" "}
            <strong className="text-gray-700">
              {displayedData
                .reduce((s, i) => s + (i.total_clicks ?? 0), 0)
                .toLocaleString()}
            </strong>
          </span>
          {checkedRowKeys.length > 0 && (
            <span className="text-[#1d3557] font-medium">
              {checkedRowKeys.length} row{checkedRowKeys.length > 1 ? "s" : ""} selected
            </span>
          )}
        </div>
      )}

      {/* Table / empty state */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : selectedCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <svg
            width="56"
            height="56"
            fill="none"
            viewBox="0 0 24 24"
            className="mb-4 opacity-40">
            <path
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z"
            />
          </svg>
          <p className="text-base font-medium">No campaign selected</p>
          <p className="text-sm mt-1">
            Select one or more campaigns above to view their conversion data.
          </p>
        </div>
      ) : (
        <Table
          bordered
          dataSource={tableData}
          columns={columns}
          rowKey="campaign_id"
          loading={loading}
          tableLayout="fixed"
          rowSelection={rowSelection}
          scroll={{
            x: columns.reduce((s, c) => s + (colWidths[c.key] ?? c.width ?? 150), 0) + 48,
            y: 600,
          }}
          components={{ header: { cell: ResizableTitle } }}
          pagination={{
            pageSizeOptions: ["10", "20", "50"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
          className="conversion-table"
        />
      )}

      <style>{`
        .conversion-table .ant-table-thead > tr > th {
          background-color: #f3f6fb !important;
          color: #2f5d99 !important;
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
          position: relative;
          overflow: visible !important;
        }
        .conversion-table .ant-table-tbody > tr > td {
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .conversion-table .ant-table-tbody > tr:hover > td {
          background-color: #f9fbff !important;
        }
        .conversion-table .react-resizable-handle {
          position: absolute;
          right: -5px;
          bottom: 0;
          z-index: 1;
          width: 10px;
          height: 100%;
          cursor: col-resize;
          background: none;
        }
        .conversion-table .react-resizable-handle::after {
          content: '';
          position: absolute;
          right: 4px;
          top: 20%;
          height: 60%;
          width: 2px;
          background: #d0d9e8;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default Conversion;
