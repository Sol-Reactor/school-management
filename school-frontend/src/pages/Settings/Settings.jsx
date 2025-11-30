import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import {
  FaCog,
  FaPalette,
  FaFont,
  FaAdjust,
  FaCheck,
  FaSave,
} from "react-icons/fa";

const Settings = () => {
  const { currentTheme, themes, changeTheme } = useTheme();
  const { showToast } = useToast();

  // Load settings from localStorage
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("userSettings");
    return saved
      ? JSON.parse(saved)
      : {
          fontSize: "medium",
          fontWeight: "normal",
          reducedMotion: false,
          compactMode: false,
        };
  });

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    const fontSizes = {
      small: "14px",
      medium: "16px",
      large: "18px",
      xlarge: "20px",
    };
    root.style.setProperty("--base-font-size", fontSizes[settings.fontSize]);

    // Font weight
    const fontWeights = {
      light: "300",
      normal: "400",
      medium: "500",
      bold: "600",
    };
    root.style.setProperty("--base-font-weight", fontWeights[settings.fontWeight]);

    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty("--animation-duration", "0.01ms");
    } else {
      root.style.setProperty("--animation-duration", "200ms");
    }

    // Compact mode
    if (settings.compactMode) {
      root.style.setProperty("--spacing-unit", "0.75rem");
    } else {
      root.style.setProperty("--spacing-unit", "1rem");
    }

    // Save to localStorage
    localStorage.setItem("userSettings", JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    showToast("Settings saved successfully!", "success");
  };

  const handleReset = () => {
    const defaultSettings = {
      fontSize: "medium",
      fontWeight: "normal",
      reducedMotion: false,
      compactMode: false,
    };
    setSettings(defaultSettings);
    changeTheme("blue");
    showToast("Settings reset to defaults", "info");
  };

  const themeColors = [
    { key: "blue", name: "Ocean Blue", color: "#3B82F6" },
    { key: "purple", name: "Royal Purple", color: "#8B5CF6" },
    { key: "green", name: "Forest Green", color: "#10B981" },
    { key: "orange", name: "Sunset Orange", color: "#F97316" },
    { key: "dark", name: "Dark Mode", color: "#1E293B" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
          <FaCog className="text-blue-500" />
          <span>Settings</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Customize your experience with theme and display preferences
        </p>
      </div>

      {/* Theme Selection */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FaPalette className="text-blue-500 text-xl" />
          <h2 className="text-xl font-semibold text-gray-900">Theme</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Choose a color theme for the application
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {themeColors.map((theme) => (
            <button
              key={theme.key}
              onClick={() => {
                changeTheme(theme.key);
                showToast(`Theme changed to ${theme.name}`, "success");
              }}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                currentTheme === theme.key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-full"
                  style={{ backgroundColor: theme.color }}
                />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{theme.name}</p>
                  <p className="text-sm text-gray-500">{theme.color}</p>
                </div>
              </div>
              {currentTheme === theme.key && (
                <div className="absolute top-2 right-2">
                  <FaCheck className="text-blue-500" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FaFont className="text-blue-500 text-xl" />
          <h2 className="text-xl font-semibold text-gray-900">Font Size</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Adjust the text size throughout the application
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "small", label: "Small", size: "14px" },
            { key: "medium", label: "Medium", size: "16px" },
            { key: "large", label: "Large", size: "18px" },
            { key: "xlarge", label: "Extra Large", size: "20px" },
          ].map((size) => (
            <button
              key={size.key}
              onClick={() => handleSettingChange("fontSize", size.key)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                settings.fontSize === size.key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-semibold text-gray-900">{size.label}</p>
              <p className="text-sm text-gray-500">{size.size}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Font Weight */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FaAdjust className="text-blue-500 text-xl" />
          <h2 className="text-xl font-semibold text-gray-900">Font Weight</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Change the thickness of text for better readability
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "light", label: "Light", weight: "300" },
            { key: "normal", label: "Normal", weight: "400" },
            { key: "medium", label: "Medium", weight: "500" },
            { key: "bold", label: "Bold", weight: "600" },
          ].map((weight) => (
            <button
              key={weight.key}
              onClick={() => handleSettingChange("fontWeight", weight.key)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                settings.fontWeight === weight.key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{ fontWeight: weight.weight }}
            >
              <p className="font-semibold text-gray-900">{weight.label}</p>
              <p className="text-sm text-gray-500">{weight.weight}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Options */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Additional Options
        </h2>

        <div className="space-y-4">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">Reduce Motion</p>
              <p className="text-sm text-gray-600">
                Minimize animations for better performance
              </p>
            </div>
            <button
              onClick={() =>
                handleSettingChange("reducedMotion", !settings.reducedMotion)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.reducedMotion ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.reducedMotion ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">Compact Mode</p>
              <p className="text-sm text-gray-600">
                Reduce spacing for more content on screen
              </p>
            </div>
            <button
              onClick={() =>
                handleSettingChange("compactMode", !settings.compactMode)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.compactMode ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.compactMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FaSave />
          <span>Save Settings</span>
        </button>
        <button
          onClick={handleReset}
          className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
        <div className="space-y-3">
          <p className="text-gray-900">
            This is how your text will look with the current settings.
          </p>
          <p className="text-gray-600">
            Secondary text appears in a lighter shade for better hierarchy.
          </p>
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">
              Primary Button
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg">
              Secondary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
