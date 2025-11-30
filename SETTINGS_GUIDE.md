# Settings Page Guide

## Overview
The Settings page allows users to customize their experience with various display and theme preferences.

## Features

### 1. Theme Selection
Choose from 5 beautiful color themes:
- **Ocean Blue** - Default professional blue theme
- **Royal Purple** - Elegant purple theme
- **Forest Green** - Fresh green theme
- **Sunset Orange** - Warm orange theme
- **Dark Mode** - Easy on the eyes dark theme

### 2. Font Size
Adjust text size for better readability:
- **Small** (14px) - Compact view
- **Medium** (16px) - Default size
- **Large** (18px) - Easier to read
- **Extra Large** (20px) - Maximum readability

### 3. Font Weight
Change text thickness:
- **Light** (300) - Thin, elegant text
- **Normal** (400) - Default weight
- **Medium** (500) - Slightly bolder
- **Bold** (600) - Strong, prominent text

### 4. Additional Options

#### Reduce Motion
- Minimizes animations throughout the app
- Better for performance and accessibility
- Reduces animation duration to near-instant

#### Compact Mode
- Reduces spacing between elements
- Fits more content on screen
- Great for smaller displays

## How to Access

### From Header (Navbar)
1. Click on your profile avatar in the top-right corner
2. Click "Settings" from the dropdown menu

### Direct URL
Navigate to: `http://localhost:3001/settings`

## Settings Persistence
All settings are automatically saved to your browser's localStorage and will persist across sessions.

## Preview Section
The Settings page includes a live preview showing how your text and buttons will look with the current settings.

## Reset to Defaults
Click "Reset to Defaults" to restore all settings to their original values:
- Theme: Ocean Blue
- Font Size: Medium
- Font Weight: Normal
- Reduce Motion: Off
- Compact Mode: Off

## Technical Details

### CSS Variables Used
- `--base-font-size` - Controls global font size
- `--base-font-weight` - Controls global font weight
- `--animation-duration` - Controls animation speed
- `--spacing-unit` - Controls spacing between elements
- `--color-*` - Theme color variables

### Storage
Settings are stored in localStorage under the key `userSettings`.

## Tips
1. Try different themes to find what works best for you
2. Increase font size if you find text hard to read
3. Enable "Reduce Motion" on slower devices
4. Use "Compact Mode" on smaller screens
5. Dark Mode is great for nighttime use

## Browser Compatibility
Works on all modern browsers that support:
- CSS Custom Properties (CSS Variables)
- localStorage API
- ES6+ JavaScript
