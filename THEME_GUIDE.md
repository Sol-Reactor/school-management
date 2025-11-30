# Theme Guide

## Available Themes

The School Management System comes with 5 beautiful, carefully crafted themes. Each theme has been designed to provide excellent readability and visual appeal.

---

## 🌊 Ocean Blue (Default)
**Best for**: Professional, corporate environments

### Colors
- **Primary**: `#3B82F6` - Bright blue
- **Primary Dark**: `#2563EB` - Deep blue
- **Primary Light**: `#60A5FA` - Light blue
- **Secondary**: `#8B5CF6` - Purple
- **Accent**: `#06B6D4` - Cyan
- **Background**: `#F8FAFC` - Light gray
- **Surface**: `#FFFFFF` - White
- **Text**: `#1E293B` - Dark slate
- **Border**: `#E2E8F0` - Light gray

### Use Case
Perfect for schools and educational institutions that want a professional, trustworthy appearance. The blue color scheme is calming and promotes focus.

---

## 👑 Royal Purple
**Best for**: Creative, modern environments

### Colors
- **Primary**: `#8B5CF6` - Vibrant purple
- **Primary Dark**: `#7C3AED` - Deep purple
- **Primary Light**: `#A78BFA` - Light purple
- **Secondary**: `#EC4899` - Pink
- **Accent**: `#F59E0B` - Amber
- **Background**: `#FAF5FF` - Light purple tint
- **Surface**: `#FFFFFF` - White
- **Text**: `#1E293B` - Dark slate
- **Border**: `#E9D5FF` - Light purple

### Use Case
Ideal for creative institutions, art schools, or organizations that want to stand out with a bold, modern look.

---

## 🌲 Forest Green
**Best for**: Eco-friendly, natural environments

### Colors
- **Primary**: `#10B981` - Emerald green
- **Primary Dark**: `#059669` - Deep green
- **Primary Light**: `#34D399` - Light green
- **Secondary**: `#3B82F6` - Blue
- **Accent**: `#F59E0B` - Amber
- **Background**: `#F0FDF4` - Light green tint
- **Surface**: `#FFFFFF` - White
- **Text**: `#1E293B` - Dark slate
- **Border**: `#D1FAE5` - Light green

### Use Case
Perfect for environmentally-conscious schools or institutions that want to convey growth, nature, and sustainability.

---

## 🌅 Sunset Orange
**Best for**: Energetic, warm environments

### Colors
- **Primary**: `#F97316` - Vibrant orange
- **Primary Dark**: `#EA580C` - Deep orange
- **Primary Light**: `#FB923C` - Light orange
- **Secondary**: `#EF4444` - Red
- **Accent**: `#8B5CF6` - Purple
- **Background**: `#FFF7ED` - Light orange tint
- **Surface**: `#FFFFFF` - White
- **Text**: `#1E293B` - Dark slate
- **Border**: `#FFEDD5` - Light orange

### Use Case
Great for energetic, youth-focused institutions or organizations that want to convey warmth, enthusiasm, and creativity.

---

## 🌙 Dark Mode
**Best for**: Night use, reduced eye strain

### Colors
- **Primary**: `#3B82F6` - Bright blue
- **Primary Dark**: `#2563EB` - Deep blue
- **Primary Light**: `#60A5FA` - Light blue
- **Secondary**: `#8B5CF6` - Purple
- **Accent**: `#06B6D4` - Cyan
- **Background**: `#0F172A` - Very dark blue
- **Surface**: `#1E293B` - Dark slate
- **Text**: `#F1F5F9` - Light gray
- **Text Secondary**: `#94A3B8` - Medium gray
- **Border**: `#334155` - Dark gray

### Use Case
Perfect for night-time use or users who prefer dark interfaces. Reduces eye strain in low-light conditions.

---

## 🎨 How to Switch Themes

### For Users
1. Click the **palette icon** (🎨) in the header
2. Select your preferred theme from the dropdown
3. Theme is saved automatically and persists across sessions

### For Developers
Themes are managed in `school-frontend/src/context/ThemeContext.jsx`

To add a new theme:
```javascript
newTheme: {
  name: 'Theme Name',
  primary: '#HEX_COLOR',
  primaryDark: '#HEX_COLOR',
  primaryLight: '#HEX_COLOR',
  secondary: '#HEX_COLOR',
  accent: '#HEX_COLOR',
  background: '#HEX_COLOR',
  surface: '#HEX_COLOR',
  text: '#HEX_COLOR',
  textSecondary: '#HEX_COLOR',
  border: '#HEX_COLOR',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
}
```

---

## 🎯 Theme Usage in Components

All components use CSS variables for theming:

```jsx
// Background color
style={{ backgroundColor: 'var(--color-background)' }}

// Text color
style={{ color: 'var(--color-text)' }}

// Primary color
style={{ backgroundColor: 'var(--color-primary)' }}

// Border
style={{ borderColor: 'var(--color-border)' }}
```

---

## 📊 Color Meanings

### Primary Colors
Used for main actions, buttons, and important elements. Should be the most prominent color in your theme.

### Secondary Colors
Used for less important actions and complementary elements. Provides visual variety.

### Accent Colors
Used sparingly for highlights and special elements. Draws attention to specific features.

### Background & Surface
- **Background**: Main page background
- **Surface**: Cards, modals, and elevated elements

### Text Colors
- **Text**: Primary text color
- **Text Secondary**: Less important text, labels, hints

### Status Colors
- **Success**: `#10B981` - Positive actions, success messages
- **Warning**: `#F59E0B` - Warnings, important notices
- **Error**: `#EF4444` - Errors, destructive actions
- **Info**: `#3B82F6` - Informational messages

---

## 🌈 Accessibility

All themes have been designed with accessibility in mind:

- ✅ **Contrast Ratios**: All text meets WCAG AA standards
- ✅ **Color Blindness**: Themes work for common types of color blindness
- ✅ **Dark Mode**: Reduces eye strain in low-light conditions
- ✅ **Consistent**: Same elements use same colors across themes

---

## 💡 Tips for Choosing a Theme

1. **Consider Your Brand**: Choose colors that match your institution's branding
2. **Think About Your Audience**: Younger audiences might prefer vibrant colors
3. **Time of Day**: Use dark mode for evening/night use
4. **Environment**: Consider the lighting conditions where the system will be used
5. **Accessibility**: Ensure chosen theme works for users with visual impairments

---

## 🔧 Customization

Want to customize a theme? Edit the theme object in `ThemeContext.jsx`:

```javascript
// Example: Make Ocean Blue more vibrant
blue: {
  name: 'Ocean Blue',
  primary: '#2563EB', // Changed from #3B82F6
  // ... other colors
}
```

After editing, the changes will apply immediately when the theme is selected.

---

## 📱 Theme Persistence

Themes are automatically saved to `localStorage` and persist across:
- ✅ Page refreshes
- ✅ Browser restarts
- ✅ Different sessions
- ✅ Different pages in the app

---

## 🎨 Design Philosophy

Each theme follows these principles:

1. **Consistency**: Same elements look similar across themes
2. **Hierarchy**: Important elements stand out
3. **Readability**: Text is always easy to read
4. **Balance**: Colors are well-distributed
5. **Purpose**: Every color has a specific purpose

---

## 🚀 Future Themes

Potential themes for future releases:
- Midnight Blue
- Cherry Blossom
- Autumn Leaves
- Ocean Breeze
- Lavender Dreams
- Custom Theme Builder

---

## 📞 Feedback

Have a theme suggestion? Want to see a specific color scheme? Let us know!

Themes are an important part of user experience, and we're always looking to improve and expand our theme collection.
