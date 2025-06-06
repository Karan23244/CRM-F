import { useState } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://apii.clickorbits.in/api";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  // Trim username and password to remove leading/trailing spaces
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
      body: JSON.stringify({ username: trimmedUsername, password: trimmedPassword }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Login failed");

    dispatch(setUser(data.subAdmin)); // Store user in Redux & localStorage

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-sm w-full">
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          Login
        </h2>

        <form onSubmit={handleLogin} className="mt-4">
          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Username
            </label>
            <input
              type="text"
              className="block w-full px-2 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              className="block w-full px-2 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="block w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
