import { PrismaClient } from "@prisma/client";
import { createNotification, notifyAdmins } from './notificationController.js';

const prisma = new PrismaClient();

// Get all enrollments
export const getEnrollments = async (req, res) => {
  try {
    const { studentId, classId } = req.query;

    const where = {};
    if (studentId) where.studentId = studentId;
    if (classId) where.classId = classId;

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        },
        class: {
          select: {
            name: true,
            level: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ message: 'Server error fetching enrollments' });
  }
};

// Create enrollment
export const createEnrollment = async (req, res) => {
  try {
    const { studentId, classId } = req.body;

    if (!studentId || !classId) {
      return res.status(400).json({ message: 'Student ID and Class ID are required' });
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        classId
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Student is already enrolled in this class' });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classId
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        },
        class: {
          select: {
            name: true,
            level: true
          }
        }
      }
    });

    // Update student's classId
    await prisma.student.update({
      where: { id: studentId },
      data: { classId }
    });

    // Notify student about class assignment
    try {
      await createNotification(
        enrollment.student.user.id,
        'Assigned to Class',
        `You have been assigned to ${enrollment.class.name} (${enrollment.class.level}).`,
        'CLASS_ASSIGNED'
      );

      // Notify admins about enrollment
      await notifyAdmins(
        'New Student Enrollment',
        `${enrollment.student.user.fullName} has been enrolled in ${enrollment.class.name}.`,
        'ENROLLMENT'
      );
    } catch (notifError) {
      console.error('Error creating notifications:', notifError);
    }

    res.status(201).json({
      message: 'Enrollment created successfully',
      enrollment
    });
  } catch (error) {
    console.error('Error creating enrollment:', error);

    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Enrollment already exists' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid student or class ID' });
    }

    res.status(500).json({ message: 'Server error creating enrollment' });
  }
};

// Delete enrollment
export const deleteEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await prisma.enrollment.delete({
      where: { id },
      include: {
        student: {
          select: {
            id: true
          }
        }
      }
    });

    // Remove classId from student
    await prisma.student.update({
      where: { id: enrollment.student.id },
      data: { classId: null }
    });

    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.status(500).json({ message: 'Server error deleting enrollment' });
  }
};


// Assign student to class by email
export const assignStudentToClass = async (req, res) => {
  try {
    const { studentEmail, classId } = req.body;

    if (!studentEmail || !classId) {
      return res.status(400).json({ message: 'Student email and Class ID are required' });
    }

    // Find student by email
    const studentUser = await prisma.user.findFirst({
      where: {
        email: studentEmail.trim(),
        role: 'STUDENT'
      },
      include: {
        student: true
      }
    });

    if (!studentUser || !studentUser.student) {
      return res.status(400).json({ message: 'Student not found with the provided email' });
    }

    const studentId = studentUser.student.id;

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        classId
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Student is already enrolled in this class' });
    }

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        name: true,
        level: true
      }
    });

    if (!classInfo) {
      return res.status(400).json({ message: 'Class not found' });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classId
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        },
        class: {
          select: {
            name: true,
            level: true
          }
        }
      }
    });

    // Update student's classId
    await prisma.student.update({
      where: { id: studentId },
      data: { classId }
    });

    // Notify student about class assignment
    try {
      await createNotification(
        enrollment.student.user.id,
        'Assigned to Class',
        `You have been assigned to ${enrollment.class.name} (${enrollment.class.level}).`,
        'CLASS_ASSIGNED'
      );

      // Notify admins about enrollment
      await notifyAdmins(
        'New Student Enrollment',
        `${enrollment.student.user.fullName} has been enrolled in ${enrollment.class.name}.`,
        'ENROLLMENT'
      );

      // Notify parent if exists
      if (enrollment.student.parentId) {
        const parent = await prisma.parent.findUnique({
          where: { id: enrollment.student.parentId },
          include: {
            user: {
              select: {
                id: true
              }
            }
          }
        });

        if (parent) {
          await createNotification(
            parent.user.id,
            'Child Assigned to Class',
            `${enrollment.student.user.fullName} has been assigned to ${enrollment.class.name} (${enrollment.class.level}).`,
            'CLASS_ASSIGNED'
          );
        }
      }
    } catch (notifError) {
      console.error('Error creating notifications:', notifError);
    }

    res.status(201).json({
      message: 'Student assigned to class successfully',
      enrollment
    });
  } catch (error) {
    console.error('Error assigning student to class:', error);

    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Enrollment already exists' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid student or class ID' });
    }

    res.status(500).json({ message: 'Server error assigning student to class' });
  }
};
