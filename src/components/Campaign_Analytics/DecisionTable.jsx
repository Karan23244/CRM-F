import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Tag,
  Card,
  Typography,
  message,
  Spin,
  Popover,
} from "antd";
import axios from "axios";
import { useSelector } from "react-redux";

const API = import.meta.env.VITE_API_URL2;
const apiUrl = import.meta.env.VITE_API_URL;

const { Title } = Typography;

const DecisionTable = ({ campaign_name, os, lastdate }) => {
  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [subadmins, setSubadmins] = useState([]);

  // ================= ACCESS =================
  const allowedRoles = [
    "publisher_manager",
    "publisher",
    "pub_executive",
  ];

  const hasAccess = user?.role?.some((r) => allowedRoles.includes(r));

  // ================= FETCH SUBADMINS =================
  const fetchSubadmins = async () => {
    try {
      const res = await axios.get(`${apiUrl}/get-subadmin`);

      setSubadmins(res.data?.data || []);
    } catch (err) {
      console.error("Subadmin fetch error", err);
    }
  };

  // ================= FETCH DECISION DATA =================
  const fetchDecisionData = async () => {
    try {
      setLoading(true);

      const payload = {
        campaign_name,
        os,
        date: lastdate,
      };

      console.log("Fetching decision data with payload:", payload);

      const res = await axios.post(
        `${API}/api/decision`,
        payload,
      );

      if (res.data?.success) {
        setDataSource(res.data.data || []);
      } else {
        message.error("Failed to fetch data");
      }
    } catch (error) {
      console.error(error);
      message.error("API Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchDecisionData();
      fetchSubadmins();
    }
  }, [campaign_name, os, lastdate, hasAccess]);

  // ================= FILTER DATA BY USER =================
  const filteredData = useMemo(() => {
    const normalize = (val) =>
      val === null || val === undefined || val === ""
        ? "-"
        : val.toString().trim().toLowerCase();

    if (!hasAccess) return [];

    const username = normalize(user?.username);

    const assignedIds = user?.assigned_subadmins || [];

    // assigned subadmin usernames
    const assignedNames = subadmins
      .filter((s) => assignedIds.includes(s.id))
      .map((s) => normalize(s.username));

    return dataSource.filter((item) => {
      const pubam = normalize(item.pubam);

      // own data
      if (pubam === username) return true;

      // assigned subadmin data
      if (assignedNames.includes(pubam)) return true;

      // only publisher_manager can see n/a
      if (
        user?.role?.includes("publisher_manager") &&
        (pubam === "n/a" || pubam === "-")
      ) {
        return true;
      }

      return false;
    });
  }, [dataSource, user, subadmins, hasAccess]);

  // ================= STATUS COLOR =================
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "live":
        return "green";
      case "pause":
        return "red";
      default:
        return "orange";
    }
  };

  // ================= GRADE COLOR =================
  const getGradeColor = (grade) => {
    if (grade === "A") return "green";
    if (grade === "B") return "blue";
    if (grade === "C") return "orange";
    return "red";
  };

  // ================= ELIGIBILITY POPUP =================
  const renderEligibility = (flags) => {
    return (
      <div className="w-[260px] rounded-xl overflow-hidden shadow-lg bg-white">
        <div className="p-3 space-y-2">
          {Object.entries(flags || {}).map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
            >
              <span className="text-gray-700 text-sm capitalize">
                {key.replace("_", " ")}
              </span>

              <Tag
                color={value ? "green" : "red"}
                className="rounded-full px-2"
              >
                {value ? "✔" : "✖"}
              </Tag>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ================= METRICS POPUP =================
  const renderMetrics = (metrics) => {
    return (
      <div className="w-[300px] rounded-xl overflow-hidden shadow-xl bg-white">
        <div className="p-3 space-y-2">
          {Object.entries(metrics || {}).map(([key, val]) => (
            <div
              key={key}
              className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
            >
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase">
                  {key}
                </span>

                <span className="font-semibold text-gray-800">
                  {val?.value}
                </span>
              </div>

              <Tag
                color={getGradeColor(val?.grade)}
                className="text-sm px-2 py-0.5 rounded-full"
              >
                {val?.grade}
              </Tag>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ================= TABLE COLUMNS =================
  const columns = [
    {
      title: "Pub AM",
      dataIndex: "pubam",
      key: "pubam",
      width: 180,
      render: (text) => (
        <span className="font-medium text-gray-800">
          {text}
        </span>
      ),
    },
    {
      title: "Pub ID",
      dataIndex: "pubid",
      key: "pubid",
      width: 120,
    },
    {
      title: "PID",
      dataIndex: "pid",
      key: "pid",
      ellipsis: true,
    },
    {
      title: "Eligibility",
      key: "eligibility",
      width: 160,
      render: (_, record) => (
        <Popover
          content={renderEligibility(record.eligibility_flags)}
          title="Eligibility Flags"
          trigger="hover"
        >
          <Tag color={record.eligible ? "green" : "red"}>
            {record.eligible ? "Eligible" : "Not Eligible"}
          </Tag>
        </Popover>
      ),
    },
    {
      title: "Metrics",
      key: "metrics",
      width: 150,
      render: (_, record) => (
        <Popover
          content={renderMetrics(record.metrics)}
          title="Performance Metrics"
          trigger="hover"
        >
          <Tag color="blue" className="cursor-pointer">
            View Metrics
          </Tag>
        </Popover>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => (
        <Tag
          color={getStatusColor(status)}
          className="px-3 py-1 rounded-md"
        >
          {status}
        </Tag>
      ),
    },
  ];

  // ================= NO ACCESS =================
  if (!hasAccess) {
    return (
      <div
        style={{
          padding: 20,
          textAlign: "center",
          color: "#ff4d4f",
          fontWeight: 600,
        }}
      >
        You do not have permission to view this report
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Card className="shadow-lg rounded-2xl border-0">
        <div className="flex items-center justify-between mb-5">
          <Title level={4} className="!mb-0">
            Campaign Decision Report
          </Title>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey={(record, index) => index}
            bordered
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            scroll={{ x: 900 }}
            className="rounded-xl overflow-hidden"
          />
        </Spin>
      </Card>
    </div>
  );
};

export default DecisionTable;