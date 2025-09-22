import React, { useState } from 'react';
import { Appointment } from '../../contexts/AppointmentContext';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  MapPin,
  MoreHorizontal,
  Edit,
  X,
  Phone
} from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  compact?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  compact = false 
}) => {
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${
      compact ? 'p-4' : 'p-6'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`${
              appointment.type === 'virtual' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
            } p-2 rounded-lg`}>
              {appointment.type === 'virtual' ? 
                <Video className="w-5 h-5" /> : 
                <MapPin className="w-5 h-5" />
              }
            </div>
            <div>
              <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>
                {appointment.doctorName}
              </h3>
              <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
                {appointment.specialization}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className={compact ? 'text-xs' : 'text-sm'}>
                {new Date(appointment.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className={compact ? 'text-xs' : 'text-sm'}>
                {appointment.time} ({appointment.duration} min)
              </span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className={compact ? 'text-xs' : 'text-sm'}>
                {appointment.patientName}
              </span>
            </div>
          </div>

          {!compact && (
            <div className="mt-4">
              <p className="text-gray-700 font-medium mb-1">Reason:</p>
              <p className="text-gray-600 text-sm">{appointment.reason}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              getStatusColor(appointment.status)
            }`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </span>

            {appointment.type === 'virtual' && appointment.virtualMeetingUrl && (
              <button className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                <Video className="w-4 h-4" />
                <span className="text-sm">Join Call</span>
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Edit className="w-4 h-4 mr-2" />
                Reschedule
              </button>
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Phone className="w-4 h-4 mr-2" />
                Contact Patient
              </button>
              <button className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};