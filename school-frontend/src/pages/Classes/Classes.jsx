// src/pages/Classes/Classes.js
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useApi } from "../../hooks/useApi";
import { classService } from "../../services/classService";
import Button from "../../components/UI/Button";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import Modal from "../../components/UI/Modal";
import {
  FaSchool,
  FaSearch,
  FaPlus,
  FaChalkboardTeacher,
  FaUsers,
  FaEye,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

const Classes = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    search: "",
    page: 1,
    limit: 10,
  });
  const [selectedClass, setSelectedClass] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("view"); // 'view', 'create', 'edit'
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    level: "",
    teacherEmail: "",
  });

  const {
    data: classesData,
    loading,
    error,
    refetch,
  } = useApi(() => classService.getClasses());

  const handleViewClass = (classItem) => {
    setSelectedClass(classItem);
    setModalType("view");
    setShowModal(true);
  };

  const handleAddClass = () => {
    setFormData({ name: "", level: "", teacherEmail: "" });
    setModalType("create");
    setShowModal(true);
  };

  const handleSubmitClass = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await classService.createClass(formData);
      showToast('Class created successfully!', 'success');
      setShowModal(false);
      setFormData({ name: "", level: "", teacherEmail: "" });
      refetch();
    } catch (error) {
      console.error('Error creating class:', error);
      showToast(error.response?.data?.message || 'Failed to create class', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const ClassCard = ({ classItem }) => (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {classItem.name}
            </h3>
            <p className="text-gray-500">{classItem.level}</p>

            {classItem.teacher && (
              <p className="text-gray-600 flex items-center space-x-1 mt-2">
                <FaChalkboardTeacher className="text-sm" />
                <span>Teacher: {classItem.teacher.user.fullName}</span>
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleViewClass(classItem)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="View Details"
            >
              <FaEye />
            </button>
            {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
              <>
                <button
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                  title="Edit Class"
                >
                  <FaEdit />
                </button>
                {user?.role === "ADMIN" && (
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Delete Class"
                  >
                    <FaTrash />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FaSchool className="mr-1" />
            {classItem.level}
          </span>

          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaUsers className="mr-1" />
            {classItem._count?.students || 0} Students
          </span>

          {classItem._count && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <FaChalkboardTeacher className="mr-1" />
              {classItem._count.subjects || 0} Subjects
            </span>
          )}
        </div>

        {classItem.teacher && (
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <span>Teacher: {classItem.teacher.user.fullName}</span>
            <span>{classItem.teacher.user.email}</span>
          </div>
        )}
      </div>
    </div>
  );

  const ClassDetailModal = () => (
    <Modal
      isOpen={showModal && modalType === "view"}
      onClose={() => setShowModal(false)}
      title="Class Details"
      size="lg"
    >
      {selectedClass && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FaSchool className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedClass.name}
              </h2>
              <p className="text-gray-500">{selectedClass.level}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Class Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Class Name
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedClass.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Level
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedClass.level}
                </p>
              </div>

              {selectedClass.teacher && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teacher
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedClass.teacher.user.fullName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedClass.teacher.user.email}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Statistics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedClass._count?.students || 0}
                  </div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedClass._count?.subjects || 0}
                  </div>
                  <div className="text-sm text-gray-600">Subjects</div>
                </div>
              </div>
            </div>
          </div>

          {/* Students List */}
          {selectedClass.students && selectedClass.students.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Students
              </h3>
              <div className="space-y-2">
                {selectedClass.students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {student.user.fullName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {student.user.email}
                      </p>
                    </div>
                    {student.parent && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Parent: {student.parent.user.fullName}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subjects List */}
          {selectedClass.subjects && selectedClass.subjects.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Subjects
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedClass.subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="p-2 bg-gray-50 rounded text-center"
                  >
                    <p className="font-medium text-gray-900">{subject.name}</p>
                    <p className="text-xs text-gray-600">{subject.code}</p>
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
            <FaSchool className="text-blue-500" />
            <span>Classes</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and view all classes in the system
          </p>
        </div>

        {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
          <Button onClick={handleAddClass}>
            <FaPlus className="mr-2" />
            Add Class
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Classes
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by class name..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {classesData?.classes?.length || 0} classes
            </div>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {classesData?.classes
          ?.filter(
            (classItem) =>
              !filters.search ||
              classItem.name
                .toLowerCase()
                .includes(filters.search.toLowerCase()) ||
              classItem.level
                .toLowerCase()
                .includes(filters.search.toLowerCase())
          )
          .map((classItem) => (
            <ClassCard key={classItem.id} classItem={classItem} />
          ))}
      </div>

      {/* Empty State */}
      {(!classesData?.classes || classesData.classes.length === 0) && (
        <div className="text-center py-12">
          <FaSchool className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No classes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search
              ? "No classes match your search."
              : "Get started by creating your first class."}
          </p>
        </div>
      )}

      <ClassDetailModal />
      
      {/* Assign Student Modal */}
      <Modal
        isOpen={showModal && modalType === "assign"}
        onClose={() => setShowModal(false)}
        title={`Assign Student to ${selectedClass?.name || 'Class'}`}
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Email
            </label>
            <input
              type="email"
              required
              value={assignData.studentEmail}
              onChange={(e) => setAssignData({ ...assignData, studentEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="student@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the student's email address to assign them to this class
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              loading={submitting}
              loadingText="Assigning..."
              disabled={submitting}
            >
              Assign Student
            </Button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Create Class Modal */}
      <Modal
        isOpen={showModal && modalType === "create"}
        onClose={() => setShowModal(false)}
        title="Add New Class"
      >
        <form onSubmit={handleSubmitClass} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Grade 10A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <input
              type="text"
              required
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Grade 10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teacher Email (Optional)
            </label>
            <input
              type="email"
              value={formData.teacherEmail}
              onChange={(e) => setFormData({ ...formData, teacherEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="teacher@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the teacher's email address or leave empty to assign later
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              loading={submitting}
              loadingText="Creating..."
              disabled={submitting}
            >
              Create Class
            </Button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Classes;
