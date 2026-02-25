# Practitioner Types Management System Guide

## Overview

The Beauty Clinic Management System now includes a comprehensive **Practitioner Types** management system that allows administrators to dynamically configure different types of healthcare practitioners with custom permissions, features, and scheduling rules.

## Key Features

### 🎯 What is a Practitioner Type?

A Practitioner Type is a configurable template that defines:
- **Permissions**: What actions a practitioner can perform in the system
- **Features**: Specialized tools and capabilities they need
- **Scheduling Rules**: Default appointment settings and constraints
- **Required Certifications**: Professional qualifications needed
- **Allowed Services**: Which service categories they can perform

### 📋 Pre-configured Practitioner Types

The system comes with 7 pre-configured practitioner types:

#### 1. **Dermatologist** (Medical)
- **Permissions**: Can prescribe, access medical records, create treatment plans
- **Features**: Needs before/after photos, skin analysis, prescription management
- **Scheduling**: 45-minute appointments, 10-minute buffers
- **Certifications**: Board Certification in Dermatology, Medical License
- **Services**: Skincare, Injectable, Laser Treatment, Consultation, Diagnostic

#### 2. **Laser Specialist** (Aesthetic)
- **Permissions**: Requires assistant, can access medical records
- **Features**: Needs laser settings tracking, before/after photos, consent forms
- **Scheduling**: 60-minute appointments, 15-minute buffers
- **Certifications**: Laser Safety Certification, Aesthetic Medicine Training
- **Services**: Laser Treatment, Hair Removal, Skincare, Consultation

#### 3. **Nutritionist** (Wellness)
- **Permissions**: Can create treatment plans, export data
- **Features**: Needs meal plans, progress tracking, product recommendations
- **Scheduling**: 60-minute appointments, 5-minute buffers
- **Certifications**: Registered Dietitian, Nutrition Certification
- **Services**: Nutrition, Wellness, Consultation

#### 4. **Dentist** (Dental)
- **Permissions**: Can prescribe, perform surgery, full medical records access
- **Features**: Needs dental chart, x-ray management, insurance billing
- **Scheduling**: 60-minute appointments, 10/15-minute buffers
- **Certifications**: DDS or DMD Degree, State Dental License
- **Services**: Dental, Surgical, Consultation, Diagnostic

#### 5. **Cosmetic Surgeon** (Medical)
- **Permissions**: Can prescribe, perform surgery, full system access
- **Features**: Needs before/after photos, x-ray management, consent forms
- **Scheduling**: 120-minute appointments, 30-minute buffers
- **Certifications**: Board Certification in Plastic Surgery, Medical License
- **Services**: Surgical, Injectable, Body Contouring, Consultation

#### 6. **Physical Therapist** (Therapeutic)
- **Permissions**: Can create treatment plans, limited records access
- **Features**: Needs exercise plans, progress tracking, insurance billing
- **Scheduling**: 60-minute appointments, 5-minute buffers
- **Certifications**: DPT Degree, State PT License
- **Services**: Physical Therapy, Wellness, Consultation

#### 7. **Esthetician** (Aesthetic)
- **Permissions**: Basic permissions, inventory management
- **Features**: Needs skin analysis, product recommendations, before/after photos
- **Scheduling**: 60-minute appointments, 10-minute buffers
- **Certifications**: Esthetician License, State Cosmetology License
- **Services**: Skincare, Body Contouring, Wellness

## 🔧 How to Use

### For Administrators

#### Creating a New Practitioner Type

1. Navigate to **Practitioner Types** tab in the Admin Dashboard
2. Click **"Add Practitioner Type"**
3. Fill in the basic information:
   - **Type Name**: e.g., "Chiropractor", "Massage Therapist"
   - **Description**: Brief overview of the role
   - **Category**: Medical, Aesthetic, Wellness, Dental, Therapeutic, or Other
   - **Color Theme**: Visual identifier for the type

4. Configure **Permissions**:
   - Can Prescribe
   - Can Perform Surgery
   - Requires Assistant
   - Can Access Medical Records
   - Can Create Treatment Plans
   - Can Manage Inventory
   - Can View All Patients
   - Can Export Data

