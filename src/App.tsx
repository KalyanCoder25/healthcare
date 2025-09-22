import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppointmentProvider } from './contexts/AppointmentContext';
import { Navigation } from './components/Navigation';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { PatientDashboard } from './components/dashboards/PatientDashboard';
import { DoctorDashboard } from './components/dashboards/DoctorDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { useAuth } from './contexts/AuthContext';
import './index.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'dashboard'>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">HealthCare Connect</h1>
              <p className="text-gray-600">Your healthcare management platform</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex mb-6">
                <button
                  onClick={() => setCurrentView('login')}
                  className={`flex-1 py-2 text-sm font-medium rounded-l-lg ${
                    currentView === 'login'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className={`flex-1 py-2 text-sm font-medium rounded-r-lg ${
                    currentView === 'register'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Sign Up
                </button>
              </div>
              
              {currentView === 'login' ? <LoginForm /> : <RegisterForm />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'patient':
        return <PatientDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <PatientDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="pt-16">
        {renderDashboard()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppointmentProvider>
        <AppContent />
      </AppointmentProvider>
    </AuthProvider>
  );
}

export default App;