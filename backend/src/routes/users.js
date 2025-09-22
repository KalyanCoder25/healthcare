const express = require('express');
const bcrypt = require('bcryptjs');
const { getConnection } = require('../database/connection');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { updateProfileValidation, paginationValidation, idValidation } = require('../middleware/validation');
const { NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const db = getConnection();

    const [users] = await db.execute(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.date_of_birth, 
              u.gender, u.address, u.emergency_contact_name, u.emergency_contact_phone,
              u.created_at, u.updated_at, d.specialization, d.license_number, d.years_of_experience,
              d.consultation_fee, d.rating, d.total_reviews
       FROM users u
       LEFT JOIN doctors d ON u.id = d.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      throw new NotFoundError('User');
    }

    const user = users[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        address: user.address,
        emergencyContactName: user.emergency_contact_name,
        emergencyContactPhone: user.emergency_contact_phone,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        ...(user.specialization && {
          specialization: user.specialization,
          licenseNumber: user.license_number,
          yearsOfExperience: user.years_of_experience,
          consultationFee: user.consultation_fee,
          rating: user.rating,
          totalReviews: user.total_reviews
        })
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, updateProfileValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContactName,
      emergencyContactPhone
    } = req.body;

    // Build update query
    const updateFields = [];
    const updateValues = [];

    if (firstName !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(firstName);
    }

    if (lastName !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(lastName);
    }

    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (dateOfBirth !== undefined) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(dateOfBirth);
    }

    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }

    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }

    if (emergencyContactName !== undefined) {
      updateFields.push('emergency_contact_name = ?');
      updateValues.push(emergencyContactName);
    }

    if (emergencyContactPhone !== undefined) {
      updateFields.push('emergency_contact_phone = ?');
      updateValues.push(emergencyContactPhone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(req.user.id);

    await db.execute(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const db = getConnection();

    // Get current password hash
    const [users] = await db.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.execute(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    // Revoke all refresh tokens to force re-login
    await db.execute(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    next(error);
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), paginationValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const { 
      page = 1, 
      limit = 10, 
      role, 
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      isActive
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    if (role) {
      whereConditions.push('u.role = ?');
      queryParams.push(role);
    }

    if (search) {
      whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (isActive !== undefined) {
      whereConditions.push('u.is_active = ?');
      queryParams.push(isActive === 'true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Validate sort field
    const allowedSortFields = ['created_at', 'first_name', 'last_name', 'email', 'role'];
    const sortField = allowedSortFields.includes(sortBy) ? `u.${sortBy}` : 'u.created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get users
    const [users] = await db.execute(
      `SELECT 
        u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.date_of_birth,
        u.gender, u.is_active, u.email_verified, u.created_at, u.updated_at,
        d.specialization, d.license_number, d.years_of_experience, d.consultation_fee, d.rating
       FROM users u
       LEFT JOIN doctors d ON u.id = d.user_id
       ${whereClause}
       ORDER BY ${sortField} ${order}
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        ...(user.specialization && {
          specialization: user.specialization,
          licenseNumber: user.license_number,
          yearsOfExperience: user.years_of_experience,
          consultationFee: user.consultation_fee,
          rating: user.rating
        })
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

// Get single user (admin only)
router.get('/:id', authenticateToken, authorizeRoles('admin'), idValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const userId = req.params.id;

    const [users] = await db.execute(
      `SELECT 
        u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.date_of_birth,
        u.gender, u.address, u.emergency_contact_name, u.emergency_contact_phone,
        u.is_active, u.email_verified, u.created_at, u.updated_at,
        d.specialization, d.license_number, d.years_of_experience, d.education,
        d.certifications, d.bio, d.consultation_fee, d.rating, d.total_reviews, d.is_available
       FROM users u
       LEFT JOIN doctors d ON u.id = d.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      throw new NotFoundError('User');
    }

    const user = users[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        address: user.address,
        emergencyContactName: user.emergency_contact_name,
        emergencyContactPhone: user.emergency_contact_phone,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        ...(user.specialization && {
          specialization: user.specialization,
          licenseNumber: user.license_number,
          yearsOfExperience: user.years_of_experience,
          education: user.education,
          certifications: user.certifications,
          bio: user.bio,
          consultationFee: user.consultation_fee,
          rating: user.rating,
          totalReviews: user.total_reviews,
          isAvailable: user.is_available
        })
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update user status (admin only)
router.put('/:id/status', authenticateToken, authorizeRoles('admin'), idValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const userId = req.params.id;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean value' });
    }

    // Prevent admin from deactivating themselves
    if (userId == req.user.id && !isActive) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const [result] = await db.execute(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [isActive, userId]
    );

    if (result.affectedRows === 0) {
      throw new NotFoundError('User');
    }

    // If deactivating user, revoke all their refresh tokens
    if (!isActive) {
      await db.execute(
        'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?',
        [userId]
      );
    }

    res.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      userId: parseInt(userId),
      isActive
    });

  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), idValidation, async (req, res, next) => {
  try {
    const db = getConnection();
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId == req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const [users] = await db.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new NotFoundError('User');
    }

    // Delete user (cascade will handle related records)
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ 
      message: 'User deleted successfully',
      userId: parseInt(userId)
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;