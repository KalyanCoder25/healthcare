import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  specialization?: string; // for doctors
  licenseNumber?: string; // for doctors
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor';
  phone?: string;
  dateOfBirth?: string;
  specialization?: string;
  licenseNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('healthcare_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    // Mock authentication - in real app, this would be an API call
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'patient@demo.com',
        role: 'patient',
        firstName: 'John',
        lastName: 'Doe',
        phone: '(555) 123-4567',
        dateOfBirth: '1985-06-15'
      },
      {
        id: '2',
        email: 'doctor@demo.com',
        role: 'doctor',
        firstName: 'Dr. Sarah',
        lastName: 'Smith',
        phone: '(555) 987-6543',
        specialization: 'Cardiology',
        licenseNumber: 'MD12345'
      },
      {
        id: '3',
        email: 'admin@demo.com',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        phone: '(555) 111-2222'
      }
    ];

    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'demo123') {
      setUser(foundUser);
      localStorage.setItem('healthcare_user', JSON.stringify(foundUser));
    } else {
      throw new Error('Invalid credentials');
    }
    
    setLoading(false);
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    
    // Mock registration - in real app, this would be an API call
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      role: userData.role,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      dateOfBirth: userData.dateOfBirth,
      specialization: userData.specialization,
      licenseNumber: userData.licenseNumber
    };

    setUser(newUser);
    localStorage.setItem('healthcare_user', JSON.stringify(newUser));
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('healthcare_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};