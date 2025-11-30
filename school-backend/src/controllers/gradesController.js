import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all grades
export const getGrades = async (req, res) => {
  try {
    const { examId, studentId, subjectId, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (examId) where.examId = examId;
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;

    const grades = await prisma.grade.findMany({
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
        exam: {
          select: {
            name: true,
            date: true
          }
        },
        subject: {
          select: {
            name: true,
            code: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: {
        exam: {
          date: 'desc'
        }
      }
    });

    const total = await prisma.grade.count({ where });

    res.json({
      grades,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ message: 'Server error fetching grades' });
  }
};

// Get grade by ID
export const getGradeById = async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await prisma.grade.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            },
            class: {
              select: {
                name: true
              }
            }
          }
        },
        exam: {
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
          }
        },
        subject: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    res.json({ grade });
  } catch (error) {
    console.error('Error fetching grade:', error);
    res.status(500).json({ message: 'Server error fetching grade' });
  }
};

// Create grade
export const createGrade = async (req, res) => {
  try {
    const { examId, studentId, subjectId, marks } = req.body;

    if (!examId || !studentId || !subjectId || marks === undefined) {
      return res.status(400).json({ 
        message: 'Exam ID, Student ID, Subject ID, and marks are required' 
      });
    }

    // Check if grade already exists for this student in this exam
    const existingGrade = await prisma.grade.findFirst({
      where: {
        examId,
        studentId,
        subjectId
      }
    });

    if (existingGrade) {
      return res.status(400).json({ 
        message: 'Grade already exists for this student in this exam' 
      });
    }

    const grade = await prisma.grade.create({
      data: {
        examId,
        studentId,
        subjectId,
        marks: parseInt(marks)
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        },
        exam: {
          select: {
            name: true
          }
        },
        subject: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Grade created successfully',
      grade
    });
  } catch (error) {
    console.error('Error creating grade:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid exam, student, or subject ID' });
    }
    
    res.status(500).json({ message: 'Server error creating grade' });
  }
};

// Update grade
export const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { marks } = req.body;

    if (marks === undefined) {
      return res.status(400).json({ message: 'Marks are required' });
    }

    const grade = await prisma.grade.update({
      where: { id },
      data: { marks: parseInt(marks) },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        },
        exam: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Grade updated successfully',
      grade
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.status(500).json({ message: 'Server error updating grade' });
  }
};

// Delete grade
export const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.grade.delete({
      where: { id }
    });

    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error('Error deleting grade:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Grade not found' });
    }
    
    res.status(500).json({ message: 'Server error deleting grade' });
  }
};

// Get student grades
export const getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subjectId } = req.query;

    const where = { studentId };
    if (subjectId) where.subjectId = subjectId;

    const grades = await prisma.grade.findMany({
      where,
      include: {
        exam: {
          include: {
            subject: {
              select: {
                name: true
              }
            },
            class: {
              select: {
                name: true
              }
            }
          }
        },
        subject: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        exam: {
          date: 'desc'
        }
      }
    });

    // Calculate average if needed
    const average = grades.length > 0 
      ? grades.reduce((sum, grade) => sum + grade.marks, 0) / grades.length 
      : 0;

    res.json({
      grades,
      average: Math.round(average * 100) / 100,
      total: grades.length
    });
  } catch (error) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({ message: 'Server error fetching student grades' });
  }
};

// Get exam grades
export const getExamGrades = async (req, res) => {
  try {
    const { examId } = req.params;

    const grades = await prisma.grade.findMany({
      where: { examId },
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
        subject: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        student: {
          user: {
            fullName: 'asc'
          }
        }
      }
    });

    // Calculate exam statistics
    const statistics = {
      totalStudents: grades.length,
      average: grades.length > 0 
        ? grades.reduce((sum, grade) => sum + grade.marks, 0) / grades.length 
        : 0,
      highest: grades.length > 0 ? Math.max(...grades.map(g => g.marks)) : 0,
      lowest: grades.length > 0 ? Math.min(...grades.map(g => g.marks)) : 0
    };

    res.json({
      grades,
      statistics
    });
  } catch (error) {
    console.error('Error fetching exam grades:', error);
    res.status(500).json({ message: 'Server error fetching exam grades' });
  }
};