import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'patient' | 'doctor' | 'admin') => {
    const demoCredentials = {
      patient: { email: 'patient@demo.com', password: 'demo123' },
      doctor: { email: 'doctor@demo.com', password: 'demo123' },
      admin: { email: 'admin@demo.com', password: 'demo123' }
    };

    setFormData(demoCredentials[role]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      {/* Demo Login Buttons */}
      <div className="border-t border-gray-200 pt-6">
        <p className="text-sm text-gray-600 text-center mb-4">
          Try the demo with these accounts:
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleDemoLogin('patient')}
            className="w-full bg-green-50 text-green-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-green-100 transition-colors"
          >
            Demo Patient Account
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('doctor')}
            className="w-full bg-blue-50 text-blue-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            Demo Doctor Account
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin('admin')}
            className="w-full bg-purple-50 text-purple-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-purple-100 transition-colors"
          >
            Demo Admin Account
          </button>
        </div>
      </div>
    </form>
  );
};