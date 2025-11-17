// import { useEffect, useState } from "react";
// import io from "socket.io-client";
// import axios from "axios";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";

// const apiUrl = import.meta.env.VITE_API_URL;
// const socket = io("https://apii.clickorbits.in", { transports: ["websocket"] });

// export default function NotificationList() {
//   const [notifications, setNotifications] = useState([]);
//   const navigate = useNavigate();

//   // ✅ Logged-in user
//   const user = useSelector((state) => state.auth?.user);
//   const userId = user?.id || JSON.parse(localStorage.getItem("user"))?.id;

//   // 🔌 Connect socket & fetch
//   useEffect(() => {
//     if (!userId) return;

//     console.log("🧩 Registering socket for user:", userId);
//     socket.emit("register", userId);

//     fetchNotifications();

//     socket.on("new_notification", ({ newNotification }) => {
//       if (newNotification.receiver_id === userId) {
//         console.log("🆕 New notification received:", newNotification);
//         setNotifications((prev) => [newNotification, ...prev]);
//       }
//     });

//     return () => {
//       socket.off("new_notification");
//       socket.disconnect();
//     };
//   }, [userId]);

//   // 📨 Fetch notifications for this user
//   const fetchNotifications = async () => {
//     try {
//       const res = await axios.get(
//         `https://apii.clickorbits.in/getNotifications/${userId}`
//       );
//       console.log("📨 Notifications fetched:", res.data);
//       setNotifications(res.data);
//     } catch (err) {
//       console.error("❌ Error fetching notifications:", err);
//     }
//   };

//   // ✅ Mark as read + redirect (open in new tab)
//   const handleNotificationClick = async (id, url) => {
//     try {
//       // Send payload in body instead of URL param
//       await axios.post(`${apiUrl}/mark-read`, { id });

//       // Update local state
//       setNotifications((prev) =>
//         prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
//       );

//       // Open link in new tab (if provided)
//       if (url) window.open(url, "_blank");
//     } catch (err) {
//       console.error("❌ Error marking as read:", err);
//     }
//   };

//   return (
//     <div className="p-4 max-w-2xl mx-auto bg-white rounded-lg shadow">
//       <h2 className="text-lg font-semibold text-gray-700 mb-3">
//         Notifications
//       </h2>

//       {notifications.length === 0 ? (
//         <p className="text-gray-400 text-sm text-center">
//           No notifications yet.
//         </p>
//       ) : (
//         <div className="flex flex-col gap-2">
//           {notifications.map((n) => (
//             <div
//               key={n.id}
//               onClick={() => handleNotificationClick(n.id, n.url)}
//               className={`p-3 rounded-lg border cursor-pointer transition ${
//                 n.is_read === 1
//                   ? "bg-gray-100 hover:bg-gray-200"
//                   : "bg-blue-50 hover:bg-blue-100"
//               }`}>
//               <p className="text-sm text-gray-800">{n.message}</p>
//               <span className="text-xs text-gray-500">
//                 {new Date(n.created_at).toLocaleString()}
//               </span>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import io from "socket.io-client";
// import axios from "axios";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";

// const apiUrl = import.meta.env.VITE_API_URL;
// const socket = io("https://apii.clickorbits.in", { transports: ["websocket"] });

// // ✅ Create channel once (outside component)
// const bc = new BroadcastChannel("notifications");

// export default function NotificationList() {
//   const [notifications, setNotifications] = useState([]);
//   const navigate = useNavigate();

//   // ✅ Logged-in user
//   const user = useSelector((state) => state.auth?.user);
//   const userId = user?.id || JSON.parse(localStorage.getItem("user"))?.id;

//   // 🔌 Connect socket & fetch
//   useEffect(() => {
//     if (!userId) return;

//     console.log("🧩 Registering socket for user:", userId);
//     // socket.emit("register", userId);

//     const socket = io("https://apii.clickorbits.in", {
//       query: { userId },
//       transports: ["websocket"],
//     });

//     // ✅ Fetch existing notifications
//     axios
//       .get(`https://apii.clickorbits.in/getNotifications/${userId}`)
//       .then((res) => setNotifications(res.data));

//     // ✅ Helper: safely post message
//     const safePost = (data) => {
//       try {
//         if (bc) bc.postMessage(data);
//       } catch (err) {
//         console.warn("⚠️ BroadcastChannel closed, skipping:", err.message);
//       }
//     };

//     // ✅ Receive new notification (from socket)
//     socket.on("new_notification", (notif) => {
//       setNotifications((prev) => [notif, ...prev]);
//       safePost({ type: "new_notification", notif });
//     });

//     // fetchNotifications();

//     // socket.on("new_notification", ({ newNotification }) => {
//     //   if (newNotification.receiver_id === userId) {
//     //     console.log("🆕 New notification received:", newNotification);
//     //     setNotifications((prev) => [newNotification, ...prev]);
//     //   }
//     // });

