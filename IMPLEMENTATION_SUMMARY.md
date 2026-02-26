# Beauty Clinic – Implementation Summary

This document summarizes the changes made to meet the requested features and what remains to be completed or configured.

---

## ✅ Implemented

### 1. Dynamic calendar (daily & monthly)
- **Backend:** `AppointmentController` index supports `date_from` and `date_to`; `byDate(date)` and `byDoctor(uuid)` unchanged.
- **Frontend:** `CalendarView` and `DoctorPortal` now fetch appointments when the date or view changes (daily: by date, monthly: by date range). Data is refetched after create/update/delete so the calendar always shows current data.

### 2. Soft delete
- **Migration:** `2024_01_01_000017_add_soft_deletes_to_tables.php` adds `deleted_at` to: `patients`, `doctors`, `appointments`, `materials_tools`, `services`, `session_records`, `patient_files`, `practitioner_types`.
- **Models:** All listed models use `SoftDeletes`. Deleted records are excluded from normal queries; `destroy()` sets `deleted_at` instead of hard delete. Appointments are also set to `cancelled` before soft delete.

### 3. Admin backlog (activity log)
- **Backend:** `activity_log` table and `ActivityLog` model; `ActivityLog::log()` for create/update/delete. `ActivityLogController::index()` with filters: `subject_type`, `action`, `user_id`, `date_from`, `date_to`. Logging added for patients and appointments (can be extended to other entities).
- **Frontend:** “Activity Log” tab in Admin dashboard with filters and expandable row details.

### 4. Accountant dashboard
- **Backend:** New role `accountant` (migration `2024_01_01_000019_add_accountant_role_to_users.php`). `ReportsController::sessions()` and `exportSessions()` (CSV) under `role:admin,accountant`. Session update allows `servicePrice`, `totalMaterialsCost`, `netProfit` for admin/accountant.
- **Frontend:** `AccountantDashboard` with sales summary, session list, date/search filters, edit-session modal, and Export CSV. Admin has a “Sales & Export” tab that reuses the same report (embedded).

### 5. Filters and search
- **Backend:**  
  - Patients: existing `?search=` on name, email, phone.  
  - Doctors: `?search=` on name, email, phone, specialty; `?practitioner_type=uuid`.  
  - Services: `?search=` on name, category, description; existing `?category`, `?popular`.  
  - Materials/tools: `?search=` on name, supplier, notes; existing `?type`.  
  - Reports: `?date_from`, `?date_to`, `?search=` on service/performer/patient.
- **Frontend:** Activity log and accountant report UIs use these filters; other list views can pass query params to the same endpoints.

### 6. Export (CSV) for sales
- **Backend:** `GET /reports/sessions/export?date_from=&date_to=` returns CSV (admin/accountant).
- **Frontend:** “Export CSV” in Accountant dashboard and in Admin “Sales & Export” tab; uses auth and triggers download.

### 7. Doctor data isolation
- **Backend:**  
  - `UserResource` and `/auth/me` include `doctorId` when user has a linked doctor.  
  - Appointments: `index`, `byDate`, `byDoctor` restricted to current doctor when `role === 'doctor'`.  
  - Patients: `index` limited to patients with a patient file for the current doctor; `show` returns 403 if the patient has no file with that doctor.  
  - Patient files: `index` returns only the current doctor’s file(s); `show(patientUuid, doctorUuid)` returns 403 if `doctorUuid` is not the current doctor.
- **Frontend:** DoctorPortal uses `appointmentService.byDate` / `byDateRange` (backend already scoped); `PatientsView` in doctor context receives `user.doctorId`.

---

## 🔶 Partially done / to extend

### 8. Material and tools – vendor/type pricing
- **Current:** Single `unit_price` and `type` (material|tool) on `materials_tools`.
- **To do:** Add vendor and type-based pricing, e.g.:
  - Option A: New table `material_prices` (material_id, vendor, type_or_category, unit_price, effective_from).
  - Option B: Add columns `vendor`, `price_type` and a JSON or separate table for multiple prices per item.
- Then use the chosen price in session material usage and in UI.

### 9. SMS / WhatsApp / email notifications
- **Current:** `notification_records` and endpoints for pending reminders and creating records; no actual sending.
- **To do:**  
  - Add a settings table or config for “reminder X days before” (e.g. `reminder_days_before` default 1).  
  - Implement sending (e.g. Laravel Mail, Twilio for SMS, WhatsApp Business API) when creating reminder records or via a scheduled job.  
  - Use appointment and patient data in the message body.

### 10. Material/tools assigned to multiple doctors
- **Current:** No assignment; all authenticated users can read materials.
- **To do:**  
  - Pivot table `doctor_material` (doctor_id, material_id) or `material_assignments`.  
  - Admin UI to assign materials to doctors.  
  - When role is doctor, filter materials (and session material usage) to assigned items only.

### 11. Doctor attachments per patient ✅
- **Done:** Table `patient_file_attachments`, model `PatientFileAttachment`, `PatientFileAttachmentController` (index/store/destroy). Routes under `patient-files/{fileUuid}/attachments`. Doctor can upload any file; stored in `storage/app/public/patient-file-attachments/` and path in DB. Patient file view has an “Attachments” tab: list, upload, delete. Access scoped so doctors only see their own patient files.

---

## 🔧 How to run migrations

```bash
cd backend
php artisan migrate
```

New migrations:
- `2024_01_01_000017_add_soft_deletes_to_tables`
- `2024_01_01_000018_create_activity_log_table`
- `2024_01_01_000019_add_accountant_role_to_users`
- `2024_01_01_000020_create_settings_table` (includes default `reminder_days_before = 1`)
- `2024_01_01_000021_create_material_prices_table` (vendor/type-based pricing; wire in services when needed)
- `2024_01_01_000022_create_doctor_material_table` (pivot for assigning materials to doctors; wire in when needed)
- `2024_01_01_000023_create_patient_file_attachments_table`

---

## 👤 Creating an accountant user

- In Admin → Users, create a user and set **Role** to **Accountant**.  
- Or in DB: `UPDATE users SET role = 'accountant' WHERE email = '...';`  
- Accountant can log in and see only the accountant dashboard (sales report + export).

---

## Optional next steps (from “professional features” research)

- **Compliance:** Keep activity log for audit; consider retention policy.  
- **Security:** Ensure HTTPS; avoid logging sensitive fields in `old_values`/`new_values` (e.g. mask password).  
- **Performance:** Index `activity_log(created_at)`, `session_records(date)`; paginate large exports.  
- **UX:** Bulk actions, clearer empty states, and keyboard shortcuts where useful.
