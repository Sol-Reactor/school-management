// src/pages/Auth/Register.js
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { loginStart, loginSuccess, loginFailure } from "../../store/slices/authSlice";
import { authService } from "../../services/authServices";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/UI/Button.jsx";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaSchool,
  FaUserTie,
  FaUserGraduate,
  FaUserFriends,
} from "react-icons/fa";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
    parentEmail: "", // For student registration
  });

  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { loading } = useSelector((state) => state.auth);

  const roles = [
    {
      value: "STUDENT",
      label: "Student",
      icon: FaUserGraduate,
      description: "Register as a student",
    },
    {
      value: "PARENT",
      label: "Parent",
      icon: FaUserFriends,
      description: "Register as a parent",
    },
    {
      value: "TEACHER",
      label: "Teacher",
      icon: FaUserTie,
      description: "Register as a teacher",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.role === "STUDENT" && formData.parentEmail) {
      if (!/\S+@\S+\.\S+/.test(formData.parentEmail)) {
        newErrors.parentEmail = "Parent email is invalid";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    dispatch(loginStart()); // Start loading

    try {
      // Prepare data for API
      const registrationData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      // Add parent email only if provided and role is STUDENT
      if (formData.role === "STUDENT" && formData.parentEmail) {
        registrationData.parentEmail = formData.parentEmail;
      }

      const result = await authService.register(registrationData);
      dispatch(loginSuccess(result.token));
      
      // Store user data after successful registration
      if (result.user) {
        const { setUser } = await import("../../store/slices/userSlice");
        dispatch(setUser(result.user));
      }
      
      showToast('Account created successfully! Welcome to Haya School.', 'success');
      navigate("/dashboard");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      setErrors({ submit: errorMessage });
      showToast(errorMessage, 'error');
      dispatch(loginFailure(errorMessage)); // Stop loading on error
    }
  };

  const RoleCard = ({ role, selected, onClick }) => {
    const Icon = role.icon;

    return (
      <div
        onClick={() => onClick(role.value)}
        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
          selected
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-full ${
              selected
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <Icon className="text-lg" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{role.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{role.description}</p>
          </div>
          <div
            className={`w-4 h-4 rounded-full border-2 ${
              selected ? "bg-blue-500 border-blue-500" : "border-gray-300"
            }`}
          >
            {selected && (
              <div className="w-full h-full rounded-full bg-white scale-50"></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <FaSchool className="h-12 w-12 text-blue-500" />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join Haya School management system
        </p>
        <div className="mt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {roles.map((role) => (
                  <RoleCard
                    key={role.value}
                    role={role}
                    selected={formData.role === role.value}
                    onClick={(value) =>
                      setFormData((prev) => ({ ...prev, role: value }))
                    }
                  />
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.fullName ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Parent Email (Only for Students) */}
            {formData.role === "STUDENT" && (
              <div>
                <label
                  htmlFor="parentEmail"
                  className="block text-sm font-medium text-gray-700"
                >
                  Parent's Email (Optional)
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserFriends className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="parentEmail"
                    name="parentEmail"
                    type="email"
                    autoComplete="email"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.parentEmail ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter parent's email (if already registered)"
                  />
                </div>
                {errors.parentEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.parentEmail}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  If your parent is already registered, enter their email to
                  link your accounts
                </p>
              </div>
            )}

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="Confirm your password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                loading={loading}
                loadingText="Creating Account..."
                className="w-full flex justify-center py-3"
                size="large"
              >
                Create Account
              </Button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 transition duration-150"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>

          {/* Role-specific information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              What you'll get:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <FaUserGraduate className="text-green-500" />
                <span>Students: Access classes, grades, and attendance</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaUserFriends className="text-blue-500" />
                <span>Parents: Monitor children's progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaUserTie className="text-purple-500" />
                <span>Teachers: Manage classes and students</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
