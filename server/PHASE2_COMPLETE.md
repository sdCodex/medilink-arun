# Phase 2: Authentication & OTP System - Complete! ✅

## Overview

Built a comprehensive three-role authentication system with OTP verification, JWT tokens, and role-based access control.

## What Was Built

### Database Schemas

1. **[User.js](file:///c:/Users/arunk/Desktop/medilink/server/models/User.js)** - Patient schema with:

   - Personal details (name, email, mobile, password with bcrypt hashing)
   - Emergency contact
   - Health information (blood group, self-reported diseases/allergies)
   - Verification flags (email, mobile, profile complete)
   - Health card tracking
   - Methods: comparePassword(), generateHealthId(), checkProfileComplete()

2. **[Doctor.js](file:///c:/Users/arunk/Desktop/medilink/server/models/Doctor.js)** - Doctor schema with:

   - Professional credentials (registration number, specialization, hospital)
   - Document uploads (government ID, medical certificate)
   - Approval workflow (pending/approved/rejected)
   - Admin action tracking
   - Method: canAccessSystem()

3. **[Admin.js](file:///c:/Users/arunk/Desktop/medilink/server/models/Admin.js)** - Admin schema with:

   - Credentials with bcrypt
   - Permissions (approve doctors, view audit logs, revoke access)

4. **[OTPLog.js](file:///c:/Users/arunk/Desktop/medilink/server/models/OTPLog.js)** - OTP tracking with:

   - Hashed OTP storage
   - Auto-expiry (5 minutes) via MongoDB TTL index
   - Attempt tracking (max 3 attempts)
   - Purpose tracking (registration, login, password-reset)

5. **[AuditLog.js](file:///c:/Users/arunk/Desktop/medilink/server/models/AuditLog.js)** - Comprehensive audit trail:

   - Actor tracking (who performed action)
   - Action type (30+ predefined actions)
   - Target tracking (what was affected)
   - Metadata, IP address, user agent

6. **[Notification.js](file:///c:/Users/arunk/Desktop/medilink/server/models/Notification.js)** - Notification tracking:
   - SMS, Email, WhatsApp delivery status
   - Purpose tracking
   - Failure reason logging

### Services

#### [otpService.js](file:///c:/Users/arunk/Desktop/medilink/server/services/otpService.js)

- **sendOTP()**: Sends 6-digit OTP via both SMS (Twilio) and Email (Nodemailer)
- **verifyOTP()**: Verifies OTP with attempt tracking and expiry checking
- **Development Mode**: Console-logs OTPs when Twilio/SMTP not configured
- Features:
  - OTP hashing with bcrypt before storage
  - Concurrent SMS + Email sending
  - Notification logging
  - Beautiful HTML email template

#### [notificationService.js](file:///c:/Users/arunk/Desktop/medilink/server/services/notificationService.js)

- **sendSMS()**: Twilio SMS with logging
- **sendWhatsApp()**: Twilio WhatsApp with logging
- **sendEmail()**: Nodemailer email with HTML templates
- **notifyPatientOfDoctorUpdate()**: Sends WhatsApp + Email when doctor updates medical record
- Development mode fallback for all services

### Middleware

#### [auth.js](file:///c:/Users/arunk/Desktop/medilink/server/middleware/auth.js)

- **protect**: JWT verification middleware
- **requireUser**: User-only access
- **requireDoctor**: Doctor-only access
- **requireAdmin**: Admin-only access
- **requireApprovedDoctor**: Approved doctor-only access (blocks pending doctors)
- **generateToken()**: JWT token generation with role

#### [rateLimiter.js](file:///c:/Users/arunk/Desktop/medilink/server/middleware/rateLimiter.js)

- **otpLimiter**: 3 requests / 15 minutes (for OTP endpoints)
- **loginLimiter**: 5 requests / 15 minutes (for login endpoints)
- **apiLimiter**: 100 requests / 15 minutes (general API)

#### [auditLogger.js](file:///c:/Users/arunk/Desktop/medilink/server/middleware/auditLogger.js)

- **auditLogger()**: Automatic audit logging middleware
- **createAuditLog()**: Manual audit log creation utility

### Controllers & Routes

#### [authController.js](file:///c:/Users/arunk/Desktop/medilink/server/controllers/authController.js)

Comprehensive authentication logic:

- **registerUser**: User registration + OTP sending
- **registerDoctor**: Doctor registration with document URLs + OTP sending
- **verifyOTPHandler**: OTP verification with status updates
- **resendOTP**: Resend expired/lost OTP
- **loginUser**: User login with JWT + OTP check
- **loginDoctor**: Doctor login with JWT + approval status
- **loginAdmin**: Admin login with JWT

#### [auth.js](file:///c:/Users/arunk/Desktop/medilink/server/routes/auth.js) Routes

```
POST /api/auth/register/user      (Rate limited: 3/15min)
POST /api/auth/register/doctor    (Rate limited: 3/15min)
POST /api/auth/verify-otp
POST /api/auth/resend-otp         (Rate limited: 3/15min)
POST /api/auth/login/user         (Rate limited: 5/15min)
POST /api/auth/login/doctor       (Rate limited: 5/15min)
POST /api/auth/login/admin        (Rate limited: 5/15min)
```

## Key Features Implemented

✅ **Three-Role Authentication** - Completely separate flows for User/Doctor/Admin  
✅ **Dual OTP Verification** - SMS (Twilio) + Email (Nodemailer) sent concurrently  
✅ **OTP Security** - Hashed storage, 5-min expiry, 3-attempt limit  
✅ **JWT with Roles** - Token includes user ID and role for RBAC  
✅ **Doctor Approval Workflow** - Doctors pending approval can login but cannot access protected routes  
✅ **Rate Limiting** - Prevents brute force and OTP spam  
✅ **Audit Logging** - Every registration/login action logged with IP and user agent  
✅ **Notification Logging** - All SMS/Email/WhatsApp tracked with delivery status  
✅ **Development Mode** - Works without Twilio/SMTP (console logs OTPs)  
✅ **Password Security** - Bcrypt hashing with pre-save hooks  
✅ **Beautiful Email Templates** - Professional HTML emails with branding

## Testing the APIs

### 1. User Registration

```bash
POST http://localhost:5000/api/auth/register/user
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+919876543210",
  "password": "securepass123"
}
```

Response: OTP sent to email + mobile

### 2. Verify OTP

```bash
POST http://localhost:5000/api/auth/verify-otp
{
  "email": "john@example.com",
  "mobile": "+919876543210",
  "otp": "123456",
  "purpose": "registration"
}
```

### 3. User Login

```bash
POST http://localhost:5000/api/auth/login/user
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

Response: JWT token + user details

### 4. Doctor Registration

```bash
POST http://localhost:5000/api/auth/register/doctor
{
  "name": "Dr. Sarah",
  "email": "sarah@hospital.com",
  "mobile": "+919876543211",
  "password": "doctorpass123",
  "medicalRegistrationNumber": "MRN123456",
  "specialization": "Cardiology",
  "hospitalName": "City Hospital",
  "hospitalAddress": {
    "city": "Mumbai",
    "state": "Maharashtra"
  },
  "governmentId": "https://cloudinary.com/govt-id.jpg",
  "medicalCertificate": "https://cloudinary.com/cert.pdf"
}
```

### 5. Admin Login

```bash
POST http://localhost:5000/api/auth/login/admin
{
  "email": "admin@medilink.com",
  "password": "adminpass123"
}
```

## Environment Setup

For full functionality, add to `.env`:

```env
# Twilio (SMS + WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Email (Gmail or SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Without these credentials, the system runs in development mode and logs OTPs to console.**

## Next Phase

Ready for **Phase 3: User Management & Roles** which will build:

- User profile management APIs
- Doctor verification workflow (admin approval)
- RBAC middleware integration
- Audit trail querying
