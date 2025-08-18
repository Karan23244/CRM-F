import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Spin, Empty, Typography } from "antd";

const { Title } = Typography;
const apiUrl = "https://gapi.clickorbits.in";

export default function PidsOnAlert() {
  const [alertData, setAlertData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/pids-on-alert`) // adjust API URL
      .then((res) => res.json())
      .then((data) => {
        setAlertData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching PID alerts", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spin tip="Loading PID alerts..." size="large" />
      </div>
    );
  }

  if (!alertData.length) {
    return (
      <Card className="shadow-md rounded-lg mt-6">
        <Empty description="No PID’s on Alert" />
      </Card>
    );
  }

  // Flatten the data for Ant Design's Table
  const tableData = alertData.flatMap((item) =>
    item.campaigns.map((c, idx) => ({
      key: `${item.pid}-${idx}`,
      pid: idx === 0 ? item.pid : "", // show only once
      campaign: c.campaign,
      zone: c.zone,
      rowSpan: item.campaigns.length,
    }))
  );

  const columns = [
    {
      title: "PID",
      dataIndex: "pid",
      render: (text, row, index) => {
        const obj = {
          children: text,
          props: {},
        };
        // Merge rows for PID
        if (row.pid) {
          obj.props.rowSpan = row.rowSpan;
        } else {
          obj.props.rowSpan = 0;
        }
        return obj;
      },
    },
    {
      title: "Campaign Name",
      dataIndex: "campaign",
    },
    {
      title: "Zone",
      dataIndex: "zone",
      render: (zone) => {
        let color = "";
        if (zone === "Red") color = "red";
        else if (zone === "Orange") color = "orange";
        else if (zone === "Yellow") color = "gold";
        else if (zone === "Green") color = "green";
        return <Tag color={color}>{zone}</Tag>;
      },
    },
  ];

  return (
    <Card className="shadow-md rounded-lg mt-6" bordered={false}>
      <Title level={4} style={{ marginBottom: 16 }}>
        PID’s on Alert
      </Title>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50"],
          showQuickJumper: true,
        }}
        bordered
      />
    </Card>
  );
}
