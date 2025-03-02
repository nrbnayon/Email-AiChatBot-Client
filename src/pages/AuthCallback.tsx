import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles } from "lucide-react";

// Shared debug log function
const debugLog = (message, data) => {
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

const AuthCallback = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("processing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      debugLog("Auth callback triggered", { url: location.search });

      try {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (!token) {
          debugLog("No token found in URL params", null);
          setStatus("error");
          setError("No authentication token received");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        debugLog("Token received in callback", {
          tokenPreview: token.substring(0, 10) + "...",
        });

        // Store token in multiple places for redundancy
        try {
          localStorage.setItem("token", token);
          sessionStorage.setItem("token_backup", token);
          localStorage.setItem("token_timestamp", Date.now().toString());
          debugLog("Token stored in storage directly");
        } catch (storageErr) {
          debugLog("Error storing token directly", storageErr);
        }

        // Use a timeout to ensure browser has time to persist the token
        setTimeout(() => {
          debugLog("Checking if token was stored", null);
          const storedToken = localStorage.getItem("token");

          if (storedToken) {
            debugLog("Token confirmed in localStorage");
          } else {
            debugLog("Token not found in localStorage after direct set!");
            // Try again
            localStorage.setItem("token", token);
          }

          // Call the context's setToken function
          debugLog("Calling context setToken function");
          setToken(token);

          // Verify again after context function
          setTimeout(() => {
            const finalCheck = localStorage.getItem("token");

            if (finalCheck) {
              debugLog("Final token check successful, navigating to dashboard");
              setStatus("success");
              navigate("/dashboard");
            } else {
              debugLog(
                "Final token check failed! Using manual navigation with token"
              );
              setStatus("error");
              setError("Failed to store authentication token");

              // Try one more direct approach
              window.location.href = `/dashboard?emergencyToken=${encodeURIComponent(
                token
              )}`;
            }
          }, 500);
        }, 500);
      } catch (err) {
        debugLog("Error in auth callback", err);
        setStatus("error");
        setError("Authentication process failed");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleCallback();
  }, [location, navigate, setToken]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {error || "Unknown error occurred"}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg">
        <div className="relative mx-auto w-16 h-16 mb-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          <Sparkles className="h-6 w-6 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
          {status === "success"
            ? "Authentication successful!"
            : "Completing authentication..."}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {status === "success"
            ? "Redirecting to your dashboard"
            : "Please wait while we complete the process"}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
