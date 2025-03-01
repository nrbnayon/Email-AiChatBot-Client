import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Sparkles } from "lucide-react";

const Login: React.FC = () => {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500'></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to='/dashboard' replace />;
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden'>
        <div className='bg-gradient-to-r from-indigo-600 to-purple-600 py-8'>
          <div className='flex justify-center'>
            <div className='relative'>
              <Mail className='h-16 w-16 text-white' />
              <Sparkles className='h-6 w-6 text-yellow-300 absolute -top-1 -right-1' />
            </div>
          </div>
          <h2 className='mt-4 text-center text-3xl font-extrabold text-white'>
            Email AI Assistant
          </h2>
          <p className='mt-2 text-center text-sm text-indigo-200'>
            Access your emails with AI-powered insights
          </p>
        </div>

        <div className='p-8'>
          <div className='space-y-4'>
            <button
              onClick={() => login("google")}
              className='w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200'
            >
              <svg className='h-5 w-5 mr-2' viewBox='0 0 24 24'>
                <path
                  d='M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.522 0-10 4.478-10 10s4.478 10 10 10c8.396 0 10.249-7.85 9.426-11.748l-9.426 0.082z'
                  fill='#4285F4'
                />
              </svg>
              Sign in with Google
            </button>

            <button
              onClick={() => login("microsoft")}
              className='w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200'
            >
              <svg className='h-5 w-5 mr-2' viewBox='0 0 23 23'>
                <path fill='#f3f3f3' d='M0 0h23v23H0z' />
                <path fill='#f35325' d='M1 1h10v10H1z' />
                <path fill='#81bc06' d='M12 1h10v10H12z' />
                <path fill='#05a6f0' d='M1 12h10v10H1z' />
                <path fill='#ffba08' d='M12 12h10v10H12z' />
              </svg>
              Sign in with Microsoft
            </button>
          </div>

          <div className='mt-6'>
            <p className='text-center text-sm text-gray-500'>
              By signing in, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
