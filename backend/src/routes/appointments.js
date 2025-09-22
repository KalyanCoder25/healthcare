const express = require('express');
const { getConnection } = require('../database/connection');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { 
  createAppointmentValidation, 
  updateAppointmentValidation, 
  idValidation,
  paginationValidation 
} = require('../middleware/validation');
const { NotFoundError, ConflictError, ForbiddenError } = require('../middleware/errorHandler');

const router = express.Router();

// Get appointments (with filtering and pagination)
router.get('/', authenticateToken, paginationValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      doctorId, 
      patientId,
      startDate,
      endDate,
      sortBy = 'appointment_date',
      sortOrder = 'asc'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    // Role-based filtering
    if (req.user.role === 'patient') {
      whereConditions.push('a.patient_id = ?');
      queryParams.push(req.user.id);
    } else if (req.user.role === 'doctor') {
      // Get doctor record for current user
      const [doctors] = await db.execute(
        'SELECT id FROM doctors WHERE user_id = ?',
        [req.user.id]
      );
      if (doctors.length > 0) {
        whereConditions.push('a.doctor_id = ?');
        queryParams.push(doctors[0].id);
      }
    }

    // Additional filters
    if (status) {
      whereConditions.push('a.status = ?');
      queryParams.push(status);
    }

    if (type) {
      whereConditions.push('a.type = ?');
      queryParams.push(type);
    }

    if (doctorId && req.user.role === 'admin') {
      whereConditions.push('a.doctor_id = ?');
      queryParams.push(doctorId);
    }

    if (patientId && (req.user.role === 'admin' || req.user.role === 'doctor')) {
      whereConditions.push('a.patient_id = ?');
      queryParams.push(patientId);
    }

    if (startDate) {
      whereConditions.push('a.appointment_date >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('a.appointment_date <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Validate sort field
    const allowedSortFields = ['appointment_date', 'appointment_time', 'status', 'created_at'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'appointment_date';
    const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Get appointments
    const [appointments] = await db.execute(
      `SELECT 
        a.id, a.appointment_date, a.appointment_time, a.duration_minutes, a.type, 
        a.status, a.reason_for_visit, a.notes, a.virtual_meeting_url, a.consultation_fee,
        a.payment_status, a.created_at, a.updated_at,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.email as patient_email, p.phone as patient_phone,
        CONCAT(doc.first_name, ' ', doc.last_name) as doctor_name,
        doc.email as doctor_email, d.specialization
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users doc ON d.user_id = doc.id
       ${whereClause}
       ORDER BY a.${sortField} ${order}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users doc ON d.user_id = doc.id
       ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      appointments: appointments.map(apt => ({
        id: apt.id,
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time,
        durationMinutes: apt.duration_minutes,
        type: apt.type,
        status: apt.status,
        reasonForVisit: apt.reason_for_visit,
        notes: apt.notes,
        virtualMeetingUrl: apt.virtual_meeting_url,
        consultationFee: apt.consultation_fee,
        paymentStatus: apt.payment_status,
        patientName: apt.patient_name,
        patientEmail: apt.patient_email,
        patientPhone: apt.patient_phone,
        doctorName: apt.doctor_name,
        doctorEmail: apt.doctor_email,
        specialization: apt.specialization,
        createdAt: apt.created_at,
        updatedAt: apt.updated_at
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

// Get single appointment
router.get('/:id', authenticateToken, idValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const appointmentId = req.params.id;

    const [appointments] = await db.execute(
      `SELECT 
        a.id, a.patient_id, a.doctor_id, a.appointment_date, a.appointment_time, 
        a.duration_minutes, a.type, a.status, a.reason_for_visit, a.notes, 
        a.virtual_meeting_url, a.consultation_fee, a.payment_status, a.created_at, a.updated_at,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.email as patient_email, p.phone as patient_phone,
        CONCAT(doc.first_name, ' ', doc.last_name) as doctor_name,
        doc.email as doctor_email, d.specialization
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users doc ON d.user_id = doc.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    if (appointments.length === 0) {
      throw new NotFoundError('Appointment');
    }

    const appointment = appointments[0];

    // Check access permissions
    if (req.user.role === 'patient' && appointment.patient_id !== req.user.id) {
      throw new ForbiddenError('Access denied to this appointment');
    }

    if (req.user.role === 'doctor') {
      const [doctors] = await db.execute(
        'SELECT id FROM doctors WHERE user_id = ?',
        [req.user.id]
      );
      if (doctors.length === 0 || appointment.doctor_id !== doctors[0].id) {
        throw new ForbiddenError('Access denied to this appointment');
      }
    }

    res.json({
      appointment: {
        id: appointment.id,
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        durationMinutes: appointment.duration_minutes,
        type: appointment.type,
        status: appointment.status,
        reasonForVisit: appointment.reason_for_visit,
        notes: appointment.notes,
        virtualMeetingUrl: appointment.virtual_meeting_url,
        consultationFee: appointment.consultation_fee,
        paymentStatus: appointment.payment_status,
        patientName: appointment.patient_name,
        patientEmail: appointment.patient_email,
        patientPhone: appointment.patient_phone,
        doctorName: appointment.doctor_name,
        doctorEmail: appointment.doctor_email,
        specialization: appointment.specialization,
        createdAt: appointment.created_at,
        updatedAt: appointment.updated_at
      }
    });

  } catch (error) {
    next(error);
  }
});

// Create new appointment
router.post('/', authenticateToken, authorizeRoles('patient'), createAppointmentValidation, async (req, res, next) => {
  const db = getConnection();
  let connection;

  try {
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      durationMinutes = 30,
      type,
      reasonForVisit
    } = req.body;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Verify doctor exists and is available
    const [doctors] = await connection.execute(
      `SELECT d.id, d.consultation_fee, d.is_available, u.first_name, u.last_name, d.specialization
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = ? AND d.is_available = TRUE AND u.is_active = TRUE`,
      [doctorId]
    );

    if (doctors.length === 0) {
      throw new NotFoundError('Doctor not found or not available');
    }

    const doctor = doctors[0];

    // Check for scheduling conflicts
    const [conflicts] = await connection.execute(
      `SELECT id FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
       AND status IN ('scheduled', 'confirmed')`,
      [doctorId, appointmentDate, appointmentTime]
    );

    if (conflicts.length > 0) {
      throw new ConflictError('Time slot is already booked');
    }

    // Generate virtual meeting URL if needed
    let virtualMeetingUrl = null;
    if (type === 'virtual') {
      virtualMeetingUrl = `https://meet.healthcare.com/room/${Math.random().toString(36).substr(2, 12)}`;
    }

    // Create appointment
    const [result] = await connection.execute(
      `INSERT INTO appointments 
       (patient_id, doctor_id, appointment_date, appointment_time, duration_minutes, type, 
        status, reason_for_visit, virtual_meeting_url, consultation_fee, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, 'pending')`,
      [
        req.user.id, doctorId, appointmentDate, appointmentTime, durationMinutes, 
        type, reasonForVisit, virtualMeetingUrl, doctor.consultation_fee
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: {
        id: result.insertId,
        patientId: req.user.id,
        doctorId,
        doctorName: `${doctor.first_name} ${doctor.last_name}`,
        specialization: doctor.specialization,
        appointmentDate,
        appointmentTime,
        durationMinutes,
        type,
        status: 'scheduled',
        reasonForVisit,
        virtualMeetingUrl,
        consultationFee: doctor.consultation_fee,
        paymentStatus: 'pending'
      }
    });

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

// Update appointment
router.put('/:id', authenticateToken, updateAppointmentValidation, async (req, res, next) => {
  const db = getConnection();
  let connection;

  try {
    const appointmentId = req.params.id;
    const updates = req.body;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get current appointment
    const [appointments] = await connection.execute(
      `SELECT a.*, d.user_id as doctor_user_id
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    if (appointments.length === 0) {
      throw new NotFoundError('Appointment');
    }

    const appointment = appointments[0];

    // Check permissions
    const canUpdate = 
      req.user.role === 'admin' ||
      (req.user.role === 'patient' && appointment.patient_id === req.user.id) ||
      (req.user.role === 'doctor' && appointment.doctor_user_id === req.user.id);

    if (!canUpdate) {
      throw new ForbiddenError('Access denied to update this appointment');
    }

    // Patients can only update certain fields and only if appointment is scheduled
    if (req.user.role === 'patient') {
      if (appointment.status !== 'scheduled') {
        throw new ForbiddenError('Cannot update appointment that is not scheduled');
      }
      
      const allowedFields = ['appointmentDate', 'appointmentTime', 'reasonForVisit'];
      const hasDisallowedFields = Object.keys(updates).some(key => !allowedFields.includes(key));
      
      if (hasDisallowedFields) {
        throw new ForbiddenError('Patients can only update date, time, and reason for visit');
      }
    }

    // Check for conflicts if date/time is being updated
    if (updates.appointmentDate || updates.appointmentTime) {
      const newDate = updates.appointmentDate || appointment.appointment_date;
      const newTime = updates.appointmentTime || appointment.appointment_time;

      const [conflicts] = await connection.execute(
        `SELECT id FROM appointments 
         WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
         AND status IN ('scheduled', 'confirmed') AND id != ?`,
        [appointment.doctor_id, newDate, newTime, appointmentId]
      );

      if (conflicts.length > 0) {
        throw new ConflictError('Time slot is already booked');
      }
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    const fieldMapping = {
      appointmentDate: 'appointment_date',
      appointmentTime: 'appointment_time',
      durationMinutes: 'duration_minutes',
      type: 'type',
      status: 'status',
      reasonForVisit: 'reason_for_visit',
      notes: 'notes'
    };

    Object.keys(updates).forEach(key => {
      if (fieldMapping[key]) {
        updateFields.push(`${fieldMapping[key]} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    updateValues.push(appointmentId);

    await connection.execute(
      `UPDATE appointments SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    await connection.commit();

    // Get updated appointment
    const [updatedAppointments] = await db.execute(
      `SELECT 
        a.id, a.appointment_date, a.appointment_time, a.duration_minutes, a.type, 
        a.status, a.reason_for_visit, a.notes, a.virtual_meeting_url, a.consultation_fee,
        a.payment_status, a.updated_at,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        CONCAT(doc.first_name, ' ', doc.last_name) as doctor_name,
        d.specialization
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users doc ON d.user_id = doc.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    const updatedAppointment = updatedAppointments[0];

    res.json({
      message: 'Appointment updated successfully',
      appointment: {
        id: updatedAppointment.id,
        appointmentDate: updatedAppointment.appointment_date,
        appointmentTime: updatedAppointment.appointment_time,
        durationMinutes: updatedAppointment.duration_minutes,
        type: updatedAppointment.type,
        status: updatedAppointment.status,
        reasonForVisit: updatedAppointment.reason_for_visit,
        notes: updatedAppointment.notes,
        virtualMeetingUrl: updatedAppointment.virtual_meeting_url,
        consultationFee: updatedAppointment.consultation_fee,
        paymentStatus: updatedAppointment.payment_status,
        patientName: updatedAppointment.patient_name,
        doctorName: updatedAppointment.doctor_name,
        specialization: updatedAppointment.specialization,
        updatedAt: updatedAppointment.updated_at
      }
    });

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

// Cancel appointment
router.delete('/:id', authenticateToken, idValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const appointmentId = req.params.id;

    // Get appointment details
    const [appointments] = await db.execute(
      `SELECT a.*, d.user_id as doctor_user_id
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = ?`,
      [appointmentId]
    );

    if (appointments.length === 0) {
      throw new NotFoundError('Appointment');
    }

    const appointment = appointments[0];

    // Check permissions
    const canCancel = 
      req.user.role === 'admin' ||
      (req.user.role === 'patient' && appointment.patient_id === req.user.id) ||
      (req.user.role === 'doctor' && appointment.doctor_user_id === req.user.id);

    if (!canCancel) {
      throw new ForbiddenError('Access denied to cancel this appointment');
    }

    // Update appointment status to cancelled
    await db.execute(
      'UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', appointmentId]
    );

    res.json({
      message: 'Appointment cancelled successfully',
      appointmentId: parseInt(appointmentId)
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;