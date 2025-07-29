// src/layouts/PublisherLayout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaBars, FaTimes, FaBell } from "react-icons/fa";
import { logout } from "../redux/authSlice";
import { subscribeToNotifications } from "../components/Publisher/Socket";

const PublisherLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotificationDot, setShowNotificationDot] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  useEffect(() => {
    subscribeToNotifications((data) => {
      if (data?.adv_res && data?.id) {
        if (!location.pathname.includes("makerequest")) {
          setShowNotificationDot(true);
        }
      }
    });
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.includes("makerequest")) {
      setShowNotificationDot(false);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity md:hidden"
          onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside
        className={`bg-blue-500 text-white py-5 space-y-6 fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen
            ? "translate-x-0 w-48 md:w-64"
            : "-translate-x-full w-0 md:w-0"
        } md:relative md:translate-x-0 shadow-lg flex flex-col overflow-hidden`}>
        <div className="flex justify-between items-center px-4">
          <h2 className="text-2xl font-semibold">Publisher Panel</h2>
          <button
            className="text-white text-xl md:hidden"
            onClick={() => setSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto px-2">
          <SidebarLink to="form" label="Publisher form/data" />
          <SidebarLink to="currentpubdata" label="Pub Campaign data" />
          <SidebarLink
            to="makerequest"
            label={
              <>
                Make Request
                {showNotificationDot && (
                  <span className="w-2 h-2 bg-red-500 rounded-full inline-block ml-1" />
                )}
              </>
            }
          />
          <SidebarLink to="analytics" label="Campaign Analytics" />
          <SidebarLink to="changepassword" label="Change Password" />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col transition-all min-w-0">
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <button
            className="text-blue-900 text-2xl p-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <h2 className="text-xl font-semibold">Publisher Dashboard</h2>

          <div className="flex items-center gap-4">
            <NavLink to="makerequest" className="relative">
              <FaBell className="text-2xl text-blue-700 hover:text-blue-900 transition" />
              {showNotificationDot && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              )}
            </NavLink>
            <button
              className="bg-red-500 text-black font-semibold px-5 py-3 rounded-lg hover:bg-red-600 transition"
              onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const SidebarLink = ({ to, label }) => {
  return (
    <NavLink
      to={to}
      target="_blank"
      className={({ isActive }) =>
        `block text-left text-base px-4 py-2 font-medium rounded-lg transition-all ${
          isActive ? "bg-blue-700" : "hover:bg-blue-600"
        }`
      }>
      {label}
    </NavLink>
  );
};

export default PublisherLayout;
