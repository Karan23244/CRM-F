import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useSelector } from "react-redux";

const apiUrl = import.meta.env.VITE_API_URL;
const bc = new BroadcastChannel("notifications");

export default function useNotifications(limit) {
  const [notifications, setNotifications] = useState([]);
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
      .then((res) => {
        const data = limit ? res.data.slice(0, limit) : res.data;
        setNotifications(data);
      });

    socket.on("new_notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      try {
        bc.postMessage({ type: "new_notification", notif });
      } catch {}
    });

    bc.onmessage = (event) => {
      if (event.data?.type === "new_notification") {
        setNotifications((prev) => [event.data.notif, ...prev]);
      }
    };

    return () => socket.disconnect();
  }, [userId, limit]);

  return { notifications };
}
