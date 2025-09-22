# Healthcare Appointment System - Backend

A comprehensive healthcare appointment management system with role-based authentication, appointment scheduling, medical records management, and administrative controls.

## 🏗️ Architecture

- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0
- **Authentication**: JWT with refresh tokens
- **Security**: bcrypt, helmet, CORS, rate limiting
- **Deployment**: Docker + Docker Compose
- **CI/CD**: Jenkins pipelines

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0
- Docker & Docker Compose (for containerized deployment)

### Local Development

1. **Clone and Setup**
```bash
git clone <your-repo-url>
cd healthcare/backend
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Start MySQL (if not using Docker)
# Create database and user manually, or use Docker Compose

# Run migrations and seed data
npm run migrate
npm run seed
```

4. **Start Development Server**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Docker Deployment

1. **Production Deployment**
```bash
# Copy environment file
cp .env.example .env
# Configure production values in .env

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

2. **Development with Docker**
```bash
# Use development compose file
docker-compose -f docker-compose.dev.yml up -d
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── database/
│   │   ├── connection.js      # Database connection pool
│   │   ├── migrate.js         # Migration runner
│   │   ├── schema.sql         # Database schema
│   │   └── seed.sql           # Seed data
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── validation.js      # Input validation
│   │   └── errorHandler.js    # Error handling
│   ├── routes/
│   │   ├── auth.js            # Authentication endpoints
│   │   ├── users.js           # User management
│   │   ├── doctors.js         # Doctor profiles & availability
│   │   ├── appointments.js    # Appointment management
│   │   ├── medicalRecords.js  # Medical records & prescriptions
│   │   └── admin.js           # Admin dashboard & controls
│   └── server.js              # Main application entry
├── docker-compose.yml         # Production Docker setup
├── Dockerfile                 # Backend container
├── Jenkinsfile               # Backend CI/CD pipeline
└── nginx/
    └── nginx.conf            # Reverse proxy configuration
```

## 🔐 Authentication & Authorization

### User Roles
- **Patient**: Book appointments, view records, manage profile
- **Doctor**: Manage schedule, view patients, create records
- **Admin**: System oversight, user management, analytics

### JWT Implementation
- Access tokens (24h expiry)
- Refresh tokens (7d expiry, stored hashed)
- Role-based route protection
- Automatic token cleanup on logout

### Demo Accounts
```
Admin: admin@healthcare.com / demo123
Doctor: doctor@demo.com / demo123
Patient: patient@demo.com / demo123
```

## 🛡️ Security Features

- **Password Security**: bcrypt with configurable rounds
- **Rate Limiting**: Configurable per endpoint
- **CORS**: Whitelist-based origin control
- **Input Validation**: express-validator with sanitization
- **SQL Injection**: Parameterized queries only
- **Security Headers**: Helmet.js implementation
- **Error Handling**: No sensitive data exposure

## 📊 API Endpoints

### Authentication
```
POST /api/v1/auth/register     # User registration
POST /api/v1/auth/login        # User login
POST /api/v1/auth/refresh      # Token refresh
POST /api/v1/auth/logout       # User logout
GET  /api/v1/auth/me           # Current user profile
```

### Users
```
GET    /api/v1/users/profile   # Get user profile
PUT    /api/v1/users/profile   # Update profile
PUT    /api/v1/users/password  # Change password
GET    /api/v1/users           # List users (admin)
GET    /api/v1/users/:id       # Get user (admin)
PUT    /api/v1/users/:id/status # Update user status (admin)
DELETE /api/v1/users/:id       # Delete user (admin)
```

### Doctors
```
GET /api/v1/doctors                    # List doctors (public)
GET /api/v1/doctors/:id                # Get doctor details
GET /api/v1/doctors/:id/availability/:date # Check availability
PUT /api/v1/doctors/profile            # Update doctor profile
PUT /api/v1/doctors/availability       # Update availability
```

### Appointments
```
GET    /api/v1/appointments     # List appointments (filtered by role)
GET    /api/v1/appointments/:id # Get appointment details
POST   /api/v1/appointments     # Create appointment (patients)
PUT    /api/v1/appointments/:id # Update appointment
DELETE /api/v1/appointments/:id # Cancel appointment
```

### Medical Records
```
GET    /api/v1/medical-records           # List records (role-filtered)
GET    /api/v1/medical-records/:id       # Get record details
POST   /api/v1/medical-records           # Create record (doctors)
PUT    /api/v1/medical-records/:id       # Update record (doctors)
DELETE /api/v1/medical-records/:id       # Delete record (doctors/admin)
GET    /api/v1/medical-records/vital-signs/:patientId # Get vital signs
```

### Admin
```
GET /api/v1/admin/dashboard    # Dashboard statistics
GET /api/v1/admin/health       # System health metrics
GET /api/v1/admin/audit-logs   # Audit trail
GET /api/v1/admin/config       # System configuration
```

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts with role-based access
- **doctors**: Extended doctor profiles and credentials
- **appointments**: Appointment scheduling and management
- **medical_records**: Patient medical history
- **prescriptions**: Medication prescriptions
- **vital_signs**: Patient vital sign measurements
- **doctor_availability**: Doctor schedule management

### Security Tables
- **refresh_tokens**: JWT refresh token management
- **audit_logs**: System activity tracking

## 🔧 Configuration

### Environment Variables
```bash
# Server
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=healthcare_db
DB_USER=healthcare_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

