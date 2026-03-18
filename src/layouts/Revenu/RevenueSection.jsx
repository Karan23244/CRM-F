import React from "react";
import { Table, Tag, Progress, Card, Typography } from "antd";
import StyledTable from "../../Utils/StyledTable";

const { Text } = Typography;

const getRevenueColor = (value, max) => {
  const percent = (value / max) * 100;
  if (percent > 70) return "green";
  if (percent > 40) return "orange";
  return "red";
};

const RevenueSection = ({ titleKey, data }) => {
  const mainData = data.map((item) => {
    const total = Number(item.total_revenue);
    const top = item.top_publishers?.[0];

    return {
      key: item[titleKey],
      name: item[titleKey],
      total,
      topPublisher: top?.pub_name || "-",
      topRevenue: Number(top?.revenue || 0),
      publishers: item.top_publishers || [],
    };
  });

  const maxRevenue = Math.max(...mainData.map((d) => d.total || 0));

  // Expanded table
  const expandedRowRender = (record) => {
    const total = record.total;

    const columns = [
      {
        title: "Rank",
        dataIndex: "rank",
        width: 60,
        align: "center",
      },
      {
        title: "Publisher",
        dataIndex: "pub_name",
        ellipsis: true,
        align: "center",
        render: (val, row) =>
          row.rank === 1 ? <Tag color="gold">🏆 {val}</Tag> : val,
      },
          {
        title: "Username",
        dataIndex: "username",
        ellipsis: true,
        align: "center",
        render: (val, row) =>
          row.rank === 1 ? <Tag color="gold">🏆 {val}</Tag> : val,
      },
      {
        title: "Revenue",
        dataIndex: "revenue",
        width: 180,
        align: "center",
        render: (val) => {
          const percent = total ? ((val / total) * 100).toFixed(1) : 0;

          return (
            <div style={{ textAlign: "center" }}>
              <Text strong>$ {Number(val).toLocaleString()}</Text>
            </div>
          );
        },
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={record.publishers}
        pagination={false}
        rowKey="pub_id"
        bordered
        tableLayout="fixed" // 🔥 important
        rowClassName={(_, index) =>
          index % 2 === 0 ? "table-row-light" : "table-row-dark"
        }
      />
    );
  };

  const columns = [
    {
      title: titleKey.toUpperCase(),
      align: "center",
      dataIndex: "name",
      width: 200,

      render: (val) => (
        <div>
          <Tag color="blue">{val}</Tag>
        </div>
      ),
    },
    {
      title: "Revenue Overview",
      dataIndex: "total",
      width: 320,
      align: "center",
      sorter: (a, b) => a.total - b.total,
      render: (val, record) => {
        const color = getRevenueColor(val, maxRevenue);
        const percent = maxRevenue ? ((val / maxRevenue) * 100).toFixed(1) : 0;

        return (
          <div>
            <Tag color={color}>$ {val.toLocaleString()}</Tag>
          </div>
        );
      },
    },
    {
      title: "Top Performer",
      dataIndex: "topPublisher",
      width: 260,
      align: "center",
      render: (val, record) => {
        const percent = record.total
          ? ((record.topRevenue / record.total) * 100).toFixed(1)
          : 0;

        return (
          <div>
            <Tag color="gold">🏆 {val}</Tag>
            <div style={{ fontSize: 12, color: "#666" }}>
              $ {record.topRevenue.toLocaleString()}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
      <Table
        columns={columns}
        dataSource={mainData}
        expandable={{ expandedRowRender }}
        pagination={false}
        bordered
        size="middle"
        tableLayout="fixed" // 🔥 important
      />
    </Card>
  );
};

export default RevenueSection;
