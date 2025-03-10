import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/authSlice";
import { FaBars, FaTimes } from "react-icons/fa";
import PublisherFormComponent from "../components/PublisherFormComponent";
import PublisherData from "../components/PublisherData";
import PIDForm from "../components/PIDForm";
import MMPTrackerForm from "../components/MMPTrackerForm";
import PayableEventForm from "../components/PayableEventForm";
import ChangePassword from "../components/ChangePassword";

const PublisherHomepage = () => {
  const [activeComponent, setActiveComponent] = useState("form");
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
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-0"
        } md:relative md:translate-x-0 shadow-lg flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="flex justify-between items-center px-4">
          {sidebarOpen && (
            <h2 className="text-2xl font-semibold transition-opacity md:block">
              Publisher Panel
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
              className={`w-full text-left px-4 py-3 text-lg font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "form" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("form")}>
              Publisher Form
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-lg font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "data" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("data")}>
              Publisher Data
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-lg font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "pid" ? "bg-blue-700" : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("pid")}>
              Add PID
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-lg font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "payableevent"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("payableevent")}>
              Add Payable Event
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-lg font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "mmptracker"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("mmptracker")}>
              Add MMP tracker
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-lg font-medium rounded-lg transition-all flex items-center gap-2 ${
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
          <h2 className="text-xl font-semibold">Publisher Dashboard</h2>
          <button
            className="bg-red-500 text-black font-semibold px-5 py-3 rounded-lg hover:bg-red-600 transition"
            onClick={handleLogout}>
            Logout
          </button>
        </header>

        {/* Main Content Area */}
        <main className="overflow-auto min-w-0">
          {activeComponent === "form" && <PublisherFormComponent />}
          {activeComponent === "data" && (
            <div className="overflow-x-auto">
              <PublisherData />
            </div>
          )}
          {activeComponent === "pid" && <PIDForm />}
          {activeComponent === "payableevent" && <PayableEventForm/>}
          {activeComponent === "mmptracker" && <MMPTrackerForm />}
          {activeComponent === "changepassword" && <ChangePassword />}
        </main>
      </div>
    </div>
  );
};

export default PublisherHomepage;
