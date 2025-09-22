# Healthcare System Integration Guide

This guide provides step-by-step instructions to integrate the backend API with your existing frontend and set up the complete healthcare appointment system.

## 🔗 Frontend Integration

### Step 1: Update Frontend Environment

Create or update your frontend `.env` file:

```bash
# Frontend .env file
VITE_API_URL=http://localhost:5000/api/v1
VITE_API_TIMEOUT=10000
VITE_APP_NAME=Healthcare Connect
```

For production:
```bash
VITE_API_URL=https://api.yourdomain.com/api/v1
VITE_API_TIMEOUT=10000
VITE_APP_NAME=Healthcare Connect
```

### Step 2: Create API Service Layer

Create `src/services/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.tokens) {
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
    }
    
    return response;
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.tokens) {
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
    }

    return response;
  }

  // User methods
  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Doctor methods
  async getDoctors(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/doctors?${queryString}`);
  }

  async getDoctor(id) {
    return this.request(`/doctors/${id}`);
  }

  async getDoctorAvailability(doctorId, date) {
    return this.request(`/doctors/${doctorId}/availability/${date}`);
  }

  // Appointment methods
  async getAppointments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/appointments?${queryString}`);
  }

  async getAppointment(id) {
    return this.request(`/appointments/${id}`);
  }

  async createAppointment(appointmentData) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointment(id, updateData) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async cancelAppointment(id) {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // Medical Records methods
  async getMedicalRecords(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/medical-records?${queryString}`);
  }

  async getMedicalRecord(id) {
    return this.request(`/medical-records/${id}`);
  }

  async createMedicalRecord(recordData) {
    return this.request('/medical-records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  async getVitalSigns(patientId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/medical-records/vital-signs/${patientId}?${queryString}`);
  }
}

export default new ApiService();
```

### Step 3: Update Authentication Context

Update your `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../services/api';

export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  specialization?: string;
  licenseNumber?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
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
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await ApiService.getCurrentUser();
          setUser(response.user);
        } catch (error) {
          console.error('Auth initialization failed:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await ApiService.login(email, password);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      const response = await ApiService.register(userData);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Step 4: Update Appointment Context

Update your `src/contexts/AppointmentContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../services/api';
import { useAuth } from './AuthContext';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  type: 'in-person' | 'virtual';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reasonForVisit: string;
  notes?: string;
  virtualMeetingUrl?: string;
  consultationFee: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

export interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  specialization: string;
  email: string;
  phone: string;
  yearsOfExperience: number;
  consultationFee: number;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  availability: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
}

interface AppointmentContextType {
  appointments: Appointment[];
  doctors: Doctor[];
  loading: boolean;
  fetchAppointments: () => Promise<void>;
  fetchDoctors: (params?: any) => Promise<void>;
  bookAppointment: (appointmentData: any) => Promise<void>;
  updateAppointment: (id: string, updateData: any) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
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
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await ApiService.getAppointments();
      setAppointments(response.appointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (params = {}) => {
    setLoading(true);
    try {
      const response = await ApiService.getDoctors(params);
      setDoctors(response.doctors);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async (appointmentData: any) => {
    try {
      const response = await ApiService.createAppointment(appointmentData);
      await fetchAppointments(); // Refresh appointments
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updateAppointment = async (id: string, updateData: any) => {
    try {
      await ApiService.updateAppointment(id, updateData);
      await fetchAppointments(); // Refresh appointments
    } catch (error) {
      throw error;
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      await ApiService.cancelAppointment(id);
      await fetchAppointments(); // Refresh appointments
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchDoctors();
    }
  }, [user]);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        doctors,
        loading,
        fetchAppointments,
        fetchDoctors,
        bookAppointment,
        updateAppointment,
        cancelAppointment
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};
```

## 🧪 Testing Integration

### Step 1: API Health Check

Create a simple test to verify backend connectivity:

```javascript
// src/utils/healthCheck.js
import ApiService from '../services/api';

export const performHealthCheck = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/health`);
    const data = await response.json();
    console.log('Backend health:', data);
    return data.status === 'OK';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Test authentication
export const testAuth = async () => {
  try {
    // Test with demo credentials
    const response = await ApiService.login('patient@demo.com', 'demo123');
    console.log('Auth test successful:', response);
    
    // Test getting current user
    const userResponse = await ApiService.getCurrentUser();
    console.log('Current user:', userResponse);
    
    return true;
  } catch (error) {
    console.error('Auth test failed:', error);
    return false;
  }
};
```

### Step 2: Postman Collection

Import this Postman collection for comprehensive testing:

```json
{
  "info": {
    "name": "Healthcare API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api/v1"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login Patient",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"patient@demo.com\",\n  \"password\": \"demo123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "login"]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.collectionVariables.set('accessToken', response.tokens.accessToken);",
                  "}"
                ]
              }
            }
          ]
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/auth/me",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "me"]
            }
          }
        }
      ]
    },
    {
      "name": "Doctors",
      "item": [
        {
          "name": "Get All Doctors",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/doctors",
              "host": ["{{baseUrl}}"],
              "path": ["doctors"]
            }
          }
        },
        {
          "name": "Get Doctor Availability",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/doctors/1/availability/2024-01-15",
              "host": ["{{baseUrl}}"],
              "path": ["doctors", "1", "availability", "2024-01-15"]
            }
          }
        }
      ]
    },
    {
      "name": "Appointments",
      "item": [
        {
          "name": "Get Appointments",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/appointments",
              "host": ["{{baseUrl}}"],
              "path": ["appointments"]
            }
          }
        },
        {
          "name": "Create Appointment",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"doctorId\": 1,\n  \"appointmentDate\": \"2024-01-20\",\n  \"appointmentTime\": \"10:00\",\n  \"type\": \"in-person\",\n  \"reasonForVisit\": \"Regular checkup\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/appointments",
              "host": ["{{baseUrl}}"],
              "path": ["appointments"]
            }
          }
        }
      ]
    }
  ]
}
```

### Step 3: Frontend Testing

Add these test utilities to your frontend:

```javascript
// src/utils/testHelpers.js
import ApiService from '../services/api';