5. Select **Specialized Features**:
   - Before/After Photos
   - Dental Chart
   - Skin Analysis
   - Meal Plans
   - Exercise Plans
   - Laser Settings
   - X-ray Management
   - Consent Forms
   - Progress Tracking
   - Prescription Management
   - Insurance Billing
   - Product Recommendations

6. Set **Scheduling Rules**:
   - Default Appointment Duration
   - Buffer Time Before/After
   - Max Appointments Per Day
   - Allow Double Booking
   - Requires Initial Consultation

7. Add **Required Certifications**:
   - List all necessary licenses and qualifications

8. Select **Allowed Service Categories**:
   - Check all service types this practitioner can perform

9. Set **Active Status**:
   - Toggle on to allow practitioners to be assigned to this type

#### Assigning a Practitioner Type to a Doctor

1. Go to **Doctors** tab
2. Click **"Add Doctor"** or edit an existing doctor
3. In the form, select the appropriate **Practitioner Type** from the dropdown
4. The system will display:
   - Required certifications for that type
   - Default scheduling rules
   - Allowed service categories
5. Save the doctor profile

### Visual Indicators

- Each practitioner type has a **unique color** displayed as a badge
- Doctors show their practitioner type badge on their profile cards
- Services can be filtered by practitioner type compatibility

## 🎨 Customization Examples

### Example 1: Adding a "Chiropractor" Type

```
Name: Chiropractor
Category: Therapeutic
Color: Purple (#8b5cf6)
Description: Specializes in spinal adjustments and musculoskeletal treatments

Permissions:
✓ Can Access Medical Records
✓ Can Create Treatment Plans
✓ Can Export Data

Features:
✓ Progress Tracking
✓ Exercise Plans
✓ X-ray Management
✓ Consent Forms

Scheduling:
- Duration: 45 minutes
- Buffer: 10 minutes before/after
- Max: 14 appointments/day

Certifications:
- Doctor of Chiropractic (DC)
- State Chiropractic License
- X-ray Certification

Services:
- Physical Therapy
- Wellness
- Consultation
- Diagnostic
```

### Example 2: Adding a "Massage Therapist" Type

```
Name: Massage Therapist
Category: Wellness
Color: Teal (#14b8a6)
Description: Licensed massage and bodywork specialist

Permissions:
✓ Can Create Treatment Plans

Features:
✓ Progress Tracking
✓ Product Recommendations

Scheduling:
- Duration: 60 minutes
- Buffer: 5 minutes before/after
- Max: 10 appointments/day

Certifications:
- Licensed Massage Therapist (LMT)
- State Massage License

Services:
- Massage
- Wellness
- Body Treatment
```

## 🔐 Security & Permissions

### Role-Based Access
- Only **Administrators** can access the Practitioner Types tab
- Admins can create, edit, and delete practitioner types
- Practitioner type settings automatically apply to assigned doctors

### Permission Inheritance
- Doctors inherit base permissions from their practitioner type
- Custom permissions can override defaults (future feature)
- Scheduling rules from practitioner types set smart defaults for appointments

## 📊 Benefits

### For Clinic Administration
- **Standardization**: Ensure all practitioners of the same type have consistent capabilities
- **Compliance**: Track required certifications automatically
- **Efficiency**: Set appropriate scheduling defaults per specialty
- **Scalability**: Easily add new practitioner types as your clinic expands

### For Practitioners
- **Clarity**: Clear understanding of their system capabilities
- **Appropriate Tools**: Access to specialty-specific features
- **Better Scheduling**: Appointment durations match service complexity

### For Patients
- **Quality Assurance**: See practitioner certifications and specialties
- **Appropriate Booking**: Services matched to qualified practitioners
- **Better Experience**: Proper time allocation for procedures

## 🚀 Future Enhancements

Potential future features include:
- Custom permission overrides per individual doctor
- Practitioner type-specific reporting and analytics
- Automated certification expiry tracking
- Service pricing variations by practitioner type
- Multi-specialty practitioners (assigned to multiple types)
- Template-based treatment plans per type
- Type-specific patient forms and questionnaires

## 📞 Support

For questions about the Practitioner Types system:
1. Check the in-app help tooltips
2. Review this guide
3. Contact your system administrator
4. Refer to the main system documentation

---

**Note**: This is a frontend-only implementation. In a production environment with a backend, all practitioner type configurations would be stored in a database and synced across the system.
