// src\context\AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  authProvider: string;
  googleId?: string;
  microsoftId?: string;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenSet, setTokenSet] = useState(false);

  // Define base URL based on environment
  const baseUrl =
    import.meta.env?.VITE_NODE_ENV === "production"
      ? import.meta.env?.VITE_LIVE_API_URL
      : import.meta.env?.VITE_BASE_API_URL ||
        "https://email-ai-chat-bot-server.vercel.app";

  // Initialize axios with credentials
  axios.defaults.withCredentials = true;

  // Set token in localStorage and axios headers
  const setToken = (token: string) => {
    console.log(`Making request to: ${baseUrl}/api/auth/me`);
    console.log(`With headers:`, axios.defaults.headers.common);
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setTokenSet(true);

    console.log("Token set in localStorage and axios headers");
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          console.log("Found token in localStorage, setting in axios headers");
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          await fetchCurrentUser();
        } else {
          console.log("No token found in localStorage");
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setLoading(false);
      }
    };

    checkAuth();
  }, [tokenSet]);

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      console.log("Fetching current user data");
      const response = await axios.get(`${baseUrl}/api/auth/me`);

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
      // localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = (provider: string) => {
    console.log(`Initiating ${provider} login`);
    window.location.href = `${baseUrl}/api/auth/${provider}`;
  };

  // Logout function
  const logout = async () => {
    try {
      console.log("Logging out");
      await axios.get(`${baseUrl}/api/auth/logout`);
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
