import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles } from "lucide-react";

const AuthCallback: React.FC = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (token) {
          console.log("Token received in callback");

          // Store token temporarily in sessionStorage as backup
          sessionStorage.setItem("temp_token", token);

          // Use a small timeout to ensure setToken completes
          setTimeout(() => {
            setToken(token);

            // Verify the token was set
            const storedToken = localStorage.getItem("token");
            if (storedToken) {
              console.log("Token successfully stored, navigating to dashboard");
              navigate("/dashboard");
            } else {
              console.error("Token failed to store in localStorage");
              // Try to recover from sessionStorage
              const tempToken = sessionStorage.getItem("temp_token");
              if (tempToken) {
                console.log("Attempting recovery from sessionStorage");
                localStorage.setItem("token", tempToken);
                navigate("/dashboard");
              } else {
                setError("Authentication failed: Could not store token");
                navigate("/login");
              }
            }
          }, 500);
        } else {
          console.error("No token received in callback");
          setError("Authentication failed: No token received");
          navigate("/login");
        }
      } catch (err) {
        console.error("Error in auth callback:", err);
        setError("Authentication process failed");
        navigate("/login");
      }
    };

    handleCallback();
  }, [location, navigate, setToken]);

  if (error) {
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
          <p className="mt-2 text-sm text-gray-500">{error}</p>
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
          Completing authentication...
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          You will be redirected shortly
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
