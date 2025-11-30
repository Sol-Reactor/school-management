import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all subjects
export const getSubjects = async (req, res) => {
  try {
    const { classId } = req.query;
    
    const where = classId ? { classId } : {};

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        class: {
          select: {
            name: true,
            level: true
          }
        },
        _count: {
          select: {
            timetable: true,
            exams: true,
            grades: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Server error fetching subjects' });
  }
};

// Get subject by ID
export const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            level: true
          }
        },
        timetable: {
          include: {
            class: {
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
        },
        exams: {
          include: {
            class: {
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
          orderBy: {
            date: 'desc'
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
            },
            exam: {
              select: {
                name: true,
                date: true
              }
            }
          },
          orderBy: {
            exam: {
              date: 'desc'
            }
          },
          take: 20
        }
      }
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({ subject });
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ message: 'Server error fetching subject' });
  }
};

// Create subject
export const createSubject = async (req, res) => {
  try {
    const { name, code, classId } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        classId
      },
      include: {
        class: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Subject created successfully',
      subject
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Subject code already exists' });
    }
    
    res.status(500).json({ message: 'Server error creating subject' });
  }
};

// Update subject
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, classId } = req.body;

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(classId && { classId })
      },
      include: {
        class: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Subject updated successfully',
      subject
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Subject code already exists' });
    }
    
    res.status(500).json({ message: 'Server error updating subject' });
  }
};

// Delete subject
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.subject.delete({
      where: { id }
    });

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    res.status(500).json({ message: 'Server error deleting subject' });
  }
};

// Assign subject to class
export const assignSubjectToClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { classId } = req.body;

    const subject = await prisma.subject.update({
      where: { id },
      data: { classId },
      include: {
        class: {
          select: {
            name: true,
            level: true
          }
        }
      }
    });

    res.json({
      message: 'Subject assigned to class successfully',
      subject
    });
  } catch (error) {
    console.error('Error assigning subject to class:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Subject or class not found' });
    }
    
    res.status(500).json({ message: 'Server error assigning subject to class' });
  }
};