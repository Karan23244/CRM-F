import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../redux/authSlice";
import { useDispatch } from "react-redux";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`bg-blue-500 text-white py-5 space-y-6 fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen
            ? "translate-x-0 w-48 md:w-64"
            : "-translate-x-full w-0 md:w-0"
        } md:relative md:translate-x-0 shadow-lg flex flex-col overflow-hidden`}>
        <div className="flex justify-between items-center px-4">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <button
            className="text-white text-2xl md:hidden"
            onClick={() => setSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <nav className="space-y-1 flex-1 px-2 overflow-y-auto">
          <SidebarLink to="/admin-home/subadmin" label="Sub Admin Form" />
          <SidebarLink to="/admin-home/review" label="Review" />
          <SidebarLink
            to="/admin-home/current-campaign"
            label="Campaign Data"
          />
          <SidebarLink
            to="/admin-home/advertiser-data"
            label="Advertiser Data"
          />
          <SidebarLink to="/admin-home/publisher-data" label="Publisher Data" />
          <SidebarLink
            to="/admin-home/change-password"
            label="Change Password"
          />
        </nav>
      </aside>

      <div className="flex-1 flex flex-col transition-all min-w-0">
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

        <main className="overflow-auto min-w-0 p-6">
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
        `block px-4 py-3 text-base font-medium rounded-lg transition-all ${
          isActive ? "bg-blue-700" : "hover:bg-blue-600"
        }`
      }>
      {label}
    </NavLink>
  );
};

export default AdminLayout;
