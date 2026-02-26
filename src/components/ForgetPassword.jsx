import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";

const apiUrl = import.meta.env.VITE_API_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      return Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Email is required",
      });
    }

    try {
      setLoading(true);

      // 🔌 API call placeholder
      // await fetch(`${apiUrl}/forgot-password`, { ... })

      Swal.fire({
        icon: "success",
        title: "Reset Link Sent",
        text: "If this email exists, a password reset link has been sent.",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#496e93] min-h-screen flex items-center justify-center p-4 md:p-10">
      <div className="relative flex flex-col md:flex-row w-full max-w-7xl h-auto md:h-[80vh] rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Side */}
        <div className="w-full md:w-2/5 bg-[#002F65] text-white flex flex-col justify-center px-8 py-10 md:px-14">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-snug text-center md:text-left">
            Forgot Your <br />
            Password?
          </h1>
          <p className="text-base md:text-lg leading-relaxed opacity-90 text-center md:text-left">
            Don’t worry — we’ll help you get back into your account securely.
          </p>
        </div>

        {/* Center Logo */}
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
            <h2 className="text-3xl md:text-4xl font-semibold text-[#01509D] mb-8 text-center">
              Reset Password
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#2F5D99] focus:outline-none"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#2F5D99] text-white rounded-md font-semibold text-lg shadow-md hover:opacity-90 transition disabled:opacity-50">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              {/* Back to Login */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2 text-sm text-[#2F5D99] font-medium hover:text-[#01509D] hover:underline">
                  <FaArrowLeft className="text-xs" />
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
