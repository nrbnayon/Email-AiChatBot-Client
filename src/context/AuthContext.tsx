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

// Create a debug log function that writes to console and to localStorage for persistence
const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;

  console.log(logMessage, data);

  // Store log in localStorage for persistence
  try {
    const logs = JSON.parse(localStorage.getItem("auth_debug_logs") || "[]");
    logs.push({
      time: timestamp,
      message,
      data: data ? JSON.stringify(data) : undefined,
    });
    localStorage.setItem("auth_debug_logs", JSON.stringify(logs.slice(-50))); // Keep last 50 logs
  } catch (e) {
    console.error("Failed to store debug log", e);
  }
};

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
    if (!token) {
      debugLog("setToken called with empty token, ignoring");
      return;
    }

    debugLog("Setting token in localStorage", {
      tokenPreview: token.substring(0, 10) + "...",
    });

    try {
      // Save token in localStorage
      localStorage.setItem("token", token);

      // Also save in sessionStorage as backup
      sessionStorage.setItem("token_backup", token);

      // Add timestamp
      localStorage.setItem("token_timestamp", Date.now().toString());

      // Set token in axios headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Set flag to trigger useEffect
      setTokenSet((prevState) => !prevState);

      debugLog("Token successfully set");

      // Don't fetch user here - let the useEffect handle it
    } catch (err) {
      debugLog("Error setting token", err);
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      debugLog("checkAuth triggered");

      try {
        // Check localStorage
        const token = localStorage.getItem("token");

        // If not in localStorage, try to recover from sessionStorage
        if (!token) {
          const backupToken = sessionStorage.getItem("token_backup");
          if (backupToken) {
            debugLog("Recovering token from sessionStorage");
            localStorage.setItem("token", backupToken);
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${backupToken}`;
            await fetchCurrentUser();
            return;
          }

          debugLog("No token found in any storage");
          setLoading(false);
          return;
        }

        debugLog("Found token in localStorage", {
          tokenPreview: token.substring(0, 10) + "...",
        });
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        await fetchCurrentUser();
      } catch (err) {
        debugLog("Auth check error", err);
        setLoading(false);
      }
    };

    checkAuth();
  }, [tokenSet]);

  // Fetch current user data
  const fetchCurrentUser = async () => {
    debugLog("fetchCurrentUser called");

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        debugLog("No token found, skipping user fetch");
        setLoading(false);
        return;
      }

      debugLog("Fetching user with token", {
        tokenPreview: token.substring(0, 10) + "...",
      });

      // IMPORTANT: Make a direct fetch request instead of using axios
      // to rule out axios configuration issues
      const fetchOptions = {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include" as RequestCredentials,
      };

      debugLog(`Making fetch request to ${baseUrl}/api/auth/me`, fetchOptions);

      try {
        const response = await fetch(`${baseUrl}/api/auth/me`, fetchOptions);

        debugLog("Fetch response status", response.status);

        if (response.ok) {
          const data = await response.json();
          debugLog("User data received", data);

          if (data.success) {
            setUser(data.user);
            debugLog("User set successfully", data.user);
          } else {
            debugLog("API returned success:false", data);
            setError("Failed to get user data");
          }
        } else {
          // Don't remove token for server errors
          debugLog("Server returned error status", response.status);

          if (response.status === 401 || response.status === 403) {
            debugLog("Auth error - KEEPING TOKEN FOR DEBUGGING");
            // DON'T remove token for now to debug the issue
            // localStorage.removeItem("token");
          }
        }
      } catch (fetchErr) {
        debugLog("Fetch request failed", fetchErr);

        // Try axios as fallback
        debugLog("Trying axios as fallback");
        const axiosResponse = await axios.get(`${baseUrl}/api/auth/me`, {
          withCredentials: true,
        });

        debugLog("Axios response received", axiosResponse.data);

        if (axiosResponse.data.success) {
          setUser(axiosResponse.data.user);
        }
      }
    } catch (err: any) {
      debugLog("Error in fetchCurrentUser", err);

      // CRITICAL: DO NOT REMOVE TOKEN HERE
      // This is likely where the issue is happening
      debugLog("KEEPING TOKEN despite error for debugging");

      setError(err.message || "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = (provider: string) => {
    debugLog(`Initiating ${provider} login`);
    window.location.href = `${baseUrl}/api/auth/${provider}`;
  };

  // Logout function
  const logout = async () => {
    debugLog("Logout called");

    try {
      await axios.get(`${baseUrl}/api/auth/logout`);
      setUser(null);

      debugLog("Removing token on explicit logout");
      localStorage.removeItem("token");
      sessionStorage.removeItem("token_backup");
      localStorage.removeItem("token_timestamp");

      delete axios.defaults.headers.common["Authorization"];
      debugLog("Logout successful");
    } catch (err) {
      debugLog("Error logging out", err);
      setError("Failed to logout");

      // Force logout on frontend even if API call fails
      setUser(null);
      localStorage.removeItem("token");
      sessionStorage.removeItem("token_backup");
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
