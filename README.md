# 🎓 Haya School Management System

A modern, full-stack school management system designed to streamline educational administration. Built with cutting-edge technologies to provide a seamless experience for administrators, teachers, students, and parents.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Communication](#api-communication)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)

---

## 🌟 Overview

Haya School Management System is a comprehensive web application that digitizes school operations. It provides role-based access control, real-time notifications, attendance tracking, and much more.

### Key Highlights

- **Multi-role Support**: Admin, Teacher, Student, and Parent roles
- **Real-time Updates**: Live notifications and data synchronization
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Theme Customization**: 5 beautiful themes with customizable settings
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing

---

## ✨ Features

### For Administrators

- ✅ Manage students, teachers, and classes
- ✅ Assign students to classes
- ✅ Assign teachers to classes
- ✅ View system-wide analytics
- ✅ Send notifications to all users

### For Teachers

- ✅ View assigned classes
- ✅ Manage student attendance
- ✅ View student information
- ✅ Receive notifications

### For Students

- ✅ View class information
- ✅ Check attendance records
- ✅ Receive notifications

### For Parents

- ✅ Monitor children's progress
- ✅ View attendance records
- ✅ Receive notifications about children

---

## 🛠 Technology Stack

### **Frontend Technologies**

| Technology        | Purpose                 | Version |
| ----------------- | ----------------------- | ------- |
| **React**         | UI Library              | 18.3.1  |
| **Vite**          | Build Tool & Dev Server | 6.0.5   |
| **Redux Toolkit** | State Management        | 2.5.0   |
| **React Router**  | Client-side Routing     | 7.1.1   |
| **Axios**         | HTTP Client             | 1.7.9   |
| **Tailwind CSS**  | Utility-first CSS       | 3.4.17  |
| **React Icons**   | Icon Library            | 5.4.0   |

**Why These Technologies?**

- **React**: Component-based architecture for reusable UI
- **Redux Toolkit**: Centralized state management
- **Vite**: Lightning-fast development with HMR
- **Tailwind CSS**: Rapid UI development
- **Axios**: HTTP client with interceptors for auth

### **Backend Technologies**

| Technology     | Purpose            | Version |
| -------------- | ------------------ | ------- |
| **Node.js**    | JavaScript Runtime | 18+     |
| **Express.js** | Web Framework      | 4.21.2  |
| **Prisma**     | ORM                | 6.2.1   |
| **PostgreSQL** | Database           | 14+     |
| **JWT**        | Authentication     | 9.0.2   |
| **bcryptjs**   | Password Hashing   | 2.4.3   |
| **cors**       | CORS Middleware    | 2.8.5   |

**Why These Technologies?**

- **Express.js**: Minimal and flexible framework
- **Prisma**: Type-safe database access
- **PostgreSQL**: Robust relational database
- **JWT**: Stateless authentication
- **bcryptjs**: Secure password hashing

---

## 🏗 Architecture

### **How Frontend, Backend, and Database Work Together**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE (Browser)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         React Application (Port 3001)                   │ │
│  │                                                          │ │
│  │  Components → Redux Store → Services (Axios)           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests (REST API)
                              │ Authorization: Bearer <JWT>
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER SIDE (Node.js)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Express.js Server (Port 5000)                   │ │
│  │                                                          │ │
│  │  Routes → Middleware (Auth) → Controllers              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma Client
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Tables: User, Student, Teacher, Class, Enrollment     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Communication Flow Example: Login**

1. **User enters credentials** in React Login component
2. **Frontend** sends POST request via Axios:
   ```javascript
   axios.post("http://localhost:5000/api/auth/login", {
     email: "user@example.com",
     password: "password123",
   });
   ```
3. **Backend** receives request in authController:
   - Validates email format
   - Queries database via Prisma: `prisma.user.findUnique()`
4. **Database** returns user data to backend
5. **Backend** verifies password with bcrypt:
   ```javascript
   bcrypt.compare(password, user.password);
   ```
6. **Backend** generates JWT token and sends response:
   ```javascript
   { token: 'eyJhbGc...', user: {...} }
   ```
7. **Frontend** stores token in localStorage and Redux
8. **Frontend** includes token in all future requests:
   ```javascript
   headers: {
     Authorization: "Bearer <token>";
   }
   ```

---

## 🗄 Database Schema

### **Entity Relationships**

```
User (Base table for all users)
├── Student (1:1) → Class (Many:1)
├── Teacher (1:1) → Class (1:Many)
├── Parent (1:1) → Student (1:Many)
└── Admin (1:1)

Enrollment (Junction table)
├── Student (Many:1)
└── Class (Many:1)

Notification
└── User (Many:1)
```

### **Key Tables**

**User Table**

- Stores authentication data (email, password)
- Contains role field (ADMIN, TEACHER, STUDENT, PARENT)
- One user can have one role-specific profile

**Student Table**

- Links to User via userId
- Links to Class via classId
- Links to Parent via parentId

**Class Table**

- Contains class information (name, level)
- Links to Teacher via teacherId
- Has many Students through Enrollment

**Enrollment Table**

- Junction table for Student-Class relationship
- Tracks when student enrolled in class
- Allows historical enrollment data

---

## 🔌 API Communication

### **Frontend to Backend Connection**

**1. Axios Instance Configuration**

```javascript
// school-frontend/src/services/api.js
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**2. Service Layer**

```javascript
// school-frontend/src/services/studentService.js
export const studentService = {
  getStudents: () => api.get("/students"),
  getStudent: (id) => api.get(`/students/${id}`),
  createStudent: (data) => api.post("/students", data),
};
```

**3. React Component Usage**

```javascript
// school-frontend/src/pages/Students/Students.jsx
const { data } = useApi(() => studentService.getStudents());
```

### **Backend to Database Connection**

**1. Prisma Configuration**

```javascript
// school-backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
// DATABASE_URL="postgresql://user:pass@localhost:5432/db"
```

**2. Prisma Client Usage**

```javascript
// school-backend/src/controllers/studentController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const students = await prisma.student.findMany({
  include: {
    user: true, // Join with User table
    class: true, // Join with Class table
    parent: true, // Join with Parent table
  },
});
```

**3. Query Translation**

```
Prisma Query → SQL Query → PostgreSQL Execution → Results
```

---

## 🚀 Getting Started

### **Prerequisites**

- Node.js v18+
- PostgreSQL v14+
- npm or yarn

### **Installation**

**1. Clone Repository**

```bash
git clone <repository-url>
cd school-management-system
```

**2. Backend Setup**

```bash
cd school-backend
npm install

