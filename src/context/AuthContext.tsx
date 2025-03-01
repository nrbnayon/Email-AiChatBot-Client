// src\context\AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

interface User {
  id: string;
  name: string;
  email: string;
  authProvider: string;
  googleAccessToken?: string;
  microsoftAccessToken?: string;
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
      ? import.meta.env?.VITE_LIVE_API_URL ||
        "https://email-ai-chat-bot-server.vercel.app"
      : import.meta.env?.VITE_BASE_API_URL ||
        "https://email-ai-chat-bot-server.vercel.app";

  // Initialize axios with credentials
  axios.defaults.withCredentials = true;

  // Set token in localStorage and axios headers
  const setToken = (token: string) => {
    if (!token) return;

    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (token) {
      fetchCurrentUser()
        .then(() => {
          setTokenSet(true);
        })
        .catch((err) => {
          console.error("Error after setting token:", err);
        });
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/api/auth/me`);


      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      if (
        axios.isAxiosError(err) &&
        (err.response?.status === 401 || err.response?.status === 403)
      ) {
        // Don't remove token here - this might be causing the issue
        // Just clear the header, let the app decide when to remove the token
        delete axios.defaults.headers.common["Authorization"];
      } else {
        setError("Failed to fetch user data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          try {
            await fetchCurrentUser();
          } catch (fetchErr) {
            console.error("Error fetching user during auth check:", fetchErr);
            // Don't remove token on error, just log it
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setLoading(false);
      }
    };

    checkAuth();
  }, [tokenSet]);

  // Login function
  const login = (provider: string) => {
    window.location.href = `${baseUrl}/api/auth/${provider}`;
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.get(`${baseUrl}/api/auth/logout`);
      setUser(null);
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    } catch (err) {
      console.error("Error logging out:", err);
      setError("Failed to logout");
      // Still remove token even if the logout API call fails
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
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
