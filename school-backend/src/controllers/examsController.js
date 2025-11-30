import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all exams
export const getExams = async (req, res) => {
  try {
    const { classId, teacherId, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;

    const exams = await prisma.exam.findMany({
      where,
      include: {
        class: {
          select: {
            name: true,
            level: true
          }
        },
        subject: {
          select: {
            name: true,
            code: true
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
        },
        _count: {
          select: {
            grades: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: {
        date: 'desc'
      }
    });

    const total = await prisma.exam.count({ where });

    res.json({
      exams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Server error fetching exams' });
  }
};

// Get exam by ID
export const getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
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
        grades: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    fullName: true
                  }
                }
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
        }
      }
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({ exam });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ message: 'Server error fetching exam' });
  }
};

// Create exam
export const createExam = async (req, res) => {
  try {
    const { name, date, classId, subjectId, teacherId } = req.body;

    if (!name || !date || !classId || !subjectId || !teacherId) {
      return res.status(400).json({ 
        message: 'Name, date, class ID, subject ID, and teacher ID are required' 
      });
    }

    const exam = await prisma.exam.create({
      data: {
        name,
        date: new Date(date),
        classId,
        subjectId,
        teacherId
      },
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
      }
    });

    res.status(201).json({
      message: 'Exam created successfully',
      exam
    });
  } catch (error) {
    console.error('Error creating exam:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid class, subject, or teacher ID' });
    }
    
    res.status(500).json({ message: 'Server error creating exam' });
  }
};

// Update exam
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, classId, subjectId, teacherId } = req.body;

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(date && { date: new Date(date) }),
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        ...(teacherId && { teacherId })
      },
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
    });

    res.json({
      message: 'Exam updated successfully',
      exam
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    res.status(500).json({ message: 'Server error updating exam' });
  }
};

// Delete exam
export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.exam.delete({
      where: { id }
    });

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    res.status(500).json({ message: 'Server error deleting exam' });
  }
};

// Get class exams
export const getClassExams = async (req, res) => {
  try {
    const { classId } = req.params;

    const exams = await prisma.exam.findMany({
      where: { classId },
      include: {
        subject: {
          select: {
            name: true,
            code: true
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
        },
        _count: {
          select: {
            grades: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    res.json({ exams });
  } catch (error) {
    console.error('Error fetching class exams:', error);
    res.status(500).json({ message: 'Server error fetching class exams' });
  }
};