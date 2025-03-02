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

    console.log("Setting token in localStorage:", token);

    localStorage.setItem("token", token);

    // Add a timestamp to track when the token was set
    localStorage.setItem("token_timestamp", Date.now().toString());

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setTokenSet(true); // Set flag to trigger useEffect

    fetchCurrentUser().catch((err) =>
      console.error("Error fetching user after setting token:", err)
    );
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

      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, skipping user fetch");
        setLoading(false);
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      console.log("Fetching user with token:", token);

      const response = await axios.get(`${baseUrl}/api/auth/me`, {
        withCredentials: true, // Ensures cookies are sent
      });

      if (response.data.success) {
        setUser(response.data.user);
        console.log("User fetched successfully:", response.data.user.email);
      } else {
        console.warn("API returned success:false");
        setError("Failed to get user data");
        // Do NOT remove token here - might be temporary issue
      }
    } catch (err: any) {
      console.error("Error fetching user:", err);

      // Only remove token for auth-related errors (401, 403)
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        console.log("Removing token due to auth error:", err.response.status);
        localStorage.removeItem("token");
      } else {
        // For other errors (network, server, etc.), keep the token
        console.log(
          "Keeping token despite error. Likely CORS or network issue."
        );
      }

      setError(err.message || "Failed to fetch user data");
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
      localStorage.removeItem("token_timestamp");
      delete axios.defaults.headers.common["Authorization"];
      console.log("Logout successful");
    } catch (err) {
      console.error("Error logging out:", err);
      setError("Failed to logout");

      // Force logout on frontend even if API call fails
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("token_timestamp");
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
