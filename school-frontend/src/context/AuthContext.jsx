// src/context/AuthContext.js
import React, { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser } from "../store/slices/userSlice";
import { authService } from "../services/authServices";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { token } = useSelector((state) => state.auth);

  const fetchUserProfile = async () => {
    try {
      const userData = await authService.getProfile();
      dispatch(setUser(userData));
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      dispatch(clearUser());
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      dispatch(setUser(updatedUser));
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (token && !user) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Only run when token changes

  const value = {
    user,
    fetchUserProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
