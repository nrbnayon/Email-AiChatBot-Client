// Modified AuthCallback.tsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthCallback: React.FC = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");

      if (token) {
        console.log(
          "Token received in callback:",
          token.substring(0, 10) + "..."
        ); // Log partial token for debugging
        setToken(token);

        // Add a small delay before navigation to ensure token is set
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        console.error("No token received in callback");
        navigate("/login");
      }
    };

    handleCallback();
  }, [location, navigate, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-700">
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
