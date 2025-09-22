const express = require('express');
const { getConnection } = require('../database/connection');
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');
const { paginationValidation, idValidation } = require('../middleware/validation');
const { NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

// Get all doctors (public endpoint with optional auth for favorites)
router.get('/', optionalAuth, paginationValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const { 
      page = 1, 
      limit = 10, 
      specialization, 
      search,
      sortBy = 'rating',
      sortOrder = 'desc',
      minRating,
      maxFee,
      available = 'true'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['u.is_active = TRUE'];
    let queryParams = [];

    if (available === 'true') {
      whereConditions.push('d.is_available = TRUE');
    }

    if (specialization) {
      whereConditions.push('d.specialization LIKE ?');
      queryParams.push(`%${specialization}%`);
    }

    if (search) {
      whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR d.specialization LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (minRating) {
      whereConditions.push('d.rating >= ?');
      queryParams.push(parseFloat(minRating));
    }

    if (maxFee) {
      whereConditions.push('d.consultation_fee <= ?');
      queryParams.push(parseFloat(maxFee));
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // Validate sort field
    const allowedSortFields = ['rating', 'consultation_fee', 'years_of_experience', 'total_reviews'];
    const sortField = allowedSortFields.includes(sortBy) ? `d.${sortBy}` : 'd.rating';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get doctors
    const [doctors] = await db.execute(
      `SELECT 
        d.id, d.specialization, d.license_number, d.years_of_experience, 
        d.education, d.certifications, d.bio, d.consultation_fee, d.rating, 
        d.total_reviews, d.is_available,
        u.first_name, u.last_name, u.email, u.phone,
        COUNT(da.id) as availability_slots
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN doctor_availability da ON d.id = da.doctor_id AND da.is_active = TRUE
       ${whereClause}
       GROUP BY d.id
       ORDER BY ${sortField} ${order}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(DISTINCT d.id) as total
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Get availability for each doctor
    const doctorIds = doctors.map(d => d.id);
    let availability = [];
    
    if (doctorIds.length > 0) {
      const placeholders = doctorIds.map(() => '?').join(',');
      const [availabilityData] = await db.execute(
        `SELECT doctor_id, day_of_week, start_time, end_time
         FROM doctor_availability 
         WHERE doctor_id IN (${placeholders}) AND is_active = TRUE
         ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')`,
        doctorIds
      );
      availability = availabilityData;
    }

    res.json({
      doctors: doctors.map(doctor => ({
        id: doctor.id,
        name: `${doctor.first_name} ${doctor.last_name}`,
        firstName: doctor.first_name,
        lastName: doctor.last_name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
        licenseNumber: doctor.license_number,
        yearsOfExperience: doctor.years_of_experience,
        education: doctor.education,
        certifications: doctor.certifications,
        bio: doctor.bio,
        consultationFee: doctor.consultation_fee,
        rating: doctor.rating,
        totalReviews: doctor.total_reviews,
        isAvailable: doctor.is_available,
        availabilitySlots: doctor.availability_slots,
        availability: availability.filter(a => a.doctor_id === doctor.id).map(a => ({
          dayOfWeek: a.day_of_week,
          startTime: a.start_time,
          endTime: a.end_time
        }))
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

// Get single doctor details
router.get('/:id', optionalAuth, idValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const doctorId = req.params.id;

    const [doctors] = await db.execute(
      `SELECT 
        d.id, d.specialization, d.license_number, d.years_of_experience, 
        d.education, d.certifications, d.bio, d.consultation_fee, d.rating, 
        d.total_reviews, d.is_available, d.created_at,
        u.first_name, u.last_name, u.email, u.phone
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = ? AND u.is_active = TRUE`,
      [doctorId]
    );

    if (doctors.length === 0) {
      throw new NotFoundError('Doctor');
    }

    const doctor = doctors[0];

    // Get availability
    const [availability] = await db.execute(
      `SELECT day_of_week, start_time, end_time
       FROM doctor_availability 
       WHERE doctor_id = ? AND is_active = TRUE
       ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')`,
      [doctorId]
    );

    // Get recent reviews (if implemented)
    // For now, we'll return basic stats

    res.json({
      doctor: {
        id: doctor.id,
        name: `${doctor.first_name} ${doctor.last_name}`,
        firstName: doctor.first_name,
        lastName: doctor.last_name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
        licenseNumber: doctor.license_number,
        yearsOfExperience: doctor.years_of_experience,
        education: doctor.education,
        certifications: doctor.certifications,
        bio: doctor.bio,
        consultationFee: doctor.consultation_fee,
        rating: doctor.rating,
        totalReviews: doctor.total_reviews,
        isAvailable: doctor.is_available,
        createdAt: doctor.created_at,
        availability: availability.map(a => ({
          dayOfWeek: a.day_of_week,
          startTime: a.start_time,
          endTime: a.end_time
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get doctor's available time slots for a specific date
router.get('/:id/availability/:date', optionalAuth, idValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const doctorId = req.params.id;
    const date = req.params.date;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(400).json({ error: 'Cannot check availability for past dates' });
    }

    // Get day of week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[appointmentDate.getDay()];

    // Get doctor's availability for this day
    const [availability] = await db.execute(
      `SELECT start_time, end_time
       FROM doctor_availability da
       JOIN doctors d ON da.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE da.doctor_id = ? AND da.day_of_week = ? AND da.is_active = TRUE 
       AND d.is_available = TRUE AND u.is_active = TRUE`,
      [doctorId, dayOfWeek]
    );

    if (availability.length === 0) {
      return res.json({
        date,
        dayOfWeek,
        availableSlots: [],
        message: 'Doctor is not available on this day'
      });
    }

    const { start_time, end_time } = availability[0];

    // Get existing appointments for this date
    const [bookedSlots] = await db.execute(
      `SELECT appointment_time, duration_minutes
       FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? 
       AND status IN ('scheduled', 'confirmed', 'in-progress')`,
      [doctorId, date]
    );

    // Generate available time slots (30-minute intervals)
    const slots = [];
    const startTime = new Date(`2000-01-01 ${start_time}`);
    const endTime = new Date(`2000-01-01 ${end_time}`);
    
    let currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      
      // Check if this slot is already booked
      const isBooked = bookedSlots.some(slot => {
        const slotStart = new Date(`2000-01-01 ${slot.appointment_time}`);
        const slotEnd = new Date(slotStart.getTime() + slot.duration_minutes * 60000);
        const currentSlotEnd = new Date(currentTime.getTime() + 30 * 60000);
        
        return (currentTime >= slotStart && currentTime < slotEnd) ||
               (currentSlotEnd > slotStart && currentSlotEnd <= slotEnd);
      });

      if (!isBooked) {
        slots.push({
          time: timeString,
          available: true
        });
      }

      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    res.json({
      date,
      dayOfWeek,
      doctorAvailability: {
        startTime: start_time,
        endTime: end_time
      },
      availableSlots: slots,
      totalSlots: slots.length
    });

  } catch (error) {
    next(error);
  }
});

// Update doctor profile (doctors only)
router.put('/profile', authenticateToken, authorizeRoles('doctor'), async (req, res, next) => {
  try {
    const db = getConnection();
    const {
      bio,
      education,
      certifications,
      consultationFee,
      isAvailable
    } = req.body;

    // Get doctor record
    const [doctors] = await db.execute(
      'SELECT id FROM doctors WHERE user_id = ?',
      [req.user.id]
    );

    if (doctors.length === 0) {
      throw new NotFoundError('Doctor profile');
    }

    const doctorId = doctors[0].id;

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }

    if (education !== undefined) {
      updateFields.push('education = ?');
      updateValues.push(education);
    }

    if (certifications !== undefined) {
      updateFields.push('certifications = ?');
      updateValues.push(certifications);
    }

    if (consultationFee !== undefined) {
      updateFields.push('consultation_fee = ?');
      updateValues.push(parseFloat(consultationFee));
    }

    if (isAvailable !== undefined) {
      updateFields.push('is_available = ?');
      updateValues.push(Boolean(isAvailable));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(doctorId);

    await db.execute(
      `UPDATE doctors SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Doctor profile updated successfully' });

  } catch (error) {
    next(error);
  }
});

// Update doctor availability (doctors only)
router.put('/availability', authenticateToken, authorizeRoles('doctor'), async (req, res, next) => {
  const db = getConnection();
  let connection;

  try {
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ error: 'Availability must be an array' });
    }

    // Get doctor record
    const [doctors] = await db.execute(
      'SELECT id FROM doctors WHERE user_id = ?',
      [req.user.id]
    );

    if (doctors.length === 0) {
      throw new NotFoundError('Doctor profile');
    }

    const doctorId = doctors[0].id;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Delete existing availability
    await connection.execute(
      'DELETE FROM doctor_availability WHERE doctor_id = ?',
      [doctorId]
    );

    // Insert new availability
    for (const slot of availability) {
      const { dayOfWeek, startTime, endTime, isActive = true } = slot;

      if (!dayOfWeek || !startTime || !endTime) {
        throw new ValidationError('Each availability slot must have dayOfWeek, startTime, and endTime');
      }

      await connection.execute(
        'INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?)',
        [doctorId, dayOfWeek.toLowerCase(), startTime, endTime, isActive]
      );
    }

    await connection.commit();

    res.json({ message: 'Doctor availability updated successfully' });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;