# Create .env file
echo "DATABASE_URL=postgresql://user:password@localhost:5432/school_db" > .env
echo "JWT_SECRET=your-secret-key" >> .env
echo "PORT=5000" >> .env

# Run migrations
npx prisma migrate dev

# Start server
npm run dev
```

**3. Frontend Setup**

```bash
cd school-frontend
npm install
npm run dev
```

**4. Access Application**

- Frontend: http://localhost:3001
- Backend: http://localhost:5000
- Admin Login: admin@school.com / password123

---

## 📁 Project Structure

### **Frontend**

```
school-frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context (Auth, Theme, Toast)
│   ├── pages/          # Page components
│   ├── services/       # API services (Axios)
│   ├── store/          # Redux store
│   └── hooks/          # Custom hooks
```

### **Backend**

```
school-backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth middleware
│   ├── routes/         # API routes
│   └── server.js       # Express app
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # DB migrations
```

---

## 📊 API Endpoints

### **Authentication**

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile

### **Students**

- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### **Classes**

- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create class
- `PUT /api/classes/:id` - Update class

### **Enrollments**

- `POST /api/enrollments/assign` - Assign student to class
- `GET /api/enrollments` - Get enrollments

### **Notifications**

- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

---

## 🔒 Security

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: Stateless tokens
- **CORS**: Configured for frontend origin
- **SQL Injection**: Prevented by Prisma ORM
- **XSS Protection**: React's built-in escaping
- **Environment Variables**: Sensitive data in .env

---

## 📝 License

MEKELLE-UNIVERSITY License

---

## 👥 Support

For questions: support@hayaschool.edu

---

**Happy Learning! 🎓**
