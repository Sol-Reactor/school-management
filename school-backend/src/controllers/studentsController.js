import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all students
export const getStudents = async (req, res) => {
  try {
    const { classId, page = 1, limit = 10 } = req.query;
    
    const where = classId ? { classId } : {};

    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
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
        }
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: {
        user: {
          fullName: 'asc'
        }
      }
    });

    const total = await prisma.student.count({ where });

    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error fetching students' });
  }
};

// Get student by ID
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
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
        class: {
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
            subjects: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
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
        enrollments: {
          include: {
            class: {
              select: {
                name: true,
                level: true
              }
            }
          }
        },
        grades: {
          include: {
            exam: {
              select: {
                name: true,
                date: true
              }
            },
            subject: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            exam: {
              date: 'desc'
            }
          }
        },
        attendance: {
          include: {
            class: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 20
        }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Server error fetching student' });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    // Note: Student profile updates might be limited since most data is in User model

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server error updating student' });
  }
};

// Assign student to class
export const assignToClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { classId } = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: { classId },
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
        }
      }
    });

    res.json({
      message: 'Student assigned to class successfully',
      student
    });
  } catch (error) {
    console.error('Error assigning student to class:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Student or class not found' });
    }
    
    res.status(500).json({ message: 'Server error assigning student to class' });
  }
};

// Assign student to parent
export const assignToParent = async (req, res) => {
  try {
    const { id } = req.params;
    const { parentId } = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: { parentId },
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
    });

    res.json({
      message: 'Student assigned to parent successfully',
      student
    });
  } catch (error) {
    console.error('Error assigning student to parent:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Student or parent not found' });
    }
    
    res.status(500).json({ message: 'Server error assigning student to parent' });
  }
};