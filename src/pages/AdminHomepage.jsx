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
        <div className="flex items-center justify-between px-4 mb-6">
          <div className="flex items-center space-x-2">
            <img
              src="/crm2.svg" // replace with your logo path
              alt="Logo"
              className="h-14 w-14"
            />
            <h2 className="text-lg font-bold tracking-wide">Admin Panel</h2>
          </div>
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
          <SidebarLink to="/admin-home/analytics" label="Campaign Analytics" />
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

        <main className="overflow-auto min-w-0">
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

// import React, { useState } from "react";
// import { FaBars, FaTimes } from "react-icons/fa";
// import { NavLink, Outlet, useNavigate } from "react-router-dom";
// import { logout } from "../redux/authSlice";
// import { useDispatch } from "react-redux";

// const AdminLayout = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     dispatch(logout());
//     navigate("/");
//   };

//   return (
//     <div className="flex h-screen bg-gray-100">
//       {/* Overlay for mobile */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 transition-opacity md:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Sidebar */}
//       <aside
//         className={`bg-gradient-to-b from-blue-600 to-blue-800 text-white py-6 space-y-6 fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out ${
//           sidebarOpen
//             ? "translate-x-0 w-56 md:w-64"
//             : "-translate-x-full w-0 md:w-0"
//         } md:relative md:translate-x-0 shadow-xl flex flex-col overflow-hidden`}>
//         {/* Logo Section */}
//         <div className="flex items-center justify-between px-4 mb-6">
//           <div className="flex items-center space-x-2">
//             <img
//               src="/logo.png" // replace with your logo path
//               alt="Logo"
//               className="h-10 w-10 rounded-full border-2 border-white shadow-md"
//             />
//             <h2 className="text-lg font-bold tracking-wide">Admin Panel</h2>
//           </div>
//           <button
//             className="text-white text-2xl md:hidden"
//             onClick={() => setSidebarOpen(false)}>
//             <FaTimes />
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="space-y-1 flex-1 px-3 overflow-y-auto">
//           <SidebarLink to="/admin-home/subadmin" label="Sub Admin Form" />
//           <SidebarLink to="/admin-home/review" label="Review" />
//           <SidebarLink
//             to="/admin-home/current-campaign"
//             label="Campaign Data"
//           />
//           <SidebarLink
//             to="/admin-home/advertiser-data"
//             label="Advertiser Data"
//           />
//           <SidebarLink to="/admin-home/publisher-data" label="Publisher Data" />
//           <SidebarLink to="/admin-home/analytics" label="Campaign Analytics" />
//           <SidebarLink
//             to="/admin-home/change-password"
//             label="Change Password"
//           />
//         </nav>
//       </aside>

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col transition-all min-w-0">
//         {/* Header */}
//         <header className="bg-white shadow-md p-4 flex justify-between items-center">
//           <button
//             className="text-blue-900 text-2xl p-2 md:hidden"
//             onClick={() => setSidebarOpen(!sidebarOpen)}>
//             {sidebarOpen ? <FaTimes /> : <FaBars />}
//           </button>
//           <h2 className="text-2xl font-semibold text-gray-700">
//             Admin Dashboard
//           </h2>
//           <button
//             className="bg-red-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-red-600 shadow-md transition"
//             onClick={handleLogout}>
//             Logout
//           </button>
//         </header>

//         {/* Page Content */}
//         <main className="overflow-auto min-w-0 bg-gray-50 p-4">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// };

// const SidebarLink = ({ to, label }) => {
//   return (
//     <NavLink
//       to={to}
//       className={({ isActive }) =>
//         `block px-4 py-3 text-base font-medium rounded-md transition-all duration-200 ${
//           isActive
//             ? "bg-blue-900 text-white shadow-md"
//             : "hover:bg-blue-700 hover:text-white"
//         }`
//       }>
//       {label}
//     </NavLink>
//   );
// };

// export default AdminLayout;
