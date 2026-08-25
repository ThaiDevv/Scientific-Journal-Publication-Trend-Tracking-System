-- Insert Mock Users for Testing & Presentation
-- Passwords for all mock accounts are: 123456
-- BCrypt hash: $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi

INSERT INTO users (username, email, password_hash, full_name, role, is_active)
VALUES 
('admin', 'admin@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Quản Trị Viên (Admin)', 'ADMIN', true),
('thai', 'thai@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Trần Văn Thái', 'RESEARCHER', true),
('student', 'student@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Sinh Viên Mẫu', 'STUDENT', true),
('lecturer', 'lecturer@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Giảng Viên Mẫu', 'LECTURER', true)
ON DUPLICATE KEY UPDATE updated_at = NOW();
