import { useState } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Both username and password are required.",
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/login-subadmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      dispatch(setUser(data.subAdmin));

      Swal.fire({
        icon: "success",
        title: "Logged in!",
        text: `Welcome back, ${data.subAdmin.username || "User"}!`,
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        switch (data.subAdmin.role) {
          case "admin":
            navigate("/admin-home");
            break;
          case "advertiser":
            navigate("/advertiser-home");
            break;
          case "publisher":
            navigate("/publisher-home");
            break;
          case "advertiser_manager":
            navigate("/advertiser-manager-home");
            break;
          case "publisher_manager":
            navigate("/publisher-manager-home");
            break;
          case "manager":
            navigate("/manager-home");
            break;
          default:
            navigate("/");
        }
      }, 1500);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900">
      <div className="backdrop-blur-lg shadow-2xl rounded-2xl p-10 max-w-md w-full  bg-white">
        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/crm.png" // <- Replace with your actual logo path
            alt="Logo"
            className="w-20 h-20 mb-3"
          />
          <h2 className="text-3xl text-blue-600 font-bold">ClickOrbits</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 text-black">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <FaUser />
              </span>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 text-black rounded-md bg-white/20 border border-gray-400 placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <FaLock />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="block w-full pl-10 pr-10 py-2 rounded-md text-black bg-white/20 border border-gray-400 placeholder-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
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

          {/* Button */}
          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-md font-semibold text-lg shadow-lg hover:opacity-90 transition disabled:opacity-50"
            disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Extra Links */}
        {/* <p className="text-center mt-6 text-sm text-gray-300">
          Forgot your password?{" "}
          <a href="#" className="underline hover:text-white">
            Reset here
          </a>
        </p> */}
      </div>
    </div>
  );
};

export default LoginForm;
