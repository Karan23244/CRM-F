import React, { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import AdvFormComponent from "../components/AdvFormComponent";
import AdvertiserData from "../components/AdvertiserData";
import PIDForm from "../components/PIDForm";
import MMPTrackerForm from "../components/MMPTrackerForm";
import PayableEventForm from "../components/PayableEventForm";
import { logout } from "../redux/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import ChangePassword from "../components/ChangePassword";
import PublisherData from "../components/PublisherData";
import PublisherFormComponent from "../components/PublisherFormComponent";
import MainComponent from "../components/ManagerAllData";
import  AdvertiserCurrentData from "../components/AdvertiserCurrentData"
import  PublisherCurrentData from "../components/PublisherCurrentData"
import SubAdminPubnameData from "../components/SubAdminPubnameData";
const ManagerHomepage = () => {
  const [activeComponent, setActiveComponent] = useState("advform");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/"); // Redirect to login page
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Overlay for mobile view */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity md:hidden"
          onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside
        className={`bg-blue-500 text-white py-5 space-y-6 fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0 w-48" : "-translate-x-full w-0"
        } md:relative md:translate-x-0 shadow-lg flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="flex justify-between items-center px-4">
          {sidebarOpen && (
            <h2 className="text-xl font-semibold transition-opacity md:block">
              Manager Panel
            </h2>
          )}
          <button
            className="text-white text-2xl md:hidden"
            onClick={() => setSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>

        {/* Navigation */}
        {sidebarOpen && (
          <nav className="space-y-2 flex-1">
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "advform" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("advform")}>
              Advertiser Form
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "pubform" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("pubform")}>
              Publisher Form
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "currentadvdata" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("currentadvdata")}>
              Current Advertiser Data
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "advdata" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("advdata")}>
              Previous Advertiser Data
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "currentpubdata" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("currentpubdata")}>
              Current Publisher Data
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "pubdata" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("pubdata")}>
              Previous Publisher Data
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "pid" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("pid")}>
              Add PID
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "payableevent"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("payableevent")}>
              Add Payable Event
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "mmptracker"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("mmptracker")}>
              Add MMP tracker
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "managerData"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("managerData")}>
              Assigned Sub-Admin Data
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "pubnameData"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("pubnameData")}>
              Assigned Sub-Admin Publisher Data
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "changepassword"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("changepassword")}>
              Change Password
            </button>
          </nav>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all min-w-0">
        {/* Header with Sidebar Toggle */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <button
            className="text-blue-900 text-2xl p-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <h2 className="text-xl font-semibold">Manager Dashboard</h2>
          <button
            className="bg-red-500 text-black font-semibold px-5 py-3 rounded-lg hover:bg-red-600 transition"
            onClick={handleLogout}>
            Logout
          </button>
        </header>

        {/* Main Content Area */}
        <main className="overflow-auto min-w-0">
          {activeComponent === "advform" && <AdvFormComponent />}
          {activeComponent === "pubform" && <PublisherFormComponent />}

          {activeComponent === "currentadvdata" && (
            <div className="overflow-x-auto">
              <AdvertiserCurrentData />
            </div>
          )}
          {activeComponent === "advdata" && (
            <div className="overflow-x-auto">
              <AdvertiserData />
            </div>
          )}
           {activeComponent === "currentpubdata" && (
            <div className="overflow-x-auto">
              <PublisherCurrentData />
            </div>
          )}
          {activeComponent === "pubdata" && (
            <div className="overflow-x-auto">
              <PublisherData />
            </div>
          )}
          {activeComponent === "pid" && <PIDForm />}
          {activeComponent === "mmptracker" && <MMPTrackerForm />}
          {activeComponent === "payableevent" && <PayableEventForm />}
          {activeComponent === "managerData" && <MainComponent />}
          {activeComponent === "pubnameData" && <SubAdminPubnameData />}
          {activeComponent === "changepassword" && <ChangePassword />}
        </main>
      </div>
    </div>
  );
};

export default ManagerHomepage;
