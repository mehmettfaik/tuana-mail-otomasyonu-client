import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';

const Navbar = ({ onToggleAutomation, senderName, setSenderName }) => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-black">TUANA B2B Mail Otomasyonu</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleAutomation}
              className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
            >
            Otomasyon
            </button>
            <span className="text-gray-700 text-sm hidden sm:inline">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
