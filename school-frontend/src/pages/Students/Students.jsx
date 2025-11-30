// src/pages/Students/Students.js
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useApi } from "../../hooks/useApi";
import { studentService } from "../../services/studentService";
import { classService } from "../../services/classService";
import { enrollmentService } from "../../services/enrollmentService";
import Button from "../../components/UI/Button";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import Modal from "../../components/UI/Modal";
import {
  FaUsers,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserGraduate,
  FaEnvelope,
  FaPhone,
  FaSchool,
  FaUserFriends,
  FaEye,
} from "react-icons/fa";

const Students = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    search: "",
    classId: "",
    page: 1,
    limit: 10,
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("view"); // 'view', 'edit', 'assign'
  const [submitting, setSubmitting] = useState(false);
  const [assignForm, setAssignForm] = useState({
    classId: "",
    parentId: "",
  });

  const {
    data: studentsData,
    loading,
    error,
    refetch,
  } = useApi(() => studentService.getStudents(filters));

  const { data: classesData } = useApi(() => classService.getClasses());

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setModalType("view");
    setShowModal(true);
  };

  const handleAssignStudent = (student) => {
    setSelectedStudent(student);
    setModalType("assign");
    setAssignForm({
      classId: student.class?.id || "",
      parentId: student.parent?.id || "",
    });
    setShowModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    if (!assignForm.classId) {
      showToast('Please select a class', 'error');
      return;
    }

    if (!selectedStudent?.user?.email) {
      showToast('Student email not found', 'error');
      return;
    }

    setSubmitting(true);

    try {
      await enrollmentService.assignStudentToClass(
        selectedStudent.user.email,
        assignForm.classId
      );
      
      showToast('Student assigned to class successfully!', 'success');
      setShowModal(false);
      setAssignForm({ classId: "", parentId: "" });
      refetch();
    } catch (error) {
      console.error("Failed to assign student:", error);
      showToast(error.response?.data?.message || 'Failed to assign student to class', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const StudentCard = ({ student }) => (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FaUserGraduate className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {student.user.fullName}
              </h3>
              <p className="text-gray-500 flex items-center space-x-1">
                <FaEnvelope className="text-sm" />
                <span>{student.user.email}</span>
              </p>
              {student.class && (
                <p className="text-gray-600 flex items-center space-x-1 mt-1">
                  <FaSchool className="text-sm" />
                  <span>
                    {student.class.name} - {student.class.level}
                  </span>
                </p>
              )}
              {student.parent && (
                <p className="text-gray-600 flex items-center space-x-1 mt-1">
                  <FaUserFriends className="text-sm" />
                  <span>Parent: {student.parent.user.fullName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleViewStudent(student)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="View Details"
            >
              <FaEye />
            </button>
            {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
              <button
                onClick={() => handleAssignStudent(student)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                title="Assign to Class"
              >
                <FaEdit />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {student.class ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <FaSchool className="mr-1" />
              {student.class.name}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              No Class Assigned
            </span>
          )}

          {student.parent ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <FaUserFriends className="mr-1" />
              Has Parent
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              No Parent
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const StudentDetailModal = () => (
    <Modal
      isOpen={showModal && modalType === "view"}
      onClose={() => setShowModal(false)}
      title="Student Details"
      size="lg"
    >
      {selectedStudent && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FaUserGraduate className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedStudent.user.fullName}
              </h2>
              <p className="text-gray-500">{selectedStudent.user.email}</p>
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
                  {selectedStudent.user.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {selectedStudent.user.role}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Member Since
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(
                    selectedStudent.user.createdAt
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Academic Information
              </h3>

              {selectedStudent.class ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Class
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedStudent.class.name} - {selectedStudent.class.level}
                  </p>
                  {selectedStudent.class.teacher && (
                    <p className="mt-1 text-xs text-gray-500">
                      Teacher: {selectedStudent.class.teacher.user.fullName}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Class
                  </label>
                  <p className="mt-1 text-sm text-yellow-600">
                    Not assigned to any class
                  </p>
                </div>
              )}

              {selectedStudent.parent ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Parent
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedStudent.parent.user.fullName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedStudent.parent.user.email}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Parent
                  </label>
                  <p className="mt-1 text-sm text-yellow-600">
                    No parent assigned
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Grades and Attendance Summary */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Performance Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">-</div>
                <div className="text-sm text-gray-600">Average Grade</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">-</div>
                <div className="text-sm text-gray-600">Attendance %</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">-</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">-</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );

  const AssignStudentModal = () => (
    <Modal
      isOpen={showModal && modalType === "assign"}
      onClose={() => setShowModal(false)}
      title="Assign Student"
      size="md"
    >
      {selectedStudent && (
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Class
            </label>
            <select
              value={assignForm.classId}
              onChange={(e) =>
                setAssignForm((prev) => ({ ...prev, classId: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a class</option>
              {classesData?.classes?.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.level}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FaUserGraduate className="text-blue-600 text-lg" />
              <div>
                <h4 className="font-semibold text-blue-900">
                  {selectedStudent.user.fullName}
                </h4>
                <p className="text-sm text-blue-700">
                  {selectedStudent.user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              loading={submitting}
              loadingText="Assigning..."
              disabled={submitting}
            >
              Assign to Class
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
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
            <FaUsers className="text-blue-500" />
            <span>Students</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and view all students in the system
          </p>
        </div>

        <div className="flex space-x-3">
          {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
            <Button>
              <FaPlus className="mr-2" />
              Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Students
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

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Class
            </label>
            <select
              value={filters.classId}
              onChange={(e) => handleFilterChange("classId", e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Classes</option>
              {classesData?.classes?.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {studentsData?.students?.length || 0} of{" "}
              {studentsData?.pagination?.total || 0} students
            </div>
          </div>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {studentsData?.students?.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>

      {/* Empty State */}
      {(!studentsData?.students || studentsData.students.length === 0) && (
        <div className="text-center py-12">
          <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No students
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search || filters.classId
              ? "No students match your filters."
              : "Get started by adding your first student."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {studentsData?.pagination && studentsData.pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="secondary"
            disabled={filters.page === 1}
            onClick={() => handleFilterChange("page", filters.page - 1)}
          >
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            Page {filters.page} of {studentsData.pagination.pages}
          </span>

          <Button
            variant="secondary"
            disabled={filters.page === studentsData.pagination.pages}
            onClick={() => handleFilterChange("page", filters.page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Modals */}
      <StudentDetailModal />
      <AssignStudentModal />
    </div>
  );
};

export default Students;
