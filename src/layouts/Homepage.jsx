import React, { useEffect, useState } from "react";
import {
  FaBullhorn,
  FaPauseCircle,
  FaPlayCircle,
  FaLink,
} from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { useSelector } from "react-redux";
import StyledTable from "../Utils/StyledTable";
import axios from "axios";
import { Switch, message } from "antd";
import Swal from "sweetalert2";
import useNotifications from "../Utils/useNotifications";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import KPICard from "./KPICard";
import {
  getKPIs,
  groupByDate,
  groupByAdvertiser,
  groupByPublisher,
  groupByOS,
  groupByVertical,
} from "../Utils/dashboardUtils";

import OffersTrendChart from "./Charts/OffersTrendChart";
import TopAdvertisersChart from "./Charts/TopAdvertisersChart";
import TopPublishersChart from "./Charts/TopPublishersChart";
import OSDistributionChart from "./Charts/OSDistributionChart";
import VerticalDistributionChart from "./Charts/VerticalDistributionChart";
const { RangePicker } = DatePicker;
const apiUrl = import.meta.env.VITE_API_URL;
const apiUrl3 = import.meta.env.VITE_API_URL;
export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const { notifications } = useNotifications(15);
  // 🔥 TWO SEPARATE TOGGLES
  const [toggleRequest, setToggleRequest] = useState(0);
  const [toggleCampaign, setToggleCampaign] = useState(0);

  const [loadReq, setLoadReq] = useState(false);
  const [loadCamp, setLoadCamp] = useState(false);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [geoCount, setGeoCount] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
  const [advCount, setAdvCount] = useState(0);
  const [pubCount, setPubCount] = useState(0);

  const fetchCounts = async () => {
    try {
      console.log("Sending →", {
        role: user?.role,
        id: user?.id,
      });

      // 1️⃣ total campaigns
      const total = await axios.post(`${apiUrl}/campaign-count`, {
        role: user?.role,
        id: user?.id,
      });
      setTotalCampaigns(total?.data?.campaign_count);
      console.log("Received ←", total);

      // 2️⃣ paused PID count
      const paused = await axios.post(`${apiUrl}/geo-count`, {
        role: user?.role,
        id: user?.id,
      });
      setGeoCount(paused?.data?.totalGeo);
      console.log("Received ←", paused);
      // 3️⃣ live PID count
      const live = await axios.post(`${apiUrl}/pid-count`, {
        role: user?.role,
        id: user?.id,
      });
      setLiveCount(live?.data?.totalPid || 0);
      // 3️⃣ live PID count
      const adv = await axios.post(`${apiUrl}/adv-count`, {
        role: user?.role,
        id: user?.id,
      });
      setAdvCount(adv?.data?.totalAdv || 0);
      console.log("Received ←", adv);
      // 3️⃣ live PID count
      const pub = await axios.post(`${apiUrl}/pub-count`, {
        role: user?.role,
        id: user?.id,
      });
      setPubCount(pub?.data?.totalPub || 0);
      console.log("Received ←", pub);
    } catch (err) {
      console.log(err);
      message.error("Failed to load dashboard counts.");
    }
  };

  // 🟡 Fetch Request Toggle
  const fetchRequestToggle = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getHierarchyToggle`);
      if (res.data?.success) setToggleRequest(res.data.value);
    } catch {
      Swal.fire("Error", "Failed to load Request toggle", "error");
    }
  };

  // 🟡 Fetch Campaign Toggle
  const fetchCampaignToggle = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getcamHierarchyToggle`);
      if (res.data?.success) setToggleCampaign(res.data.value);
    } catch {
      Swal.fire("Error", "Failed to load Campaign toggle", "error");
    }
  };

  // 🔄 Update Request Permission
  const updateRequest = async (checked) => {
    setLoadReq(true);
    try {
      const res = await axios.put(`${apiUrl}/updateHierarchyToggle`, {
        value: checked ? 0 : 1,
      });
      if (res.data?.success) {
        setToggleRequest(res.data.new_value);
        Swal.fire("Updated!", "Request view permission changed", "success");
      }
    } catch {
      Swal.fire("Error", "Failed to update request permission", "error");
    }
    setLoadReq(false);
  };

  // 🔄 Update Campaign Permission
  const updateCampaign = async (checked) => {
    setLoadCamp(true);
    try {
      const res = await axios.put(`${apiUrl}/updatecamHierarchyToggle`, {
        value: checked ? 0 : 1,
      });
      if (res.data?.success) {
        setToggleCampaign(res.data.new_value);
        Swal.fire("Updated!", "Campaign view permission changed", "success");
      }
    } catch {
      Swal.fire("Error", "Failed to update campaign permission", "error");
    }
    setLoadCamp(false);
  };

  useEffect(() => {
    fetchRequestToggle();
    fetchCampaignToggle();
    fetchCounts();
  }, []);
  const role = user?.role || "";

  const isAdmin = role.includes("admin");
  const isAdvertiser =
    role.includes("advertiser") || role.includes("advertiser_manager");

  const isPublisher =
    role.includes("publisher") || role.includes("publisher_manager");

  const cards = [
    {
      title: "Active Campaigns",
      value: totalCampaigns,
      color: "from-blue-500 to-indigo-500",
      show: true,
    },
    {
      title: "Live PIDs",
      value: liveCount,
      color: "from-orange-500 to-red-500",
      show: true,
    },
    {
      title: "Total GEO",
      value: geoCount,
      color: "from-purple-500 to-pink-500",
      show: true,
    },
    {
      title: "Publishers",
      value: pubCount,
      color: "from-green-500 to-emerald-500",
      show: isPublisher || isAdmin,
    },
    {
      title: "Advertisers",
      value: advCount,
      color: "from-teal-500 to-cyan-500",
      show: isAdvertiser || isAdmin,
    },
  ].filter((card) => card.show);

  return (
    <div className="p-6 bg-gradient-to-br from-[#eef3fb] to-[#e6ecf5] min-h-screen space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 capitalize">
            Welcome back, {user?.username || "User"}
          </h1>
        </div>

        <div className="bg-white px-4 py-2 rounded-xl shadow text-sm text-gray-600">
          Today: {dayjs().format("DD MMM YYYY")}
        </div>
      </div>

      {/* MAIN ANALYTICS */}
      <section className="space-y-6">
        <DashboardOverview user={user} />
      </section>

      {/* ACTIVITY + ADMIN */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NOTIFICATIONS */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Activity
          </h2>

          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent notifications</p>
          ) : (
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition
                ${
                  n.is_read
                    ? "bg-gray-50 border-gray-200"
                    : "bg-blue-50 border-blue-200"
                }`}>
                  <p className="text-sm font-medium text-gray-700">
                    {n.message}
                  </p>
                  <span className="text-xs text-gray-500">
                    {dayjs(n.created_at).format("DD MMM, hh:mm A")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ADMIN CONTROLS */}
        {isAdmin && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Admin Controls
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border">
                <span className="text-sm font-medium text-gray-700">
                  Request View
                </span>
                <Switch
                  loading={loadReq}
                  checked={toggleRequest === 0}
                  onChange={updateRequest}
                />
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border">
                <span className="text-sm font-medium text-gray-700">
                  Campaign View
                </span>
                <Switch
                  loading={loadCamp}
                  checked={toggleCampaign === 0}
                  onChange={updateCampaign}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const DashboardOverview = ({ user }) => {
  const [data, setData] = useState([]); // ✅ FIX 1
  const [selectedDateRange, setSelectedDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const fetchAdvData = async () => {
    try {
      const [startDate, endDate] = selectedDateRange;

      const payload = {
        user_id: user.id,
        username: user.username,
        role: user.role[0],
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      };

      console.log("Sending payload:", payload);

      const response = await axios.post(
        "http://localhost:2001/api/dashboard-adv-data",
        payload,
      );

      console.log("API Response:", response.data);

      if (response.data?.success) {
        setData(response.data.data || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching adv data:", error);
      setData([]);
    }
  };

  useEffect(() => {
    if (selectedDateRange?.length === 2) {
      fetchAdvData();
    }
  }, [selectedDateRange]);

  const kpis = getKPIs(data);

  return (
    <div className="space-y-8">
      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl shadow">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Performance Analytics
          </h2>
          <p className="text-sm text-gray-500">
            Data insights for selected period
          </p>
        </div>

        <RangePicker
          value={selectedDateRange}
          onChange={setSelectedDateRange}
          className="w-[260px]"
        />
      </div>

      {/* CHART GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TopAdvertisersChart data={groupByAdvertiser(data)} role={user.role} />
        <OSDistributionChart data={groupByOS(data)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TopPublishersChart data={groupByPublisher(data)} role={user.role} />
        <VerticalDistributionChart data={groupByVertical(data)} />
      </div>
    </div>
  );
};
