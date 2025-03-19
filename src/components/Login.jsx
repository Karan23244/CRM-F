import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../redux/authSlice";
import { useNavigate } from "react-router-dom";

const apiUrl =
  import.meta.env.VITE_API_URL || "https://api.clickorbits.in/api";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username || !password) {
      setError("Both fields are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/login-subadmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      dispatch(setUser(data.subAdmin)); // Store user in Redux & localStorage

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
        case "manager":
          navigate("/manager-home");
          break;
        default:
          navigate("/");
      }
    } catch (error) {
      setError(error.message);
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

        {error && (
          <p className="text-red-500 text-sm text-center mt-2">{error}</p>
        )}

        <form onSubmit={handleLogin} className="mt-4">
          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Username
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
