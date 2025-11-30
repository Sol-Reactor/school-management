import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from "@prisma/client";
import { createNotification, notifyAdmins } from './notificationController.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register a new user
export const register = async (req, res) => {
  try {
    const { email, password, fullName, role = 'STUDENT', parentEmail } = req.body;
    console.log('Registering user with role:', role); // Added log

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'Email, password, and full name are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Validate role
    const validRoles = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be ADMIN, TEACHER, STUDENT, or PARENT' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    let user;

    if (role === 'STUDENT') {
      // Handle parent linking if parentEmail is provided
      if (parentEmail) {
        // Find the parent by email
        const parentUser = await prisma.user.findFirst({
          where: {
            email: parentEmail,
            role: 'PARENT'
          },
          include: { parent: true }
        });

        if (!parentUser) {
          return res.status(400).json({
            message: 'Parent not found with the provided email. Please register the parent first.'
          });
        }

        if (!parentUser.parent) {
          return res.status(400).json({
            message: 'Parent profile not properly set up.'
          });
        }

        // Create student with parent connection
        user = await prisma.user.create({
          data: {
            email,
            password: passwordHash,
            fullName,
            role,
            student: {
              create: {
                parentId: parentUser.parent.id
              }
            }
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            student: {
              select: {
                id: true,
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
            }
          }
        });

        // Create notifications for both parent and student
        await createNotification(
          parentUser.id,
          'New Student Assigned',
          `${fullName} has been assigned to you as a student.`,
          'PARENT_ASSIGNED'
        );

        await createNotification(
          user.id,
          'Parent Assigned',
          `${parentUser.fullName} has been assigned as your parent.`,
          'PARENT_ASSIGNED'
        );
      } else {
        // Student without parent
        user = await prisma.user.create({
          data: {
            email,
            password: passwordHash,
            fullName,
            role,
            student: {
              create: {}
            }
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            student: {
              select: {
                id: true
              }
            }
          }
        });
        console.log('User created with role:', user.role); // Added log
      }

    } else if (role === 'TEACHER') {
      // Teacher registration (unchanged)
      user = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          fullName,
          role,
          teacher: {
            create: {}
          }
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          teacher: {
            select: {
              id: true
            }
          }
        }
      });
      console.log('User created with role:', user.role); // Added log

    } else if (role === 'PARENT') {
      // Parent registration (unchanged)
      user = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          fullName,
          role,
          parent: {
            create: {}
          }
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          parent: {
            select: {
              id: true
            }
          }
        }
      });
      console.log('User created with role:', user.role); // Added log

    } else {
      // Admin registration (unchanged)
      user = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          fullName,
          role,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      console.log('User created with role:', user.role); // Added log
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Notify all admins about new user registration
    try {
      const roleLabels = {
        STUDENT: 'Student',
        TEACHER: 'Teacher',
        PARENT: 'Parent',
        ADMIN: 'Administrator'
      };

      await notifyAdmins(
        `New ${roleLabels[role]} Registered`,
        `${fullName} (${email}) has registered as a ${roleLabels[role]}.`,
        'GENERAL'
      );
    } catch (notifError) {
      console.error('Error creating admin notifications:', notifError);
      // Don't fail registration if notification fails
    }

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });

  } catch (error) {
    console.error('Error registering user:', error);

    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Email already exists' });
    }

    if (error.code === 'P2025') {
      return res.status(400).json({ message: 'Parent not found' });
    }

    console.error('Full error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};
// Login user
export const login = async (req, res) => {
  console.log('[Login] Attempting login...');
  try {
    const { email, password } = req.body;
    console.log(`[Login] Credentials received for email: ${email}`);

    // Validate input
    if (!email || !password) {
      console.log('[Login] Validation failed: Email or password missing.');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user with related profile
    console.log(`[Login] Searching for user with email: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true
          }
        },
        teacher: {
          select: {
            id: true
          }
        },
        parent: {
          select: {
            id: true
          }
        }
      }
    });

    if (!user) {
      console.log(`[Login] User not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log(`[Login] User found: ${user.fullName} (Role: ${user.role})`);

    // Verify password
    console.log(`[Login] Verifying password for user: ${user.email}`);
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log(`[Login] Invalid password for user: ${user.email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log(`[Login] Password verified successfully for user: ${user.email}`);

    // Generate JWT token
    console.log(`[Login] Generating JWT for user: ${user.email}`);
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    console.log(`[Login] JWT generated.`);

    // Remove password from response and prepare user object
    const { password: _, ...userWithoutPassword } = user;
    const userResponse = {
      ...userWithoutPassword,
      profileId: user.student?.id || user.teacher?.id || user.parent?.id || null
    };

    console.log(`[Login] Sending successful login response for user: ${user.email}`);
    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('!!! [Login] An unexpected error occurred:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user profile
// Get current user profile - Detailed version
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            classId: true,
            class: {
              select: {
                id: true,
                name: true,
                level: true,
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
            },
            // FIXED: Include parent with user details
            parent: {
              select: {
                id: true,
                userId: true,
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
        },
        teacher: {
          select: {
            id: true,
            classes: {
              select: {
                id: true,
                name: true,
                level: true,
                students: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        fullName: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        parent: {
          select: {
            id: true,
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
                    id: true,
                    name: true,
                    level: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  const { fullName, avatar } = req.body;
  const userId = req.user.id;

  // Basic validation
  if (fullName && fullName.trim() === '') {
    return res.status(400).json({ message: 'Full name cannot be empty' });
  }

  try {
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Update the user in the database
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Send back the updated user object
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating profile:', error);

    // Handle case where user is not found
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(500).json({ message: 'Server error while updating profile' });
  }
};