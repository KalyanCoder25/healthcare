-- Healthcare Database Seed Data
USE healthcare_db;

-- Insert admin user
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active, email_verified) VALUES
('admin@healthcare.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'admin', 'System', 'Administrator', '+1-555-0001', TRUE, TRUE);

-- Insert sample patients
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, is_active, email_verified) VALUES
('patient@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'patient', 'John', 'Doe', '+1-555-0101', '1985-06-15', 'male', '123 Main St, Anytown, ST 12345', 'Jane Doe', '+1-555-0102', TRUE, TRUE),
('jane.smith@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'patient', 'Jane', 'Smith', '+1-555-0201', '1990-03-22', 'female', '456 Oak Ave, Somewhere, ST 67890', 'Bob Smith', '+1-555-0202', TRUE, TRUE),
('mike.johnson@email.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'patient', 'Mike', 'Johnson', '+1-555-0301', '1978-11-08', 'male', '789 Pine Rd, Elsewhere, ST 13579', 'Sarah Johnson', '+1-555-0302', TRUE, TRUE);

-- Insert sample doctors
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, date_of_birth, gender, is_active, email_verified) VALUES
('doctor@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'doctor', 'Dr. Sarah', 'Smith', '+1-555-1001', '1975-04-12', 'female', TRUE, TRUE),
('dr.johnson@healthcare.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'doctor', 'Dr. Michael', 'Johnson', '+1-555-1002', '1980-09-25', 'male', TRUE, TRUE),
('dr.chen@healthcare.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'doctor', 'Dr. Emily', 'Chen', '+1-555-1003', '1982-07-18', 'female', TRUE, TRUE);

-- Insert doctor details
INSERT INTO doctors (user_id, specialization, license_number, years_of_experience, education, bio, consultation_fee, rating, total_reviews, is_available) VALUES
(4, 'Cardiology', 'MD12345', 12, 'MD from Harvard Medical School, Cardiology Fellowship at Mayo Clinic', 'Experienced cardiologist specializing in preventive cardiology and heart disease management.', 200.00, 4.8, 156, TRUE),
(5, 'Dermatology', 'MD23456', 8, 'MD from Johns Hopkins, Dermatology Residency at UCSF', 'Board-certified dermatologist with expertise in medical and cosmetic dermatology.', 150.00, 4.9, 203, TRUE),
(6, 'Pediatrics', 'MD34567', 15, 'MD from Stanford Medical School, Pediatrics Residency at Children\'s Hospital', 'Pediatrician with extensive experience in child healthcare and development.', 120.00, 4.7, 89, TRUE);

-- Insert doctor availability
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_active) VALUES
-- Dr. Sarah Smith (Cardiology)
(1, 'monday', '09:00:00', '17:00:00', TRUE),
(1, 'tuesday', '09:00:00', '17:00:00', TRUE),
(1, 'wednesday', '09:00:00', '17:00:00', TRUE),
(1, 'thursday', '09:00:00', '17:00:00', TRUE),
(1, 'friday', '09:00:00', '15:00:00', TRUE),

-- Dr. Michael Johnson (Dermatology)
(2, 'monday', '10:00:00', '18:00:00', TRUE),
(2, 'tuesday', '10:00:00', '18:00:00', TRUE),
(2, 'wednesday', '10:00:00', '18:00:00', TRUE),
(2, 'friday', '10:00:00', '16:00:00', TRUE),

-- Dr. Emily Chen (Pediatrics)
(3, 'monday', '08:00:00', '16:00:00', TRUE),
(3, 'tuesday', '08:00:00', '16:00:00', TRUE),
(3, 'wednesday', '08:00:00', '16:00:00', TRUE),
(3, 'thursday', '08:00:00', '16:00:00', TRUE),
(3, 'friday', '08:00:00', '14:00:00', TRUE);

-- Insert sample appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, duration_minutes, type, status, reason_for_visit, consultation_fee, payment_status) VALUES
(2, 1, '2024-01-15', '10:00:00', 30, 'in-person', 'scheduled', 'Regular checkup and blood pressure monitoring', 200.00, 'pending'),
(3, 2, '2024-01-20', '14:00:00', 45, 'virtual', 'scheduled', 'Skin consultation for recurring rash', 150.00, 'paid'),
(4, 3, '2024-01-18', '11:30:00', 30, 'in-person', 'completed', 'Child wellness exam', 120.00, 'paid');

-- Insert sample medical records
INSERT INTO medical_records (patient_id, doctor_id, appointment_id, record_type, title, description, diagnosis, treatment_plan) VALUES
(4, 3, 3, 'consultation', 'Annual Wellness Exam', 'Routine pediatric examination for 8-year-old patient', 'Healthy child, normal development', 'Continue regular diet and exercise, next checkup in 6 months'),
(2, 1, NULL, 'lab_result', 'Blood Work Results', 'Complete blood count and lipid panel', 'Slightly elevated cholesterol', 'Dietary modifications recommended, recheck in 3 months');

-- Insert sample vital signs
INSERT INTO vital_signs (patient_id, appointment_id, recorded_by, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, weight, height, bmi) VALUES
(2, 1, 4, 128, 82, 72, 98.6, 165.5, 70.0, 23.7),
(4, 3, 6, 95, 60, 88, 98.4, 55.2, 50.0, 22.1);

-- Insert sample prescriptions
INSERT INTO prescriptions (medical_record_id, medication_name, dosage, frequency, duration_days, instructions, start_date, end_date, is_active) VALUES
(1, 'Children\'s Multivitamin', '1 tablet', 'Once daily', 90, 'Take with breakfast', '2024-01-18', '2024-04-18', TRUE),
(2, 'Atorvastatin', '20mg', 'Once daily', 90, 'Take in the evening with or without food', '2024-01-10', '2024-04-10', TRUE);

-- Note: All passwords are hashed version of 'demo123' for testing purposes
-- In production, users should set their own secure passwords