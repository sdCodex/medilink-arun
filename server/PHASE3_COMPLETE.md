# Phase 3: User Management & Roles - Complete! ✅

## Overview

Built comprehensive user management system with role-based access control, doctor approval workflow, and admin dashboard.

## What Was Built

### User Management

#### [userController.js](file:///c:/Users/arunk/Desktop/medilink/server/controllers/userController.js)

**5 Controller Functions:**

1. **getProfile** - Get user profile details
2. **updateProfile** - Update personal information (auto-generates health ID when profile complete)
3. **updateEmergencyContact** - Add/update emergency contact
4. **addMedicalHistory** - Add self-reported diseases and allergies
5. **getDashboard** - Get user dashboard with stats

**Key Features:**

- Automatic profile completion checking
- Auto-generation of unique Health ID when profile is complete
- Emergency contact management
- Self-reported medical history (diseases, allergies)
- Audit logging for all updates

#### [user.js Routes](file:///c:/Users/arunk/Desktop/medilink/server/routes/user.js)

```
GET  /api/user/profile               - Get profile
PUT  /api/user/profile               - Update profile
POST /api/user/emergency-contact     - Add/update emergency contact
POST /api/user/medical-history       - Add self-reported medical history
GET  /api/user/dashboard             - Get dashboard stats
```

**Protected by:** `protect` + `requireUser` middleware

---

### Doctor Management

#### [doctorController.js](file:///c:/Users/arunk/Desktop/medilink/server/controllers/doctorController.js)

**4 Controller Functions:**

1. **getProfile** - Get doctor profile with approval status
2. **searchPatients** - Search patients by name/email/mobile (approved doctors only)
3. **getPatientDetails** - Get patient full details (approved doctors only, logged in audit)
4. **getDashboard** - Get doctor dashboard with stats

**Key Features:**

- Approval status tracking (pending/approved/rejected)
- Patient search with regex
- Audit logging when viewing patient records
- Dashboard with approval status and system access info

#### [doctor.js Routes](file:///c:/Users/arunk/Desktop/medilink/server/routes/doctor.js)

```
GET  /api/doctor/profile             - Get profile (all doctors)
GET  /api/doctor/dashboard           - Get dashboard (all doctors)
GET  /api/doctor/patients?search=    - Search patients (approved only)
GET  /api/doctor/patient/:userId     - Get patient details (approved only)
```

**Protected by:**

- All routes: `protect` + `requireDoctor`
- Patient routes: Additional `requireApprovedDoctor` (blocks pending doctors)

---

### Admin Management

#### [adminController.js](file:///c:/Users/arunk/Desktop/medilink/server/controllers/adminController.js)

**8 Controller Functions:**

**Dashboard & Stats:**

1. **getDashboardStats** - Comprehensive dashboard statistics:
   - Total users (verified count)
   - Total doctors (pending/approved/rejected breakdown)
   - Recent activity (last 10 audit logs)

**Doctor Approval Workflow:** 2. **getPendingDoctors** - Get all pending doctor applications 3. **approveDoctor** - Approve doctor application:

- Sets approval status to 'approved'
- Records admin who approved
- Sends beautiful approval email
- Creates audit log

4. **rejectDoctor** - Reject doctor application:
   - Sets approval status to 'rejected'
   - Records reason for rejection
   - Sends rejection email with reason
   - Creates audit log
5. **revokeDoctor** - Revoke doctor access:
   - Deactivates doctor account
   - Sends notification email
   - Creates audit log

**User & Doctor Management:** 6. **getAllUsers** - Get paginated list of users 7. **getAllDoctors** - Get paginated list of doctors (filterable by approval status)

**Audit Logs:** 8. **getAuditLogs** - Get paginated audit logs (filterable by action and actor)

**Email Notifications:**

- Beautiful HTML email templates for approval/rejection/revocation
- Professional styling with gradients and color-coded alerts
- Links to frontend portal

#### [admin.js Routes](file:///c:/Users/arunk/Desktop/medilink/server/routes/admin.js)

```
GET  /api/admin/dashboard                    - Dashboard stats
GET  /api/admin/pending-doctors              - Pending doctor applications
POST /api/admin/approve-doctor/:doctorId     - Approve doctor
POST /api/admin/reject-doctor/:doctorId      - Reject doctor (with reason)
POST /api/admin/revoke-doctor/:doctorId      - Revoke doctor access
GET  /api/admin/doctors?status=&page=        - Get all doctors (filterable)
GET  /api/admin/users?page=                  - Get all users (paginated)
GET  /api/admin/audit-logs?action=&actorId=  - Get audit logs (filterable)
```

**Protected by:** `protect` + `requireAdmin`

---

