// src/pages/Attendance/Attendance.js
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../hooks/useApi";
import { attendanceService } from "../../services/AttendanceServices";
import { classService } from "../../services/classService";
import Button from "../../components/UI/Button.jsx";
import LoadingSpinner from "../../components/UI/LoadingSpinner.jsx";
import Modal from "../../components/UI/Modal.jsx";
import {
  FaClipboardList,
  FaSearch,
  FaCalendar,
  FaUserCheck,
  FaUserTimes,
  FaClock,
  FaUserSlash,
  FaFilter,
  FaPlus,
} from "react-icons/fa";

const Attendance = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    classId: "",
    date: new Date().toISOString().split("T")[0],
    page: 1,
    limit: 10,
  });
  const [selectedClass, setSelectedClass] = useState(null);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});

  const { data: classesData } = useApi(() => classService.getClasses());
  const {
    data: fetchedClassAttendance,
    loading,
    error,
    refetch,
  } = useApi(() =>
    filters.classId
      ? attendanceService.getClassAttendance(filters.classId, {
          date: filters.date,
        })
      : null
  );

  const { data: studentAttendance } = useApi(() =>
    user?.role === "STUDENT"
      ? attendanceService.getStudentAttendance(user.student.id)
      : null
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleMarkAttendance = (classItem) => {
    setSelectedClass(classItem);
    setShowMarkAttendance(true);
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const submitAttendance = async () => {
    try {
      const attendanceRecords = Object.entries(attendanceData).map(
        ([studentId, status]) => ({
          studentId,
          classId: selectedClass.id,
          date: filters.date,
          status,
        })
      );

      // Submit each attendance record
      for (const record of attendanceRecords) {
        await attendanceService.markAttendance(record);
      }

      setShowMarkAttendance(false);
      setAttendanceData({});
      refetch();
    } catch (error) {
      console.error("Failed to mark attendance:", error);
    }
  };

  const statusColors = {
    PRESENT: "bg-green-100 text-green-800",
    ABSENT: "bg-red-100 text-red-800",
    LATE: "bg-yellow-100 text-yellow-800",
    EXCUSED: "bg-blue-100 text-blue-800",
  };

  const statusIcons = {
    PRESENT: FaUserCheck,
    ABSENT: FaUserTimes,
    LATE: FaClock,
    EXCUSED: FaUserSlash,
  };

  const AttendanceStatus = ({ status }) => {
    const Icon = statusIcons[status] || FaUserTimes;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
      >
        <Icon className="mr-1" />
        {status}
      </span>
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <FaClipboardList className="text-green-500" />
            <span>Attendance</span>
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === "TEACHER"
              ? "Manage class attendance"
              : "View your attendance records"}
          </p>
        </div>
      </div>

      {/* Role-specific content */}
      {user?.role === "TEACHER" && (
        <TeacherAttendanceView
          filters={filters}
          handleFilterChange={handleFilterChange}
          classesData={classesData}
          handleMarkAttendance={handleMarkAttendance}
          fetchedClassAttendance={fetchedClassAttendance}
          AttendanceStatus={AttendanceStatus}
        />
      )}
      {user?.role === "STUDENT" && (
        <StudentAttendanceView
          studentAttendance={studentAttendance}
          AttendanceStatus={AttendanceStatus}
        />
      )}

      {/* Parent and Admin views can be added similarly */}

      <MarkAttendanceModal
        showMarkAttendance={showMarkAttendance}
        setShowMarkAttendance={setShowMarkAttendance}
        selectedClass={selectedClass}
        filters={filters}
        attendanceData={attendanceData}
        handleAttendanceChange={handleAttendanceChange}
        submitAttendance={submitAttendance}
      />
    </div>
  );
};

// Helper Components (defined outside the main component)

const TeacherAttendanceView = ({
  filters,
  handleFilterChange,
  classesData,
  handleMarkAttendance,
  fetchedClassAttendance,
  AttendanceStatus,
}) => {
  const classToMark = classesData?.classes?.find(
    (c) => c.id === filters.classId
  );

  return (
    // Teacher View - Class Attendance
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={filters.classId}
              onChange={(e) => handleFilterChange("classId", e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a class</option>
              {classesData?.classes?.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaCalendar className="text-gray-400" />
              </div>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            {filters.classId && (
              <Button onClick={() => handleMarkAttendance(classToMark)}>
                <FaPlus className="mr-2" />
                Mark Attendance
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Attendance List */}
      {filters.classId && fetchedClassAttendance && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Attendance for {filters.date}
            </h3>
          </div>
          <div className="p-6">
            {fetchedClassAttendance.attendance &&
            fetchedClassAttendance.attendance.length > 0 ? (
              <div className="space-y-3">
                {fetchedClassAttendance.attendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <FaUserCheck className="text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {record.student.user.fullName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {record.student.user.email}
                        </p>
                      </div>
                    </div>
                    <AttendanceStatus status={record.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No attendance records
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No attendance has been marked for this class on {filters.date}
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StudentAttendanceView = ({ studentAttendance, AttendanceStatus }) => {
  const attendanceSummary = studentAttendance?.summary || {};
  const overallPercentage =
    attendanceSummary.TOTAL > 0
      ? Math.round((attendanceSummary.PRESENT / attendanceSummary.TOTAL) * 100)
      : 0;

  // Student View - Personal Attendance
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">My Attendance</h3>
        </div>
        <div className="p-6">
          {studentAttendance ? (
            <div className="space-y-4">
              {/* Attendance Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {attendanceSummary.PRESENT || 0}
                  </div>
                  <div className="text-sm text-green-700">Present</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {attendanceSummary.ABSENT || 0}
                  </div>
                  <div className="text-sm text-red-700">Absent</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {attendanceSummary.LATE || 0}
                  </div>
                  <div className="text-sm text-yellow-700">Late</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {attendanceSummary.EXCUSED || 0}
                  </div>
                  <div className="text-sm text-blue-700">Excused</div>
                </div>
              </div>

              {/* Attendance Percentage */}
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  Overall Attendance: {overallPercentage}%
                </div>
              </div>

              {/* Recent Attendance */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Recent Records
                </h4>
                <div className="space-y-2">
                  {studentAttendance.attendance?.slice(0, 10).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <span className="font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          {record.class?.name}
                        </span>
                      </div>
                      <AttendanceStatus status={record.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FaClipboardList className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No attendance records
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Your attendance records will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MarkAttendanceModal = ({
  showMarkAttendance,
  setShowMarkAttendance,
  selectedClass,
  filters,
  attendanceData,
  handleAttendanceChange,
  submitAttendance,
}) => {
  // Mark Attendance Modal
  return (
    <Modal
      isOpen={showMarkAttendance}
      onClose={() => setShowMarkAttendance(false)}
      title={`Mark Attendance - ${selectedClass?.name}`}
      size="lg"
    >
      {selectedClass && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FaCalendar className="text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-900">
                  Date: {filters.date}
                </h4>
                <p className="text-sm text-blue-700">
                  Class: {selectedClass.name}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedClass.students?.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <FaUserCheck className="text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {student.user.fullName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {student.user.email}
                    </p>
                  </div>
                </div>

                <select
                  value={attendanceData[student.id] || ""}
                  onChange={(e) =>
                    handleAttendanceChange(student.id, e.target.value)
                  }
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="EXCUSED">Excused</option>
                </select>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button onClick={submitAttendance} className="flex-1">
              Submit Attendance
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowMarkAttendance(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default Attendance;
