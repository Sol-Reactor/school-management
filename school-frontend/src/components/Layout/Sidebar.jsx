import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaTachometerAlt,
  FaUser,
  FaUsers,
  FaChalkboardTeacher,
  FaSchool,
  FaClipboardList,
  FaTimes,
} from "react-icons/fa";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Get first name from full name
  const getFirstName = (fullName) => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };

  const menuItems = [
    { path: "/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
    { path: "/profile", icon: FaUser, label: "Profile" },
  ];

  if (user?.role === "ADMIN" ) {
    menuItems.push(
      { path: "/students", icon: FaUsers, label: "Students" },
      { path: "/teachers", icon: FaChalkboardTeacher, label: "Teachers" },
      { path: "/classes", icon: FaSchool, label: "Classes" }
    );
  }
    if (user?.role === "TEACHER") {
    menuItems.push(
      { path: "/students", icon: FaUsers, label: "Students" },
      { path: "/attendance", icon: FaClipboardList, label: "Attendance" },
      { path: "/classes", icon: FaSchool, label: "Classes" }
    );
  }


  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center space-x-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <FaSchool className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                Haya
              </span>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-lg hover:bg-opacity-10"
              style={{ color: 'var(--color-text)' }}
            >
              <FaTimes />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group"
                  style={{
                    backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                    color: isActive ? 'white' : 'var(--color-text)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--color-border)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon className="text-lg" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4" style={{ borderTop: '2px solid var(--color-border)' }}>
            <div className="flex items-center space-x-3 px-3 py-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {getFirstName(user?.fullName.toUpperCase())}
                </p>
                <p className="text-xs truncate capitalize" style={{ color: 'var(--color-textPrimary)' }}>
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
