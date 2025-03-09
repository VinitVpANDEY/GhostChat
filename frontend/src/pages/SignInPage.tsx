import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; // Assuming ThemeContext is already set up

const SignInPage = () => {
  const { login } = useAuth();
  const { theme } = useTheme(); // Get the current theme from ThemeContext
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during sign-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        theme === "dark" ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div
        className={`p-8 rounded-lg shadow-lg w-full max-w-md ${
          theme === "dark" ? "bg-gray-700" : "bg-white"
        }`}
      >
        <h1
          className={`text-2xl font-bold mb-6 text-center ${
            theme === "dark" ? "text-gray-200" : "text-gray-800"
          }`}
        >
          Sign In
        </h1>
        {error && (
          <p
            className={`${
              theme === "dark" ? "bg-red-500 text-white" : "bg-red-600 text-white"
            } p-3 rounded-md mb-4 text-center`}
          >
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full p-2 border rounded-md ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-500 text-gray-100 focus:ring-2 focus:ring-gray-400"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500"
              }`}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full p-2 border rounded-md ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-500 text-gray-100 focus:ring-2 focus:ring-gray-400"
                  : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500"
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : theme === "dark"
                ? "bg-gray-600 hover:bg-gray-500"
                : "bg-gray-500 hover:bg-gray-400"
            }`}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <p
          className={`text-center text-sm mt-4 ${
            theme === "dark" ? "text-gray-400" : "text-gray-700"
          }`}
        >
          Don't have an account?{" "}
          <a
            href="/signup"
            className={`${
              theme === "dark" ? "text-gray-300 hover:text-gray-200" : "text-gray-600 hover:text-gray-500"
            } underline`}
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
