import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../hooks/useApi";
import { dashboardService } from "../../services/dashboardService";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import {
  FaUsers,
  FaChalkboardTeacher,
  FaUserFriends,
  FaSchool,
  FaBook,
  FaClipboardCheck,
  FaCalendarAlt,
  FaTrophy,
  FaChartLine,
} from "react-icons/fa";

const StatCard = ({ icon: Icon, title, value, color, trend }) => (
  <div className="card card-hover">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: color + "20",
            color: color,
          }}
        >
          <Icon className="text-3xl" />
        </div>
        <div>
          <h3
            className="text-sm font-medium"
            style={{ color: "var(--color-textSecondary)" }}
          >
            {title}
          </h3>
          <p
            className="text-3xl font-bold mt-1"
            style={{ color: "var(--color-text)" }}
          >
            {value}
          </p>
          {trend && (
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-success)" }}
            >
              {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const {
    data: dashboardData,
    loading,
    error,
  } = useApi(() => dashboardService.getDashboard(), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4" style={{ color: "var(--color-textSecondary)" }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="card"
        style={{
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderColor: "var(--color-error)",
        }}
      >
        <p style={{ color: "var(--color-error)" }}>
          Error loading dashboard: {error}
        </p>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--color-textSecondary)" }}
        >
          Please try refreshing the page or contact support if the issue
          persists.
        </p>
      </div>
    );
  }

  // If no data yet, show loading
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4" style={{ color: "var(--color-textSecondary)" }}>
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (user?.role === "ADMIN") {
    const stats = [
      {
        icon: FaUsers,
        title: "Total Students",
        value: dashboardData?.summary?.totalStudents || 0,
        color: "var(--color-primary)",
        trend: "+12% from last month",
      },
      {
        icon: FaChalkboardTeacher,
        title: "Total Teachers",
        value: dashboardData?.summary?.totalTeachers || 0,
        color: "var(--color-success)",
        trend: "+5% from last month",
      },
      {
        icon: FaUserFriends,
        title: "Total Parents",
        value: dashboardData?.summary?.totalParents || 0,
        color: "var(--color-secondary)",
        trend: "+8% from last month",
      },
      {
        icon: FaSchool,
        title: "Total Classes",
        value: dashboardData?.summary?.totalClasses || 0,
        color: "var(--color-warning)",
      },
    ];

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Admin Dashboard
            </h1>
            <p style={{ color: "var(--color-textSecondary)" }}>
              Overview of your school management system
            </p>
          </div>
          <div className="badge badge-info">Administrator</div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: "var(--color-text)" }}
            >
              Recent Users
            </h2>
            <div className="space-y-3">
              {dashboardData?.recentActivity?.newUsers
                ?.slice(0, 5)
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: "var(--color-background)" }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        {user.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p
                          className="font-medium"
                          style={{ color: "var(--color-text)" }}
                        >
                          {user.fullName}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: "var(--color-textSecondary)" }}
                        >
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-info capitalize">
                      {user.role?.toLowerCase()}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="card">
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: "var(--color-text)" }}
            >
              Recent Enrollments
            </h2>
            <div className="space-y-3">
              {dashboardData?.recentActivity?.newEnrollments
                ?.slice(0, 5)
                .map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: "var(--color-background)" }}
                  >
                    <div>
                      <p
                        className="font-medium"
                        style={{ color: "var(--color-text)" }}
                      >
                        {enrollment.student?.user?.fullName}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--color-textSecondary)" }}
                      >
                        {enrollment.class?.name}
                      </p>
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-textSecondary)" }}
                    >
                      {new Date(enrollment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Teacher Dashboard
  if (user?.role === "TEACHER") {
    const stats = [
      {
        icon: FaSchool,
        title: "My Classes",
        value: dashboardData?.summary?.totalClasses || 0,
        color: "var(--color-primary)",
      },
      {
        icon: FaUsers,
        title: "Total Students",
        value: dashboardData?.summary?.totalStudents || 0,
        color: "var(--color-success)",
      },
      {
        icon: FaCalendarAlt,
        title: "Upcoming Exams",
        value: dashboardData?.summary?.upcomingExams || 0,
        color: "var(--color-warning)",
      },
    ];

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Teacher Dashboard
            </h1>
            <p style={{ color: "var(--color-textSecondary)" }}>
              Manage your classes and students
            </p>
          </div>
          <div className="badge badge-success">Teacher</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: "var(--color-text)" }}
            >
              My Classes
            </h2>
            <div className="space-y-3">
              {dashboardData?.myClasses?.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: "var(--color-background)" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="font-semibold"
                        style={{ color: "var(--color-text)" }}
                      >
                        {cls.name}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--color-textSecondary)" }}
                      >
                        Level: {cls.level}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-semibold"
                        style={{ color: "var(--color-primary)" }}
                      >
                        {cls._count?.students || 0}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-textSecondary)" }}
                      >
                        Students
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: "var(--color-text)" }}
            >
              Upcoming Exams
            </h2>
            <div className="space-y-3">
              {dashboardData?.upcomingExams?.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: "var(--color-background)" }}
                >
                  <p
                    className="font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {exam.name}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-textSecondary)" }}
                  >
                    {exam.subject?.name} - {exam.class?.name}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {new Date(exam.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  if (user?.role === "STUDENT") {
    const stats = [
      {
        icon: FaClipboardCheck,
        title: "Attendance",
        value: `${dashboardData?.summary?.attendancePercentage || 0}%`,
        color: "var(--color-success)",
      },
      {
        icon: FaBook,
        title: "Subjects",
        value: dashboardData?.summary?.totalSubjects || 0,
        color: "var(--color-primary)",
      },
      {
        icon: FaCalendarAlt,
        title: "Upcoming Exams",
        value: dashboardData?.summary?.upcomingExams || 0,
        color: "var(--color-warning)",
      },
    ];

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Student Dashboard
            </h1>
            <p style={{ color: "var(--color-textSecondary)" }}>
              Track your academic progress
            </p>
          </div>
          <div className="badge badge-info">Student</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Information Card */}
          <div className="card lg:col-span-2">
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: "var(--color-text)" }}
            >
              My Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--color-textSecondary)" }}
                >
                  My Class
                </label>
                <p
                  className="text-lg font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  {dashboardData?.studentInfo?.class?.name || "Not assigned"}
                </p>
                {dashboardData?.studentInfo?.class?.teacher?.user?.fullName && (
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-textSecondary)" }}
                  >
                    Teacher:{" "}
                    {dashboardData.studentInfo.class.teacher.user.fullName}
                  </p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--color-textSecondary)" }}
                >
                  My Parent/Guardian
                </label>
                <p
                  className="text-lg font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  {dashboardData?.studentInfo?.parent?.user?.fullName ||
                    "Not assigned"}
                </p>
                {dashboardData?.studentInfo?.parent?.user?.email && (
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-textSecondary)" }}
                  >
                    {dashboardData.studentInfo.parent.user.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: "var(--color-text)" }}
            >
              Recent Grades
            </h2>
            <div className="space-y-3">
              {dashboardData?.recentGrades?.map((grade) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: "var(--color-background)" }}
                >
                  <div>
                    <p
                      className="font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {grade.subject?.name}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--color-textSecondary)" }}
                    >
                      {grade.exam?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {grade.marks}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-textSecondary)" }}
                    >
                      marks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: "var(--color-text)" }}
            >
              Upcoming Exams
            </h2>
            <div className="space-y-3">
              {dashboardData?.upcomingExams?.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: "var(--color-background)" }}
                >
                  <p
                    className="font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {exam.name}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-textSecondary)" }}
                  >
                    {exam.subject?.name}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {new Date(exam.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Parent Dashboard
  if (user?.role === "PARENT") {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Parent Dashboard
            </h1>
            <p style={{ color: "var(--color-textSecondary)" }}>
              Monitor your children's progress
            </p>
          </div>
          <div className="badge badge-warning">Parent</div>
        </div>

        <div className="card">
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            My Children
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData?.children?.map((child) => (
              <div
                key={child.id}
                className="p-4 rounded-lg"
                style={{ backgroundColor: "var(--color-background)" }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {child.user?.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p
                      className="font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {child.user?.fullName}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--color-textSecondary)" }}
                    >
                      {child.class?.name || "No class assigned"}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-textSecondary)" }}
                  >
                    Attendance
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--color-success)" }}
                  >
                    {child.attendancePercentage || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Recent Grades
          </h2>
          <div className="space-y-3">
            {dashboardData?.recentGrades?.map((grade) => (
              <div
                key={grade.id}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: "var(--color-background)" }}
              >
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {grade.student?.user?.fullName}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-textSecondary)" }}
                  >
                    {grade.subject?.name} - {grade.exam?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {grade.marks}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-textSecondary)" }}
                  >
                    marks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Dashboard;
