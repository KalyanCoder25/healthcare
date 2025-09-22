import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Heart, 
  User, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Video
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, message: 'Appointment reminder: Tomorrow at 2:00 PM', type: 'reminder' },
    { id: 2, message: 'Lab results are ready', type: 'results' }
  ]);

  const getNavigationItems = () => {
    const commonItems = [
      { icon: Calendar, label: 'Appointments', active: true },
      { icon: FileText, label: 'Records' },
      { icon: Video, label: 'Virtual Visits' }
    ];

    switch (user?.role) {
      case 'doctor':
        return [
          ...commonItems,
          { icon: User, label: 'Patients' },
          { icon: Settings, label: 'Schedule' }
        ];
      case 'admin':
        return [
          ...commonItems,
          { icon: User, label: 'Users' },
          { icon: Settings, label: 'System Settings' }
        ];
      default:
        return commonItems;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Heart className="w-8 h-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              HealthCare Connect
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {getNavigationItems().map((item, index) => (
              <button
                key={index}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.active
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {getNavigationItems().map((item, index) => (
              <button
                key={index}
                className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm font-medium ${
                  item.active
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};