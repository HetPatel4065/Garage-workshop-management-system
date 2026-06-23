import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      return setError("Passwords do not match");
    }
    if (password.length < 8) {
      return setError("Password must be at least 8 characters");
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-3 mb-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-blue-600 p-2.5 rounded-xl">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">
              Garage<span className="text-blue-600">Pro</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Set New Password
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter your new password below
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="h-1 w-full bg-blue-500" />
          <div className="p-6 sm:p-8">
            {success ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Password Reset!
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Your password has been updated successfully.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                >
                  Go to Login
                </button>
              </div>
            ) : !token ? (
              <div className="text-center py-4">
                <p className="text-red-500 font-medium">
                  Invalid or missing reset link.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="mt-4 text-sm text-blue-600 hover:underline"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full h-11 px-4 pr-11 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-400 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon style={{ width: 18, height: 18 }} />
                      ) : (
                        <EyeIcon style={{ width: 18, height: 18 }} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Enter Password Again"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-blue-400 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
