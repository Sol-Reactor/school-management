import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all parents
export const getParents = async (req, res) => {
  try {
    const parents = await prisma.parent.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        user: {
          fullName: 'asc'
        }
      }
    });

    res.json({ parents });
  } catch (error) {
    console.error('Error fetching parents:', error);
    res.status(500).json({ message: 'Server error fetching parents' });
  }
};

// Get parent by ID
export const getParentById = async (req, res) => {
  try {
    const { id } = req.params;

    const parent = await prisma.parent.findUnique({
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
        students: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            },
            class: {
              include: {
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
              },
              take: 10
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
              take: 10
            }
          }
        }
      }
    });

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    res.json({ parent });
  } catch (error) {
    console.error('Error fetching parent:', error);
    res.status(500).json({ message: 'Server error fetching parent' });
  }
};

// Get parent's children
export const getParentChildren = async (req, res) => {
  try {
    const { id } = req.params;

    const children = await prisma.student.findMany({
      where: { parentId: id },
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
            level: true,
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
          }
        }
      }
    });

    res.json({ children });
  } catch (error) {
    console.error('Error fetching parent children:', error);
    res.status(500).json({ message: 'Server error fetching parent children' });
  }
};