## API Routes Summary

### Total Routes Created: 17

**User Routes (5):**

- Profile management
- Emergency contact
- Medical history
- Dashboard

**Doctor Routes (4):**

- Profile and dashboard (all doctors)
- Patient search and details (approved only)

**Admin Routes (8):**

- Dashboard statistics
- Doctor approval workflow (3 actions)
- User and doctor listing
- Audit logs

---

## RBAC Implementation

### Middleware Protection Levels

1. **protect** - Requires valid JWT
2. **requireUser** - User role only
3. **requireDoctor** - Doctor role only
4. **requireApprovedDoctor** - Approved doctor only (blocks pending/rejected)
5. **requireAdmin** - Admin role only

### Access Control Flow

```
User Journey:
Register → Verify OTP → Login → Get Token → Access User Routes

Doctor Journey:
Register → Verify OTP → Status: PENDING → Limited Access (profile/dashboard)
                       ↓
              Admin Approves
                       ↓
         Status: APPROVED → Full Access (patient data)

Admin Journey:
Login → Get Token → Full Admin Access
```

---

## Doctor Approval Workflow

### States

1. **Pending** - Initial state after registration
   - Can login and view profile/dashboard
   - **Cannot** access patient data
   - Shows "pending approval" message
2. **Approved** - Admin approved
   - Full system access
   - Can search and view patients
   - Receives approval email
3. **Rejected** - Admin rejected
   - Cannot access system
   - Receives rejection email with reason
4. **Revoked** - Access removed by admin
   - Account deactivated
   - Cannot login

### Approval Process

```
Doctor registers → Admin views pending list →
Admin reviews credentials → Approve or Reject →
Doctor receives email → System access updated
```

---

## Audit Logging

All critical actions are logged:

- User profile updates
- Emergency contact updates
- Doctor viewing patient records
- Doctor approval/rejection/revocation
- All actions include:
  - Actor (who did it)
  - Action type
  - Target (what was affected)
  - IP address
  - User agent
  - Timestamp
  - Metadata

---

## Testing the APIs

### User Profile Management

```bash
# Get profile (requires user JWT)
GET http://localhost:5000/api/user/profile
Authorization: Bearer <user-token>

# Update profile
PUT http://localhost:5000/api/user/profile
Authorization: Bearer <user-token>
{
  "name": "John Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "bloodGroup": "A+",
  "address": {
    "city": "Mumbai",
    "state": "Maharashtra"
  }
}

# Add emergency contact
POST http://localhost:5000/api/user/emergency-contact
Authorization: Bearer <user-token>
{
  "name": "Jane Doe",
  "relationship": "Spouse",
  "mobile": "+919876543210",
  "email": "jane@example.com"
}

# Add medical history
POST http://localhost:5000/api/user/medical-history
Authorization: Bearer <user-token>
{
  "diseases": ["Diabetes", "Hypertension"],
  "allergies": ["Penicillin"]
}
```

### Admin Doctor Approval

```bash
# Get pending doctors (requires admin JWT)
GET http://localhost:5000/api/admin/pending-doctors
Authorization: Bearer <admin-token>

# Approve doctor
POST http://localhost:5000/api/admin/approve-doctor/doctorId123
Authorization: Bearer <admin-token>

# Reject doctor
POST http://localhost:5000/api/admin/reject-doctor/doctorId123
Authorization: Bearer <admin-token>
{
  "reason": "Invalid medical registration number"
}

# Get dashboard stats
GET http://localhost:5000/api/admin/dashboard
Authorization: Bearer <admin-token>
```

### Doctor Patient Access

```bash
# Search patients (requires approved doctor JWT)
GET http://localhost:5000/api/doctor/patients?search=john
Authorization: Bearer <approved-doctor-token>

# Get patient details
GET http://localhost:5000/api/doctor/patient/userId123
Authorization: Bearer <approved-doctor-token>
```

---

## Email Templates

### Approval Email

- ✅ Green gradient header
- Success alert box
- Login link to doctor portal
- Professional branding

### Rejection Email

- ⚠️ Red gradient header
- Warning alert box
- Rejection reason displayed
- Support contact info

### Revocation Email

- Account deactivated notice
- Reason for revocation
- Support contact info

---

## Next Steps

**Phase 3 Complete!** Ready for:

**Phase 4: Medical Records System**

- Medical record schema with versioning
- User self-reporting
- Doctor verification and updates
- Cloudinary file uploads
- Record timeline

**Phase 5: Digital Health Card**

- Auto-generation when profile complete
- PDF/image export
- Unique Health ID embedding

**Phase 6: QR Code & Emergency Access**

- Secure token generation
- Public emergency access endpoint
- Real-time data fetching
