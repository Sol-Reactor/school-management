import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/UI/Button";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import {
  FaUser,
  FaEnvelope,
  FaCalendar,
  FaCamera,
  FaEdit,
} from "react-icons/fa";

const Profile = () => {
  const { user, updateProfile, fetchUserProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    avatar: user?.avatar || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
      setEditing(false);
      await fetchUserProfile();
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const avatarOptions = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  ];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <LoadingSpinner size="large" />
          </div>
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--color-text)" }}
          >
            Loading Profile...
          </h2>
          <p className="mb-4" style={{ color: "var(--color-textSecondary)" }}>
            We're fetching your profile information.
          </p>
          <Button onClick={fetchUserProfile} variant="secondary">
            Retry Loading Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="card card-hover">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="relative group">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                backgroundColor: "var(--color-primary)",
                border: "4px solid var(--color-border)",
              }}
            >
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser className="text-white text-5xl" />
              )}
            </div>
            {editing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <FaCamera className="text-white text-2xl" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: "var(--color-text)" }}
            >
              {user.fullName}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <span className="badge badge-info capitalize">
                {user.role?.toLowerCase()}
              </span>
              <span
                className="flex items-center text-sm"
                style={{ color: "var(--color-textSecondary)" }}
              >
                <FaEnvelope className="mr-2" />
                {user.email}
              </span>
              <span
                className="flex items-center text-sm"
                style={{ color: "var(--color-textSecondary)" }}
              >
                <FaCalendar className="mr-2" />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-primary flex items-center space-x-2 mx-auto md:mx-0"
              >
                <FaEdit />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card animate-fadeIn">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--color-text)" }}
          >
            Edit Profile
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--color-text)" }}
              >
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="input-field w-full"
                required
              />
            </div>

            {/* Avatar Selection */}
            <div>
              <label
                className="block text-sm font-medium mb-3"
                style={{ color: "var(--color-text)" }}
              >
                Choose Avatar
              </label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {avatarOptions.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar })}
                    className="w-full aspect-square rounded-full overflow-hidden transition-all duration-200 hover:scale-110"
                    style={{
                      border:
                        formData.avatar === avatar
                          ? "3px solid var(--color-primary)"
                          : "2px solid var(--color-border)",
                      boxShadow:
                        formData.avatar === avatar
                          ? "0 0 0 4px rgba(59, 130, 246, 0.1)"
                          : "none",
                    }}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <p
                className="text-sm mt-2"
                style={{ color: "var(--color-textSecondary)" }}
              >
                Or paste a custom image URL:
              </p>
              <input
                type="url"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
                className="input-field w-full mt-2"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 md:flex-none"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    fullName: user.fullName,
                    avatar: user.avatar || "",
                  });
                }}
                className="px-6 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Role-specific Information */}
      {user.role === "STUDENT" && user.student && (
        <div className="card">
          <h3
            className="text-xl font-bold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Student Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-textSecondary)" }}
              >
                Class
              </label>
              <p
                className="text-lg font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                {user.student.class?.name || "Not assigned"}
              </p>
              {user.student.class?.level && (
                <p
                  className="text-sm"
                  style={{ color: "var(--color-textSecondary)" }}
                >
                  Level: {user.student.class.level}
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-textSecondary)" }}
              >
                Parent/Guardian
              </label>
              <p
                className="text-lg font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                {user.student.parent?.user?.fullName || "Not assigned"}
              </p>
              {user.student.parent?.user?.email && (
                <p
                  className="text-sm"
                  style={{ color: "var(--color-textSecondary)" }}
                >
                  {user.student.parent.user.email}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {user.role === "TEACHER" && user.teacher && (
        <div className="card">
          <h3
            className="text-xl font-bold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Teacher Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--color-textSecondary)" }}
              >
                Classes Teaching
              </label>
              <p
                className="text-lg font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                {user.teacher.classes?.length || 0} Classes
              </p>
            </div>
          </div>
        </div>
      )}

      {user.role === "PARENT" && user.parent && (
        <div className="card">
          <h3
            className="text-xl font-bold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Parent Information
          </h3>
          <div>
            <label
              className="block text-sm font-medium mb-3"
              style={{ color: "var(--color-textSecondary)" }}
            >
              Children
            </label>
            {user.parent.students && user.parent.students.length > 0 ? (
              <div className="space-y-3">
                {user.parent.students.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: "var(--color-background)" }}
                  >
                    <p
                      className="font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {student.user?.fullName}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--color-textSecondary)" }}
                    >
                      Class: {student.class?.name || "Not assigned"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--color-textSecondary)" }}>
                No children assigned
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
