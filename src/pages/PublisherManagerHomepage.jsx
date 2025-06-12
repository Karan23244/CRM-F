import React, { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import PIDForm from "../components/PIDForm";
import MMPTrackerForm from "../components/MMPTrackerForm";
import PayableEventForm from "../components/PayableEventForm";
import { logout } from "../redux/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import ChangePassword from "../components/ChangePassword";
import PublisherFormComponent from "../components/PublisherFormComponent";
import PublisherCurrentData from "../components/PublisherCurrentData";
import MakeRequest from "../components/MakeRequest";
import { subscribeToNotifications } from "../components/Socket";
import { FaBell } from "react-icons/fa";
import BlacklistManager from "../components/BlacklistManager";

const ManagerHomepage = ({}) => {
  const [activeComponent, setActiveComponent] = useState("pubform");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotificationDot, setShowNotificationDot] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/"); // Redirect to login page
  };

  useEffect(() => {
    subscribeToNotifications((data) => {
      if (data?.adv_res && data?.id) {
        // Only show dot if not on MakeRequest component
        if (activeComponent !== "makerequest") {
          setShowNotificationDot(true);
        }
      }
    });
  }, [activeComponent]);
  useEffect(() => {
    if (activeComponent === "makerequest") {
      setShowNotificationDot(false);
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
          <nav className="space-y-2 flex-1 overflow-y-auto px-2">
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "pubform"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => {
                setActiveComponent("pubform");
                setSidebarOpen(false);
              }}>
              Publisher Form
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "currentpubdata"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => {
                setActiveComponent("currentpubdata");
                setSidebarOpen(false);
              }}>
              Pub Campaign data
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "blacklistpid"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => {
                setActiveComponent("blacklistpid");
                setSidebarOpen(false);
              }}>
              Blacklist PID
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "makerequest"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => {
                setActiveComponent("makerequest");
                setSidebarOpen(false);
              }}>
              Make Request
              {showNotificationDot && (
                <span className="w-2 h-2 bg-red-500 rounded-full ml-1"></span>
              )}
            </button>
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
          <h2 className="text-xl font-semibold">Publisher Manager Dashboard</h2>
          <div className="flex items-center gap-4">
            {/* Bell Icon */}
            <button
              className="relative"
              onClick={() => setActiveComponent("makerequest")}>
              <FaBell className="text-2xl text-blue-700 hover:text-blue-900 transition" />
              {showNotificationDot && (
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
        <main className="overflow-auto min-w-0">
          {activeComponent === "pubform" && <PublisherFormComponent />}
          {activeComponent === "currentpubdata" && (
            <div className="overflow-x-auto">
              <PublisherCurrentData />
            </div>
          )}
          {activeComponent === "pid" && <PIDForm />}
          {activeComponent === "mmptracker" && <MMPTrackerForm />}
          {activeComponent === "payableevent" && <PayableEventForm />}
          {activeComponent === "makerequest" && <MakeRequest />}
          {activeComponent === "blacklistpid" && <BlacklistManager />}
          {activeComponent === "changepassword" && <ChangePassword />}
        </main>
      </div>
    </div>
  );
};

export default ManagerHomepage;