//     // ✅ Listen for updates from other tabs
//     bc.onmessage = (event) => {
//       const { type, notif, notificationId } = event.data;
//       if (type === "new_notification") {
//         setNotifications((prev) => [notif, ...prev]);
//       } else if (type === "notification_read") {
//         setNotifications((prev) =>
//           prev.map((n) =>
//             n.id === notificationId ? { ...n, is_read: true } : n
//           )
//         );
//       }
//     };

//     // ✅ Only disconnect socket on cleanup
//     return () => {
//       socket.disconnect();
//     };
//   }, [userId]);

//   // 📨 Fetch notifications for this user
//   // const fetchNotifications = async () => {
//   //   try {
//   //     const res = await axios.get(
//   //       `https://apii.clickorbits.in/getNotifications/${userId}`
//   //     );
//   //     console.log("📨 Notifications fetched:", res.data);
//   //     setNotifications(res.data);
//   //   } catch (err) {
//   //     console.error("❌ Error fetching notifications:", err);
//   //   }
//   // };

//   // ✅ Mark as read + redirect (open in new tab)
//   const handleNotificationClick = async (id, url) => {
//     try {
//       // Send payload in body instead of URL param
//       await axios.post(`${apiUrl}/mark-read`, { id });

//       // Update local state
//       setNotifications((prev) =>
//         prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
//       );

//       // Open link in new tab (if provided)
//       if (url) window.open(url, "_blank");
//     } catch (err) {
//       console.error("❌ Error marking as read:", err);
//     }
//   };

//   return (
//     <div className="p-4 max-w-2xl mx-auto bg-white rounded-lg shadow">
//       <h2 className="text-lg font-semibold text-gray-700 mb-3">
//         Notifications
//       </h2>

//       {notifications.length === 0 ? (
//         <p className="text-gray-400 text-sm text-center">
//           No notifications yet.
//         </p>
//       ) : (
//         <div className="flex flex-col gap-2">
//           {notifications.map((n) => (
//             <div
//               key={n.id}
//               onClick={() => handleNotificationClick(n.id, n.url)}
//               className={`p-3 rounded-lg border cursor-pointer transition ${
//                 n.is_read === 1
//                   ? "bg-gray-100 hover:bg-gray-200"
//                   : "bg-blue-50 hover:bg-blue-100"
//               }`}>
//               <p className="text-sm text-gray-800">{n.message}</p>
//               <span className="text-xs text-gray-500">
//                 {new Date(n.created_at).toLocaleString()}
//               </span>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// // ✅ Close channel only when user leaves the site entirely
// window.addEventListener("beforeunload", () => {
//   try {
//     bc.close();
//   } catch (err) {
//     console.warn("⚠️ Error closing BroadcastChannel:", err.message);
//   }
// });

import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL;
const socket = io("https://apii.clickorbits.in", { transports: ["websocket"] });
const bc = new BroadcastChannel("notifications");

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const userId = user?.id || JSON.parse(localStorage.getItem("user"))?.id;
  console.log("🚀 NotificationList rendered for userId:", notifications);
  useEffect(() => {
    if (!userId) return;

    const socket = io("https://apii.clickorbits.in", {
      query: { userId },
      transports: ["websocket"],
    });

    axios
      .get(`https://apii.clickorbits.in/getNotifications/${userId}`)
      .then((res) => setNotifications(res.data));

    const safePost = (data) => {
      try {
        bc?.postMessage(data);
      } catch {}
    };

    socket.on("new_notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      safePost({ type: "new_notification", notif });
    });

    bc.onmessage = (event) => {
      const { type, notif, notificationId } = event.data;
      if (type === "new_notification")
        setNotifications((prev) => [notif, ...prev]);
      else if (type === "notification_read")
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
    };

    return () => socket.disconnect();
  }, [userId]);

  const handleNotificationClick = async (id, url) => {
    try {
      await axios.post(`${apiUrl}/mark-read`, { id });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      if (url) window.open(url, "_blank");
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 mt-6 bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-[#2F5D99]">
            Notifications
          </h2>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={() => setNotifications([])}
            className="text-sm text-[#2F5D99] hover:underline">
            Clear All
          </button>
        )}
      </div>

      {/* Empty State */}
      {notifications.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n.id, n.url)}
              className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                n.is_read === 1
                  ? "bg-gray-50 hover:bg-gray-100 border-gray-200"
                  : "bg-[#EBF2FA] hover:bg-[#DCE8F7] border-[#C6D9F4]"
              }`}>
              <div className="flex justify-between items-start">
                <p
                  className={`text-sm ${
                    n.is_read === 1
                      ? "text-gray-700"
                      : "text-[#2F5D99] font-medium"
                  }`}>
                  {n.message}
                </p>
              </div>
              <span className="text-xs text-gray-500 block mt-2">
                {new Date(n.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ✅ Close broadcast channel cleanly
window.addEventListener("beforeunload", () => {
  try {
    bc.close();
  } catch {}
});
