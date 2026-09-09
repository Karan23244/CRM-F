import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL1;
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Fetch all users from /get-subadmin
 */
export const fetchAllUsers = async (token) => {
  const { data } = await axios.get(`${API_URL}/get-subadmin`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("✅ Users fetched successfully:", data);

  if (!Array.isArray(data?.data || data)) {
    console.warn("⚠️ Unexpected user data structure:", data);
  }

  return data?.data || data;
};

/**
 * Create a notification
 */
export const createNotification = async ({
  sender,
  receiver,
  type = "custom",
  message,
  url = "/",
  token,
}) => {
  try {
    console.group("🔔 createNotification()");
    console.log("➡️ Input Params:", {
      sender,
      receiver,
      type,
      message,
      url,
    });

    if (!token) {
      throw new Error("Authentication token is missing");
    }

    const users = await fetchAllUsers(token);

    console.log("👥 Total users found:", users.length);

    // Resolve sender
    const senderUser =
      typeof sender === "number"
        ? users.find((u) => u.id === sender)
        : users.find(
            (u) =>
              u.username?.toLowerCase() === sender?.toLowerCase() ||
              u.name?.toLowerCase() === sender?.toLowerCase(),
          );

    // Resolve receiver
    const receiverUser =
      typeof receiver === "number"
        ? users.find((u) => u.id === receiver)
        : users.find(
            (u) =>
              u.username?.toLowerCase() === receiver?.toLowerCase() ||
              u.name?.toLowerCase() === receiver?.toLowerCase(),
          );

    if (!senderUser) {
      console.error("❌ Sender not found:", sender);
      throw new Error(`Sender not found: ${sender}`);
    }

    if (!receiverUser) {
      console.error("❌ Receiver not found:", receiver);
      throw new Error(`Receiver not found: ${receiver}`);
    }

    const payload = {
      sender_id: senderUser.id,
      receiver_id: receiverUser.id,
      type,
      message,
      url,
    };

    console.log("📦 Sending notification payload:", payload);

    const response = await axios.post(
      `${BASE_URL}/createNotification`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log("✅ Notification created successfully:", response.data);

    console.groupEnd();

    return response.data;
  } catch (err) {
    console.groupEnd();
    console.error("💥 Error creating notification:", err);
    throw err;
  }
};

/**
 * Send notification to all users
 */
export const notifyAllUsers = async (sender, message, url, token) => {
  try {
    if (!token) {
      throw new Error("Authentication token is missing");
    }

    const users = await fetchAllUsers(token);

    const senderUser = users.find(
      (u) =>
        u.username?.toLowerCase() === sender?.toLowerCase() ||
        u.name?.toLowerCase() === sender?.toLowerCase(),
    );

    if (!senderUser) {
      console.warn("⚠️ Sender not found for broadcast:", sender);
      return;
    }

    for (const receiver of users) {
      if (receiver.id === senderUser.id) continue;

      await axios.post(
        `${BASE_URL}/createNotification`,
        {
          sender_id: senderUser.id,
          receiver_id: receiver.id,
          type: "file_upload",
          message,
          url,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    }

    console.log("✅ Broadcast notifications sent");
  } catch (err) {
    console.error("💥 Error broadcasting notifications:", err);
  }
};
