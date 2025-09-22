const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../database/connection');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { AppError, ConflictError, UnauthorizedError } = require('../middleware/errorHandler');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Register new user
router.post('/register', registerValidation, async (req, res, next) => {
  const db = getConnection();
  let connection;

  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      dateOfBirth,
      gender,
      specialization,
      licenseNumber,
      yearsOfExperience
    } = req.body;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [userResult] = await connection.execute(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, date_of_birth, gender, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, role, firstName, lastName, phone || null, dateOfBirth || null, gender || null, false]
    );

    const userId = userResult.insertId;

    // If registering as doctor, insert doctor details
    if (role === 'doctor') {
      if (!specialization || !licenseNumber) {
        throw new AppError('Specialization and license number are required for doctors', 400);
      }

      // Check if license number already exists
      const [existingLicense] = await connection.execute(
        'SELECT id FROM doctors WHERE license_number = ?',
        [licenseNumber]
      );

      if (existingLicense.length > 0) {
        throw new ConflictError('Doctor with this license number already exists');
      }

      await connection.execute(
        `INSERT INTO doctors (user_id, specialization, license_number, years_of_experience, is_available)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, specialization, licenseNumber, yearsOfExperience || 0, true]
      );
    }

    await connection.commit();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(userId);

    // Store refresh token hash
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, refreshTokenHash, expiresAt]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        role,
        firstName,
        lastName
      },
      tokens: {
        accessToken,
        refreshToken
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

// Login user
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const db = getConnection();

    // Get user with password hash
    const [users] = await db.execute(
      `SELECT u.id, u.email, u.password_hash, u.role, u.first_name, u.last_name, u.is_active,
              d.specialization, d.license_number
       FROM users u
       LEFT JOIN doctors d ON u.id = d.user_id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = users[0];

    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token hash
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshTokenHash, expiresAt]
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        ...(user.specialization && { specialization: user.specialization }),
        ...(user.license_number && { licenseNumber: user.license_number })
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const db = getConnection();

    // Check if refresh token exists and is valid
    const [tokens] = await db.execute(
      'SELECT id, user_id, token_hash, expires_at, is_revoked FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW() AND is_revoked = FALSE',
      [decoded.userId]
    );

    let validToken = null;
    for (const token of tokens) {
      const isValid = await bcrypt.compare(refreshToken, token.token_hash);
      if (isValid) {
        validToken = token;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

    // Revoke old refresh token
    await db.execute(
      'UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = ?',
      [validToken.id]
    );

    // Store new refresh token
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [decoded.userId, newRefreshTokenHash, expiresAt]
    );

    res.json({
      message: 'Tokens refreshed successfully',
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const db = getConnection();

    if (refreshToken) {
      // Revoke specific refresh token
      const [tokens] = await db.execute(
        'SELECT id, token_hash FROM refresh_tokens WHERE user_id = ? AND is_revoked = FALSE',
        [req.user.id]
      );

      for (const token of tokens) {
        const isValid = await bcrypt.compare(refreshToken, token.token_hash);
        if (isValid) {
          await db.execute(
            'UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = ?',
            [token.id]
          );
          break;
        }
      }
    } else {
      // Revoke all refresh tokens for user
      await db.execute(
        'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?',
        [req.user.id]
      );
    }

    res.json({ message: 'Logout successful' });

  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const db = getConnection();

    const [users] = await db.execute(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.date_of_birth, 
              u.gender, u.address, u.emergency_contact_name, u.emergency_contact_phone,
              u.created_at, d.specialization, d.license_number, d.years_of_experience,
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

module.exports = router;