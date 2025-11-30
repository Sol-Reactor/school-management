import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all timetable entries
export const getTimetable = async (req, res) => {
  try {
    const { classId, teacherId, day } = req.query;
    
    const where = {};
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;
    if (day) where.day = day;

    const timetable = await prisma.timetable.findMany({
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
        }
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json({ timetable });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ message: 'Server error fetching timetable' });
  }
};

// Get timetable by ID
export const getTimetableById = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await prisma.timetable.findUnique({
      where: { id },
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
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }

    res.json({ timetable });
  } catch (error) {
    console.error('Error fetching timetable entry:', error);
    res.status(500).json({ message: 'Server error fetching timetable entry' });
  }
};

// Create timetable entry
export const createTimetable = async (req, res) => {
  try {
    const { classId, subjectId, teacherId, day, startTime, endTime } = req.body;

    if (!classId || !subjectId || !teacherId || !day || !startTime || !endTime) {
      return res.status(400).json({ 
        message: 'Class ID, Subject ID, Teacher ID, day, start time, and end time are required' 
      });
    }

    // Check for conflicts
    const conflict = await prisma.timetable.findFirst({
      where: {
        classId,
        day,
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime }
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime }
          }
        ]
      }
    });

    if (conflict) {
      return res.status(400).json({ 
        message: 'Time slot conflict with existing timetable entry' 
      });
    }

    const timetable = await prisma.timetable.create({
      data: {
        classId,
        subjectId,
        teacherId,
        day,
        startTime,
        endTime
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
      message: 'Timetable entry created successfully',
      timetable
    });
  } catch (error) {
    console.error('Error creating timetable entry:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid class, subject, or teacher ID' });
    }
    
    res.status(500).json({ message: 'Server error creating timetable entry' });
  }
};

// Update timetable entry
export const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const { classId, subjectId, teacherId, day, startTime, endTime } = req.body;

    const timetable = await prisma.timetable.update({
      where: { id },
      data: {
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        ...(teacherId && { teacherId }),
        ...(day && { day }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime })
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
      message: 'Timetable entry updated successfully',
      timetable
    });
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    
    res.status(500).json({ message: 'Server error updating timetable entry' });
  }
};

// Delete timetable entry
export const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.timetable.delete({
      where: { id }
    });

    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Timetable entry not found' });
    }
    
    res.status(500).json({ message: 'Server error deleting timetable entry' });
  }
};

// Get class timetable
export const getClassTimetable = async (req, res) => {
  try {
    const { classId } = req.params;

    const timetable = await prisma.timetable.findMany({
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
        }
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Group by day for easier frontend consumption
    const groupedTimetable = {};
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    days.forEach(day => {
      groupedTimetable[day] = timetable.filter(entry => entry.day === day);
    });

    res.json({ timetable: groupedTimetable });
  } catch (error) {
    console.error('Error fetching class timetable:', error);
    res.status(500).json({ message: 'Server error fetching class timetable' });
  }
};

// Get teacher timetable
export const getTeacherTimetable = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const timetable = await prisma.timetable.findMany({
      where: { teacherId },
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
        }
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json({ timetable });
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({ message: 'Server error fetching teacher timetable' });
  }
};