import { useState } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/authSlice";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";

const apiUrl = import.meta.env.VITE_API_URL;

const PublisherLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setLoading(false);
      return Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Both username and password are required.",
      });
    }

    try {
      const response = await fetch(`${apiUrl}/login-publisher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();
      console.log("Login response:", data);
      if (data.success) {
        dispatch(
          setUser({
            ...data.user,
            role: Array.isArray(data.user.role)
              ? data.user.role
              : typeof data.user.role === "string"
                ? data.user.role.split(",").map((r) => r.trim())
                : [],
          }),
        );

        Swal.fire({
          icon: "success",
          title: "Logged in!",
          text: `Welcome back, ${data.user.username || "User"}!`,
          timer: 1500,
          showConfirmButton: false,
        });

        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        Swal.fire({
          icon: "error",
          title: "Login failed",
          text: data.message || "Invalid credentials",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login failed",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#496e93] min-h-screen flex items-center justify-center p-4 md:p-10">
      <div className="relative flex flex-col md:flex-row w-full max-w-7xl h-auto md:h-[80vh] rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Side */}
        <div className="w-full md:w-2/5 bg-[#002F65] text-white flex flex-col justify-center px-8 py-10 md:px-14 relative">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-snug text-center md:text-left">
            Welcome to <br />
            Click Orbits
          </h1>
          <p className="text-base md:text-lg leading-relaxed opacity-90 text-center md:text-left">
            PID Metric: Powering seamless campaign management and precise
            performance tracking.
          </p>
        </div>

        {/* Center Logo Box */}
        <div
          className="absolute md:top-1/2 md:left-2/5 top-[38%] left-1/2 transform 
                 -translate-x-1/2 -translate-y-1/2 z-10 
                 bg-white rounded-full shadow-2xl border border-gray-200 
                 flex items-center justify-center w-12 h-12 md:w-20 md:h-20">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-15 h-15 md:w-20 md:h-20 object-contain"
          />
        </div>

        {/* Right Side */}
        <div className="w-full md:w-3/5 flex items-center justify-center bg-white px-6 py-10 md:px-16">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-semibold text-[#01509D] mb-8 text-center">
              Login to Your Publisher Account
            </h2>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#2F5D99] focus:outline-none"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <FaLock />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="block w-full pl-10 pr-10 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#2F5D99] focus:outline-none"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full py-2 bg-[#2F5D99] text-white rounded-md font-semibold text-lg shadow-md hover:opacity-90 transition disabled:opacity-50"
                disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
              {/* Forgot Password Link */}
              <div className="flex justify-center -mt-2">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="flex items-center gap-1 text-sm text-[#2F5D99] font-medium hover:text-[#01509D] transition-all hover:underline">
                  <FaLock className="text-xs opacity-70" />
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublisherLogin;
