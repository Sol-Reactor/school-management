// src/pages/Teachers/Teachers.js
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../hooks/useApi";
import { userService } from "../../services/userService";
import Button from "../../components/UI/Button";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import Modal from "../../components/UI/Modal";
import {
  FaChalkboardTeacher,
  FaSearch,
  FaEnvelope,
  FaSchool,
  FaUsers,
  FaEye,
  FaUserTie,
} from "react-icons/fa";

const Teachers = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 10,
  });
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const {
    data: teachersData,
    loading,
    error,
  } = useApi(() => userService.getUsers({ role: "TEACHER", ...filters }));

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleViewTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setShowModal(true);
  };

  const TeacherCard = ({ teacher }) => (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FaUserTie className="text-purple-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {teacher.user.fullName}
              </h3>
              <p className="text-gray-500 flex items-center space-x-1">
                <FaEnvelope className="text-sm" />
                <span>{teacher.user.email}</span>
              </p>
              {teacher.classes && teacher.classes.length > 0 && (
                <p className="text-gray-600 flex items-center space-x-1 mt-1">
                  <FaSchool className="text-sm" />
                  <span>{teacher.classes.length} classes</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleViewTeacher(teacher)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="View Details"
            >
              <FaEye />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <FaChalkboardTeacher className="mr-1" />
            Teacher
          </span>

          {teacher.classes && teacher.classes.length > 0 ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <FaSchool className="mr-1" />
              {teacher.classes.length} Classes
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              No Classes Assigned
            </span>
          )}

          {teacher._count && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <FaUsers className="mr-1" />
              {teacher._count.classes || 0} Classes
            </span>
          )}
        </div>

        {teacher.classes && teacher.classes.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Classes:</h4>
            <div className="flex flex-wrap gap-1">
              {teacher.classes.slice(0, 3).map((classItem) => (
                <span
                  key={classItem.id}
                  className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {classItem.name}
                </span>
              ))}
              {teacher.classes.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                  +{teacher.classes.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const TeacherDetailModal = () => (
    <Modal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      title="Teacher Details"
      size="lg"
    >
      {selectedTeacher && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <FaUserTie className="text-purple-600 text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedTeacher.user.fullName}
              </h2>
              <p className="text-gray-500">{selectedTeacher.user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTeacher.user.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {selectedTeacher.user.role}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Member Since
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(
                    selectedTeacher.user.createdAt
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Teaching Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Classes
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTeacher.classes?.length || 0}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Students
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTeacher._count?.students || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {selectedTeacher.classes && selectedTeacher.classes.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Assigned Classes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedTeacher.classes.map((classItem) => (
                  <div key={classItem.id} className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900">
                      {classItem.name}
                    </h4>
                    <p className="text-sm text-gray-600">{classItem.level}</p>
                    {classItem._count && (
                      <p className="text-xs text-gray-500 mt-1">
                        {classItem._count.students || 0} students
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );

  if (loading) return <LoadingSpinner />;
  if (error)
    return <div className="text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <FaChalkboardTeacher className="text-purple-500" />
            <span>Teachers</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and view all teachers in the system
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Teachers
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {teachersData?.users?.length || 0} teachers
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teachersData?.users?.map((teacher) => (
          <TeacherCard key={teacher.id} teacher={teacher} />
        ))}
      </div>

      {/* Empty State */}
      {(!teachersData?.users || teachersData.users.length === 0) && (
        <div className="text-center py-12">
          <FaChalkboardTeacher className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No teachers
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search
              ? "No teachers match your search."
              : "No teachers found in the system."}
          </p>
        </div>
      )}

      <TeacherDetailModal />
    </div>
  );
};

export default Teachers;
