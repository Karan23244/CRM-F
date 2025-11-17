import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Spin, Empty, Typography } from "antd";
import StyledTable from "../../Utils/StyledTable";

const { Title } = Typography;
const apiUrl = "https://gapi.clickorbits.in";

export default function PidsStable() {
  const [alertData, setAlertData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/pids-stable`) // adjust API URL
      .then((res) => res.json())
      .then((data) => {
        setAlertData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching Stable PIDs", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spin tip="Loading Stable PID’s..." size="large" />
      </div>
    );
  }

  if (!alertData.length) {
    return (
      <Card className="shadow-md rounded-lg mt-6">
        <Empty description="No Stable PID’s Found" />
      </Card>
    );
  }

  const tableData = alertData.flatMap((item) =>
    item.campaigns.map((c, idx) => ({
      key: `${item.pid}-${idx}`,
      pid: item.pid, // Always show PID
      campaign: c.campaign,
      zone: c.zone,
    }))
  );

  const columns = [
    {
      title: "PID",
      dataIndex: "pid",
      render: (text, row) => {
        const obj = {
          children: text,
          props: {},
        };
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
        Stable PID’s
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
