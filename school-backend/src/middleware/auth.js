import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Main authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from "Bearer <token>" header
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // 2. Verify JWT token and decode user data
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 3. Fetch fresh user data from database (including profile relationships)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        student: { select: { id: true, classId: true } },
        teacher: { select: { id: true } },
        parent: { select: { id: true } }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // 4. Add user object to request for use in controllers
    req.user = user;
    next(); // Continue to the next middleware/controller
  } catch (error) {
    // Handle different JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Authentication failed' });
  }
};
// Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Specific role middlewares for convenience
export const requireAdmin = authorize('ADMIN');
export const requireTeacher = authorize('TEACHER');
export const requireStudent = authorize('STUDENT');
export const requireParent = authorize('PARENT');

// Middleware for teacher or admin
export const requireTeacherOrAdmin = authorize('TEACHER', 'ADMIN');

// Middleware to check if user owns the resource (for students/parents)
export const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const resourceId = req.params.id;
      
      if (!resourceId) {
        return res.status(400).json({ message: 'Resource ID required' });
      }

      let isOwner = false;

      switch (resourceType) {
        case 'student':
          // Check if user is the student or parent of the student
          if (req.user.role === 'STUDENT') {
            isOwner = req.user.student?.id === resourceId;
          } else if (req.user.role === 'PARENT') {
            const student = await prisma.student.findFirst({
              where: {
                id: resourceId,
                parentId: req.user.parent?.id
              }
            });
            isOwner = !!student;
          }
          break;

        case 'parent':
          isOwner = req.user.parent?.id === resourceId;
          break;

        case 'teacher':
          isOwner = req.user.teacher?.id === resourceId;
          break;

        case 'attendance':
          if (req.user.role === 'STUDENT') {
            const attendance = await prisma.attendance.findFirst({
              where: {
                id: resourceId,
                studentId: req.user.student?.id
              }
            });
            isOwner = !!attendance;
          } else if (req.user.role === 'TEACHER') {
            const attendance = await prisma.attendance.findFirst({
              where: {
                id: resourceId,
                class: {
                  teacherId: req.user.teacher?.id
                }
              }
            });
            isOwner = !!attendance;
          }
          break;

        case 'grade':
          if (req.user.role === 'STUDENT') {
            const grade = await prisma.grade.findFirst({
              where: {
                id: resourceId,
                studentId: req.user.student?.id
              }
            });
            isOwner = !!grade;
          } else if (req.user.role === 'TEACHER') {
            const grade = await prisma.grade.findFirst({
              where: {
                id: resourceId,
                exam: {
                  teacherId: req.user.teacher?.id
                }
              }
            });
            isOwner = !!grade;
          }
          break;

        default:
          return res.status(400).json({ message: 'Invalid resource type' });
      }

      // Admins can access any resource
      if (req.user.role === 'ADMIN') {
        isOwner = true;
      }

      if (!isOwner) {
        return res.status(403).json({ 
          message: 'Access denied. You do not own this resource.' 
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ message: 'Server error during ownership verification' });
    }
  };
};

// Middleware to check if teacher owns the class
export const requireClassOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const classId = req.params.classId || req.body.classId;
    
    if (!classId) {
      return res.status(400).json({ message: 'Class ID required' });
    }

    if (req.user.role === 'ADMIN') {
      return next(); // Admins can access all classes
    }

    if (req.user.role === 'TEACHER') {
      const classRecord = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: req.user.teacher?.id
        }
      });

      if (!classRecord) {
        return res.status(403).json({ 
          message: 'Access denied. You are not the teacher of this class.' 
        });
      }
    } else {
      return res.status(403).json({ 
        message: 'Access denied. Only teachers and admins can access class resources.' 
      });
    }

    next();
  } catch (error) {
    console.error('Class ownership check error:', error);
    res.status(500).json({ message: 'Server error during class ownership verification' });
  }
};

// Middleware to check if student is in class (for students/parents)
export const requireClassMembership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const classId = req.params.classId || req.body.classId;
    
    if (!classId) {
      return res.status(400).json({ message: 'Class ID required' });
    }

    let isMember = false;

    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: {
          id: req.user.student?.id,
          classId: classId
        }
      });
      isMember = !!student;
    } else if (req.user.role === 'PARENT') {
      const student = await prisma.student.findFirst({
        where: {
          parentId: req.user.parent?.id,
          classId: classId
        }
      });
      isMember = !!student;
    } else if (req.user.role === 'TEACHER' || req.user.role === 'ADMIN') {
      isMember = true; // Teachers and admins can access any class
    }

    if (!isMember) {
      return res.status(403).json({ 
        message: 'Access denied. You are not a member of this class.' 
      });
    }

    next();
  } catch (error) {
    console.error('Class membership check error:', error);
    res.status(500).json({ message: 'Server error during class membership verification' });
  }
};

// Helper function to extract token from header
function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  
  return null;
}

export default {
  authenticate,
  authorize,
  requireAdmin,
  requireTeacher,
  requireStudent,
  requireParent,
  requireTeacherOrAdmin,
  requireOwnership,
  requireClassOwnership,
  requireClassMembership
};
