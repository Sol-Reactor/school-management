// Role-specific dashboard data. Errors propagate to the central error handler.
import prisma from "../lib/prisma.js";
import { notFound, forbidden } from "../lib/errors.js";

// Get admin dashboard
export const getAdminDashboard = async (req, res) => {
  // Get counts for all entities
  const [
    totalStudents,
    totalTeachers,
    totalParents,
    totalClasses,
    totalSubjects,
    recentUsers,
    recentEnrollments,
  ] = await Promise.all([
    // Count students
    prisma.user.count({
      where: { role: "STUDENT" },
    }),

    // Count teachers
    prisma.user.count({
      where: { role: "TEACHER" },
    }),

    // Count parents
    prisma.user.count({
      where: { role: "PARENT" },
    }),

    // Count classes
    prisma.class.count(),

    // Count subjects
    prisma.subject.count(),

    // Get recent users (last 7 days)
    prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // Get recent enrollments - SIMPLIFIED VERSION
    prisma.enrollment.findMany({
      select: {
        id: true,
        createdAt: true,
        student: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  res.json({
    summary: {
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      totalSubjects,
    },
    recentActivity: {
      newUsers: recentUsers,
      newEnrollments: recentEnrollments,
    },
  });
};

// Get teacher dashboard
// Get teacher dashboard
export const getTeacherDashboard = async (req, res) => {
  const teacherId = req.user.teacher?.id;

  if (!teacherId) {
    throw forbidden("Access denied. Teacher profile not found.");
  }
  const myClasses = await prisma.class.findMany({
    where: { teacherId },
    select: {
      id: true,
      name: true,
      level: true,
      _count: {
        select: { students: true },
      },
    },
  });

  const [
    totalStudents,
    upcomingExams,
    recentAttendance,
    timetable,
  ] = await Promise.all([
    // Count total students across all classes
    prisma.student.count({
      where: {
        class: {
          teacherId,
        },
      },
    }),

    // Get upcoming exams (next 30 days) - ONLY IF TEACHER HAS CLASSES
    myClasses.length > 0 ? prisma.exam.findMany({
      where: {
        teacherId,
        date: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        date: true,
        class: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: "asc" },
      take: 5,
    }) : Promise.resolve([]),

    // Get recent attendance records - ONLY IF TEACHER HAS CLASSES
    myClasses.length > 0 ? prisma.attendance.findMany({
      where: {
        class: {
          teacherId,
        },
      },
      select: {
        id: true,
        date: true,
        status: true,
        student: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        class: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 5,
    }) : Promise.resolve([]),

    // Get teacher's timetable
    prisma.timetable.findMany({
      where: { teacherId },
      select: {
        id: true,
        day: true,
        startTime: true,
        endTime: true,
        class: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
      take: 10,
    }),
  ]);

  res.json({
    summary: {
      totalClasses: myClasses.length,
      totalStudents,
      upcomingExams: upcomingExams.length,
    },
    myClasses,
    upcomingExams,
    recentAttendance,
    timetable,
  });
};

// Get student dashboard
// Get student dashboard
export const getStudentDashboard = async (req, res) => {
  const studentId = req.user.student?.id;

  if (!studentId) {
    throw forbidden("Access denied. Student profile not found.");
  }
  // First get student info to get classId
  const studentInfo = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      classId: true, // This might be null!
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          level: true,
          teacher: {
            select: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      },
      parent: {
        select: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!studentInfo) {
    throw notFound("Student not found");
  }
  // Handle the case where student has no class assigned
  const hasClass = !!studentInfo.classId;

  const [
    attendanceSummary,
    recentGrades,
    upcomingExams,
    timetable,
    classInfo,
  ] = await Promise.all([
    // Get attendance summary
    prisma.attendance.groupBy({
      by: ["status"],
      where: { studentId },
      _count: {
        status: true,
      },
    }),

    // Get recent grades
    prisma.grade.findMany({
      where: { studentId },
      select: {
        id: true,
        marks: true,
        exam: {
          select: {
            name: true,
            date: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        exam: {
          date: "desc",
        },
      },
      take: 5,
    }),

    // Get upcoming exams - ONLY IF STUDENT HAS A CLASS
    hasClass ? prisma.exam.findMany({
      where: {
        classId: studentInfo.classId, // This is now guaranteed to be valid
        date: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        date: true,
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: "asc" },
      take: 5,
    }) : Promise.resolve([]), // Return empty array if no class

    // Get student's timetable - ONLY IF STUDENT HAS A CLASS
    hasClass ? prisma.timetable.findMany({
      where: {
        classId: studentInfo.classId, // This is now guaranteed to be valid
      },
      select: {
        id: true,
        day: true,
        startTime: true,
        endTime: true,
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    }) : Promise.resolve([]), // Return empty array if no class

    // Get class subjects - ONLY IF STUDENT HAS A CLASS
    hasClass ? prisma.class.findUnique({
      where: { id: studentInfo.classId },
      select: {
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    }) : Promise.resolve({ subjects: [] }),
  ]);
  // Calculate attendance percentage
  const totalAttendance = attendanceSummary.reduce(
    (sum, item) => sum + item._count.status,
    0
  );
  const presentCount =
    attendanceSummary.find((item) => item.status === "PRESENT")?._count
      .status || 0;
  const attendancePercentage =
    totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

  const responseData = {
    studentInfo,
    summary: {
      attendancePercentage: Math.round(attendancePercentage),
      totalSubjects: classInfo?.subjects?.length || 0,
      upcomingExams: upcomingExams.length,
      hasClass: hasClass, // Add this to help frontend
    },
    attendance: attendanceSummary,
    recentGrades,
    upcomingExams: upcomingExams || [], // Ensure it's always an array
    timetable: timetable || [], // Ensure it's always an array
    subjects: classInfo?.subjects || [],
  };
  res.json(responseData);
};

// Get parent dashboard
export const getParentDashboard = async (req, res) => {
  const parentId = req.user.parent?.id;

  if (!parentId) {
    throw forbidden("Access denied. Parent profile not found.");
  }
  // First get children to use their IDs
  const children = await prisma.student.findMany({
    where: { parentId },
    select: {
      id: true,
      classId: true,
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
      class: {
        select: {
          name: true,
          level: true,
        },
      },
    },
  });

  const childrenIds = children.map(child => child.id);
  const classIds = children.map(child => child.classId).filter(Boolean);

  const [
    parentInfo,
    childrenAttendance,
    childrenGrades,
    upcomingExams,
  ] = await Promise.all([
    // Get parent info
    prisma.parent.findUnique({
      where: { id: parentId },
      select: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    }),

    // Get children's attendance summary
    prisma.attendance.groupBy({
      by: ["studentId", "status"],
      where: {
        studentId: {
          in: childrenIds,
        },
      },
      _count: {
        status: true,
      },
    }),

    // Get children's recent grades
    prisma.grade.findMany({
      where: {
        studentId: {
          in: childrenIds,
        },
      },
      select: {
        id: true,
        marks: true,
        student: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        exam: {
          select: {
            name: true,
            date: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        exam: {
          date: "desc",
        },
      },
      take: 10,
    }),

    // Get upcoming exams for all children
    classIds.length > 0 ? prisma.exam.findMany({
      where: {
        classId: {
          in: classIds,
        },
        date: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        date: true,
        class: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { date: "asc" },
      take: 5,
    }) : Promise.resolve([]),
  ]);

  // Calculate attendance for each child
  const childrenWithAttendance = children.map((child) => {
    const childAttendance = childrenAttendance.filter(
      (att) => att.studentId === child.id
    );
    const total = childAttendance.reduce(
      (sum, item) => sum + item._count.status,
      0
    );
    const present =
      childAttendance.find((item) => item.status === "PRESENT")?._count
        .status || 0;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    return {
      ...child,
      attendancePercentage: Math.round(percentage),
    };
  });

  res.json({
    parentInfo,
    summary: {
      totalChildren: children.length,
      totalUpcomingExams: upcomingExams.length,
    },
    children: childrenWithAttendance,
    recentGrades: childrenGrades,
    upcomingExams,
  });
};

// Main dashboard route
export const getDashboard = async (req, res) => {
  const userRole = req.user.role;
  switch (userRole) {
    case "ADMIN":
      return await getAdminDashboard(req, res);
    case "TEACHER":
      return await getTeacherDashboard(req, res);
    case "STUDENT":
      return await getStudentDashboard(req, res);
    case "PARENT":
      return await getParentDashboard(req, res);
    default:
      return res.status(400).json({ message: "Invalid user role: " + userRole });
  }
};