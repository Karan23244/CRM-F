import { useState } from "react";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash, FaUserCircle } from "react-icons/fa";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const MyAccount = () => {
  const user = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const togglePassword = (field) =>
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedData = {
      currentPassword: formData.currentPassword.trim(),
      newPassword: formData.newPassword.trim(),
      confirmNewPassword: formData.confirmNewPassword.trim(),
    };

    if (trimmedData.newPassword !== trimmedData.confirmNewPassword) {
      Swal.fire({
        icon: "error",
        title: "Mismatch",
        text: "New passwords do not match!",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/change-pass/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmedData),
      });
      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Password changed successfully!",
        });
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Failed to change password.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Try again!",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-6">
          <div className="flex items-center space-x-4">
            <FaUserCircle className="text-[#2F5D99] text-6xl" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800 capitalize">
                {user?.username || "User Name"}
              </h2>
              <p className="text-sm text-gray-500">
                Role:{" "}
                <span className="font-medium text-gray-700">{user?.role}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            Change Password
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Password */}
              <div className="relative">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Current Password
                </label>
                <input
                  type={showPassword.current ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  placeholder="Enter current password"
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D99] transition-all"
                />
                <button
                  type="button"
                  onClick={() => togglePassword("current")}
                  className="absolute inset-y-0 right-3 flex items-center top-5 text-gray-500 cursor-pointer">
                  {showPassword.current ? (
                    <FaEyeSlash size={25} />
                  ) : (
                    <FaEye size={25} />
                  )}
                </button>
              </div>

              {/* New Password */}
              <div className="relative">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  New Password
                </label>
                <input
                  type={showPassword.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="Enter new password"
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D99] transition-all"
                />
                <button
                  type="button"
                  onClick={() => togglePassword("new")}
                  className="absolute inset-y-0 right-3 top-5 flex items-center text-gray-500 cursor-pointer">
                  {showPassword.new ? (
                    <FaEyeSlash size={25} />
                  ) : (
                    <FaEye size={25} />
                  )}
                </button>
              </div>

              {/* Confirm New Password */}
              <div className="relative md:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-enter new password"
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2F5D99] transition-all"
                />
                <button
                  type="button"
                  onClick={() => togglePassword("confirm")}
                  className="absolute inset-y-0 right-3 top-5 flex items-center text-gray-500 cursor-pointer">
                  {showPassword.confirm ? (
                    <FaEyeSlash size={25} />
                  ) : (
                    <FaEye size={25} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2F5D99] hover:bg-[#24487A] text-white py-3 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 font-medium">
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
