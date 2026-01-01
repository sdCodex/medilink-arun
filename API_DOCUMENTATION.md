# MedLink API Documentation 📡

Comprehensive guide to the MedLink MERN stack API.

## Base URL

`http://localhost:5000/api`

## Authentication Routes (`/auth`)

### 1. Register User (Patient)

- **Endpoint**: `POST /register/user`
- **Body**: `{ name, email, mobile, password }`
- **Response**: `201 Created` with verification details.

### 2. Register Doctor (HCP)

- **Endpoint**: `POST /register/doctor`
- **Body**: `{ name, email, mobile, password, specialization, hospitalName, medicalRegistrationNumber, governmentId, medicalCertificate }`
- **Response**: `201 Created` (Application pending admin approval).

### 3. Verify OTP

- **Endpoint**: `POST /verify-otp`
- **Body**: `{ email, otp, purpose }` (purpose: 'registration' or 'login')
- **Response**: `200 OK` if valid.

### 4. User Login

- **Endpoint**: `POST /login/user`
- **Body**: `{ email, password }`
- **Response**: `200 OK` with JWT token OR `403 Forbidden` if OTP verification is required.

### 5. Doctor Login

- **Endpoint**: `POST /login/doctor`
- **Body**: `{ email, password }`
- **Response**: `200 OK` with token and approval status.

### 6. Admin Login

- **Endpoint**: `POST /login/admin`
- **Body**: `{ email, password }`
- **Response**: `200 OK` with administrative token.

---

## User Routes (`/user`) - Protected (Role: User)

### 7. Get Profile

- **Endpoint**: `GET /profile`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Detailed user object.

### 8. Update Profile

- **Endpoint**: `PUT /profile`
- **Body**: `{ name, dob, gender, bloodGroup, address, emergencyContact }`

### 9. Get Health Card

- **Endpoint**: `GET /health-card`
- **Response**: Active health card data including QR code image.

### 10. Generate Health Card

- **Endpoint**: `POST /health-card/generate`
- **Response**: Generates new card if profile is complete.

---

## Doctor Routes (`/doctor`) - Protected (Role: Doctor, Approved)

### 11. Search Patient

- **Endpoint**: `GET /search-patient?query=<mobile/email>`
- **Response**: Basic patient info for verification.

### 12. Add Medical Record

- **Endpoint**: `POST /medical-record/:userId`
- **Body**: `{ diagnosis, prescription, observations }`

### 13. Verify Patient Data

- **Endpoint**: `POST /verify-data/:userId`
- **Body**: `{ recordsToVerify: [] }`

---

## Admin Routes (`/admin`) - Protected (Role: Admin)

### 14. Get Pending Approvals

- **Endpoint**: `GET /approvals/pending`
- **Response**: List of doctors waiting for verification.

### 15. Approve/Reject Doctor

- **Endpoint**: `POST /approvals/:doctorId`
- **Body**: `{ status: 'approved' | 'rejected', reason: string }`

### 16. Audit Logs

- **Endpoint**: `GET /audit-logs`
- **Response**: Comprehensive system activity logs.

---

## Emergency Routes (`/emergency`) - Public

### 17. Scan QR Code

- **Endpoint**: `POST /scan-qr`
- **Body**: `{ token: string }` (Token extracted from QR code)
- **Response**: **VERIFIED** medical data only.

---

## Technical Features

- **Security**: JWT-based auth, password hashing with bcrypt, rate limiting on sensitive routes.
- **Data Integrity**: QR tokens are signed and encrypted.
- **Verification**: 4-eye principle for medical records (Self-reported vs Doctor-verified).
- **Audit**: All critical actions logged with IP and User-Agent.

---

## Error Handling

- `400 Bad Request`: Validation errors.
- `401 Unauthorized`: Missing or invalid token.
- `403 Forbidden`: Role mismatch or pending verification/approval.
- `404 Not Found`: Resource doesn't exist.
- `500 Server Error`: Unexpected backend failure.
