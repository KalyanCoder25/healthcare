import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointments } from '../../contexts/AppointmentContext';
import { AppointmentCard } from '../appointments/AppointmentCard';
import { 
  Calendar, 
  Users, 
  Clock, 
  Video,
  FileText,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { appointments, updateAppointmentStatus } = useAppointments();
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'patients' | 'schedule'>('overview');
  
  const doctorAppointments = appointments.filter(apt => apt.doctorId === user?.id);
  const todayAppointments = doctorAppointments.filter(apt => 
    apt.date === new Date().toISOString().split('T')[0] && apt.status === 'scheduled'
  );
  const upcomingAppointments = doctorAppointments.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.date) > new Date()
  );

  const stats = [
    {
      icon: Calendar,
      label: "Today's Appointments",
      value: todayAppointments.length,
      color: 'bg-blue-500'
    },
    {
      icon: Users,
      label: 'Total Patients',
      value: new Set(doctorAppointments.map(apt => apt.patientId)).size,
      color: 'bg-green-500'
    },
    {
      icon: Video,
      label: 'Virtual Visits',
      value: doctorAppointments.filter(apt => apt.type === 'virtual').length,
      color: 'bg-purple-500'
    },
    {
      icon: Activity,
      label: 'Completed Today',
      value: doctorAppointments.filter(apt => 
        apt.date === new Date().toISOString().split('T')[0] && apt.status === 'completed'
      ).length,
      color: 'bg-teal-500'
    }
  ];

  const handleStatusUpdate = (appointmentId: string, status: 'completed' | 'cancelled') => {
    updateAppointmentStatus(appointmentId, status);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appointments':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Schedule</h3>
              {todayAppointments.length > 0 ? (
                <div className="grid gap-4">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="relative">
                      <AppointmentCard appointment={appointment} />
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Cancel appointment"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No appointments scheduled for today</p>
                </div>
              )}
            </div>

            {upcomingAppointments.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Appointments</h3>
                <div className="grid gap-4">
                  {upcomingAppointments.slice(0, 5).map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'patients':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Patient Management</h3>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Patient management features coming soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  View patient records, medical history, and treatment plans
                </p>
              </div>
            </div>
          </div>
        );
      case 'schedule':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Schedule Management</h3>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Schedule management features coming soon</p>
                <p className="text-sm text-gray-500 mt-2">
                  Set availability, manage time slots, and configure appointment types
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

            {/* Today's Schedule */}
            {todayAppointments.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Today's Schedule</h3>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {todayAppointments.slice(0, 3).map((appointment) => (
                    <div key={appointment.id} className="relative">
                      <AppointmentCard appointment={appointment} compact />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                          className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                          className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                          title="Cancel appointment"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <Calendar className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mr-2" />
                  <span className="text-gray-600 group-hover:text-blue-600 font-medium">
                    View Schedule
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('patients')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                >
                  <Users className="w-6 h-6 text-gray-400 group-hover:text-green-500 mr-2" />
                  <span className="text-gray-600 group-hover:text-green-600 font-medium">
                    Manage Patients
                  </span>
                </button>
                <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group">
                  <Video className="w-6 h-6 text-gray-400 group-hover:text-purple-500 mr-2" />
                  <span className="text-gray-600 group-hover:text-purple-600 font-medium">
                    Start Virtual Visit
                  </span>
                </button>
              </div>
            </div>

            {/* Patient Summary */}
            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">New Patients</span>
                    <span className="text-2xl font-bold text-green-600">3</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">This week</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Follow-ups</span>
                    <span className="text-2xl font-bold text-blue-600">8</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">This week</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Consultations</span>
                    <span className="text-2xl font-bold text-purple-600">12</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">This week</p>
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
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.specialization} • {doctorAppointments.length} total appointments
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: Activity },
            { key: 'appointments', label: 'Appointments', icon: Calendar },
            { key: 'patients', label: 'Patients', icon: Users },
            { key: 'schedule', label: 'Schedule', icon: Clock }
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