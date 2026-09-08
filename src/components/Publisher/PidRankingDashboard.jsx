import React, { useEffect, useState } from "react";
import { Tabs, DatePicker, Spin, message, Select } from "antd";

import axios from "axios";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

import PidRankingSection from "./PidRankingSection";

const apiUrl = import.meta.env.VITE_API_URL2;

const API = `${apiUrl}/analytics/pid-ranking`;

const PidRankingDashboard = () => {
  const user = useSelector((state) => state.auth?.user);

  const [loading, setLoading] = useState(false);

  const [month, setMonth] = useState(dayjs());

  const [rankBy, setRankBy] = useState("revenue");

  const [data, setData] = useState(null);

  const fetchData = async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const payload = {
        user_id: user.id,
        role: user.role[0],

        month: month.format("YYYY-MM"),

        rank_by: "revenue",
      };

      const res = await axios.post(API, payload);

      setData(res.data);
    } catch (err) {
      console.error(err);

      message.error("Failed to load PID ranking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, rankBy, user?.id]);

  const items = [
    {
      key: "vertical",
      label: "Vertical",
      children: (
        <PidRankingSection
          type="vertical"
          data={data?.vertical || []}
          rankBy={rankBy}
        />
      ),
    },

    {
      key: "geo",
      label: "GEO",
      children: (
        <PidRankingSection type="geo" data={data?.geo || []} rankBy={rankBy} />
      ),
    },

    {
      key: "os",
      label: "OS",
      children: (
        <PidRankingSection type="os" data={data?.os || []} rankBy={rankBy} />
      ),
    },

    {
      key: "combination",
      label: "Vertical + GEO + OS",
      children: (
        <PidRankingSection
          type="combination"
          data={data?.combination || []}
          rankBy={rankBy}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}>
        <h2 style={{ margin: 0 }}>PID Ranking Dashboard</h2>

        <div
          style={{
            display: "flex",
            gap: 12,
          }}>
          <DatePicker
            picker="month"
            value={month}
            allowClear={false}
            onChange={(value) => {
              if (value) {
                setMonth(value);
              }
            }}
          />
        </div>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: 50,
          }}>
          <Spin size="large" />
        </div>
      ) : (
        <Tabs defaultActiveKey="vertical" items={items} />
      )}
    </div>
  );
};

export default PidRankingDashboard;
