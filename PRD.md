# Product Requirements Document
## Beauty Clinic Management System

**Version:** 1.0  
**Date:** May 4, 2026  
**Status:** Final  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Roles & Personas](#4-user-roles--personas)
5. [System Architecture](#5-system-architecture)
6. [Feature Requirements](#6-feature-requirements)
   - 6.1 Authentication & Access Control
   - 6.2 Appointment & Calendar Management
   - 6.3 Patient Management
   - 6.4 Patient Files & Medical Records
   - 6.5 Session Recording & Financial Tracking
   - 6.6 Doctor Management
   - 6.7 Service Catalog
   - 6.8 Materials & Tools Inventory
   - 6.9 Coupon & Discount System
   - 6.10 Notification System
   - 6.11 Financial Reports
   - 6.12 User Management
   - 6.13 Practitioner Type Configuration
   - 6.14 System Administration (Superadmin)
   - 6.15 Activity & API Audit Logs
   - 6.16 Settings Management
7. [Role-Based Feature Matrix](#7-role-based-feature-matrix)
8. [Data Models](#8-data-models)
9. [API Specification Summary](#9-api-specification-summary)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Tech Stack](#11-tech-stack)
12. [Key Workflows](#12-key-workflows)
13. [Security Requirements](#13-security-requirements)
14. [Open Items & Future Enhancements](#14-open-items--future-enhancements)

---

## 1. Executive Summary

The **Beauty Clinic Management System** is a full-stack web application designed to digitize and streamline all operations of a beauty and medical aesthetic clinic. It replaces paper-based or fragmented processes with a unified platform covering appointment scheduling, patient medical files, session recording, financial tracking, inventory management, and multi-role staff access.

The system is architected as a React SPA (single-page application) communicating with a Laravel RESTful API backend backed by a MySQL database. Five distinct user roles — Superadmin, Admin, Doctor, Assistant, and Accountant — each receive a tailored portal with precisely scoped access. Every data mutation is audited, and all sensitive records use soft deletes to preserve historical data integrity.

---

## 2. Product Overview

### 2.1 Problem Statement

Beauty and medical aesthetic clinics face operational friction in four key areas:

1. **Scheduling fragmentation** — appointments tracked in spreadsheets or paper calendars with no automated reminders or doctor visibility.
2. **Disconnected patient records** — each doctor maintains separate notes with no central patient history, photo documentation, or prescription tracking.
3. **Manual financial reconciliation** — session revenue, discount codes, and material costs tallied by hand, leading to revenue leakage and reporting delays.
4. **Opaque inventory** — no real-time stock tracking of consumable materials, making supply management reactive rather than proactive.

### 2.2 Solution

A role-driven clinic management platform that:

- Provides a shared appointment calendar with per-doctor visibility controls.
- Centralizes patient files per doctor-patient relationship, including photos, prescriptions, attachments, and session histories.
- Automatically calculates session profitability (service price minus material costs minus coupon discounts).
- Decrements inventory in real time when materials are consumed in a session.
- Exports financial data to CSV for accounting and compliance needs.
- Logs every action for audit and compliance purposes.

### 2.3 Scope

**In scope:**
- Multi-role web application (SPA + REST API)
- Appointment scheduling with calendar views
- Patient file management (sessions, photos, prescriptions, attachments)
- Service catalog and practitioner type configuration
- Materials and tools inventory management
- Coupon/discount management
- Financial reporting with CSV export
- Notification management (email, SMS, WhatsApp)
- User and permission management
- System module and feature-flag administration

**Out of scope (v1.0):**
- Native mobile applications
- Online patient self-booking portal
- Third-party EHR/EMR integrations
- Real-time video consultations
- Payment gateway integration

---

## 3. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Reduce appointment no-shows | Notification reminder send rate | ≥ 90% of upcoming appointments receive a reminder |
| Eliminate manual financial reconciliation | Automated net-profit calculation accuracy | 100% — system calculates; staff do not adjust manually |
| Real-time inventory tracking | Stock discrepancy rate | < 1% variance between system stock and physical count |
| Centralize patient records | Patient files with at least one session record | ≥ 95% of active patients within 3 months of launch |
| Role-appropriate access | Support tickets from unauthorized access attempts | 0 |
| Audit completeness | Activity log coverage | 100% of create/update/delete operations logged |

---

## 4. User Roles & Personas

### 4.1 Superadmin

**Who:** Technical owner or clinic IT administrator.  
**Responsibilities:** Full system control — enable/disable modules, manage feature flags, configure role visibility, view API and activity logs, trigger artisan commands, manage all users.  
**Key needs:** Visibility into system health, ability to configure the platform without code deployments.

### 4.2 Admin

**Who:** Clinic manager or front-desk supervisor.  
**Responsibilities:** Day-to-day clinic operations — manage doctors, patients, appointments, services, materials, users, coupons, notifications, settings, and reports.  
**Key needs:** A single dashboard that gives full operational control without requiring technical knowledge.

### 4.3 Doctor

**Who:** Licensed medical or aesthetic practitioner.  
**Responsibilities:** View own appointments, manage own patient files, log session details, add prescriptions and photos.  
**Key needs:** A focused portal showing only their own schedule and patients, with fast access to record session outcomes.

### 4.4 Assistant

**Who:** Front-desk staff or medical assistant.  
**Responsibilities:** Create and edit appointments, register patients, manage coupons, send notifications.  
**Key needs:** Quick patient lookup and appointment creation; does not need financial or medical record details.

### 4.5 Accountant

**Who:** Finance staff or external auditor.  
**Responsibilities:** Access session and financial reports; export CSV data for accounting.  
**Key needs:** Read-only financial dashboard with flexible date/filter controls and reliable export functionality.

---

## 5. System Architecture

### 5.1 High-Level Overview

```
Browser (React SPA)
        │
        │  HTTPS + Bearer Token
        ▼
Laravel API  (backend/, port 8000)
  ├── Sanctum Authentication
  ├── Role Middleware
  ├── Request Validation
  ├── Eloquent ORM
  └── MySQL Database
        ├── Core tables (users, doctors, patients, appointments...)
        ├── Medical tables (patient_files, session_records, prescriptions...)
        ├── Business tables (coupons, notifications, services, materials...)
        └── Audit tables (activity_log, api_request_logs)
```

### 5.2 Frontend Structure

```
src/
├── app/
│   ├── components/          # Role dashboards, modal forms, data views
│   ├── contexts/            # PractitionerTypeContext
│   └── types/               # TypeScript interfaces
└── lib/
    ├── api.ts               # HTTP client (auth, dedup, rate-limit)
    └── services/            # 17 domain service modules
```

### 5.3 Backend Structure

```
backend/
├── app/
│   ├── Models/              # 20 Eloquent models with relationships
│   └── Http/Controllers/Api/V1/   # 19 API controllers
├── database/
│   ├── migrations/          # 35 schema migrations
│   └── seeders/             # Demo data seeders
└── routes/api.php           # All API routes (versioned under /api/v1)
```

---

## 6. Feature Requirements

### 6.1 Authentication & Access Control

#### 6.1.1 Login

- Users authenticate with email and password.
- Successful login issues a Laravel Sanctum token stored in `localStorage`.
- All previous tokens for the user are revoked on new login (single-session enforcement).
- Token expires after 7 days.
- Failed login attempts are throttled: maximum 5 per minute per IP.
- The API client attaches the token as a `Bearer` header on every request.
- A `401` response triggers an automatic re-authentication flow.

#### 6.1.2 Password Reset

- User requests a reset email from the login screen.
- Reset request endpoint throttled to 3 per minute.
- User receives a token-based link and can set a new password.
- Reset endpoint throttled to 5 per minute.

#### 6.1.3 Role-Based Authorization

- Five roles: `superadmin`, `admin`, `doctor`, `assistant`, `accountant`.
- Role is stored on the `users` table and enforced by Laravel middleware on every protected route.
- Ten per-user permission flags override role defaults for fine-grained tab/feature visibility:
  - `perm_show_calendar`, `perm_show_patients`, `perm_show_doctors`, `perm_show_services`
  - `perm_show_users`, `perm_show_settings`, `perm_show_activity_log`, `perm_show_reports`
  - `perm_show_materials_tools`, `perm_show_practitioner_types`

---

### 6.2 Appointment & Calendar Management

#### 6.2.1 Calendar View

- Monthly and daily calendar views available to all calendar-permitted roles.
- Monthly view shows appointment counts per day; daily view shows a time-slot timeline.
- Navigation controls to move between months and days.
- Appointments displayed with patient name, doctor name, and status indicator.

#### 6.2.2 Appointment CRUD

- Create appointments by selecting patient, doctor, date, start time, duration, and optional notes.
- Appointment end time calculated automatically from start time + duration.
- Status lifecycle: `scheduled` → `completed` or `cancelled`.
- Edit and delete permitted for Admin, Superadmin; Doctors may edit their own.
- Filter appointments by date (`/appointments/date/{date}`) or doctor (`/appointments/doctor/{uuid}`).
- "Patients of the Day" view lists all appointments scheduled for the current date.

#### 6.2.3 Doctor Appointment Scoping

- Doctors see only appointments assigned to them.
- Admins and Superadmins see all appointments across all doctors.

---

### 6.3 Patient Management

#### 6.3.1 Patient CRUD

- Create, read, update, and delete patient records.
- Patient fields: name, email, phone, date of birth, address, emergency contact, notes.
- System auto-tracks `last_visit` and `total_visits` derived from session records.
- Patient records use soft deletes (data is never permanently removed).
- All authenticated roles can view and create patients; delete is restricted to Admin/Superadmin.

#### 6.3.2 Patient Lookup

- Searchable patient list with filtering.
- Patient detail modal shows demographics, linked files, and visit history.

---

### 6.4 Patient Files & Medical Records

#### 6.4.1 Patient File Structure

- A **Patient File** is a unique record per `(patient, doctor)` pair — one file per relationship.
- A patient file is created automatically when a session is logged for that doctor-patient combination.
- Each file is the container for all medical data between that doctor and patient.

#### 6.4.2 Session Records

See [Section 6.5](#65-session-recording--financial-tracking).

#### 6.4.3 Patient Photos

- Upload photos categorized as `before`, `after`, or `during` a session.
- Photos are stored as file uploads (multipart form) and associated with both a patient file and an optional session.
- Delete photos individually.
- Supports before/after comparison documentation for aesthetic outcomes.

#### 6.4.4 Prescriptions

- Doctors create prescriptions attached to a patient file.
- Fields: medication name, dosage, frequency, duration, optional file upload (PDF), notes.
- Prescription list is viewable within the patient file; individual prescriptions can be edited or deleted.
- Restricted to roles with prescription permissions.

#### 6.4.5 File Attachments

- Attach arbitrary documents (lab results, medical records, consent forms) to a patient file.
- Associates each attachment with an optional session record.
- Tracks uploader, MIME type, and file name.
- Delete individual attachments.

#### 6.4.6 Access Scoping

- Doctors can only access files where they are the assigned doctor.
- Admins and Superadmins can access all patient files.
- Assistants can view patient files but cannot create prescriptions.

---

### 6.5 Session Recording & Financial Tracking

#### 6.5.1 Session Creation

- A session record is created after an appointment is completed.
- Required fields: patient file, appointment, service performed, optional coupon code.
- Optional fields: notes, materials used.

#### 6.5.2 Financial Calculation

All calculations are performed server-side:

```
service_price         = selected service's price
discount_amount       = coupon discount (percent or fixed, capped by max_discount_amount)
total_materials_cost  = Σ (quantity × unit_price) for all materials used
net_profit            = service_price - discount_amount - total_materials_cost
```

- `original_service_price` stores the price at time of session (price changes do not retroactively affect records).

#### 6.5.3 Materials Used

- Record one or more materials consumed during a session.
- Each entry stores: material reference, material name snapshot, quantity, unit price snapshot, total price.
- Creating a session decrements the stock of each material used.

#### 6.5.4 Coupon Application

- Coupon is validated at session time: must be active, within date range, and below usage limit.
- Discount applied to session; coupon `uses_count` incremented.
- Coupon details (code, discount type, discount value) stored on the session record for historical accuracy.

#### 6.5.5 Session Editing & Deletion

- Sessions may be edited or deleted by authorized roles.
- Deleting a session soft-deletes the record; material stock is not automatically re-credited (manual adjustment required).

---

### 6.6 Doctor Management

#### 6.6.1 Doctor Profiles

- Each doctor corresponds to a system `User` (one-to-one relationship).
- Doctor fields: name, email, phone, specialty, experience, qualifications, license number.
- Linked to a **Practitioner Type** that defines capabilities and scheduling rules.
- `availability` stored as a JSON schedule (days/hours available).
- `custom_permissions` JSON allows per-doctor overrides of practitioner type defaults.

#### 6.6.2 Doctor Services

- Doctors are linked to services they are authorized to perform via a `doctor_services` pivot table.

#### 6.6.3 Doctor CRUD

- Create, update, and delete doctors restricted to Admin and Superadmin.
- All authenticated roles can read doctor profiles (for appointment creation).

---

### 6.7 Service Catalog

#### 6.7.1 Services

- Service fields: name, category, duration (minutes), price, description, popular flag.
- Admin and Superadmin can create, update, and delete services.
- All authenticated roles can read the service list (needed during appointment/session forms).

#### 6.7.2 Service Categories

- Services grouped by category (e.g., Facial, Laser, Dental, Wellness).
- Practitioner types can restrict which service categories their doctors may perform.

---

### 6.8 Materials & Tools Inventory

#### 6.8.1 Inventory Items

- Items classified as `material` (consumable) or `tool` (reusable equipment).
- Fields: name, type, unit price, unit of measure, stock quantity, supplier, notes.
- Admin and Superadmin can create, update, and delete inventory items.

#### 6.8.2 Stock Tracking

- `stock_quantity` is automatically decremented when a session records usage of that material.
- Read access available to all authenticated roles (needed when logging session materials).

---

### 6.9 Coupon & Discount System

#### 6.9.1 Coupon Configuration

- Fields: code (unique), description, discount type (`percent` or `fixed`), discount value.
- For percent discounts: optional `max_discount_amount` caps the maximum deduction.
- Validity window: `starts_at` and `ends_at` timestamps.
- Usage limit: `max_uses`; system tracks `uses_count`.
- `is_active` flag for manual enable/disable.

#### 6.9.2 Coupon Validation (Preview)

- Any authenticated user can call the preview endpoint with a coupon code and service price.
- Response returns the calculated discount amount and validity status without committing the coupon.

#### 6.9.3 Coupon CRUD

- Create, update, and delete restricted to Admin, Superadmin, and Assistant.

---

### 6.10 Notification System

#### 6.10.1 Notification Types

- `reminder` — sent before an appointment to remind the patient.
- `confirmation` — sent to confirm a booked appointment.

#### 6.10.2 Notification Channels

- Supported delivery methods: `email`, `sms`, `whatsapp`.
- Method is recorded on the notification record.

#### 6.10.3 Notification Records

- Every notification sent is persisted with: patient, appointment, type, method, sent at timestamp, sent by user, status (`sent` or `failed`), and full message content.

#### 6.10.4 Reminder Batching

- Batch-send reminders to all appointments that are upcoming within a configured window.
- Available to Admin, Superadmin, Doctor, and Assistant.

#### 6.10.5 Pending Notifications

- View pending (unsent) notifications for upcoming appointments.
- Patient-level notification count endpoint aggregates unnotified appointments per patient.

---

### 6.11 Financial Reports

#### 6.11.1 Session Report

- Lists all session records with: patient, doctor, service, service price, materials cost, coupon discount, net profit.
- Filterable by date range, doctor, and service.
- Exportable to CSV.

#### 6.11.2 Financial Summary Report

- Aggregated financial metrics: total revenue, total discounts applied, total materials cost, total net profit.
- Filterable by date range.
- Exportable to CSV.

#### 6.11.3 Access

- Read access: Admin, Superadmin, Accountant.
- Accountant role has access **only** to the reports module.

---

### 6.12 User Management

#### 6.12.1 User CRUD

- Admin and Superadmin can create, view, update, and delete user accounts.
- User fields: name, email, password, role, active status, practitioner type, ten permission flags.
- `is_active` flag; inactive users cannot log in.

#### 6.12.2 User Activation Toggle

- Superadmin can toggle a user's active status via a dedicated endpoint.

---

### 6.13 Practitioner Type Configuration

#### 6.13.1 Practitioner Types

- Defines a category of medical/aesthetic practitioners (e.g., Dermatologist, Therapist, Dentist).
- Fields: name, category (Medical / Aesthetic / Wellness / Dental / Therapeutic / Other), color, icon.

#### 6.13.2 Permission Flags (8 bits)

| Flag | Description |
|------|-------------|
| `can_prescribe` | May write prescriptions |
| `can_perform_surgery` | May perform surgical procedures |
| `can_manage_inventory` | May consume/record inventory |
| `can_access_all_patients` | Not restricted to own patient files |
| `requires_supervision` | Must have a supervising practitioner |
| `can_issue_referrals` | May issue referrals |
| `can_access_lab_results` | May view lab result attachments |
| `can_perform_procedures` | May log procedural session records |

#### 6.13.3 Feature Flags (12 toggles)

| Flag | Description |
|------|-------------|
| `needs_before_after_photos` | Requires before/after photo documentation |
| `needs_skin_analysis` | Requires skin analysis form |
| `needs_dental_chart` | Requires dental charting |
| `needs_body_chart` | Requires body chart annotation |
| `needs_hair_analysis` | Requires hair analysis form |
| `needs_laser_settings` | Records laser device settings per session |
| `needs_nutrition_plan` | Associates nutrition plans with sessions |
| `needs_exercise_plan` | Associates exercise plans with sessions |
| `needs_psychological_assessment` | Requires psychological assessment |
| `needs_allergy_check` | Requires allergy verification |
| `needs_consent_form` | Requires signed consent form |
| `needs_follow_up_schedule` | Requires follow-up scheduling |

#### 6.13.4 Scheduling Rules (6 parameters)

| Rule | Description |
|------|-------------|
| `default_appointment_duration` | Default session length in minutes |
| `buffer_time_before` | Prep time before each appointment (minutes) |
| `buffer_time_after` | Cleanup time after each appointment (minutes) |
| `allow_double_booking` | Whether overlapping appointments are permitted |
| `requires_initial_consultation` | First visit must be a consultation |
| `max_patients_per_day` | Daily patient cap |

#### 6.13.5 Service Restrictions

- `allowed_service_categories` (JSON array) restricts which service categories practitioners of this type may perform.
- `certifications` (JSON array) records required certifications for this practitioner type.

---

### 6.14 System Administration (Superadmin)

#### 6.14.1 Module Management

- `SystemModule` records define named feature modules (e.g., Calendar, Reports, Inventory).
- Each module has an `enabled` flag and `enabled_for_roles` JSON array.
- Superadmin can enable/disable entire modules or restrict them per role via the UI.

#### 6.14.2 Feature Flags

- `SystemFeatureFlag` records are nested under modules.
- Fine-grained toggles for individual features within a module.
- Superadmin can enable/disable individual feature flags.

#### 6.14.3 Role Tab Visibility

- Superadmin configures which navigation tabs each role sees in the dashboard.
- Persisted server-side; frontend reads this configuration on load.

#### 6.14.4 Artisan Commands

- Superadmin can trigger Laravel artisan commands through the UI (e.g., cache:clear, queue:restart).
- Requires Superadmin role and is logged in the activity log.

#### 6.14.5 System User List

- Superadmin views all users regardless of active status.
- Toggle active/inactive status per user.

---

### 6.15 Activity & API Audit Logs

#### 6.15.1 Activity Log

- Every create, update, and delete operation generates an `ActivityLog` record.
- Stored fields: user ID, action verb, subject type, subject ID, old values (JSON), new values (JSON), IP address, user agent.
- Queryable by: action, subject type, subject ID.
- Viewable by Admin and Superadmin.

#### 6.15.2 API Request Log

- Every API request is logged: method, path, user ID, IP, response status, request headers (JSON), request payload (JSON), response body (JSON), response time (ms).
- Viewable by Superadmin only.
- Used for debugging, performance analysis, and security auditing.

---

### 6.16 Settings Management

- Global key-value configuration store for clinic-wide preferences (clinic name, contact info, notification templates, etc.).
- Read: all authenticated roles.
- Write: Admin and Superadmin only.

---

## 7. Role-Based Feature Matrix

| Feature | Superadmin | Admin | Doctor | Assistant | Accountant |
|---------|:---:|:---:|:---:|:---:|:---:|
| View Calendar | ✓ | ✓ | ✓ (own) | ✓ | ✗ |
| Create/Edit Appointments | ✓ | ✓ | ✓ (own) | ✓ | ✗ |
| Delete Appointments | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Patients | ✓ | ✓ | ✓ (own) | ✓ | ✗ |
| Create/Edit Patients | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete Patients | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Patient Files | ✓ | ✓ | ✓ (own) | ✓ | ✗ |
| Create Session Records | ✓ | ✓ | ✓ (own) | ✓ | ✗ |
| Upload Patient Photos | ✓ | ✓ | ✓ (own) | ✓ | ✗ |
| Upload Attachments | ✓ | ✓ | ✓ (own) | ✓ | ✗ |
| Create Prescriptions | ✓ | ✓ | ✓ (own) | ✗ | ✗ |
| Manage Doctors | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage Services | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage Materials/Tools | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage Coupons | ✓ | ✓ | ✗ | ✓ | ✗ |
| Preview Coupon | ✓ | ✓ | ✓ | ✓ | ✗ |
| Manage Users | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage Practitioner Types | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Reports | ✓ | ✓ | ✗ | ✗ | ✓ |
| Export Reports (CSV) | ✓ | ✓ | ✗ | ✗ | ✓ |
| View Activity Log | ✓ | ✓ | ✗ | ✗ | ✗ |
| View API Log | ✓ | ✗ | ✗ | ✗ | ✗ |
| Send Notifications | ✓ | ✓ | ✓ | ✓ | ✗ |
| Manage System Modules | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage Feature Flags | ✓ | ✗ | ✗ | ✗ | ✗ |
| Configure Tab Visibility | ✓ | ✗ | ✗ | ✗ | ✗ |
| Run Artisan Commands | ✓ | ✗ | ✗ | ✗ | ✗ |
| Edit System Settings | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## 8. Data Models

### 8.1 Entity Relationship Summary

```
User ────────────── Doctor (1:1)
                       │
         ┌─────────────┼──────────────────┐
         ▼             ▼                  ▼
  PatientFile    Appointment        Doctor_Services
       │               │
  ┌────┼────┐          ▼
  │    │    │    SessionRecord ──── SessionMaterialUsage
  │    │    │         │
  ▼    ▼    ▼         ▼
Photo  Rx  Attach   Coupon
                       │
                    Patient ──── PatientFile
                       │
                    NotificationRecord
```

### 8.2 Core Models

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | string | |
| email | string | unique |
| password | hashed | |
| role | enum | superadmin, admin, doctor, assistant, accountant |
| is_active | boolean | |
| practitioner_type_id | UUID FK | nullable |
| perm_show_calendar | boolean | |
| perm_show_patients | boolean | |
| perm_show_doctors | boolean | |
| perm_show_services | boolean | |
| perm_show_users | boolean | |
| perm_show_settings | boolean | |
| perm_show_activity_log | boolean | |
| perm_show_reports | boolean | |
| perm_show_materials_tools | boolean | |
| perm_show_practitioner_types | boolean | |

#### Doctor
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| user_id | UUID FK | one-to-one User |
| practitioner_type_id | UUID FK | nullable |
| name | string | |
| email | string | |
| phone | string | |
| specialty | string | |
| experience | string | |
| qualifications | text | |
| license_number | string | |
| availability | JSON | weekly schedule |
| custom_permissions | JSON | per-doctor overrides |
| deleted_at | timestamp | soft delete |

#### Patient
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | string | |
| email | string | |
| phone | string | |
| date_of_birth | date | |
| address | text | |
| emergency_contact | string | |
| notes | text | |
| last_visit | date | auto-tracked |
| total_visits | integer | auto-tracked |
| deleted_at | timestamp | soft delete |

#### Appointment
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| patient_id | UUID FK | |
| doctor_id | UUID FK | |
| date | date | |
| start_time | time | |
| end_time | time | calculated |
| duration | integer | minutes |
| status | enum | scheduled, completed, cancelled |
| notes | text | |
| deleted_at | timestamp | soft delete |

#### PatientFile
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| patient_id | UUID FK | |
| doctor_id | UUID FK | |
| deleted_at | timestamp | soft delete |

Unique constraint: `(patient_id, doctor_id)`

#### SessionRecord
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| patient_file_id | UUID FK | |
| appointment_id | UUID FK | nullable |
| service_id | UUID FK | nullable (snapshot for history) |
| coupon_id | UUID FK | nullable |
| service_name | string | snapshot at session time |
| service_price | decimal | snapshot at session time |
| original_service_price | decimal | pre-discount price |
| discount_amount | decimal | coupon discount applied |
| total_materials_cost | decimal | sum of materials used |
| net_profit | decimal | calculated |
| performed_by | UUID FK | user who logged it |
| notes | text | |
| deleted_at | timestamp | soft delete |

#### SessionMaterialUsage
| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| session_record_id | UUID FK | |
| material_id | UUID FK | |
| material_name | string | snapshot |
| quantity | decimal | |
| unit_price | decimal | snapshot |
| total_price | decimal | calculated |

#### Service
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | string | |
| category | string | |
| duration | integer | minutes |
| price | decimal | |
| description | text | |
| popular | boolean | |
| deleted_at | timestamp | soft delete |

#### MaterialOrTool
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | string | |
| type | enum | material, tool |
| unit_price | decimal | |
| unit | string | |
| stock_quantity | decimal | |
| supplier | string | |
| notes | text | |
| deleted_at | timestamp | soft delete |

#### Coupon
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| code | string | unique |
| description | text | |
| discount_type | enum | percent, fixed |
| discount_value | decimal | |
| max_discount_amount | decimal | nullable; caps percent discounts |
| starts_at | timestamp | nullable |
| ends_at | timestamp | nullable |
| max_uses | integer | nullable |
| uses_count | integer | auto-incremented |
| is_active | boolean | |

#### NotificationRecord
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| patient_id | UUID FK | |
| appointment_id | UUID FK | |
| type | enum | reminder, confirmation |
| sent_at | timestamp | |
| sent_by | UUID FK | user |
| method | enum | email, sms, whatsapp |
| status | enum | sent, failed |
| message | text | full message content |

#### PractitionerType
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | string | |
| category | enum | Medical, Aesthetic, Wellness, Dental, Therapeutic, Other |
| color | string | hex color |
| icon | string | icon identifier |
| can_prescribe … (8 permission flags) | boolean | |
| needs_before_after_photos … (12 feature flags) | boolean | |
| default_appointment_duration … (6 scheduling rules) | mixed | |
| certifications | JSON | |
| allowed_service_categories | JSON | |

#### SystemModule
| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| key | string | unique slug |
| name | string | display name |
| description | text | |
| enabled | boolean | |
| enabled_for_roles | JSON | array of role strings |
| sort_order | integer | |

#### ActivityLog
| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| user_id | UUID FK | who acted |
| action | string | created, updated, deleted |
| subject_type | string | model class |
| subject_id | string | UUID of record |
| old_values | JSON | before state |
| new_values | JSON | after state |
| ip | string | |
| user_agent | string | |

---

## 9. API Specification Summary

All API endpoints are versioned under `/api/v1/`. Authentication uses `Bearer <token>` header. All responses are JSON.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | Public | Login; returns Sanctum token |
| POST | `/auth/forgot-password` | Public | Send reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |
| POST | `/auth/logout` | Required | Revoke current token |
| GET | `/auth/me` | Required | Get authenticated user profile |
| PUT | `/auth/password` | Required | Change own password |

### Appointments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/appointments` | Required | List all appointments |
| GET | `/appointments/date/{date}` | Required | Appointments for a date |
| GET | `/appointments/doctor/{uuid}` | Required | Appointments for a doctor |
| GET | `/appointments/{uuid}` | Required | Single appointment |
| POST | `/appointments` | Required | Create appointment |
| PUT | `/appointments/{uuid}` | Required | Update appointment |
| DELETE | `/appointments/{uuid}` | Required | Delete appointment |

### Patients

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/patients` | Required | List patients |
| GET | `/patients/{uuid}` | Required | Single patient |
| POST | `/patients` | Required | Create patient |
| PUT | `/patients/{uuid}` | Required | Update patient |
| DELETE | `/patients/{uuid}` | Required | Delete patient |
| GET | `/patients/{uuid}/files` | Required | Patient's files |
| GET | `/patients/{uuid}/files/{doctorUuid}` | Required | Specific file |

### Patient File Sub-Resources

All nested under `/patient-files/{fileUuid}/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `sessions` / `sessions/{id}` | Session CRUD |
| GET/POST/DELETE | `photos` / `photos/{id}` | Photo management |
| GET/POST/DELETE | `attachments` / `attachments/{id}` | Attachment management |
| GET/POST/PUT/DELETE | `prescriptions` / `prescriptions/{id}` | Prescription CRUD |

### Doctors

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/doctors` | Required | List doctors |
| GET | `/doctors/{uuid}` | Required | Single doctor |
| POST | `/doctors` | Admin+ | Create doctor |
| PUT | `/doctors/{uuid}` | Admin+ | Update doctor |
| DELETE | `/doctors/{uuid}` | Admin+ | Delete doctor |

### Services, Materials, Coupons, Users, Practitioner Types

Standard CRUD following the same read-all / read-one / create / update / delete pattern. Write operations require Admin or Superadmin (Coupons also allow Assistant).

### Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reports/sessions` | Admin/Accountant+ | Session report |
| GET | `/reports/sessions/export` | Admin/Accountant+ | CSV export |
| GET | `/reports/financial` | Admin/Accountant+ | Financial summary |
| GET | `/reports/financial/export` | Admin/Accountant+ | CSV export |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications/pending` | Admin/Doctor/Assistant+ | Pending notifications |
| GET | `/notifications/patient-counts` | Admin/Superadmin | Counts per patient |
| GET | `/notifications` | Required | All notifications |
| POST | `/notifications` | Required | Create notification |
| POST | `/notifications/send-reminders` | Admin/Doctor/Assistant+ | Batch send reminders |

### System (Superadmin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/system/modules` | Module management |
| GET/PUT | `/system/feature-flags` | Feature flag management |
| GET/PUT | `/system/role-tab-visibility` | Tab visibility per role |
| GET | `/system/activity-log` | System activity log |
| GET | `/system/api-log` | API request log |
| POST | `/system/run-artisan` | Execute artisan command |
| GET | `/system/users` | All users (incl. inactive) |
| PUT | `/system/users/{uuid}/active` | Toggle active status |

---

## 10. Non-Functional Requirements

### 10.1 Performance

- API response time under normal load: ≤ 300ms for list endpoints, ≤ 150ms for single-record fetches.
- The frontend HTTP client implements request deduplication — identical concurrent requests are collapsed into one.
- The client enforces client-side rate limiting to prevent API flooding from rapid UI interactions.
- File uploads for photos and attachments must support files up to 10 MB.

### 10.2 Reliability

- Soft deletes on all core entities ensure no patient or financial data is permanently lost through normal operations.
- Price and material cost snapshots on session records ensure historical financial accuracy even if service or material prices change.
- All financial calculations are performed server-side to prevent client-side tampering.

### 10.3 Scalability

- All primary keys are UUIDs to support future distributed or replicated database setups.
- API is stateless (token-based auth); horizontal scaling requires only shared database access.

### 10.4 Usability

- Each role receives a dedicated portal or dashboard tailored to their workflow — no role sees irrelevant UI.
- Per-user permission flags allow fine-tuning individual access without changing their role.
- Superadmin can enable/disable entire modules per role without a code deployment.

### 10.5 Accessibility

- UI components are built on Radix UI (accessible, unstyled primitives) and Shadcn.
- Keyboard navigation and ARIA labels provided by the underlying component library.

### 10.6 Internationalization

- Dates handled with `date-fns` for locale-aware formatting.
- All user-facing text is in the UI component layer; backend responses use English field names and enums (i18n layer can be added in a future version).

---

## 11. Tech Stack

### 11.1 Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | strict mode | Type safety |
| Vite | 6.3.5 | Build tool and dev server |
| Tailwind CSS | 4.1.12 | Utility-first styling |
| Radix UI | latest | Accessible UI primitives |
| Shadcn/ui | — | Pre-built component library |
| React Hook Form | — | Form state management |
| Recharts | — | Financial charts |
| React Day Picker | — | Date selection |
| date-fns | — | Date utilities |
| Lucide React | — | Icon library |
| Sonner | — | Toast notifications |
| React DnD | — | Drag-and-drop interactions |

### 11.2 Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Laravel | 10.10 | PHP API framework |
| PHP | 8.1+ | Server language |
| MySQL | — | Relational database |
| Laravel Sanctum | — | Token-based authentication |
| Eloquent ORM | — | Database access layer |
| Laravel Form Requests | — | Input validation |
| Laravel Resources | — | API response shaping |
| Soft Deletes | — | Data retention |

### 11.3 Infrastructure

- **Dev server:** XAMPP (Apache + MySQL)
- **Frontend dev port:** 5173 (Vite)
- **Backend API port:** 8000 (Laravel artisan serve)
- **Auth:** Bearer token in `localStorage`, 7-day expiry
- **File storage:** Local filesystem (configurable to cloud storage)

---

## 12. Key Workflows

### 12.1 Full Appointment → Session Flow

```
1.  Admin/Assistant creates Appointment
    → selects Patient, Doctor, Date, Time, Duration
    → status = "scheduled"

2.  Doctor views appointment in Calendar (filtered to own)

3.  Doctor opens appointment and creates Session Record
    → selects Service performed
    → records Materials used (auto-decrements stock)
    → optionally applies Coupon code (validated server-side)
    → adds notes

4.  System calculates:
    net_profit = service_price - coupon_discount - total_materials_cost

5.  Session saved; Appointment status updated to "completed"

6.  Doctor optionally uploads Before/After Photos

7.  Doctor optionally writes Prescription

8.  Admin/Assistant sends Notification (reminder or confirmation)
    → recorded in NotificationRecord with full message

9.  Session appears in Financial Reports
```

### 12.2 New Patient Registration Flow

```
1.  Assistant creates Patient record
    → name, phone, email, DOB, address, emergency contact

2.  Admin creates Appointment for patient with selected Doctor

3.  On first session, PatientFile auto-created for (Patient, Doctor) pair

4.  All subsequent sessions with same doctor append to same file
```

### 12.3 Coupon Lifecycle

```
1.  Admin creates Coupon
    → code, discount type, value, date range, max uses

2.  Assistant previews coupon during appointment creation
    → GET /coupons/preview returns discount amount

3.  Doctor applies coupon when creating Session Record
    → server validates: active, in date range, uses_count < max_uses
    → coupon.uses_count incremented
    → discount recorded on SessionRecord
```

### 12.4 Financial Reporting Flow

```
1.  Accountant opens Reports tab (only tab they can see)

2.  Selects date range; optionally filters by doctor or service

3.  Session report table shows each session with:
    patient | doctor | service | price | materials cost | discount | net profit

4.  Financial summary shows aggregated totals

5.  Exports to CSV for bookkeeping / external accounting
```

### 12.5 Practitioner Type Setup Flow

```
1.  Superadmin/Admin creates PractitionerType
    → e.g., "Laser Aesthetician" in Aesthetic category

2.  Configures permissions
    → can_perform_procedures = true, can_prescribe = false

3.  Enables features
    → needs_before_after_photos = true, needs_laser_settings = true

4.  Sets scheduling rules
    → default_appointment_duration = 45, buffer_time_after = 15

5.  Restricts service categories
    → allowed_service_categories = ["Laser", "Aesthetic"]

6.  Assigns type to a Doctor's profile

7.  Doctor inherits all type configuration unless custom_permissions override
```

---

## 13. Security Requirements

| Requirement | Implementation |
|-------------|---------------|
| Authentication | Laravel Sanctum token-based auth, 7-day expiry |
| Single session | All existing tokens revoked on new login |
| Brute-force protection | Login throttled 5/min, reset throttled 3–5/min |
| Authorization | Role middleware on every protected route |
| Data scoping | Doctors can only access own patients/files via query filters |
| Input validation | Laravel Form Request classes on all write endpoints |
| Data retention | Soft deletes; no hard deletes on patient/financial data |
| Audit trail | ActivityLog on every create/update/delete |
| API audit | ApiRequestLog records full request/response for Superadmin review |
| Sensitive data | Passwords hashed (bcrypt); tokens stored as hashed values |
| CORS | Configured in Laravel CORS middleware |
| Financial integrity | All calculations server-side; client sends raw inputs only |

---

## 14. Open Items & Future Enhancements

### 14.1 Known Open Items

| Item | Priority | Notes |
|------|----------|-------|
| Appointment reminder scheduling (cron) | High | `AppointmentReminderCommand` exists; cron job setup required on server |
| SMS/WhatsApp delivery integration | High | Notification records created but actual delivery gateway not yet wired |
| File storage to cloud | Medium | Currently local filesystem; S3/cloud migration needed for production |
| Patient self-booking portal | Low | Out of scope for v1.0 |

### 14.2 Suggested Future Enhancements

| Enhancement | Rationale |
|-------------|-----------|
| Online patient portal (booking + history) | Reduces front-desk load; improves patient experience |
| Payment gateway integration | Enables in-app billing and digital receipts |
| Real-time notifications (WebSockets) | Live appointment updates across staff devices |
| Multi-branch / multi-clinic support | Enables clinic chain expansion |
| Dashboard analytics (charts & KPIs) | Visual summaries of revenue, appointments, top services |
| Mobile application (iOS/Android) | Doctor and assistant access from mobile devices |
| Third-party EHR integration | Data exchange with hospital information systems |
| Automated low-stock alerts | Notify staff when material stock falls below threshold |
| Patient satisfaction surveys | Post-session feedback collection |
| Recall system | Automated reminders for follow-up visits |

---

*End of Product Requirements Document*
