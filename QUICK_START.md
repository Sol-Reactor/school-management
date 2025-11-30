# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start Backend (Terminal 1)
```bash
cd school-backend
npm install
npx prisma db push
npm run dev
```

Backend will run on: http://localhost:5000

### Step 2: Start Frontend (Terminal 2)
```bash
cd school-frontend
npm install
npm run dev
```

Frontend will run on: http://localhost:5173

### Step 3: Login
Open http://localhost:5173 in your browser and login with:
- **Email**: admin@school.com
- **Password**: password123

---

## 🎨 Try New Features

### 1. Change Theme
- Click the **palette icon** (🎨) in the top right
- Choose from 5 themes:
  - Ocean Blue
  - Royal Purple
  - Forest Green
  - Sunset Orange
  - Dark Mode

### 2. Set Your Avatar
- Click **Profile** in the sidebar
- Click **Edit Profile**
- Choose an avatar or paste a custom URL
- Click **Save Changes**

### 3. Explore Dashboard
- View role-specific information
- Check statistics and recent activity
- Navigate using the sidebar

---

## 🎯 What's New?

✅ **5 Beautiful Themes** - Switch between different color schemes
✅ **Profile Avatars** - Personalize your profile with images
✅ **Modern UI** - Clean, professional design
✅ **Better Mobile** - Responsive design for all devices
✅ **Smooth Animations** - Polished user experience
✅ **Fixed Bugs** - Improved reliability

---

## 📱 Mobile View

On mobile devices:
- Tap the **hamburger menu** (☰) to open sidebar
- Tap outside to close sidebar
- All features work on mobile

---

## 🔧 Troubleshooting

### Backend won't start?
- Check if PostgreSQL is running
- Verify DATABASE_URL in .env file
- Run: `npx prisma db push`

### Frontend won't start?
- Delete node_modules and run `npm install` again
- Check if port 5173 is available

### Theme not changing?
- Clear browser cache
- Check browser console for errors

### Avatar not showing?
- Ensure backend migration ran: `npx prisma db push`
- Check if image URL is valid

---

## 📚 Learn More

- **Full Setup**: See `SETUP_INSTRUCTIONS.md`
- **All Changes**: See `CHANGES_SUMMARY.md`
- **API Docs**: Check backend routes in `school-backend/src/routes/`

---

## 🎉 Enjoy!

Your School Management System is now ready with:
- Modern, beautiful UI
- Multiple themes
- Profile avatars
- Better user experience

Happy managing! 🎓
