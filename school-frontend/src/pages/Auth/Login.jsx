import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../../store/slices/authSlice";
import { authService } from "../../services/authServices";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/UI/Button";
import { FaEnvelope, FaLock, FaSchool, FaGraduationCap } from "react-icons/fa";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { loading, error } = useSelector((state) => state.auth);
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    dispatch(loginStart());

    try {
      const result = await authService.login(formData);
      dispatch(loginSuccess(result.token));
      
      // Fetch user profile after successful login
      if (result.user) {
        const { setUser } = await import("../../store/slices/userSlice");
        dispatch(setUser(result.user));
      }
      
      showToast('Login successful! Welcome back.', 'success');
      navigate("/dashboard");
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || "Login failed";
      setLocalError(errorMessage);
      showToast(errorMessage, 'error');
      dispatch(loginFailure(errorMessage));
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Left Side - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between"
        style={{
          backgroundColor: "#F3F4F6",
        }}
      >
        <div>
          <Link to="/" className="flex items-center space-x-3 text-gray-800 hover:opacity-80 transition-opacity">
            <div className="p-3 bg-blue-500 rounded-xl">
              <FaSchool className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold">Haya School</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl font-bold leading-tight text-gray-800">
            Welcome to
            <br />
            <span className="text-blue-500">Haya School</span>
          </h1>
          <p className="text-xl text-gray-600">
            Empowering education through innovative technology and dedicated learning
          </p>
          <div className="flex flex-wrap gap-4 pt-6">
            <div className="flex items-center space-x-2 text-gray-700">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaGraduationCap className="text-xl text-blue-500" />
              </div>
              <span className="text-lg font-medium">Students</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaSchool className="text-xl text-blue-500" />
              </div>
              <span className="text-lg font-medium">Teachers</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-700">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaSchool className="text-xl text-blue-500" />
              </div>
              <span className="text-lg font-medium">Parents</span>
            </div>
          </div>
          
          <div className="pt-8">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-md"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          © 2024 Haya School. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center space-x-3">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <FaSchool className="h-8 w-8 text-white" />
              </div>
              <span
                className="text-3xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                Haya
              </span>
            </div>
          </div>

          <div className="card">
            <div className="mb-8">
              <h2
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--color-text)" }}
              >
                Sign in
              </h2>
              <p style={{ color: "var(--color-textSecondary)" }}>
                Welcome back! Please enter your details.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {localError && (
                <div
                  className="px-4 py-3 rounded-lg animate-fadeIn"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid var(--color-error)",
                    color: "var(--color-error)",
                  }}
                >
                  {localError}
                </div>
              )}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text)" }}
                >
                  Email address
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaEnvelope
                      style={{ color: "var(--color-textSecondary)" }}
                    />
                  </div>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-12 pl-12 pr-4 rounded-lg border 
                 border-gray-300 focus:outline-none 
                 focus:ring-2 focus:ring-indigo-500
                 bg-transparent text-sm
                 placeholder:text-gray-400"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                  style={{ color: "var(--color-text)" }}
                >
                  Password
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock style={{ color: "var(--color-textSecondary)" }} />
                  </div>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full h-12 pl-12 pr-4 rounded-lg border 
                 border-gray-300 focus:outline-none
                 focus:ring-2 focus:ring-indigo-500
                 bg-transparent text-sm
                 placeholder:text-gray-400"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  loading={loading}
                  loadingText="Signing in..."
                  disabled={loading}
                  variant="primary"
                  size="large"
                  className="w-full"
                >
                  Sign in
                </Button>
              </div>

              <div className="text-center">
                <Link
                  to="/register"
                  className="font-medium transition-colors"
                  style={{ color: "var(--color-primary)" }}
                  onMouseEnter={(e) => {
                    e.target.style.color = "var(--color-primaryDark)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = "var(--color-primary)";
                  }}
                >
                  Don't have an account? Sign up
                </Link>
              </div>
            </form>
          </div>

          {/* Demo Credentials */}
          <div
            className="mt-6 p-4 rounded-lg text-sm"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p
              className="font-semibold mb-2"
              style={{ color: "var(--color-text)" }}
            >
              Demo Credentials:
            </p>
            <p style={{ color: "var(--color-textSecondary)" }}>
              Admin: admin@school.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