## 🚀 CI/CD Pipeline

### Jenkins Pipeline Features
- **Build**: Dependency installation and linting
- **Test**: Unit tests with coverage reporting
- **Security**: Vulnerability scanning
- **Docker**: Multi-stage image building
- **Deploy**: Automated deployment to staging/production
- **Health Check**: Post-deployment verification

### Pipeline Stages
1. Checkout & dependency installation
2. Code linting and type checking
3. Unit test execution with coverage
4. Security vulnerability scanning
5. Docker image build and push
6. Environment-specific deployment
7. Health check verification
8. Slack notifications

## 🔄 Frontend Integration

### Environment Configuration
Update your frontend `.env` file:
```bash
VITE_API_URL=http://localhost:5000/api/v1
VITE_API_TIMEOUT=10000
```

### Sample API Calls
```javascript
// Authentication
const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// Authenticated requests
const getAppointments = async (token) => {
  const response = await fetch(`${API_URL}/appointments`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Create appointment
const createAppointment = async (token, appointmentData) => {
  const response = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appointmentData)
  });
  return response.json();
};
```

## 🧪 Testing

### API Testing with curl
```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@demo.com","password":"demo123"}'

# Get appointments (with token)
curl http://localhost:5000/api/v1/appointments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman Collection
Import the provided Postman collection for comprehensive API testing:
1. Authentication flows
2. CRUD operations for all resources
3. Role-based access testing
4. Error scenario validation

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check MySQL service
docker-compose logs mysql

# Verify credentials
mysql -h localhost -u healthcare_user -p healthcare_db
```

**JWT Token Issues**
```bash
# Check token expiry
# Verify JWT_SECRET in environment
# Clear refresh tokens: DELETE FROM refresh_tokens WHERE user_id = ?
```

**Permission Denied**
```bash
# Check user role in database
# Verify route authorization middleware
# Check token payload
```

### Rollback Procedures

**Application Rollback**
```bash
# Rollback to previous Docker image
docker-compose down
docker-compose up -d --scale backend=0
docker tag your-registry/healthcare-backend:previous-tag your-registry/healthcare-backend:latest
docker-compose up -d
```

**Database Rollback**
```bash
# Restore from backup
docker exec -i mysql_container mysql -u root -p healthcare_db < backup.sql

# Or restore specific tables
mysqldump --single-transaction healthcare_db table_name > table_backup.sql
```

### Monitoring & Logs

**Application Logs**
```bash
# Docker logs
docker-compose logs -f backend

# Application logs
tail -f logs/app.log
```

**Database Monitoring**
```bash
# Connection status
SHOW PROCESSLIST;

# Performance metrics
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Queries';
```

## 📈 Performance Optimization

- Database indexing on frequently queried columns
- Connection pooling with configurable limits
- Response compression with gzip
- Rate limiting to prevent abuse
- Efficient pagination for large datasets
- Prepared statements for SQL injection prevention

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

---

**Note**: This is a production-ready implementation with security best practices. Always review and customize security settings for your specific deployment environment.