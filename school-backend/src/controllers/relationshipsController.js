import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Link student to parent by email
export const linkStudentToParent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { parentEmail } = req.body;

    if (!parentEmail) {
      return res.status(400).json({ message: 'Parent email is required' });
    }

    // Find parent by email
    const parent = await prisma.parent.findFirst({
      where: {
        user: {
          email: parentEmail
        }
      }
    });

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found with this email' });
    }

    // Link student to parent
    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        parent: {
          connect: { id: parent.id }
        }
      },
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
      message: 'Student linked to parent successfully',
      student
    });
  } catch (error) {
    console.error('Error linking student to parent:', error);
    res.status(500).json({ message: 'Server error linking student to parent' });
  }
};

// Unlink student from parent
export const unlinkStudentFromParent = async (req, res) => {
  try {
    const { studentId, parentId } = req.params;

    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        parent: {
          disconnect: true
        }
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Student unlinked from parent successfully',
      student
    });
  } catch (error) {
    console.error('Error unlinking student from parent:', error);
    res.status(500).json({ message: 'Server error unlinking student from parent' });
  }
};

// Get student's parents
export const getStudentParents = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parent: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      parents: student.parent ? [student.parent] : []
    });
  } catch (error) {
    console.error('Error fetching student parents:', error);
    res.status(500).json({ message: 'Server error fetching student parents' });
  }
};

// Get parent's students
export const getParentStudents = async (req, res) => {
  try {
    const { parentId } = req.params;

    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                createdAt: true
              }
            },
            class: {
              select: {
                name: true,
                level: true
              }
            }
          }
        }
      }
    });

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    res.json({
      students: parent.students
    });
  } catch (error) {
    console.error('Error fetching parent students:', error);
    res.status(500).json({ message: 'Server error fetching parent students' });
  }
};