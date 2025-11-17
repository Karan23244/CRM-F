import axios from "axios";
const BASE_URL = "https://apii.clickorbits.in"; // your API base URL
const API_URL = import.meta.env.VITE_API_URL; // your API base URL

/**
 * Helper: Fetch all users from /get-subadmin
 * @returns {Promise<Array>} - List of user objects
 */
const fetchAllUsers = async () => {
  console.log("📡 Fetching all users from:", `${API_URL}/get-subadmin`);
  const { data } = await axios.get(`${API_URL}/get-subadmin`);
  console.log("✅ Users fetched successfully:", data);

  // Optional safety check
  if (!Array.isArray(data?.data || data)) {
    console.warn("⚠️ Unexpected user data structure:", data);
  }

  return data?.data || data; // normalize in case your API returns { data: [] }
};

/**
 * Create a notification and send it in real-time
 * Automatically resolves sender_id and receiver_id from names if needed.
 *
 * @param {Object} params
 * @param {string|number} params.sender - sender name or id
 * @param {string|number} params.receiver - receiver name or id
 * @param {string} params.type - type of notification (e.g., "link_shared")
 * @param {string} params.message - text to display
 * @param {string} params.url - redirect link on click
 * @returns {Promise<Object>} - Created notification response
 */
export const createNotification = async ({
  sender,
  receiver,
  type = "custom",
  message,
  url = "/",
}) => {
  try {
    console.group("🔔 createNotification()");
    console.log("➡️ Input Params:", { sender, receiver, type, message, url });

    const users = await fetchAllUsers();
    console.log("👥 Total users found:", users.length);

    // 🧩 Resolve sender
    const senderUser =
      typeof sender === "number"
        ? users.find((u) => u.id === sender)
        : users.find(
            (u) =>
              u.username?.toLowerCase() === sender?.toLowerCase() ||
              u.name?.toLowerCase() === sender?.toLowerCase()
          );

    // 🧩 Resolve receiver
    const receiverUser =
      typeof receiver === "number"
        ? users.find((u) => u.id === receiver)
        : users.find(
            (u) =>
              u.username?.toLowerCase() === receiver?.toLowerCase() ||
              u.name?.toLowerCase() === receiver?.toLowerCase()
          );

    console.log("📤 Matched Sender:", senderUser);
    console.log("📥 Matched Receiver:", receiverUser);

    if (!senderUser) {
      console.error("❌ Sender not found:", sender);
      throw new Error(`Sender not found: ${sender}`);
    }
    if (!receiverUser) {
      console.error("❌ Receiver not found:", receiver);
      throw new Error(`Receiver not found: ${receiver}`);
    }

    // 🚀 Send notification
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
      payload
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
 * Send a broadcast notification to all users
 * @param {string} sender - who triggered the upload
 * @param {string} message - notification message text
 * @param {string} url - redirect path when clicked
 */
export const notifyAllUsers = async (sender, message, url = "/uploads") => {
  try {
    const users = await fetchAllUsers();
    console.log("📢 Sending broadcast to:", users.length, "users");

    // Find sender details
    const senderUser = users.find(
      (u) =>
        u.username?.toLowerCase() === sender?.toLowerCase() ||
        u.name?.toLowerCase() === sender?.toLowerCase()
    );

    if (!senderUser) {
      console.warn("⚠️ Sender not found for broadcast:", sender);
      return;
    }

    // Loop through all users and send notification
    for (const receiver of users) {
      if (receiver.id === senderUser.id) continue; // skip self
      await axios.post(`${BASE_URL}/createNotification`, {
        sender_id: senderUser.id,
        receiver_id: receiver.id,
        type: "file_upload",
        message,
        url,
      });
    }

    console.log("✅ Broadcast notifications sent successfully!");
  } catch (err) {
    console.error("💥 Error broadcasting notifications:", err);
  }
};