export const runIntegrationTests = async () => {
  const results = [];

  // Test 1: Health Check
  try {
    const healthResponse = await fetch(`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/health`);
    const health = await healthResponse.json();
    results.push({
      test: 'Health Check',
      status: health.status === 'OK' ? 'PASS' : 'FAIL',
      data: health
    });
  } catch (error) {
    results.push({
      test: 'Health Check',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 2: Authentication
  try {
    const authResponse = await ApiService.login('patient@demo.com', 'demo123');
    results.push({
      test: 'Authentication',
      status: authResponse.user ? 'PASS' : 'FAIL',
      data: authResponse.user
    });
  } catch (error) {
    results.push({
      test: 'Authentication',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 3: Get Doctors
  try {
    const doctorsResponse = await ApiService.getDoctors();
    results.push({
      test: 'Get Doctors',
      status: doctorsResponse.doctors?.length > 0 ? 'PASS' : 'FAIL',
      data: `Found ${doctorsResponse.doctors?.length || 0} doctors`
    });
  } catch (error) {
    results.push({
      test: 'Get Doctors',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 4: Get Appointments
  try {
    const appointmentsResponse = await ApiService.getAppointments();
    results.push({
      test: 'Get Appointments',
      status: 'PASS',
      data: `Found ${appointmentsResponse.appointments?.length || 0} appointments`
    });
  } catch (error) {
    results.push({
      test: 'Get Appointments',
      status: 'FAIL',
      error: error.message
    });
  }

  return results;
};
```

## 🚀 Deployment Setup

### Step 1: Backend Deployment

1. **Prepare Environment**
```bash
# On your server
mkdir -p /opt/healthcare
cd /opt/healthcare

# Copy files
scp -r backend/ user@server:/opt/healthcare/
scp docker-compose.yml user@server:/opt/healthcare/
```

2. **Configure Environment**
```bash
# Create production environment file
cp .env.example .env

# Edit with production values
nano .env
```

3. **Deploy with Docker**
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f backend
```

### Step 2: Frontend Deployment

1. **Build for Production**
```bash
# Update environment for production
echo "VITE_API_URL=https://api.yourdomain.com/api/v1" > .env.production

# Build
npm run build
```

2. **Deploy to Web Server**
```bash
# Copy build files
scp -r dist/ user@server:/var/www/yourdomain.com/

# Configure Nginx
sudo nano /etc/nginx/sites-available/yourdomain.com
```

3. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/yourdomain.com;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Troubleshooting

### Common Integration Issues

**CORS Errors**
```javascript
// Check CORS configuration in backend
// Ensure ALLOWED_ORIGINS includes your frontend URL
// Verify preflight requests are handled correctly
```

**Authentication Issues**
```javascript
// Check token storage and retrieval
// Verify JWT secret configuration
// Test token refresh mechanism
```

**API Connection Issues**
```javascript
// Verify API URL configuration
// Check network connectivity
// Test with curl or Postman first
```

### Debug Tools

Add this debug component to your frontend:

```jsx
// src/components/DebugPanel.jsx
import React, { useState } from 'react';
import { runIntegrationTests } from '../utils/testHelpers';

export const DebugPanel = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = await runIntegrationTests();
    setTestResults(results);
    setLoading(false);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-md">
      <h3 className="font-bold mb-2">API Integration Tests</h3>
      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-2"
      >
        {loading ? 'Running...' : 'Run Tests'}
      </button>
      
      {testResults.length > 0 && (
        <div className="space-y-2">
          {testResults.map((result, index) => (
            <div key={index} className="text-sm">
              <span className={`font-medium ${result.status === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                {result.status}
              </span>
              <span className="ml-2">{result.test}</span>
              {result.error && (
                <div className="text-red-500 text-xs mt-1">{result.error}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

This integration guide provides everything needed to connect your frontend with the backend API and deploy a complete healthcare appointment system. Follow the steps in order and use the testing tools to verify each integration point.