import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all teachers
export const getTeachers = async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        classes: {
          select: {
            id: true,
            name: true,
            level: true
          }
        },
        _count: {
          select: {
            classes: true,
            exams: true
          }
        }
      },
      orderBy: {
        user: {
          fullName: 'asc'
        }
      }
    });

    res.json({ teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Server error fetching teachers' });
  }
};

// Get teacher by ID
export const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        classes: {
          include: {
            students: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true
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
            }
          }
        },
        exams: {
          include: {
            class: {
              select: {
                name: true
              }
            },
            subject: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 10
        },
        timetable: {
          include: {
            class: {
              select: {
                name: true
              }
            },
            subject: {
              select: {
                name: true
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

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ teacher });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ message: 'Server error fetching teacher' });
  }
};

// Get teacher's classes
export const getTeacherClasses = async (req, res) => {
  try {
    const { id } = req.params;

    const classes = await prisma.class.findMany({
      where: { teacherId: id },
      include: {
        students: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
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
        _count: {
          select: {
            students: true,
            subjects: true
          }
        }
      }
    });

    res.json({ classes });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: 'Server error fetching teacher classes' });
  }
};

// Get teacher's students
export const getTeacherStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const students = await prisma.student.findMany({
      where: {
        class: {
          teacherId: id
        }
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        class: {
          select: {
            name: true,
            level: true
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
            }
          }
        }
      }
    });

    res.json({ students });
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    res.status(500).json({ message: 'Server error fetching teacher students' });
  }
};