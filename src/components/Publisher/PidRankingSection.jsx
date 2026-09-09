import React, { useState } from "react";
import StyledTable from "../../Utils/StyledTable";
import { Table, Tag, Card, Typography } from "antd";

const { Text } = Typography;

const currency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const number = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

const getGroupName = (item, type) => {
  if (type === "combination") {
    return `${item.vertical} / ${item.geo} / ${item.os}`;
  }

  return item[type] || "UNKNOWN";
};

const getRankMetric = (item, rankBy) => {
  switch (rankBy) {
    case "pub_apno":
      return number(item.total_pub_apno);

    case "adv_total_number":
      return number(item.total_adv_number);

    case "approval_rate":
      return `${Number(item.approval_rate || 0).toFixed(2)}%`;

    case "revenue":
    default:
      return `$ ${currency(item.revenue)}`;
  }
};

const PidRankingSection = ({ type, data = [], rankBy }) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const mainData = data.map((item, index) => {
    const topPid = item.top_pids?.[0];

    return {
      ...item,

      key:
        type === "combination"
          ? `${item.vertical}-${item.geo}-${item.os}`
          : `${type}-${item[type]}-${index}`,

      groupName: getGroupName(item, type),

      topPid,
    };
  });

  const expandedRowRender = (record) => {
    const columns = [
      {
        title: "Rank",
        dataIndex: "rank",
        width: 75,
        align: "center",

        render: (rank) => {
          if (rank === 1) {
            return <Tag color="gold">🏆 #1</Tag>;
          }

          if (rank === 2) {
            return <Tag color="default">#2</Tag>;
          }

          if (rank === 3) {
            return <Tag color="orange">#3</Tag>;
          }

          return `#${rank}`;
        },
      },

      {
        title: "PID",
        dataIndex: "pid",
        width: 220,
        ellipsis: true,

        render: (pid, row) => {
          if (row.rank === 1) {
            return <Tag color="gold">{pid}</Tag>;
          }

          return <Text strong>{pid}</Text>;
        },
      },

      {
        title: "Publisher",
        width: 200,
        ellipsis: true,

        render: (_, row) => (
          <div>
            <div>{row.pub_name || "-"}</div>

            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.username || "-"}
            </Text>
          </div>
        ),
      },

      {
        title: "Revenue",
        dataIndex: "revenue",
        width: 145,
        align: "right",

        sorter: (a, b) => Number(a.revenue) - Number(b.revenue),

        render: (value) => <Text strong>$ {currency(value)}</Text>,
      },

      {
        title: "Campaigns",
        dataIndex: "campaign_count",
        width: 105,
        align: "center",
      },
    ];

    return (
      <StyledTable
        columns={columns}
        dataSource={record.top_pids || []}
        rowKey={(row) => `${row.pub_id}-${row.pid}`}
        bordered
        pagination={false}
      />
    );
  };

  const columns = [
    {
      title:
        type === "combination" ? "Vertical / GEO / OS" : type.toUpperCase(),

      dataIndex: "groupName",
      width: type === "combination" ? 300 : 180,

      render: (value) => <Tag color="blue">{value}</Tag>,
    },

    {
      title: "Total Revenue",
      dataIndex: "total_revenue",
      width: 170,
      align: "right",

      sorter: (a, b) => Number(a.total_revenue) - Number(b.total_revenue),

      render: (value) => <Tag color="green">$ {currency(value)}</Tag>,
    },

    {
      title: "PIDs",
      dataIndex: "pid_count",
      width: 100,
      align: "center",

      sorter: (a, b) => Number(a.pid_count) - Number(b.pid_count),
    },

    {
      title: "Top PID",
      dataIndex: "topPid",
      width: 250,

      render: (topPid) => {
        if (!topPid) {
          return "-";
        }

        return (
          <div>
            <Tag color="gold">🏆 {topPid.pid}</Tag>

            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#666",
              }}>
              {getRankMetric(topPid, rankBy)}
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
      <StyledTable
        columns={columns}
        dataSource={mainData}
        rowKey="key"
        expandable={{
          expandedRowRender,

          expandedRowKeys,

          onExpand: (expanded, record) => {
            setExpandedRowKeys(expanded ? [record.key] : []);
          },
        }}
        bordered
      />
    </Card>
  );
};

export default PidRankingSection;
