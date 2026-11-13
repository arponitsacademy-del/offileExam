-- =====================================================================
-- SmartOMR - Automated OMR Examination & Evaluation System
-- Production MySQL 8.0+ Database Schema DDL & Seed Data
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `smartomr`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `smartomr`;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. Table: users
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(30) NOT NULL DEFAULT 'student',
  `phone` VARCHAR(30) NULL DEFAULT NULL,
  `avatar` VARCHAR(255) NULL DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `remember_token` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Table: password_reset_tokens
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Table: personal_access_tokens (Laravel Sanctum)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE `personal_access_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` VARCHAR(255) NOT NULL,
  `tokenable_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `token` VARCHAR(64) NOT NULL UNIQUE,
  `abilities` TEXT NULL,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_pat_tokenable` (`tokenable_type`, `tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Table: teachers
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `teachers`;
CREATE TABLE `teachers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `employee_id` VARCHAR(50) NOT NULL UNIQUE,
  `designation` VARCHAR(100) NULL DEFAULT NULL,
  `department` VARCHAR(100) NULL DEFAULT NULL,
  `phone` VARCHAR(30) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_teachers_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Table: classes
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT NULL DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Table: batches
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `batches`;
CREATE TABLE `batches` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `session` VARCHAR(50) NULL DEFAULT NULL,
  `max_students` INT NOT NULL DEFAULT 100,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_batches_class_status` (`class_id`, `status`),
  CONSTRAINT `fk_batches_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Table: sections
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `sections`;
CREATE TABLE `sections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `room_no` VARCHAR(50) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sections_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Table: students
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `student_uid` VARCHAR(50) NOT NULL UNIQUE,
  `roll_no` VARCHAR(50) NOT NULL,
  `reg_no` VARCHAR(50) NOT NULL UNIQUE,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `section_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `phone` VARCHAR(30) NULL DEFAULT NULL,
  `email` VARCHAR(150) NULL DEFAULT NULL,
  `photo_path` VARCHAR(255) NULL DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_students_roll_no` (`roll_no`),
  INDEX `idx_students_status` (`status`),
  INDEX `idx_students_batch_roll` (`batch_id`, `roll_no`),
  CONSTRAINT `fk_students_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_students_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_students_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_students_section_id` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. Table: student_batch (Many-to-Many Enrollment)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `student_batch`;
CREATE TABLE `student_batch` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `roll_no` VARCHAR(50) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_batch` (`student_id`, `batch_id`),
  CONSTRAINT `fk_sb_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sb_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. Table: subjects
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. Table: omr_templates
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `omr_templates`;
CREATE TABLE `omr_templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `total_questions` INT NOT NULL,
  `options_per_question` INT NOT NULL DEFAULT 4,
  `columns_count` INT NOT NULL DEFAULT 2,
  `layout_config` JSON NULL DEFAULT NULL,
  `qr_position` JSON NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. Table: exams
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `exam_code` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `subject_id` BIGINT UNSIGNED NOT NULL,
  `class_id` BIGINT UNSIGNED NOT NULL,
  `created_by` BIGINT UNSIGNED NOT NULL,
  `template_id` BIGINT UNSIGNED NOT NULL,
  `exam_date` DATE NOT NULL,
  `duration_minutes` INT NOT NULL DEFAULT 60,
  `total_questions` INT NOT NULL,
  `marks_per_question` DECIMAL(8,2) NOT NULL DEFAULT 1.00,
  `negative_marks_per_question` DECIMAL(8,2) NOT NULL DEFAULT 0.25,
  `passing_marks` DECIMAL(8,2) NOT NULL DEFAULT 20.00,
  `invalid_marking_penalty` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
  `allow_multiple_attempts` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_exams_status` (`status`),
  INDEX `idx_exams_created_by` (`created_by`, `status`),
  INDEX `idx_exams_class_date` (`class_id`, `exam_date`),
  CONSTRAINT `fk_exams_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_exams_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_exams_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_exams_template_id` FOREIGN KEY (`template_id`) REFERENCES `omr_templates` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. Table: exam_assignments
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `exam_assignments`;
CREATE TABLE `exam_assignments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `exam_id` BIGINT UNSIGNED NOT NULL,
  `batch_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_batch` (`exam_id`, `batch_id`),
  CONSTRAINT `fk_ea_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ea_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. Table: exam_answer_keys
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `exam_answer_keys`;
CREATE TABLE `exam_answer_keys` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `exam_id` BIGINT UNSIGNED NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_by` BIGINT UNSIGNED NOT NULL,
  `change_reason` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_key_version` (`exam_id`, `version`),
  CONSTRAINT `fk_eak_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eak_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 15. Table: answer_key_items
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `answer_key_items`;
CREATE TABLE `answer_key_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `answer_key_id` BIGINT UNSIGNED NOT NULL,
  `question_number` INT NOT NULL,
  `correct_option` VARCHAR(5) NOT NULL,
  `marks_weight` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  `is_bonus` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key_question` (`answer_key_id`, `question_number`),
  CONSTRAINT `fk_aki_answer_key_id` FOREIGN KEY (`answer_key_id`) REFERENCES `exam_answer_keys` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 16. Table: omr_sheets
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `omr_sheets`;
CREATE TABLE `omr_sheets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sheet_uid` VARCHAR(64) NOT NULL UNIQUE,
  `exam_id` BIGINT UNSIGNED NOT NULL,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'generated',
  `printed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_omr_sheets_exam_student` (`exam_id`, `student_id`),
  CONSTRAINT `fk_os_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_os_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 17. Table: omr_scans
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `omr_scans`;
CREATE TABLE `omr_scans` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scan_uid` VARCHAR(64) NOT NULL UNIQUE,
  `exam_id` BIGINT UNSIGNED NOT NULL,
  `student_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `omr_sheet_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `original_image_path` VARCHAR(255) NOT NULL,
  `processed_image_path` VARCHAR(255) NULL DEFAULT NULL,
  `scanned_by` BIGINT UNSIGNED NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'processing',
  `alignment_confidence` DECIMAL(5,2) NULL DEFAULT NULL,
  `qr_detected` TINYINT(1) NOT NULL DEFAULT 0,
  `qr_payload` VARCHAR(255) NULL DEFAULT NULL,
  `raw_engine_response` JSON NULL DEFAULT NULL,
  `review_status` VARCHAR(30) NOT NULL DEFAULT 'approved',
  `error_message` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_scans_exam_status` (`exam_id`, `status`),
  INDEX `idx_scans_student_exam` (`student_id`, `exam_id`),
  CONSTRAINT `fk_scans_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_scans_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_scans_sheet_id` FOREIGN KEY (`omr_sheet_id`) REFERENCES `omr_sheets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_scans_scanned_by` FOREIGN KEY (`scanned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 18. Table: scan_answers
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `scan_answers`;
CREATE TABLE `scan_answers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scan_id` BIGINT UNSIGNED NOT NULL,
  `question_number` INT NOT NULL,
  `detected_option` VARCHAR(5) NULL DEFAULT NULL,
  `fill_ratio_a` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `fill_ratio_b` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `fill_ratio_c` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `fill_ratio_d` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(30) NOT NULL DEFAULT 'single',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scan_question` (`scan_id`, `question_number`),
  CONSTRAINT `fk_sa_scan_id` FOREIGN KEY (`scan_id`) REFERENCES `omr_scans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 19. Table: scan_reviews
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `scan_reviews`;
CREATE TABLE `scan_reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scan_id` BIGINT UNSIGNED NOT NULL,
  `reviewer_id` BIGINT UNSIGNED NOT NULL,
  `question_number` INT NOT NULL,
  `previous_option` VARCHAR(5) NULL DEFAULT NULL,
  `revised_option` VARCHAR(5) NULL DEFAULT NULL,
  `revised_status` VARCHAR(30) NOT NULL,
  `comment` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_sr_scan_reviewer` (`scan_id`, `reviewer_id`),
  CONSTRAINT `fk_sr_scan_id` FOREIGN KEY (`scan_id`) REFERENCES `omr_scans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sr_reviewer_id` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 20. Table: results
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `results`;
CREATE TABLE `results` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `exam_id` BIGINT UNSIGNED NOT NULL,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `scan_id` BIGINT UNSIGNED NOT NULL,
  `total_questions` INT NOT NULL,
  `correct_count` INT NOT NULL DEFAULT 0,
  `wrong_count` INT NOT NULL DEFAULT 0,
  `blank_count` INT NOT NULL DEFAULT 0,
  `multiple_marked_count` INT NOT NULL DEFAULT 0,
  `uncertain_count` INT NOT NULL DEFAULT 0,
  `raw_score` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `penalty_score` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `final_score` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `is_passed` TINYINT(1) NOT NULL DEFAULT 0,
  `rank` INT NULL DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
  `evaluated_at` TIMESTAMP NULL DEFAULT NULL,
  `published_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_results_exam_student` (`exam_id`, `student_id`),
  INDEX `idx_results_status` (`status`),
  INDEX `idx_results_exam_score` (`exam_id`, `final_score`),
  CONSTRAINT `fk_res_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_res_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_res_scan_id` FOREIGN KEY (`scan_id`) REFERENCES `omr_scans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 21. Table: result_answers
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `result_answers`;
CREATE TABLE `result_answers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `result_id` BIGINT UNSIGNED NOT NULL,
  `question_number` INT NOT NULL,
  `student_answer` VARCHAR(5) NULL DEFAULT NULL,
  `correct_answer` VARCHAR(5) NOT NULL,
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0,
  `is_wrong` TINYINT(1) NOT NULL DEFAULT 0,
  `is_blank` TINYINT(1) NOT NULL DEFAULT 0,
  `is_invalid` TINYINT(1) NOT NULL DEFAULT 0,
  `score_awarded` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_res_answer_q` (`result_id`, `question_number`),
  CONSTRAINT `fk_ra_result_id` FOREIGN KEY (`result_id`) REFERENCES `results` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 22. Table: audit_logs
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `old_values` JSON NULL DEFAULT NULL,
  `new_values` JSON NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_al_entity` (`entity_type`, `entity_id`),
  INDEX `idx_al_user_action` (`user_id`, `action`),
  CONSTRAINT `fk_al_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 23. Table: system_settings
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` TEXT NULL DEFAULT NULL,
  `group` VARCHAR(50) NOT NULL DEFAULT 'general',
  `description` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- INITIAL SYSTEM SEED DATA
-- =====================================================================

-- 1. Default Super Admin User (password: Password123!)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `status`, `created_at`, `updated_at`)
VALUES
(1, 'System Administrator', 'admin@smartomr.edu', '$2y$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'super_admin', 'active', NOW(), NOW()),
(2, 'Prof. Alex Mercer', 'teacher@smartomr.edu', '$2y$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'teacher', 'active', NOW(), NOW());

-- 2. Teacher Profile
INSERT INTO `teachers` (`id`, `user_id`, `employee_id`, `designation`, `department`, `phone`, `created_at`, `updated_at`)
VALUES
(1, 2, 'TCH-1001', 'Senior Physics Lecturer', 'Department of Natural Sciences', '+1-555-0199', NOW(), NOW());

-- 3. Standard OMR Templates
INSERT INTO `omr_templates` (`id`, `code`, `name`, `total_questions`, `options_per_question`, `columns_count`, `is_active`, `created_at`, `updated_at`)
VALUES
(1, 'omr_20_v1', 'Standard 20-MCQ A4 (2 Columns)', 20, 4, 2, 1, NOW(), NOW()),
(2, 'omr_25_v1', 'Standard 25-MCQ A4 (2 Columns)', 25, 4, 2, 1, NOW(), NOW()),
(3, 'omr_50_v1', 'Standard 50-MCQ A4 (2 Columns)', 50, 4, 2, 1, NOW(), NOW()),
(4, 'omr_100_v1', 'Standard 100-MCQ A4 (4 Columns)', 100, 4, 4, 1, NOW(), NOW());

-- 4. Academic Core Hierarchy
INSERT INTO `classes` (`id`, `name`, `code`, `description`, `status`, `created_at`, `updated_at`)
VALUES
(1, 'Higher Secondary Class XII', 'HSC-2026', 'Higher Secondary Certificate Examination Batch 2026', 'active', NOW(), NOW()),
(2, 'Secondary Class X', 'SSC-2026', 'Secondary School Certificate Examination Batch 2026', 'active', NOW(), NOW());

INSERT INTO `batches` (`id`, `class_id`, `name`, `session`, `max_students`, `status`, `created_at`, `updated_at`)
VALUES
(1, 1, 'Science Group A', '2025-2026', 80, 'active', NOW(), NOW()),
(2, 1, 'Science Group B', '2025-2026', 80, 'active', NOW(), NOW());

INSERT INTO `sections` (`id`, `batch_id`, `name`, `room_no`, `created_at`, `updated_at`)
VALUES
(1, 1, 'Morning Section A1', 'Room 301', NOW(), NOW()),
(2, 1, 'Day Section A2', 'Room 302', NOW(), NOW());

INSERT INTO `subjects` (`id`, `name`, `code`, `description`, `created_at`, `updated_at`)
VALUES
(1, 'Physics Paper 1', 'PHY-101', 'Mechanics, Waves, and Thermodynamics', NOW(), NOW()),
(2, 'Chemistry Paper 1', 'CHE-101', 'Inorganic and Physical Chemistry', NOW(), NOW()),
(3, 'Mathematics Paper 1', 'MAT-101', 'Calculus, Algebra, and Coordinate Geometry', NOW(), NOW());

-- 5. System Configuration Settings
INSERT INTO `system_settings` (`key`, `value`, `group`, `description`, `created_at`, `updated_at`)
VALUES
('institution_name', 'Metropolitan Institute of Science & Technology', 'general', 'Name of the university or institution shown on OMR sheets and reports', NOW(), NOW()),
('institution_code', 'MIST-ACAD', 'general', 'Academic institution registration identifier', NOW(), NOW()),
('contact_email', 'examination@smartomr.edu', 'general', 'Official examination board contact email', NOW(), NOW()),
('omr_fill_threshold', '0.42', 'omr', 'Bubble fill density threshold above which bubble is considered marked', NOW(), NOW()),
('omr_blank_threshold', '0.22', 'omr', 'Threshold below which bubble is treated as completely blank', NOW(), NOW()),
('omr_uncertain_threshold', '0.12', 'omr', 'Maximum margin between runner-up bubbles before marking is flagged as uncertain', NOW(), NOW()),
('allow_student_portal', 'true', 'portal', 'Allow students to log in and inspect their published merit ranks and breakdown', NOW(), NOW()),
('default_negative_marking', '0.25', 'grading', 'Default penalty deducted for incorrect answers', NOW(), NOW()),
('default_passing_percentage', '40.00', 'grading', 'Minimum percentage required to achieve passing status', NOW(), NOW());

