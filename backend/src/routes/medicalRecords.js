const express = require('express');
const { getConnection } = require('../database/connection');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { 
  createMedicalRecordValidation, 
  paginationValidation, 
  idValidation 
} = require('../middleware/validation');
const { NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

const router = express.Router();

// Get medical records (with filtering and pagination)
router.get('/', authenticateToken, paginationValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const { 
      page = 1, 
      limit = 10, 
      patientId, 
      recordType,
      startDate,
      endDate,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    // Role-based filtering
    if (req.user.role === 'patient') {
      whereConditions.push('mr.patient_id = ?');
      queryParams.push(req.user.id);
    } else if (req.user.role === 'doctor') {
      // Get doctor record for current user
      const [doctors] = await db.execute(
        'SELECT id FROM doctors WHERE user_id = ?',
        [req.user.id]
      );
      if (doctors.length > 0) {
        whereConditions.push('mr.doctor_id = ?');
        queryParams.push(doctors[0].id);
      }
    }

    // Additional filters
    if (patientId && (req.user.role === 'admin' || req.user.role === 'doctor')) {
      whereConditions.push('mr.patient_id = ?');
      queryParams.push(patientId);
    }

    if (recordType) {
      whereConditions.push('mr.record_type = ?');
      queryParams.push(recordType);
    }

    if (startDate) {
      whereConditions.push('DATE(mr.created_at) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(mr.created_at) <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Validate sort field
    const allowedSortFields = ['created_at', 'record_type', 'title'];
    const sortField = allowedSortFields.includes(sortBy) ? `mr.${sortBy}` : 'mr.created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get medical records
    const [records] = await db.execute(
      `SELECT 
        mr.id, mr.record_type, mr.title, mr.description, mr.diagnosis, mr.treatment_plan,
        mr.file_url, mr.file_type, mr.is_confidential, mr.created_at, mr.updated_at,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.email as patient_email,
        CONCAT(doc.first_name, ' ', doc.last_name) as doctor_name,
        d.specialization,
        a.appointment_date, a.appointment_time
       FROM medical_records mr
       JOIN users p ON mr.patient_id = p.id
       JOIN doctors d ON mr.doctor_id = d.id
       JOIN users doc ON d.user_id = doc.id
       LEFT JOIN appointments a ON mr.appointment_id = a.id
       ${whereClause}
       ORDER BY ${sortField} ${order}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total
       FROM medical_records mr
       JOIN users p ON mr.patient_id = p.id
       JOIN doctors d ON mr.doctor_id = d.id
       JOIN users doc ON d.user_id = doc.id
       ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      records: records.map(record => ({
        id: record.id,
        recordType: record.record_type,
        title: record.title,
        description: record.description,
        diagnosis: record.diagnosis,
        treatmentPlan: record.treatment_plan,
        fileUrl: record.file_url,
        fileType: record.file_type,
        isConfidential: record.is_confidential,
        patientName: record.patient_name,
        patientEmail: record.patient_email,
        doctorName: record.doctor_name,
        specialization: record.specialization,
        appointmentDate: record.appointment_date,
        appointmentTime: record.appointment_time,
        createdAt: record.created_at,
        updatedAt: record.updated_at
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

// Get single medical record
router.get('/:id', authenticateToken, idValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const recordId = req.params.id;

    const [records] = await db.execute(
      `SELECT 
        mr.id, mr.patient_id, mr.doctor_id, mr.appointment_id, mr.record_type, 
        mr.title, mr.description, mr.diagnosis, mr.treatment_plan, mr.file_url, 
        mr.file_type, mr.is_confidential, mr.created_at, mr.updated_at,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.email as patient_email, p.phone as patient_phone,
        CONCAT(doc.first_name, ' ', doc.last_name) as doctor_name,
        doc.email as doctor_email, d.specialization,
        a.appointment_date, a.appointment_time
       FROM medical_records mr
       JOIN users p ON mr.patient_id = p.id
       JOIN doctors d ON mr.doctor_id = d.id
       JOIN users doc ON d.user_id = doc.id
       LEFT JOIN appointments a ON mr.appointment_id = a.id
       WHERE mr.id = ?`,
      [recordId]
    );

    if (records.length === 0) {
      throw new NotFoundError('Medical record');
    }

    const record = records[0];

    // Check access permissions
    if (req.user.role === 'patient' && record.patient_id !== req.user.id) {
      throw new ForbiddenError('Access denied to this medical record');
    }

    if (req.user.role === 'doctor') {
      const [doctors] = await db.execute(
        'SELECT id FROM doctors WHERE user_id = ?',
        [req.user.id]
      );
      if (doctors.length === 0 || record.doctor_id !== doctors[0].id) {
        throw new ForbiddenError('Access denied to this medical record');
      }
    }

    // Get prescriptions for this record
    const [prescriptions] = await db.execute(
      `SELECT id, medication_name, dosage, frequency, duration_days, instructions,
              start_date, end_date, is_active, created_at
       FROM prescriptions
       WHERE medical_record_id = ?
       ORDER BY created_at DESC`,
      [recordId]
    );

    res.json({
      record: {
        id: record.id,
        patientId: record.patient_id,
        doctorId: record.doctor_id,
        appointmentId: record.appointment_id,
        recordType: record.record_type,
        title: record.title,
        description: record.description,
        diagnosis: record.diagnosis,
        treatmentPlan: record.treatment_plan,
        fileUrl: record.file_url,
        fileType: record.file_type,
        isConfidential: record.is_confidential,
        patientName: record.patient_name,
        patientEmail: record.patient_email,
        patientPhone: record.patient_phone,
        doctorName: record.doctor_name,
        doctorEmail: record.doctor_email,
        specialization: record.specialization,
        appointmentDate: record.appointment_date,
        appointmentTime: record.appointment_time,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        prescriptions: prescriptions.map(p => ({
          id: p.id,
          medicationName: p.medication_name,
          dosage: p.dosage,
          frequency: p.frequency,
          durationDays: p.duration_days,
          instructions: p.instructions,
          startDate: p.start_date,
          endDate: p.end_date,
          isActive: p.is_active,
          createdAt: p.created_at
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// Create new medical record (doctors only)
router.post('/', authenticateToken, authorizeRoles('doctor'), createMedicalRecordValidation, async (req, res, next) => {
  const db = getConnection();
  let connection;

  try {
    const {
      patientId,
      appointmentId,
      recordType,
      title,
      description,
      diagnosis,
      treatmentPlan,
      fileUrl,
      fileType,
      isConfidential = false,
      prescriptions = []
    } = req.body;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get doctor record for current user
    const [doctors] = await connection.execute(
      'SELECT id FROM doctors WHERE user_id = ?',
      [req.user.id]
    );

    if (doctors.length === 0) {
      throw new NotFoundError('Doctor profile');
    }

    const doctorId = doctors[0].id;

    // Verify patient exists
    const [patients] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND role = "patient" AND is_active = TRUE',
      [patientId]
    );

    if (patients.length === 0) {
      throw new NotFoundError('Patient');
    }

    // Verify appointment if provided
    if (appointmentId) {
      const [appointments] = await connection.execute(
        'SELECT id FROM appointments WHERE id = ? AND patient_id = ? AND doctor_id = ?',
        [appointmentId, patientId, doctorId]
      );

      if (appointments.length === 0) {
        throw new NotFoundError('Appointment or access denied');
      }
    }

    // Create medical record
    const [result] = await connection.execute(
      `INSERT INTO medical_records 
       (patient_id, doctor_id, appointment_id, record_type, title, description, 
        diagnosis, treatment_plan, file_url, file_type, is_confidential)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId, doctorId, appointmentId || null, recordType, title, 
        description || null, diagnosis || null, treatmentPlan || null,
        fileUrl || null, fileType || null, isConfidential
      ]
    );

    const recordId = result.insertId;

    // Add prescriptions if provided
    const createdPrescriptions = [];
    for (const prescription of prescriptions) {
      const {
        medicationName,
        dosage,
        frequency,
        durationDays,
        instructions,
        startDate,
        endDate
      } = prescription;

      const [prescResult] = await connection.execute(
        `INSERT INTO prescriptions 
         (medical_record_id, medication_name, dosage, frequency, duration_days, 
          instructions, start_date, end_date, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          recordId, medicationName, dosage, frequency, durationDays || null,
          instructions || null, startDate, endDate || null
        ]
      );

      createdPrescriptions.push({
        id: prescResult.insertId,
        medicationName,
        dosage,
        frequency,
        durationDays,
        instructions,
        startDate,
        endDate,
        isActive: true
      });
    }

    await connection.commit();

    res.status(201).json({
      message: 'Medical record created successfully',
      record: {
        id: recordId,
        patientId,
        doctorId,
        appointmentId,
        recordType,
        title,
        description,
        diagnosis,
        treatmentPlan,
        fileUrl,
        fileType,
        isConfidential,
        prescriptions: createdPrescriptions
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

// Update medical record (doctors only)
router.put('/:id', authenticateToken, authorizeRoles('doctor'), idValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const recordId = req.params.id;
    const updates = req.body;

    // Get current record and verify ownership
    const [records] = await db.execute(
      `SELECT mr.*, d.user_id as doctor_user_id
       FROM medical_records mr
       JOIN doctors d ON mr.doctor_id = d.id
       WHERE mr.id = ?`,
      [recordId]
    );

    if (records.length === 0) {
      throw new NotFoundError('Medical record');
    }

    const record = records[0];

    // Check if current user is the doctor who created this record
    if (record.doctor_user_id !== req.user.id) {
      throw new ForbiddenError('Access denied to update this medical record');
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    const allowedFields = {
      title: 'title',
      description: 'description',
      diagnosis: 'diagnosis',
      treatmentPlan: 'treatment_plan',
      fileUrl: 'file_url',
      fileType: 'file_type',
      isConfidential: 'is_confidential'
    };

    Object.keys(updates).forEach(key => {
      if (allowedFields[key]) {
        updateFields.push(`${allowedFields[key]} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(recordId);

    await db.execute(
      `UPDATE medical_records SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Medical record updated successfully' });

  } catch (error) {
    next(error);
  }
});

// Delete medical record (doctors and admins only)
router.delete('/:id', authenticateToken, authorizeRoles('doctor', 'admin'), idValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const recordId = req.params.id;

    // Get record details
    const [records] = await db.execute(
      `SELECT mr.*, d.user_id as doctor_user_id
       FROM medical_records mr
       JOIN doctors d ON mr.doctor_id = d.id
       WHERE mr.id = ?`,
      [recordId]
    );

    if (records.length === 0) {
      throw new NotFoundError('Medical record');
    }

    const record = records[0];

    // Check permissions (doctors can only delete their own records)
    if (req.user.role === 'doctor' && record.doctor_user_id !== req.user.id) {
      throw new ForbiddenError('Access denied to delete this medical record');
    }

    // Delete record (cascade will handle prescriptions)
    await db.execute('DELETE FROM medical_records WHERE id = ?', [recordId]);

    res.json({ 
      message: 'Medical record deleted successfully',
      recordId: parseInt(recordId)
    });

  } catch (error) {
    next(error);
  }
});

// Get vital signs for a patient
router.get('/vital-signs/:patientId', authenticateToken, idValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const patientId = req.params.patientId;
    const { limit = 10, startDate, endDate } = req.query;

    // Check access permissions
    if (req.user.role === 'patient' && patientId != req.user.id) {
      throw new ForbiddenError('Access denied to this patient\'s vital signs');
    }

    let whereConditions = ['vs.patient_id = ?'];
    let queryParams = [patientId];

    if (startDate) {
      whereConditions.push('DATE(vs.recorded_at) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(vs.recorded_at) <= ?');
      queryParams.push(endDate);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const [vitalSigns] = await db.execute(
      `SELECT 
        vs.id, vs.blood_pressure_systolic, vs.blood_pressure_diastolic, vs.heart_rate,
        vs.temperature, vs.weight, vs.height, vs.bmi, vs.oxygen_saturation,
        vs.respiratory_rate, vs.notes, vs.recorded_at,
        CONCAT(recorder.first_name, ' ', recorder.last_name) as recorded_by_name,
        a.appointment_date, a.appointment_time
       FROM vital_signs vs
       JOIN users recorder ON vs.recorded_by = recorder.id
       LEFT JOIN appointments a ON vs.appointment_id = a.id
       ${whereClause}
       ORDER BY vs.recorded_at DESC
       LIMIT ?`,
      [...queryParams, parseInt(limit)]
    );

    res.json({
      vitalSigns: vitalSigns.map(vs => ({
        id: vs.id,
        bloodPressure: vs.blood_pressure_systolic && vs.blood_pressure_diastolic 
          ? `${vs.blood_pressure_systolic}/${vs.blood_pressure_diastolic}`
          : null,
        heartRate: vs.heart_rate,
        temperature: vs.temperature,
        weight: vs.weight,
        height: vs.height,
        bmi: vs.bmi,
        oxygenSaturation: vs.oxygen_saturation,
        respiratoryRate: vs.respiratory_rate,
        notes: vs.notes,
        recordedAt: vs.recorded_at,
        recordedByName: vs.recorded_by_name,
        appointmentDate: vs.appointment_date,
        appointmentTime: vs.appointment_time
      }))
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;