import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  duration: number; // in minutes
  type: 'in-person' | 'virtual';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  reason: string;
  notes?: string;
  virtualMeetingUrl?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  rating: number;
  experience: number;
  image?: string;
}

interface AppointmentContextType {
  appointments: Appointment[];
  doctors: Doctor[];
  bookAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => void;
  cancelAppointment: (id: string) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors] = useState<Doctor[]>([
    {
      id: '1',
      name: 'Dr. Sarah Smith',
      specialization: 'Cardiology',
      email: 'dr.smith@healthcare.com',
      phone: '(555) 987-6543',
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00' },
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
        { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
        { day: 'Friday', startTime: '09:00', endTime: '15:00' }
      ],
      rating: 4.8,
      experience: 12
    },
    {
      id: '2',
      name: 'Dr. Michael Johnson',
      specialization: 'Dermatology',
      email: 'dr.johnson@healthcare.com',
      phone: '(555) 456-7890',
      availability: [
        { day: 'Monday', startTime: '10:00', endTime: '18:00' },
        { day: 'Tuesday', startTime: '10:00', endTime: '18:00' },
        { day: 'Wednesday', startTime: '10:00', endTime: '18:00' },
        { day: 'Friday', startTime: '10:00', endTime: '16:00' }
      ],
      rating: 4.9,
      experience: 8
    },
    {
      id: '3',
      name: 'Dr. Emily Chen',
      specialization: 'Pediatrics',
      email: 'dr.chen@healthcare.com',
      phone: '(555) 321-9876',
      availability: [
        { day: 'Monday', startTime: '08:00', endTime: '16:00' },
        { day: 'Tuesday', startTime: '08:00', endTime: '16:00' },
        { day: 'Wednesday', startTime: '08:00', endTime: '16:00' },
        { day: 'Thursday', startTime: '08:00', endTime: '16:00' },
        { day: 'Friday', startTime: '08:00', endTime: '14:00' }
      ],
      rating: 4.7,
      experience: 15
    }
  ]);

  useEffect(() => {
    // Load initial appointments data
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        patientId: '1',
        patientName: 'John Doe',
        doctorId: '1',
        doctorName: 'Dr. Sarah Smith',
        specialization: 'Cardiology',
        date: '2024-01-15',
        time: '10:00',
        duration: 30,
        type: 'in-person',
        status: 'scheduled',
        reason: 'Regular checkup'
      },
      {
        id: '2',
        patientId: '1',
        patientName: 'John Doe',
        doctorId: '2',
        doctorName: 'Dr. Michael Johnson',
        specialization: 'Dermatology',
        date: '2024-01-20',
        time: '14:00',
        duration: 45,
        type: 'virtual',
        status: 'scheduled',
        reason: 'Skin consultation',
        virtualMeetingUrl: 'https://meet.healthcare.com/room/abc123'
      }
    ];
    setAppointments(mockAppointments);
  }, []);

  const bookAppointment = (appointmentData: Omit<Appointment, 'id' | 'status'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Date.now().toString(),
      status: 'scheduled'
    };
    setAppointments(prev => [...prev, newAppointment]);
  };

  const rescheduleAppointment = (id: string, newDate: string, newTime: string) => {
    setAppointments(prev =>
      prev.map(appointment =>
        appointment.id === id
          ? { ...appointment, date: newDate, time: newTime, status: 'rescheduled' }
          : appointment
      )
    );
  };

  const cancelAppointment = (id: string) => {
    setAppointments(prev =>
      prev.map(appointment =>
        appointment.id === id
          ? { ...appointment, status: 'cancelled' }
          : appointment
      )
    );
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments(prev =>
      prev.map(appointment =>
        appointment.id === id
          ? { ...appointment, status }
          : appointment
      )
    );
  };

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        doctors,
        bookAppointment,
        rescheduleAppointment,
        cancelAppointment,
        updateAppointmentStatus
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};