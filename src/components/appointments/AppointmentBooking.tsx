import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointments } from '../../contexts/AppointmentContext';
import { Calendar, Clock, User, Video, MapPin, Search } from 'lucide-react';

interface AppointmentBookingProps {
  onSuccess: () => void;
}

export const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { doctors, bookAppointment } = useAppointments();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    doctorId: '',
    doctorName: '',
    specialization: '',
    date: '',
    time: '',
    duration: 30,
    type: 'in-person' as 'in-person' | 'virtual',
    reason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDoctorSelect = (doctor: any) => {
    setFormData({
      ...formData,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialization: doctor.specialization
    });
    setStep(2);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break;
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await bookAppointment({
        patientId: user!.id,
        patientName: `${user!.firstName} ${user!.lastName}`,
        doctorId: formData.doctorId,
        doctorName: formData.doctorName,
        specialization: formData.specialization,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        type: formData.type,
        reason: formData.reason,
        virtualMeetingUrl: formData.type === 'virtual' 
          ? `https://meet.healthcare.com/room/${Math.random().toString(36).substr(2, 9)}`
          : undefined
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to book appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Progress Indicator */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-4 ${
              step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`flex-1 h-1 mx-4 ${
              step >= 3 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Choose Doctor</span>
            <span>Select Date & Time</span>
            <span>Appointment Details</span>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Doctor</h3>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Doctor List */}
                <div className="grid gap-4">
                  {filteredDoctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => handleDoctorSelect(doctor)}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                          <p className="text-sm text-gray-600">{doctor.specialization}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">
                              ⭐ {doctor.rating} • {doctor.experience} years
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Available</p>
                          <p className="text-xs text-green-600">Mon-Fri 9AM-5PM</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select Date & Time</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Booking with {formData.doctorName} • {formData.specialization}
                </p>

                {/* Date Selection */}
                <div className="mb-6">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      id="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Time Slots */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Times
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {generateTimeSlots().map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setFormData({ ...formData, time })}
                        className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                          formData.time === time
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appointment Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Type
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'in-person' })}
                      className={`flex-1 p-4 rounded-lg border transition-colors ${
                        formData.type === 'in-person'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500'
                      }`}
                    >
                      <MapPin className="w-6 h-6 mx-auto mb-2" />
                      <span className="block text-sm font-medium">In-Person</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'virtual' })}
                      className={`flex-1 p-4 rounded-lg border transition-colors ${
                        formData.type === 'virtual'
                          ? 'bg-purple-50 border-purple-500 text-purple-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-purple-500'
                      }`}
                    >
                      <Video className="w-6 h-6 mx-auto mb-2" />
                      <span className="block text-sm font-medium">Virtual</span>
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!formData.date || !formData.time}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Details</h3>

                {/* Appointment Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Appointment Summary</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Doctor:</strong> {formData.doctorName}</p>
                    <p><strong>Specialization:</strong> {formData.specialization}</p>
                    <p><strong>Date:</strong> {new Date(formData.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {formData.time}</p>
                    <p><strong>Type:</strong> {formData.type === 'virtual' ? 'Virtual Visit' : 'In-Person Visit'}</p>
                  </div>
                </div>

                {/* Reason for Visit */}
                <div className="mb-6">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Visit
                  </label>
                  <textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please describe the reason for your visit..."
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.reason.trim()}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Booking...' : 'Book Appointment'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};