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
