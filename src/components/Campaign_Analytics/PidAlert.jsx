import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Spin, Empty, Typography } from "antd";
import StyledTable from "../../Utils/StyledTable";

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

  // Flatten the data without forcing pid = ""
  const tableData = alertData.flatMap((item) =>
    item.campaigns.map((c, idx) => ({
      key: `${item.pid}-${idx}`,
      pid: item.pid, // always keep pid
      campaign: c.campaign,
      zone: c.zone,
    }))
  );

  const columns = [
    {
      title: "PID",
      dataIndex: "pid",
      render: (text) => text,
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
      <StyledTable
        columns={columns}
        dataSource={tableData}
        pagination={{
          pageSizeOptions: ["10", "20", "50", "100", "200", "300"],
          showSizeChanger: true,
          defaultPageSize: 10,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        bordered
      />
    </Card>
  );
}
