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
import { subscribeToNotifications } from "../components/Socket";
import { FaBell } from "react-icons/fa";
const AdvHomepage = ({}) => {
  const user = useSelector((state) => state.auth.user);
  const [activeComponent, setActiveComponent] = useState("form");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewRequestDot, setShowNewRequestDot] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/"); // Redirect to login page
  };
  const allowedUserIds = [31, 40];
  useEffect(() => {
    subscribeToNotifications((data) => {
      if (data?.campaign_name && data?.id) {
        if (activeComponent !== "viewRequest") {
          setShowNewRequestDot(true); // Show dot only if not already on viewRequest
        }
      }
    });
  }, [activeComponent]);
  useEffect(() => {
    if (activeComponent === "viewRequest") {
      setShowNewRequestDot(false);
    }
  }, [activeComponent]);
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
          <nav className="space-y-2 flex-1 relative">
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "form" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => {
                setActiveComponent("form");
                setSidebarOpen(false);
              }}>
              Advertiser form/data
            </button>

            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "currentadvdata"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => {
                setActiveComponent("currentadvdata");
                setSidebarOpen(false);
              }}>
              Current Adv Campaign data
            </button>

            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "data" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => {
                setActiveComponent("data");
                setSidebarOpen(false);
              }}>
              Previous Adv Campaign data
            </button>

            {/* Dropdown Toggle */}
            <div>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center justify-between gap-2 ${
                  ["pid", "payableevent", "mmptracker"].includes(
                    activeComponent
                  )
                    ? "bg-blue-700"
                    : "hover:bg-blue-600"
                }`}>
                Addition (Dropdown)
                <span>{isOpen ? "▲" : "▼"}</span>
              </button>

              {/* Dropdown Items */}
              {isOpen && (
                <div className="space-y-1 mt-1 ml-4">
                  <button
                    className={`w-full text-left px-4 py-2 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                      activeComponent === "pid"
                        ? "bg-blue-700 text-white"
                        : "hover:bg-blue-600 hover:text-white"
                    }`}
                    onClick={() => {
                      setActiveComponent("pid");
                      setIsOpen(false);
                      setSidebarOpen(false);
                    }}>
                    Add PID
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                      activeComponent === "payableevent"
                        ? "bg-blue-700 text-white"
                        : "hover:bg-blue-600 hover:text-white"
                    }`}
                    onClick={() => {
                      setActiveComponent("payableevent");
                      setIsOpen(false);
                      setSidebarOpen(false);
                    }}>
                    Add Payable Event
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                      activeComponent === "mmptracker"
                        ? "bg-blue-700 text-white"
                        : "hover:bg-blue-600 hover:text-white"
                    }`}
                    onClick={() => {
                      setActiveComponent("mmptracker");
                      setIsOpen(false);
                      setSidebarOpen(false);
                    }}>
                    Add MMP tracker
                  </button>
                </div>
              )}
            </div>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "viewRequest"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => {
                setActiveComponent("viewRequest");
                setSidebarOpen(false);
              }}>
              New Request
              {showNewRequestDot && (
                <span className="w-2 h-2 bg-red-500 rounded-full ml-1"></span>
              )}
            </button>
            {allowedUserIds.includes(Number(user?.id)) && (
              <>
                <button
                  className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                    activeComponent === "reportform"
                      ? "bg-blue-700"
                      : "hover:bg-blue-600"
                  }`}
                  onClick={() => {
                    setActiveComponent("reportform");
                    setSidebarOpen(false);
                  }}>
                  Report Form
                </button>
                <button
                  className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                    activeComponent === "genrategraph"
                      ? "bg-blue-700"
                      : "hover:bg-blue-600"
                  }`}
                  onClick={() => {
                    setActiveComponent("genrategraph");
                    setSidebarOpen(false);
                  }}>
                  Generate Graph
                </button>
              </>
            )}

            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "changepassword"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => {
                setActiveComponent("changepassword");
                setSidebarOpen(false);
              }}>
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

          <div className="flex items-center gap-4">
            {/* Bell Icon */}
            <button
              className="relative"
              onClick={() => setActiveComponent("viewRequest")}>
              <FaBell className="text-2xl text-blue-700 hover:text-blue-900 transition" />
              {showNewRequestDot && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              )}
            </button>

            {/* Logout */}
            <button
              className="bg-red-500 text-black font-semibold px-5 py-3 rounded-lg hover:bg-red-600 transition"
              onClick={handleLogout}>
              Logout
            </button>
          </div>
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
