import React from "react";
import {
  FaBullhorn,
  FaPauseCircle,
  FaPlayCircle,
  FaLink,
} from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import StyledTable from "../Utils/StyledTable";

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const dataSource = [
    {
      key: "1",
      date: "05 Nov, 2025",
      name: "Lorem Ipsum",
      pid: "shamirasw9n_int",
    },
    {
      key: "2",
      date: "05 Nov, 2025",
      name: "Lorem Ipsum",
      pid: "ringringa2_int",
    },
    {
      key: "3",
      date: "04 Nov, 2025",
      name: "Lorem Ipsum",
      pid: "singaporebzj_int",
    },
    {
      key: "4",
      date: "03 Nov, 2025",
      name: "Lorem Ipsum",
      pid: "orangesweet_int",
    },
  ];

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Campaign Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "PIDs Name",
      dataIndex: "pid",
      key: "pid",
    },
  ];
  return (
    <div className="p-6 bg-[#e5ecf7] min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-semibold mb-6 capitalize">
        Hi, Welcome Back {user?.username || "User"}!
      </h1>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <div className="p-5 bg-white rounded-2xl shadow flex flex-col border-2 border-blue-200">
          <FaBullhorn className="text-4xl text-blue-500 mb-2" />
          <span className="text-gray-600 font-medium">Total Campaigns</span>
          <span className="text-3xl font-bold">40</span>
        </div>
        <div className="p-5 bg-white rounded-2xl shadow flex flex-col border-2 border-red-200">
          <FaPauseCircle className="text-4xl text-red-500 mb-2" />
          <span className="text-gray-600 font-medium">Paused PIDs</span>
          <span className="text-3xl font-bold">3</span>
        </div>
        <div className="p-5 bg-white rounded-2xl shadow flex flex-col border-2 border-green-200">
          <FaPlayCircle className="text-4xl text-green-500 mb-2" />
          <span className="text-gray-600 font-medium">Live Campaigns</span>
          <span className="text-3xl font-bold">37</span>
        </div>
        <div className="p-5 bg-white rounded-2xl shadow flex flex-col border-2 border-orange-200">
          <FaLink className="text-4xl text-orange-500 mb-2" />
          <span className="text-gray-600 font-medium">Requested Links</span>
          <span className="text-3xl font-bold">2</span>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Users */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">All Users</h2>
            <button className="text-sm text-white bg-[#2F5D99] px-3 py-1 rounded">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {["Atique", "Rohan", "Prayag", "Abhay", "Aniket"].map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <span className="text-gray-700 font-medium">{u}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Data */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4">Today's Data</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-purple-100 border-2 border-purple-200 rounded-xl shadow flex flex-col">
              <FaBullhorn className="text-4xl text-purple-500 mb-2" />
              <span className="text-gray-700 font-medium">Shared Links</span>
              <span className="text-3xl font-bold">37</span>
            </div>
            <div className="p-5 bg-cyan-100 border-2 border-cyan-200 rounded-xl shadow flex flex-col">
              <FaBullhorn className="text-4xl text-cyan-500 mb-2" />
              <span className="text-gray-700 font-medium">
                Create Campaigns
              </span>
              <span className="text-3xl font-bold">2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Added PIDs */}
      <div className="bg-white p-5 rounded-2xl shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Added PIDs</h2>
          <button className="text-sm text-white bg-[#2F5D99] px-3 py-1 rounded">
            View All
          </button>
        </div>
        <StyledTable
          bordered
          dataSource={dataSource}
          columns={columns}
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100", "200", "500"],
            showSizeChanger: true,
            defaultPageSize: 10,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: "max-content" }}
          className="rounded-xl shadow-sm border border-gray-200"
        />
      </div>
    </div>
  );
}
