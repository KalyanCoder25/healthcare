import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointments } from '../../contexts/AppointmentContext';
import { AppointmentBooking } from '../appointments/AppointmentBooking';
import { AppointmentCard } from '../appointments/AppointmentCard';
import { PatientRecords } from '../records/PatientRecords';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Video,
  Plus,
  Activity,
  Bell
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { appointments } = useAppointments();
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'records' | 'book'>('overview');
  
  const userAppointments = appointments.filter(apt => apt.patientId === user?.id);
  const upcomingAppointments = userAppointments.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.date) >= new Date()
  );
  const pastAppointments = userAppointments.filter(apt => 
    apt.status === 'completed' || new Date(apt.date) < new Date()
  );

  const stats = [
    {
      icon: Calendar,
      label: 'Upcoming Appointments',
      value: upcomingAppointments.length,
      color: 'bg-blue-500'
    },
    {
      icon: FileText,
      label: 'Medical Records',
      value: '12',
      color: 'bg-green-500'
    },
    {
      icon: Video,
      label: 'Virtual Visits',
      value: userAppointments.filter(apt => apt.type === 'virtual').length,
      color: 'bg-purple-500'
    },
    {
      icon: Activity,
      label: 'Health Score',
      value: '95%',
      color: 'bg-teal-500'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appointments':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Appointments</h3>
              {upcomingAppointments.length > 0 ? (
                <div className="grid gap-4">
                  {upcomingAppointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming appointments</p>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book Appointment
                  </button>
                </div>
              )}
            </div>

            {pastAppointments.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Past Appointments</h3>
                <div className="grid gap-4">
                  {pastAppointments.slice(0, 3).map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'records':
        return <PatientRecords />;
      case 'book':
        return <AppointmentBooking onSuccess={() => setActiveTab('appointments')} />;
      default:
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('book')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mr-2" />
                  <span className="text-gray-600 group-hover:text-blue-600 font-medium">
                    Book Appointment
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                >
                  <FileText className="w-6 h-6 text-gray-400 group-hover:text-green-500 mr-2" />
                  <span className="text-gray-600 group-hover:text-green-600 font-medium">
                    View Records
                  </span>
                </button>
                <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group">
                  <Video className="w-6 h-6 text-gray-400 group-hover:text-purple-500 mr-2" />
                  <span className="text-gray-600 group-hover:text-purple-600 font-medium">
                    Virtual Visit
                  </span>
                </button>
              </div>
            </div>

            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Next Appointments</h3>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {upcomingAppointments.slice(0, 2).map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} compact />
                  ))}
                </div>
              </div>
            )}

            {/* Health Reminders */}
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <Bell className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Health Reminders</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Annual Physical Exam</p>
                    <p className="text-sm text-gray-600">Due next month</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Schedule
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Blood Pressure Medication</p>
                    <p className="text-sm text-gray-600">Take daily at 8:00 AM</p>
                  </div>
                  <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                    Mark Taken
                  </button>
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
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your health appointments and records
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: User },
            { key: 'appointments', label: 'Appointments', icon: Calendar },
            { key: 'records', label: 'Records', icon: FileText },
            { key: 'book', label: 'Book Appointment', icon: Plus }
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