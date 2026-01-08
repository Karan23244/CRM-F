import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { sidebarLinks } from "../config/sidebarLinks";
import {
  FaBars,
  FaTimes,
  FaBell,
  FaChevronDown,
  FaUserCircle,
  FaChevronUp,
} from "react-icons/fa";
import axios from "axios";
import io from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL;

// ✅ Single broadcast channel (tab sync)
const bc = new BroadcastChannel("notifications");

const DashboardLayout = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [openMenus, setOpenMenus] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  console.log(user);
  const userId = user?.id || JSON.parse(localStorage.getItem("user"))?.id;
  if (!userId) return null;

  const socket = io(apiUrl, {
    query: { userId },
    transports: ["websocket"],
  });

  // 🧠 Logout
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };
  useEffect(() => {
    if (!userId) return;

    const socket = io("https://apii.clickorbits.in", {
      query: { userId },
      transports: ["websocket"],
    });

    // ✅ Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const res = await axios.get(
          `https://apii.clickorbits.in/getNotifications/${userId}`
        );
        const unread = res.data.filter((n) => n.is_read === 0).length;
        setNotificationCount(unread);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchUnreadCount();

    // ✅ Handle new notifications from socket
    socket.on("new_notification", (notif) => {
      if (notif.receiver_id === userId) {
        setNotificationCount((prev) => prev + 1);

        // Broadcast only for other tabs — not to update self again
        if (bc) {
          bc.postMessage({
            type: "new_notification",
            notif,
            source: "socket", // mark source
          });
        }
      }
    });

    // ✅ Listen for updates from other tabs only
    bc.onmessage = (event) => {
      const { type, source } = event.data;

      // 🛑 Ignore messages we ourselves sent
      if (source === "socket") return;

      if (type === "new_notification") {
        setNotificationCount((prev) => prev + 1);
      } else if (type === "notification_read") {
        setNotificationCount((prev) => Math.max(prev - 1, 0));
      }
    };

    // ✅ Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // Reset count when viewing notifications page
  useEffect(() => {
    if (location.pathname.includes("notifications")) {
    }
  }, [location.pathname]);

  // Filter sidebar links by role
  const filterByRole = (items) =>
    items
      .map((item) => {
        // ✅ ROLE CHECK
        const hasRole =
          Array.isArray(user?.role) &&
          user.role.some((r) => item.roles?.includes(r));

        // ✅ PERMISSION CHECK
        const hasPermission = item.permission
          ? user?.permissions?.[item.permission] === 1
          : true;
        // ❌ If parent permission fails → hide everything
        if (!hasRole || !hasPermission) {
          return null;
        }

        // ✅ Filter sublinks ONLY if parent is allowed
        const filteredSublinks = item.sublinks
          ? filterByRole(item.sublinks)
          : [];

        return { ...item, sublinks: filteredSublinks };
      })
      .filter(Boolean);

  const links = filterByRole(sidebarLinks);

  // Navigate to first valid route on login
  const getFirstRoute = (items) => {
    for (const item of items) {
      if (item.to) return item.to;
      if (item.sublinks?.length) {
        const found = getFirstRoute(item.sublinks);
        if (found) return found;
      }
    }
    return null;
  };

  useEffect(() => {
    const firstRoute = getFirstRoute(links);
    if (firstRoute && location.pathname === "/dashboard") {
      navigate(firstRoute);
    }
  }, [links, location.pathname, navigate]);

  // Toggle dropdown menus
  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderLinks = (items, level = 0) =>
    items.map((link) => {
      const isOpen = openMenus[link.label];
      const hasChildren = link.sublinks?.length > 0;
      const isActive = link.to && location.pathname.endsWith(link.to);

      return (
        <div key={link.label} className={`mt-1 ${level > 0 ? "ml-4" : ""}`}>
          <a
            href={`/dashboard/${link.to}`}
            onClick={(e) =>
              hasChildren && (e.preventDefault(), toggleMenu(link.label))
            }
            className={`flex justify-between items-center px-3 py-2 rounded-md cursor-pointer transition-all ${
              isActive
                ? "bg-[#79A2CE] text-white"
                : "hover:bg-[#3f6faf] text-gray-100"
            }`}>
            <span className="text-sm font-medium">{link.label}</span>
            {hasChildren &&
              (isOpen ? (
                <FaChevronUp className="text-xs" />
              ) : (
                <FaChevronDown className="text-xs" />
              ))}
          </a>

          {hasChildren && isOpen && (
            <div className="mt-1 ml-3 border-l border-blue-300 pl-2">
              {renderLinks(link.sublinks, level + 1)}
            </div>
          )}
        </div>
      );
    });

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        {/* HEADER */}
        <header className="fixed bg-white shadow-md py-3 px-10 flex justify-between items-center w-full z-50">
          {/* Left: Dashboard Name */}
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="h-15 w-15" />
          </div>

          {/* Center: Role + Dashboard */}
          <div className="text-[#2F5D99]">
            <h1 className="text-lg font-bold tracking-wide pl-4">
              {Array.isArray(user.role)
                ? user.role
                    .map((r) =>
                      r
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")
                    )
                    .join(", ")
                : user.role}{" "}
              Dashboard
            </h1>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-6 relative">
            <NavLink to="notifications" className="relative">
              <FaBell className="text-2xl text-[#2F5D99]" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                  {notificationCount}
                </span>
              )}
            </NavLink>

            {/* User Icon + Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowMenu(true)}
              onMouseLeave={() => setShowMenu(false)}>
              {/* Profile Icon */}
              <FaUserCircle className="text-3xl text-[#2F5D99] cursor-pointer" />

              {/* Dropdown Menu */}
              <div
                className={`absolute -right-7 mt-1 w-60 bg-white shadow-lg rounded-lg py-2 border border-gray-200 z-50 transition-all duration-200 ${
                  showMenu
                    ? "opacity-100 translate-y-0 visible"
                    : "opacity-0 -translate-y-2 invisible"
                }`}>
                <p className="px-4 py-2 text-lg text-gray-700 border-b capitalize">
                  👤 {user?.username || "User"}
                </p>

                <button
                  onClick={() => navigate("/dashboard/myaccount")}
                  className="block w-full text-left px-4 py-2 text-md text-gray-700 hover:bg-gray-100">
                  Change Password
                </button>

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-md text-red-600 hover:bg-gray-100">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN SECTION */}
        <div className="flex flex-1 overflow-hidden min-h-screen mt-21">
          {/* SIDEBAR */}
          {sidebarOpen && (
            <aside className=" fixed text-white w-64 flex flex-row items-start bg-gradient-to-b from-[#002F65] to-[#002F65] h-screen">
              <div className="flex-1 px-4 py-3 space-y-4 overflow-y-auto">
                <nav className="space-y-2">{renderLinks(links)}</nav>
              </div>
              <button
                className="text-white text-2xl p-3 border-t border-white/20 hover:bg-white/10 transition"
                onClick={() => setSidebarOpen(false)}>
                <FaTimes className="mx-auto" />
              </button>
            </aside>
          )}

          {/* WHEN SIDEBAR IS CLOSED */}
          {!sidebarOpen && (
            <button
              className="bg-[#2F5D99] text-white text-2xl p-3 flex items-start shadow-lg hover:bg-[#244B80] transition-all duration-400 ease-in-out"
              onClick={() => setSidebarOpen(true)}>
              <FaBars />
            </button>
          )}

          {/* MAIN CONTENT */}
          <main
            className={`flex-1 transition-all duration-700 ease-in-out ${
              sidebarOpen ? "pl-64 w-[90%]" : "pl-0 w-full"
            }`}>
            <div className="overflow-auto transition-all duration-300 bg-white h-screen">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

// ✅ Close channel only when user leaves the site entirely
window.addEventListener("beforeunload", () => {
  try {
    bc.close();
  } catch (err) {
    console.warn("⚠️ Error closing BroadcastChannel:", err.message);
  }
});

export default DashboardLayout;
