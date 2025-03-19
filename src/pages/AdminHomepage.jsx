import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import SubAdminForm from "../components/SubAdminForm";
import ReviewForm from "../components/ReviewForm";
import { logout } from "../redux/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import ChangePassword from "../components/ChangePassword";
import PubnameData from "../components/PubnameData";
import AdvnameData from "../components/AdvnameData";
import CampianData from "../components/CampianData";
const AdminHomepage = () => {
  const [activeComponent, setActiveComponent] = useState("subadmin");
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open for large screens
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
        } md:relative md:translate-x-0 md:${
          sidebarOpen ? "w-64" : "w-0"
        } shadow-lg flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="flex justify-between items-center px-4">
          {sidebarOpen && (
            <h2 className="text-xl font-semibold transition-opacity md:block">
              Admin Panel
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
          <nav className="space-y-1 flex-1">
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "subadmin"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("subadmin")}>
              Sub Admin Form
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "review"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("review")}>
              Review
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "alldata"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("alldata")}>
              Campaign Data
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "advertiserdata"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("advertiserdata")}>
              Advertiser Data
            </button>
            <button
              className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeComponent === "publisherdata"
                  ? "bg-blue-700"
                  : "hover:bg-blue-600"
              }`}
              onClick={() => setActiveComponent("publisherdata")}>
              Publisher Data
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
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
          <button
            className="bg-red-500 text-black font-semibold px-5 py-3 rounded-lg hover:bg-red-600 transition"
            onClick={handleLogout}>
            Logout
          </button>
        </header>

        {/* Main Content Area */}
        <main className=" overflow-auto min-w-0">
          {activeComponent === "subadmin" && <SubAdminForm />}
          {activeComponent === "review" && (
            <>
              <ReviewForm />
            </>
          )}
          {activeComponent === "alldata" && (
            <div>
              <CampianData />
            </div>
          )}
          {activeComponent === "advertiserdata" && (
            <div>
              <AdvnameData />
            </div>
          )}
          {activeComponent === "publisherdata" && (
            <div>
              <PubnameData />
            </div>
          )}
          {activeComponent === "changepassword" && <ChangePassword />}
        </main>
      </div>
    </div>
  );
};

export default AdminHomepage;
