import React, { useState } from "react";
import { authAPI } from "../api";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Assuming ThemeContext is already set up

const SignUpPage = () => {
  const { theme } = useTheme(); // Get the current theme from ThemeContext
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Form submitted:", { name, email, password });
      await authAPI.signUp({ name, email, password });
      navigate("/signin");
    } catch (error) {
      console.error("Signup failed", error);
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
        <h2
          className={`text-2xl font-bold mb-6 text-center ${
            theme === "dark" ? "text-gray-200" : "text-gray-800"
          }`}
        >
          Sign Up
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition ${
              theme === "dark"
                ? "bg-gray-600 hover:bg-gray-500"
                : "bg-gray-500 hover:bg-gray-400"
            }`}
          >
            Sign Up
          </button>
        </form>
        <p
          className={`text-center text-sm mt-4 ${
            theme === "dark" ? "text-gray-400" : "text-gray-700"
          }`}
        >
          Already have an account?{" "}
          <a
            href="/signin"
            className={`${
              theme === "dark" ? "text-gray-300 hover:text-gray-200" : "text-gray-600 hover:text-gray-500"
            } underline`}
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
