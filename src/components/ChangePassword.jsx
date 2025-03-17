import { useState } from "react";
import { useSelector } from "react-redux";

const apiUrl = import.meta.env.VITE_API_URL || "https://api.clickorbits.in/api";

const ChangePassword = () => {
  const user = useSelector((state) => state.auth.user);
  
  // State to store password fields and response messages
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmNewPassword) {
      setMessage({ type: "error", text: "New passwords do not match!" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/change-pass/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setFormData({ currentPassword: "", newPassword: "", confirmNewPassword: "" }); // Clear form after success
      } else {
        setMessage({ type: "error", text: data.message || "Failed to change password." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong. Try again!" });
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-4">Change Password</h2>
        {message && (
          <p className={`text-sm p-2 rounded mb-3 text-center ${message.type === "success" ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"}`}>
            {message.text}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700">Confirm New Password</label>
            <input
              type="password"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300 disabled:opacity-50"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
