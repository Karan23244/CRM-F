import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaLock, FaArrowLeft } from "react-icons/fa";

const apiUrl = import.meta.env.VITE_API_URL;

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch(`${apiUrl}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      await Swal.fire({
        icon: "success",
        title: "Password Updated",
        text: data.message,
      });

      navigate("/");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#496e93] min-h-screen flex items-center justify-center p-4 md:p-10">
      <div className="relative flex flex-col md:flex-row w-full max-w-7xl md:h-[80vh] rounded-2xl overflow-hidden shadow-2xl">
        {/* Left */}

        <div className="w-full md:w-2/5 bg-[#002F65] text-white flex flex-col justify-center px-10">
          <h1 className="text-5xl font-bold mb-5">Create New Password</h1>

          <p className="text-lg opacity-90">
            Your password should be strong and unique.
          </p>
        </div>

        {/* Logo */}

        <div
          className="absolute md:left-2/5 md:top-1/2 left-1/2 top-[38%]
          -translate-x-1/2 -translate-y-1/2
          bg-white rounded-full shadow-xl
          w-20 h-20 flex justify-center items-center">
          <img src="/logo.png" className="w-20 h-20" alt="" />
        </div>

        {/* Right */}

        <div className="w-full md:w-3/5 bg-white flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-md">
            <h2 className="text-4xl font-semibold text-[#01509D] text-center mb-8">
              Reset Password
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  New Password
                </label>

                <div className="relative">
                  <FaLock className="absolute left-3 top-3 text-gray-400" />

                  <input
                    type="password"
                    className="w-full pl-10 py-2 border rounded-md focus:ring-2 focus:ring-[#2F5D99]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
                  Confirm Password
                </label>

                <div className="relative">
                  <FaLock className="absolute left-3 top-3 text-gray-400" />

                  <input
                    type="password"
                    className="w-full pl-10 py-2 border rounded-md focus:ring-2 focus:ring-[#2F5D99]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-[#2F5D99] text-white py-2 rounded-md font-semibold">
                {loading ? "Updating..." : "Update Password"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2 text-[#2F5D99] w-full">
                <FaArrowLeft />
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
