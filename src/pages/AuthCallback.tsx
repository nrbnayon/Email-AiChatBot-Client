import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles } from "lucide-react";

const AuthCallback: React.FC = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = () => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");

      if (token) {
        console.log("Token received in callback");
        setToken(token);
        navigate("/dashboard");
      } else {
        console.error("No token received in callback");
        navigate("/login");
      }
    };

    handleCallback();
  }, [location, navigate, setToken]);

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
