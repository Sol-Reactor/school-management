import { PrismaClient } from "@prisma/client";
import { notifyAdmins, createNotification } from './notificationController.js';

const prisma = new PrismaClient();

// Get all classes
export const getClasses = async (req, res) => {
  try {
    const { teacherId } = req.query;

    const where = teacherId ? { teacherId } : {};

    const classes = await prisma.class.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            students: true,
            subjects: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Server error fetching classes' });
  }
};

// Get class by ID
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        },
        students: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            },
            parent: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        subjects: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        timetable: {
          include: {
            subject: {
              select: {
                name: true
              }
            },
            teacher: {
              include: {
                user: {
                  select: {
                    fullName: true
                  }
                }
              }
            }
          },
          orderBy: [
            { day: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({ class: classData });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ message: 'Server error fetching class' });
  }
};

// Create class
export const createClass = async (req, res) => {
  try {
    const { name, level, teacherEmail } = req.body;

    if (!name || !level) {
      return res.status(400).json({ message: 'Name and level are required' });
    }

    let teacherId = null;

    // Find teacher by email if provided
    if (teacherEmail && teacherEmail.trim() !== '') {
      const teacherUser = await prisma.user.findFirst({
        where: {
          email: teacherEmail.trim(),
          role: 'TEACHER'
        },
        include: {
          teacher: true
        }
      });

      if (!teacherUser || !teacherUser.teacher) {
        return res.status(400).json({ message: 'Teacher not found with the provided email' });
      }

      teacherId = teacherUser.teacher.id;
    }

    const classData = await prisma.class.create({
      data: {
        name,
        level,
        teacherId
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      }
    });

    // Notify admins about new class
    try {
      await notifyAdmins(
        'New Class Created',
        `${name} (${level}) has been created${classData.teacher ? ` with teacher ${classData.teacher.user.fullName}` : ''}.`,
        'CLASS_ASSIGNED'
      );

      // Notify the assigned teacher if there is one
      if (teacherId && classData.teacher) {
        await createNotification(
          classData.teacher.user.id,
          'Class Assigned',
          `You have been assigned to teach ${name} (${level}).`,
          'CLASS_ASSIGNED'
        );
      }
    } catch (notifError) {
      console.error('Error creating notifications:', notifError);
    }

    res.status(201).json({
      message: 'Class created successfully',
      class: classData
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Server error creating class' });
  }
};

// Update class
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, teacherId } = req.body;

    const classData = await prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(level && { level }),
        ...(teacherId && { teacherId })
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Class updated successfully',
      class: classData
    });
  } catch (error) {
    console.error('Error updating class:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.status(500).json({ message: 'Server error updating class' });
  }
};

// Delete class
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.class.delete({
      where: { id }
    });

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.status(500).json({ message: 'Server error deleting class' });
  }
};

// Get class students
export const getClassStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const students = await prisma.student.findMany({
      where: { classId: id },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        parent: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        },
        grades: {
          include: {
            subject: {
              select: {
                name: true
              }
            },
            exam: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        user: {
          fullName: 'asc'
        }
      }
    });

    res.json({ students });
  } catch (error) {
    console.error('Error fetching class students:', error);
    res.status(500).json({ message: 'Server error fetching class students' });
  }
};

// Get class subjects
export const getClassSubjects = async (req, res) => {
  try {
    const { id } = req.params;

    const subjects = await prisma.subject.findMany({
      where: { classId: id },
      include: {
        _count: {
          select: {
            timetable: true,
            exams: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching class subjects:', error);
    res.status(500).json({ message: 'Server error fetching class subjects' });
  }
};