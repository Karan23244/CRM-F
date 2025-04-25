import React, { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import FormComponent from "../components/AdvFormComponent";
import AdvertiserData from "../components/AdvertiserData";
import PIDForm from "../components/PIDForm";
import MMPTrackerForm from "../components/MMPTrackerForm";
import PayableEventForm from "../components/PayableEventForm";
import { logout } from "../redux/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import ChangePassword from "../components/ChangePassword";
import AdvertiserCurrentData from "../components/AdvertiserCurrentData";
import { useSelector } from "react-redux";
import ReportForm from "../components/ReportForm";
import NewRequest from "../components/NewRequest";
import ExcelGraphCompare from "../components/Graph";
const AdvHomepage = ({}) => {
  const user = useSelector((state) => state.auth.user);
  const [activeComponent, setActiveComponent] = useState("form");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  console.log(user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/"); // Redirect to login page
  };
  const allowedUserIds = [31, 40];
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
              Advertiser Panel
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
                activeComponent === "form" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("form")}>
              Advertiser Form
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "currentadvdata"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("currentadvdata")}>
              Current Advertiser Data
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "data" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("data")}>
              Previous Advertiser Data
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
                activeComponent === "viewRequest"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("viewRequest")}>
              New Request
            </button>
            {allowedUserIds.includes(Number(user?.id)) && (
              <>
                <button
                  className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                    activeComponent === "reportform"
                      ? "bg-blue-700"
                      : "hover:bg-blue-600"
                  }`}
                  onClick={() => setActiveComponent("reportform")}>
                  Report Form
                </button>
                <button
                  className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                    activeComponent === "genrategraph"
                      ? "bg-blue-700"
                      : "hover:bg-blue-600"
                  }`}
                  onClick={() => setActiveComponent("genrategraph")}>
                  Genrate Graph
                </button>
              </>
            )}
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
          <h2 className="text-xl font-semibold">Advertiser Dashboard</h2>
          <button
            className="bg-red-500 text-black font-semibold px-5 py-3 rounded-lg hover:bg-red-600 transition"
            onClick={handleLogout}>
            Logout
          </button>
        </header>

        {/* Main Content Area */}
        <main className=" overflow-auto min-w-0">
          {activeComponent === "form" && <FormComponent />}
          {activeComponent === "currentadvdata" && (
            <div className="overflow-x-auto">
              <AdvertiserCurrentData />
            </div>
          )}
          {activeComponent === "data" && (
            <div className="overflow-x-auto">
              <AdvertiserData />
            </div>
          )}
          {activeComponent === "pid" && <PIDForm />}
          {activeComponent === "payableevent" && <PayableEventForm />}
          {activeComponent === "mmptracker" && <MMPTrackerForm />}
          {activeComponent === "viewRequest" && <NewRequest />}
          {activeComponent === "reportform" &&
            allowedUserIds.includes(Number(user?.id)) && <ReportForm />}
          {activeComponent === "genrategraph" &&
            allowedUserIds.includes(Number(user?.id)) && <ExcelGraphCompare />}
          {activeComponent === "changepassword" && <ChangePassword />}
        </main>
      </div>
    </div>
  );
};

export default AdvHomepage;
