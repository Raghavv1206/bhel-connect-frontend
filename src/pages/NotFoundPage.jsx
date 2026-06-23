import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-50 mb-6">
          <AlertTriangle className="h-8 w-8 text-yellow-650" />
        </div>
        <h1 className="text-5xl font-black text-[#003366] mb-2 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-sm text-gray-500 mb-8 font-medium">
          The page you are looking for does not exist, has been removed, or is temporarily unavailable.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#003366] hover:bg-[#002244] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-colors cursor-pointer"
        >
          <Home className="w-4 h-4" />
          Back to Homepage
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
