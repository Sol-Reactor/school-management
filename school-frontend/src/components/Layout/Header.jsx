import React, { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useNotifications } from "../../context/NotificationContext";
import { logout } from "../../store/slices/authSlice";
import {
  FaSignOutAlt,
  FaBars,
  FaPalette,
  FaBell,
  FaUser,
  FaCog,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../UI/LoadingSpinner";

const Header = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTheme, themes, changeTheme } = useTheme();
  const { showToast } = useToast();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const themeMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target)
      ) {
        setShowThemeMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    // Simulate a brief delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    dispatch(logout());
    showToast("Logged out successfully. See you soon!", "info");
    setIsLoggingOut(false);
    navigate("/login");
  };

  // Get first name from full name
  const getFirstName = (fullName) => {
    if (!fullName) return "";
    return fullName.split(" ")[0];
  };

  return (
    <header
      className="shadow-sm z-10"
      style={{
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-opacity-10"
            style={{ color: "var(--color-text)" }}
          >
            <FaBars className="text-xl" />
          </button>
          <h1
            className="text-lg md:text-xl font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            Welcome back,{" "}
            <span style={{ color: "var(--color-primary)" }}>
              {getFirstName(user?.fullName)}
            </span>
            !
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-opacity-10 relative"
              style={{ color: "var(--color-text)" }}
            >
              <FaBell className="text-xl" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: "var(--color-error)" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg py-2 z-50 max-h-96 overflow-y-auto"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  className="px-4 py-2 border-b flex items-center justify-between"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <h3
                    className="font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-medium"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="px-4 py-3 hover:bg-opacity-10 cursor-pointer border-b"
                      style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: !notification.read
                          ? "rgba(59, 130, 246, 0.05)"
                          : "transparent",
                      }}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                          style={{
                            backgroundColor: !notification.read
                              ? "var(--color-primary)"
                              : "transparent",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-medium text-sm"
                            style={{ color: "var(--color-text)" }}
                          >
                            {notification.title}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--color-textSecondary)" }}
                          >
                            {notification.message}
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--color-textSecondary)" }}
                          >
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p style={{ color: "var(--color-textSecondary)" }}>
                      No notifications
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-lg hover:bg-opacity-10"
              style={{ color: "var(--color-text)" }}
            >
              <FaPalette className="text-xl" />
            </button>
            {showThemeMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 z-50"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {Object.entries(themes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => {
                      changeTheme(key);
                      setShowThemeMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-opacity-10"
                    style={{
                      backgroundColor:
                        currentTheme === key
                          ? "var(--color-primary)"
                          : "transparent",
                      color:
                        currentTheme === key ? "white" : "var(--color-text)",
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span className="text-sm">{theme.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Avatar with Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-1 rounded-lg hover:bg-opacity-10 transition-all"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user?.fullName?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:block text-left">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  {getFirstName(user?.fullName)}
                </p>
                <p
                  className="text-xs capitalize"
                  style={{ color: "var(--color-textSecondary)" }}
                >
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-2 z-50"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <p
                    className="font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {user?.fullName}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-textSecondary)" }}
                  >
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigate("/profile");
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-opacity-10"
                  style={{ color: "var(--color-text)" }}
                >
                  <FaUser />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/settings");
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-opacity-10"
                  style={{ color: "var(--color-text)" }}
                >
                  <FaCog />
                  <span>Settings</span>
                </button>

                <div
                  className="border-t my-2"
                  style={{ borderColor: "var(--color-border)" }}
                />

                <button
                  onClick={() => {
                    handleLogout();
                    setShowProfileMenu(false);
                  }}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-2 text-left flex items-center space-x-3 hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: "var(--color-error)" }}
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-4 h-4">
                        <LoadingSpinner size="small" />
                      </div>
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
