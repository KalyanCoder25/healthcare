const express = require('express');
const { getConnection } = require('../database/connection');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { paginationValidation } = require('../middleware/validation');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const db = getConnection();

    // Get user statistics
    const [userStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'patient' THEN 1 ELSE 0 END) as total_patients,
        SUM(CASE WHEN role = 'doctor' THEN 1 ELSE 0 END) as total_doctors,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_users_today,
        SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_users_week
      FROM users
    `);

    // Get appointment statistics
    const [appointmentStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_appointments,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_appointments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_appointments,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_appointments,
        SUM(CASE WHEN DATE(appointment_date) = CURDATE() THEN 1 ELSE 0 END) as appointments_today,
        SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as appointments_week,
        SUM(CASE WHEN type = 'virtual' THEN 1 ELSE 0 END) as virtual_appointments,
        AVG(consultation_fee) as avg_consultation_fee
      FROM appointments
    `);

    // Get revenue statistics
    const [revenueStats] = await db.execute(`
      SELECT 
        SUM(CASE WHEN payment_status = 'paid' THEN consultation_fee ELSE 0 END) as total_revenue,
        SUM(CASE WHEN payment_status = 'paid' AND DATE(created_at) = CURDATE() THEN consultation_fee ELSE 0 END) as revenue_today,
        SUM(CASE WHEN payment_status = 'paid' AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN consultation_fee ELSE 0 END) as revenue_week,
        SUM(CASE WHEN payment_status = 'paid' AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN consultation_fee ELSE 0 END) as revenue_month
      FROM appointments
    `);

    // Get medical records statistics
    const [recordStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN record_type = 'consultation' THEN 1 ELSE 0 END) as consultation_records,
        SUM(CASE WHEN record_type = 'prescription' THEN 1 ELSE 0 END) as prescription_records,
        SUM(CASE WHEN record_type = 'lab_result' THEN 1 ELSE 0 END) as lab_result_records,
        SUM(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as records_week
      FROM medical_records
    `);

    // Get recent activity
    const [recentActivity] = await db.execute(`
      SELECT 
        'user_registered' as activity_type,
        CONCAT(first_name, ' ', last_name) as description,
        role as metadata,
        created_at as activity_time
      FROM users 
      WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      
      UNION ALL
      
      SELECT 
        'appointment_created' as activity_type,
        CONCAT('Appointment with ', doc.first_name, ' ', doc.last_name) as description,
        a.type as metadata,
        a.created_at as activity_time
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users doc ON d.user_id = doc.id
      WHERE DATE(a.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      
      ORDER BY activity_time DESC
      LIMIT 20
    `);

    // Get top doctors by appointments
    const [topDoctors] = await db.execute(`
      SELECT 
        CONCAT(u.first_name, ' ', u.last_name) as doctor_name,
        d.specialization,
        COUNT(a.id) as appointment_count,
        AVG(d.rating) as rating
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN appointments a ON d.id = a.doctor_id AND a.status = 'completed'
      WHERE u.is_active = TRUE
      GROUP BY d.id
      ORDER BY appointment_count DESC
      LIMIT 10
    `);

    res.json({
      statistics: {
        users: userStats[0],
        appointments: appointmentStats[0],
        revenue: revenueStats[0],
        records: recordStats[0]
      },
      recentActivity: recentActivity.map(activity => ({
        type: activity.activity_type,
        description: activity.description,
        metadata: activity.metadata,
        timestamp: activity.activity_time
      })),
      topDoctors: topDoctors.map(doctor => ({
        name: doctor.doctor_name,
        specialization: doctor.specialization,
        appointmentCount: doctor.appointment_count,
        rating: doctor.rating
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Get system health metrics
router.get('/health', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const db = getConnection();

    // Database health
    const [dbHealth] = await db.execute('SELECT 1 as status');
    
    // Get database size
    const [dbSize] = await db.execute(`
      SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [process.env.DB_NAME || 'healthcare_db']);

    // Get table row counts
    const [tableCounts] = await db.execute(`
      SELECT 
        table_name,
        table_rows
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY table_rows DESC
    `, [process.env.DB_NAME || 'healthcare_db']);

    // System metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    res.json({
      database: {
        status: dbHealth.length > 0 ? 'healthy' : 'unhealthy',
        sizeInMB: dbSize[0]?.size_mb || 0,
        tables: tableCounts.map(table => ({
          name: table.table_name,
          rows: table.table_rows
        }))
      },
      system: systemMetrics
    });

  } catch (error) {
    next(error);
  }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, authorizeRoles('admin'), paginationValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const { 
      page = 1, 
      limit = 50, 
      action, 
      userId,
      tableName,
      startDate,
      endDate
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    if (action) {
      whereConditions.push('al.action = ?');
      queryParams.push(action);
    }

    if (userId) {
      whereConditions.push('al.user_id = ?');
      queryParams.push(userId);
    }

    if (tableName) {
      whereConditions.push('al.table_name = ?');
      queryParams.push(tableName);
    }

    if (startDate) {
      whereConditions.push('DATE(al.created_at) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(al.created_at) <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [logs] = await db.execute(`
      SELECT 
        al.id, al.action, al.table_name, al.record_id, al.old_values, al.new_values,
        al.ip_address, al.user_agent, al.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);

    // Get total count
    const [countResult] = await db.execute(`
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `, queryParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        tableName: log.table_name,
        recordId: log.record_id,
        oldValues: log.old_values ? JSON.parse(log.old_values) : null,
        newValues: log.new_values ? JSON.parse(log.new_values) : null,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        userName: log.user_name,
        userEmail: log.user_email,
        userRole: log.user_role,
        createdAt: log.created_at
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get system configuration
router.get('/config', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const config = {
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      apiVersion: process.env.API_VERSION || 'v1',
      features: {
        rateLimiting: {
          enabled: true,
          windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000,
          maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100
        },
        cors: {
          enabled: true,
          allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173']
        },
        jwt: {
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        }
      },
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        name: process.env.DB_NAME || 'healthcare_db'
      }
    };

    res.json({ config });

  } catch (error) {
    next(error);
  }
});

module.exports = router;