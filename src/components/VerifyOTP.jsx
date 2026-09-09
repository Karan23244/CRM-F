import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaArrowLeft, FaShieldAlt } from "react-icons/fa";

const apiUrl = import.meta.env.VITE_API_URL;

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState(Array(6).fill(""));

  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(600);

    useEffect(() => {
      if (!email) {
        navigate("/forgot-password");
      }
    }, [email, navigate]);
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);
  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const newOtp = [...otp];

    pasted.split("").forEach((digit, i) => {
      newOtp[i] = digit;
    });

    setOtp(newOtp);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };
  const handleVerify = async (e) => {
    e.preventDefault();

    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      return Swal.fire({
        icon: "error",
        title: "Invalid OTP",
        text: "Please enter all 6 digits.",
      });
    }

    try {
      setLoading(true);

      const response = await fetch(`${apiUrl}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: otpValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      Swal.fire({
        icon: "success",
        title: "Verified",
        text: data.message,
      });

      navigate("/reset-password", {
        state: {
          email,
        },
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      setResending(true);

      const response = await fetch(`${apiUrl}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSeconds(600);

      Swal.fire({
        icon: "success",
        title: "OTP Sent",
        text: data.message,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-[#496e93] min-h-screen flex items-center justify-center p-4 md:p-10">
      <div className="relative flex flex-col md:flex-row w-full max-w-7xl h-auto md:h-[80vh] rounded-2xl overflow-hidden shadow-2xl">
        {/* Left */}
        <div className="w-full md:w-2/5 bg-[#002F65] text-white flex flex-col justify-center px-8 py-10 md:px-14">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-snug text-center md:text-left">
            Verify <br />
            OTP
          </h1>

          <p className="text-base md:text-lg opacity-90 leading-relaxed text-center md:text-left">
            Enter the 6-digit OTP sent to your registered email address to
            continue.
          </p>
        </div>

        {/* Logo */}

        <div
          className="absolute md:top-1/2 md:left-2/5 top-[38%] left-1/2 transform
          -translate-x-1/2 -translate-y-1/2
          bg-white rounded-full shadow-2xl border border-gray-200
          flex items-center justify-center
          w-12 h-12 md:w-20 md:h-20">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-15 h-15 md:w-20 md:h-20 object-contain"
          />
        </div>

        {/* Right */}

        <div className="w-full md:w-3/5 bg-white flex items-center justify-center px-6 py-10 md:px-16">
          <div className="w-full max-w-md">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#01509D] mb-2 text-center">
              OTP Verification
            </h2>

            <p className="text-gray-500 text-center mb-8">
              Enter the code sent to
            </p>

            <p className="text-center text-[#2F5D99] font-semibold mb-8 break-all">
              {email}
            </p>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Enter Verification Code
                </label>

                <div
                  className="flex justify-between gap-3"
                  onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="
          w-12
          h-14
          md:w-14
          md:h-16
          rounded-xl
          border-2
          border-gray-300
          text-center
          text-2xl
          font-bold
          text-[#01509D]
          outline-none
          transition-all
          duration-200
          focus:border-[#2F5D99]
          focus:ring-4
          focus:ring-[#2F5D99]/20
          shadow-sm
        "
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                  <span className="text-sm text-gray-500">OTP expires in</span>

                  <span className="font-bold text-red-500">
                    {minutes}:{remainingSeconds.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#2F5D99] text-white rounded-md font-semibold text-lg shadow-md hover:opacity-90 transition disabled:opacity-50">
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                disabled={seconds > 0 || resending}
                onClick={resendOTP}
                className="
      w-full
      py-3
      rounded-lg
      border
      border-[#2F5D99]
      text-[#2F5D99]
      font-semibold
      transition-all
      duration-300
      hover:bg-[#2F5D99]
      hover:text-white
      disabled:bg-gray-100
      disabled:text-gray-400
      disabled:border-gray-300
      disabled:cursor-not-allowed
  ">
                {resending ? "Sending..." : "Resend OTP"}
              </button>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="flex items-center gap-2 text-sm text-[#2F5D99] hover:underline">
                  <FaArrowLeft className="text-xs" />
                  Back
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
