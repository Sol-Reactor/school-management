# School Management System - Setup Instructions

## Overview
This is a full-stack School Management System with improved UI, theme support, and profile avatars.

## Features Implemented

### Backend Improvements
- ✅ Fixed database queries and responses
- ✅ Added avatar field to User model
- ✅ Updated auth controller to handle avatar updates
- ✅ Proper error handling in all controllers
- ✅ Fixed dashboard queries for all user roles

### Frontend Improvements
- ✅ Modern, responsive UI with better UX
- ✅ Theme system with 5 color themes (Ocean Blue, Royal Purple, Forest Green, Sunset Orange, Dark Mode)
- ✅ Profile image support with avatar selection
- ✅ Improved Login page with split-screen design
- ✅ Enhanced Dashboard with role-specific views
- ✅ Better mobile responsiveness
- ✅ Smooth animations and transitions
- ✅ Custom CSS variables for theming

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd school-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with the following:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/school_db"
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
```

4. Run Prisma migrations:
```bash
npx prisma migrate dev --name add_avatar_field
```

5. Generate Prisma Client:
```bash
npx prisma generate
```

6. (Optional) Seed the database:
```bash
npx prisma db seed
```

7. Start the backend server:
```bash
npm run dev
```

Backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd school-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on http://localhost:5173

## Using the Application

### Default Credentials
After seeding, you can use these credentials:
- Admin: `admin@school.com` / `password123`
- Teacher: `teacher@school.com` / `password123`
- Student: `student@school.com` / `password123`
- Parent: `parent@school.com` / `password123`

### Features to Explore

#### Theme Switching
1. Click the palette icon in the header
2. Choose from 5 different themes:
   - Ocean Blue (default)
   - Royal Purple
   - Forest Green
   - Sunset Orange
   - Dark Mode

#### Profile Management
1. Navigate to Profile page
2. Click "Edit Profile"
3. Update your name
4. Choose an avatar from the gallery or paste a custom URL
5. Save changes

#### Dashboard Views
- **Admin**: View all statistics, recent users, and enrollments
- **Teacher**: Manage classes, view students, and upcoming exams
- **Student**: Track attendance, grades, and upcoming exams
- **Parent**: Monitor children's progress and grades

## Project Structure

### Backend
```
school-backend/
├── prisma/
│   ├── schema.prisma          # Database schema with avatar field
│   └── migrations/            # Database migrations
├── src/
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Auth and validation
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   └── server.js              # Express app setup
└── package.json
```

### Frontend
```
school-frontend/
├── src/
│   ├── components/
│   │   ├── Layout/            # Sidebar, Header with theme switcher
│   │   ├── UI/                # Reusable components
│   │   └── ProtectedRoute/    # Auth guard
│   ├── context/
│   │   ├── AuthContext.jsx    # Authentication state
│   │   └── ThemeContext.jsx   # Theme management (NEW)
│   ├── pages/
│   │   ├── Auth/              # Login/Register with new UI
│   │   ├── Dashboard/         # Improved dashboard
│   │   ├── Profile/           # Profile with avatar support
│   │   ├── Students/
│   │   ├── Teachers/
│   │   └── Classes/
│   ├── services/              # API calls
│   ├── store/                 # Redux store
│   ├── index.css              # Global styles with CSS variables
│   └── App.jsx                # Main app with ThemeProvider
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update profile with avatar (requires auth)

### Dashboard
- `GET /api/dashboard` - Get role-specific dashboard data (requires auth)

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `PUT /api/students/:id/assign-class` - Assign to class
- `PUT /api/students/:id/assign-parent` - Assign to parent

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID

### Classes
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create new class
- `PUT /api/classes/:id` - Update class

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database exists

### Port Already in Use
- Backend: Change PORT in .env
- Frontend: Vite will automatically use next available port

### Theme Not Applying
- Clear browser cache
- Check browser console for errors
- Ensure ThemeProvider wraps the app

### Avatar Not Showing
- Check if avatar URL is valid
- Ensure backend migration ran successfully
- Verify profile update API is working

## Next Steps

To continue development:

1. **Add More Features**:
   - Exam management
   - Grade tracking
   - Attendance marking
   - Timetable management
   - Reports generation

2. **Improve UI**:
   - Add more animations
   - Create custom components library
   - Add data visualization charts

3. **Enhance Security**:
   - Add rate limiting
   - Implement refresh tokens
   - Add input validation
   - Enable HTTPS

4. **Testing**:
   - Add unit tests
   - Add integration tests
   - Add E2E tests

5. **Deployment**:
   - Set up CI/CD pipeline
   - Deploy to cloud platform
   - Configure production database
   - Set up monitoring

## Support

For issues or questions, please check:
- Backend logs in terminal
- Frontend console in browser
- Database connection status
- API response errors
