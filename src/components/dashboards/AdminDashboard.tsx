import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointments } from '../../contexts/AppointmentContext';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Settings,
  UserCheck,
  Clock,
  FileText,
  BarChart
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { appointments, doctors } = useAppointments();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'appointments' | 'analytics' | 'settings'>('overview');

  const stats = [
    {
      icon: Users,
      label: 'Total Users',
      value: '1,234',
      change: '+12%',
      color: 'bg-blue-500'
    },
    {
      icon: Calendar,
      label: 'Total Appointments',
      value: appointments.length,
      change: '+8%',
      color: 'bg-green-500'
    },
    {
      icon: UserCheck,
      label: 'Active Doctors',
      value: doctors.length,
      change: '+3%',
      color: 'bg-purple-500'
    },
    {
      icon: TrendingUp,
      label: 'Revenue',
      value: '$45,678',
      change: '+15%',
      color: 'bg-teal-500'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">User management features coming soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  Manage patient and doctor accounts, permissions, and access control
                </p>
              </div>
            </div>
          </div>
        );
      case 'appointments':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Appointment Management</h3>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.slice(0, 10).map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {appointment.patientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.doctorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.date} at {appointment.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {appointment.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            appointment.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : appointment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : appointment.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Analytics & Reports</h3>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-center py-8">
                <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Analytics features coming soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  View detailed reports, patient demographics, and system performance metrics
                </p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">System settings coming soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  Configure system parameters, notifications, and security settings
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className={`text-sm font-medium ${
                        stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      } mt-1`}>
                        {stat.change} from last month
                      </p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New doctor registered</p>
                    <p className="text-sm text-gray-500">Dr. Michael Johnson joined the platform</p>
                  </div>
                  <span className="text-sm text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Appointment completed</p>
                    <p className="text-sm text-gray-500">John Doe's cardiology consultation finished</p>
                  </div>
                  <span className="text-sm text-gray-500">4 hours ago</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">System backup completed</p>
                    <p className="text-sm text-gray-500">Daily backup successful</p>
                  </div>
                  <span className="text-sm text-gray-500">6 hours ago</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <Users className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mr-2" />
                  <span className="text-gray-600 group-hover:text-blue-600 font-medium">
                    Manage Users
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                >
                  <Calendar className="w-6 h-6 text-gray-400 group-hover:text-green-500 mr-2" />
                  <span className="text-gray-600 group-hover:text-green-600 font-medium">
                    View Appointments
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                >
                  <BarChart className="w-6 h-6 text-gray-400 group-hover:text-purple-500 mr-2" />
                  <span className="text-gray-600 group-hover:text-purple-600 font-medium">
                    View Analytics
                  </span>
                </button>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Server Uptime</span>
                    <span className="text-sm font-medium text-green-600">99.9%</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="text-sm font-medium text-blue-600">125ms</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Storage Used</span>
                    <span className="text-sm font-medium text-orange-600">67%</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          System overview and management controls
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: TrendingUp },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'appointments', label: 'Appointments', icon: Calendar },
            { key: 'analytics', label: 'Analytics', icon: BarChart },
            { key: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};