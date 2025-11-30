import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all attendance records
export const getAttendance = async (req, res) => {
  try {
    const { classId, studentId, date, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.date = {
        gte: startDate,
        lt: endDate
      };
    }

    const attendance = await prisma.attendance.findMany({
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
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: {
        date: 'desc'
      }
    });

    const total = await prisma.attendance.count({ where });

    res.json({
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
};

// Get attendance by ID
export const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await prisma.attendance.findUnique({
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
        class: {
          select: {
            name: true,
            level: true
          }
        }
      }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json({ attendance });
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    res.status(500).json({ message: 'Server error fetching attendance record' });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { studentId, classId, date, status } = req.body;

    if (!studentId || !classId || !date || !status) {
      return res.status(400).json({ 
        message: 'Student ID, Class ID, date, and status are required' 
      });
    }

    // Check if attendance already exists for this student on this date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId,
        date: new Date(date)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Attendance already marked for this student on this date' 
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        classId,
        date: new Date(date),
        status
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
        class: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid student or class ID' });
    }
    
    res.status(500).json({ message: 'Server error marking attendance' });
  }
};

// Update attendance
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: { status },
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
        class: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.status(500).json({ message: 'Server error updating attendance' });
  }
};

// Get student attendance
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const where = { studentId };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        class: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate attendance summary
    const summary = {
      PRESENT: attendance.filter(a => a.status === 'PRESENT').length,
      ABSENT: attendance.filter(a => a.status === 'ABSENT').length,
      LATE: attendance.filter(a => a.status === 'LATE').length,
      EXCUSED: attendance.filter(a => a.status === 'EXCUSED').length,
      TOTAL: attendance.length
    };

    res.json({
      attendance,
      summary
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Server error fetching student attendance' });
  }
};

// Get class attendance
export const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    const where = { classId };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.date = {
        gte: startDate,
        lt: endDate
      };
    }

    const attendance = await prisma.attendance.findMany({
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

    res.json({ attendance });
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    res.status(500).json({ message: 'Server error fetching class attendance' });
  }
};