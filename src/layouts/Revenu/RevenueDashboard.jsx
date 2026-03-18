import React, { useEffect, useState } from "react";
import { Tabs, DatePicker, Spin, message } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import RevenueSection from "./RevenueSection";
import { useSelector } from "react-redux";

const { TabPane } = Tabs;
const apiUrl = import.meta.env.VITE_API_URL;

const API = `${apiUrl}/analytics/revenue`;

const RevenueDashboard = () => {
  const user = useSelector((state) => state.auth?.user);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(dayjs());
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.post(API, {
        user_id: user.id,
        role: user.role[0],
        month: month.format("YYYY-MM"),
      });

      setData(res.data);
    } catch (err) {
      message.error("Failed to load revenue data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <h2 style={{ margin: 0 }}>Revenue Dashboard</h2>

        <DatePicker
          picker="month"
          value={month}
          onChange={(val) => setMonth(val)}
        />
      </div>

      {loading ? (
        <Spin />
      ) : (
        data && (
          <Tabs defaultActiveKey="geo">
            <TabPane tab="Geo" key="geo">
              <RevenueSection titleKey="geo" data={data.geo} />
            </TabPane>

            <TabPane tab="Vertical" key="vertical">
              <RevenueSection titleKey="vertical" data={data.vertical} />
            </TabPane>

            <TabPane tab="OS" key="os">
              <RevenueSection titleKey="os" data={data.os} />
            </TabPane>
          </Tabs>
        )
      )}
    </div>
  );
};

export default RevenueDashboard;
