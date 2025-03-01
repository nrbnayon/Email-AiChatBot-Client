import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  authProvider: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (provider: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In your frontend code
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.vercel.app/api' 
  : 'http://localhost:4000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize axios with credentials
  axios.defaults.withCredentials = true;

  // Set token in localStorage and axios headers
  const setToken = (token: string) => {
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("Token set in localStorage and axios headers");
  };

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      console.log("Found token in localStorage, setting in axios headers");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      console.log("No token found in localStorage");
      setLoading(false);
    }
  }, []);

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      console.log("Fetching current user data");
      const response = await axios.get(`${API_BASE_URL}/auth/me`);

      if (response.data.success) {
        console.log(
          "User data fetched successfully:",
          response.data.user.email
        );
        setUser(response.data.user);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setError("Failed to fetch user data");
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = (provider: string) => {
    console.log(`Initiating ${provider} login`);
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
  };

  // Logout function
  const logout = async () => {
    try {
      console.log("Logging out");
      await axios.get(`${API_BASE_URL}/auth/logout`);
      setUser(null);
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      console.log("Logout successful");
    } catch (err) {
      console.error("Error logging out:", err);
      setError("Failed to logout");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, setToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};