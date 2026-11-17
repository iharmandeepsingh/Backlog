# Backlog Examination Registration Portal

A modern, secure, and responsive **Backlog Examination Registration System** built for university examination control divisions with dedicated portals for **Students** and **Administrators**.

---

## 🌟 Key Features & Architectural Capabilities

### 1. Student Module
- **Self-Service Authentication:** Students can register with Roll Number, Program, Department, and Semester or sign in with university credentials.
- **Student Dashboard:** Real-time summary of student profile, current academic status, registered examinations, fee statuses, and eligible backlog subjects.
- **Odd / Even Semester Session Rules:**
  - During an **Odd Semester session**, only odd-semester backlogs (Semesters 1, 3, 5, 7) are eligible.
  - During an **Even Semester session**, only even-semester backlogs (Semesters 2, 4, 6, 8) are eligible.
- **Dynamic Subject Limits & Classification:**
  - **Theory Subjects:** Capped at the maximum limit dynamically configured by the admin (default: 4). Strictly enforced on both frontend and backend.
  - **Non-Theory Subjects (Practical, Laboratory, Viva, Seminars):** Can be selected without any numerical limit and never count toward the theory cap.
- **Duplicate Registration Prevention:** Students cannot register for the same backlog subject twice within the same examination session.
- **Real-Time Fee Calculator:** Dynamically computes total exam fees based on active theory fee rate, non-theory fee rate, and base registration fee.
- **Printable Acknowledgement Slip / Hall Ticket:** Downloadable and printable examination slip formatted with university seal, barcodes, fee confirmation stamp, and candidate instructions.

---

### 2. Dual Payment Module
- **Online Payment Gateway (Simulated Razorpay):**
  - Integrated checkout interface with UPI / QR code, Credit/Debit Cards, and Net Banking.
  - Server-side signature and transaction reference verification.
  - Instant status update to `VERIFIED` and automatic registration confirmation.
- **Manual Payment (Challan / Bank Transfer):**
  - Displays official university bank account number, IFSC code, and UPI ID.
  - Student inputs remitting Bank Name, Transaction Reference / UTR Number, and Payment Date.
  - Uploads proof of payment receipt image (JPEG/PNG/WEBP) or PDF slip.
  - Status set to `PENDING_VERIFICATION` until audited and approved by the examination controller.

---

### 3. Administrative Control Console
- **KPI Overview Dashboard:** Real-time metrics including total applications, pending manual approvals, total fee collection, approved/rejected counts, and department distributions.
- **Registrations & Payment Management:**
  - Full-text search and multi-filtering by student name, roll number, department, semester, subject, session, payment status, and payment mode.
  - **Receipt Audit Modal:** High-resolution preview of uploaded bank receipts with zoom controls, full-screen view, and download options.
  - **Approve or Reject:** Approve receipts or reject with mandatory audit remarks.
  - **Export Reports:** Instant download of all registration and fee records to clean CSV format.
- **Session Management:** Configure Odd/Even sessions, academic years, opening/closing dates, and toggle active status.
- **Fee & Subject Limit Configuration:** Dynamically configure maximum theory limit, theory paper fees, non-theory paper fees, base fees, and bank account details.
- **Curriculum & Subjects Catalog:** Add, edit, or delete subjects across all 8 semesters, tagged by theory vs non-theory category.
- **Student Records & Backlog Allocation:** Assign or adjust individual backlog records for students.
- **Immutable Security Audit Trail:** Every admin action, session toggle, fee modification, and receipt verification is recorded with admin identity, timestamp, IP, and event details.

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+ or v24)
- npm

### 1. Backend Server
```bash
cd backend
npm install
npm run seed     # Pre-populates sample students, admin, sessions, and catalog
npm start        # Starts Express server on http://localhost:5000
```

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔑 Demo Credentials

| Role | Username / Login ID | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@university.edu` | `admin123` | Dr. Ramesh Sharma (Exam Controller) |
| **Student A (Row 2)** | `72312720` or `72312720@university.edu` | `student123` | Student A (Batch 2023, Sem 3, Failed in `23BALB11C01`) |
| **Student B (Row 3)** | `72311390` or `72311390@university.edu` | `student123` | Student B (Batch 2023, Sem 3, Failed in `23BALB11C02`) |

---

## 📑 Excel Result & Failure Ingestion

To import candidate failures from university result sheets (e.g. `LAW 2023.xlsx`):
1. **Via Admin Portal:** Navigate to Admin Console > **Import Results (Excel)** and upload any `.xlsx` result file directly.
2. **Via Backend CLI:**
```bash
cd backend
node scripts/importExcel.js "c:\Users\Hp\Downloads\LAW 2023.xlsx" 3
```

### 🎯 Key Rules Implemented:
1. **Strictly Previous Semesters Only:** A student currently in Semester `N` can only register for backlogs from semesters strictly `< N`. Current semester `N` subjects are regular exams and are never displayed as backlogs.
2. **Strict Failure Filtering:** Only subjects where the student actually received grade `'F'` / `'FAIL'` / `'RE'` are shown.
3. **Session Parity Matching:**
   - **Odd Sessions:** Displays strictly previous Odd semester failures (1, 3, 5...).
   - **Even Sessions:** Displays strictly previous Even semester failures (2, 4, 6...).
4. **Subject Quota & Fee Calculation:**
   - Maximum **4 Theoretical subjects** allowed.
   - **Unlimited Non-Theoretical (Practical / Clinical / Moot Court / Viva)** subjects allowed.
   - Dynamic real-time fee calculation with base fee breakdown.
