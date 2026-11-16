const bcrypt = require('bcryptjs');
const { User, Subject, Session, Config, Registration, AuditLog } = require('../src/models');

const seedDatabase = async () => {
  console.log('🌱 Starting Database Seeding...');

  // 1. Clear old data
  await User.deleteMany({});
  await Subject.deleteMany({});
  await Session.deleteMany({});
  await Config.deleteMany({});
  await Registration.deleteMany({});
  await AuditLog.deleteMany({});

  console.log('🧹 Old collections cleared.');

  // 2. Default Config
  const config = await Config.create({
    maxTheorySubjects: 4,
    theoryFeePerSubject: 500,
    nonTheoryFeePerSubject: 300,
    baseRegistrationFee: 100,
    bankDetails: {
      bankName: 'State Bank of India (SBI)',
      accountHolder: 'University Examination Controller General Fund',
      accountNumber: '389201948201',
      ifscCode: 'SBIN0001423',
      branch: 'Central Campus Branch, New Delhi',
      upiId: 'university.exam@sbi',
      instructions: 'Please transfer fee via NEFT/RTGS/IMPS/UPI. Upload clear photo/screenshot of receipt showing UTR / Ref Number.'
    },
    updatedBy: 'System Seed Initializer',
    updatedAt: new Date().toISOString()
  });
  console.log('⚙️ Configuration created.');

  // 3. Subjects (Theory + Non-Theory, Odd + Even)
  const subjectsData = [
    // Semester 1 (ODD)
    { code: 'CS101', name: 'Engineering Mathematics - I', semester: 1, credits: 4, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS102', name: 'Programming Fundamentals in C', semester: 1, credits: 3, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS103', name: 'Programming Lab in C', semester: 1, credits: 2, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Practical', isTheory: false },
    { code: 'CS104', name: 'Engineering Physics Lab', semester: 1, credits: 1, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Lab', isTheory: false },

    // Semester 2 (EVEN)
    { code: 'CS201', name: 'Engineering Mathematics - II', semester: 2, credits: 4, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS202', name: 'Object Oriented Programming with Java', semester: 2, credits: 3, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS203', name: 'OOP Java Laboratory', semester: 2, credits: 2, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Lab', isTheory: false },
    { code: 'CS204', name: 'Basic Electronics & Hardware Lab', semester: 2, credits: 1, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Lab', isTheory: false },

    // Semester 3 (ODD)
    { code: 'CS301', name: 'Data Structures & Algorithms', semester: 3, credits: 4, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS302', name: 'Computer Organization & Architecture', semester: 3, credits: 3, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS303', name: 'Discrete Mathematical Structures', semester: 3, credits: 3, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS304', name: 'Data Structures Laboratory', semester: 3, credits: 2, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Lab', isTheory: false },
    { code: 'CS305', name: 'Digital Logic Design Lab', semester: 3, credits: 2, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Lab', isTheory: false },

    // Semester 4 (EVEN)
    { code: 'CS401', name: 'Operating Systems', semester: 4, credits: 4, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS402', name: 'Database Management Systems', semester: 4, credits: 4, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS403', name: 'Theory of Computation', semester: 4, credits: 3, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS404', name: 'Operating Systems & Linux Lab', semester: 4, credits: 2, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Lab', isTheory: false },
    { code: 'CS405', name: 'DBMS SQL & NoSQL Lab', semester: 4, credits: 2, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Lab', isTheory: false },

    // Semester 5 (ODD)
    { code: 'CS501', name: 'Design & Analysis of Algorithms', semester: 5, credits: 4, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS502', name: 'Computer Networks', semester: 5, credits: 4, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS503', name: 'Software Engineering & Agile Practices', semester: 5, credits: 3, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Theory', isTheory: true },
    { code: 'CS504', name: 'Computer Networks Socket Lab', semester: 5, credits: 2, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Lab', isTheory: false },
    { code: 'CS505', name: 'Comprehensive Technical Viva Voce', semester: 5, credits: 2, department: 'Computer Science & Engineering', program: 'B.Tech', type: 'Viva', isTheory: false }
  ];

  const createdSubjects = await Subject.insertMany(subjectsData);
  console.log(`📚 Created ${createdSubjects.length} subjects.`);

  // 4. Examination Sessions
  const activeOddSession = await Session.create({
    name: 'Winter 2026 Examination (Odd Semesters 1, 3, 5)',
    type: 'ODD',
    academicYear: '2026-2027',
    startDate: new Date('2026-11-01T00:00:00.000Z').toISOString(),
    endDate: new Date('2026-12-31T23:59:59.000Z').toISOString(),
    isActive: true
  });

  const inactiveEvenSession = await Session.create({
    name: 'Summer 2027 Examination (Even Semesters 2, 4, 6)',
    type: 'EVEN',
    academicYear: '2026-2027',
    startDate: new Date('2027-04-01T00:00:00.000Z').toISOString(),
    endDate: new Date('2027-05-31T23:59:59.000Z').toISOString(),
    isActive: false
  });
  console.log('📅 Examination sessions created (Active: Winter 2026 ODD).');

  // 5. Users: Admin and Students
  const adminPassword = await bcrypt.hash('admin123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  const admin = await User.create({
    name: 'Dr. Ramesh Sharma',
    email: 'admin@university.edu',
    password: adminPassword,
    role: 'admin',
    department: 'Examination Control Division',
    program: 'University Administration',
    phone: '+91 98765 43210'
  });

  // Find odd subjects to assign as backlogs for sample students
  const cs101 = createdSubjects.find(s => s.code === 'CS101');
  const cs102 = createdSubjects.find(s => s.code === 'CS102');
  const cs103 = createdSubjects.find(s => s.code === 'CS103');
  const cs301 = createdSubjects.find(s => s.code === 'CS301');
  const cs302 = createdSubjects.find(s => s.code === 'CS302');
  const cs304 = createdSubjects.find(s => s.code === 'CS304');
  const cs201 = createdSubjects.find(s => s.code === 'CS201'); // even sem

  const student1 = await User.create({
    name: 'Rahul Sharma',
    email: 'rahul.cs@university.edu',
    password: studentPassword,
    role: 'student',
    rollNumber: 'CS2022001',
    department: 'Computer Science & Engineering',
    program: 'B.Tech',
    currentSemester: 5,
    phone: '+91 98111 22233',
    eligibleBacklogs: [cs101._id, cs103._id, cs301._id, cs304._id, cs201._id]
  });

  const student2 = await User.create({
    name: 'Priya Patel',
    email: 'priya.cs@university.edu',
    password: studentPassword,
    role: 'student',
    rollNumber: 'CS2022045',
    department: 'Computer Science & Engineering',
    program: 'B.Tech',
    currentSemester: 5,
    phone: '+91 98222 33344',
    eligibleBacklogs: [cs301._id, cs302._id, cs304._id]
  });

  const student3 = await User.create({
    name: 'Amit Kumar',
    email: 'amit.ec@university.edu',
    password: studentPassword,
    role: 'student',
    rollNumber: 'EC2022012',
    department: 'Computer Science & Engineering',
    program: 'B.Tech',
    currentSemester: 5,
    phone: '+91 98333 44455',
    eligibleBacklogs: [cs101._id, cs102._id]
  });

  console.log('👤 Admin and Students created.');

  // 6. Pre-seeded Registrations
  // Reg 1: Priya Patel - Manual Payment with receipt PENDING_VERIFICATION
  const reg1Subjects = [
    {
      subjectId: cs301._id,
      code: cs301.code,
      name: cs301.name,
      semester: cs301.semester,
      type: cs301.type,
      isTheory: true,
      credits: cs301.credits,
      fee: 500
    },
    {
      subjectId: cs304._id,
      code: cs304.code,
      name: cs304.name,
      semester: cs304.semester,
      type: cs304.type,
      isTheory: false,
      credits: cs304.credits,
      fee: 300
    }
  ];

  await Registration.create({
    registrationNumber: 'REG-2026-ODD-84910',
    student: student2._id,
    session: activeOddSession._id,
    sessionName: activeOddSession.name,
    sessionType: 'ODD',
    subjects: reg1Subjects,
    theoryCount: 1,
    nonTheoryCount: 1,
    feeBreakdown: {
      theoryCount: 1,
      theoryFeePerSubject: 500,
      theoryTotal: 500,
      nonTheoryCount: 1,
      nonTheoryFeePerSubject: 300,
      nonTheoryTotal: 300,
      baseFee: 100,
      totalFee: 900
    },
    payment: {
      method: 'MANUAL',
      amount: 900,
      transactionReference: 'SBI-UTR-938201948210',
      bankName: 'State Bank of India',
      paymentDate: '2026-11-12T10:30:00.000Z',
      receiptUrl: '/uploads/sample_receipt_sbi.png',
      receiptOriginalName: 'sbi_fee_receipt_priya.png',
      status: 'PENDING_VERIFICATION'
    },
    status: 'SUBMITTED',
    submittedAt: '2026-11-12T10:35:00.000Z'
  });

  // Reg 2: Amit Kumar - Online Payment PAID / VERIFIED
  const reg2Subjects = [
    {
      subjectId: cs101._id,
      code: cs101.code,
      name: cs101.name,
      semester: cs101.semester,
      type: cs101.type,
      isTheory: true,
      credits: cs101.credits,
      fee: 500
    },
    {
      subjectId: cs102._id,
      code: cs102.code,
      name: cs102.name,
      semester: cs102.semester,
      type: cs102.type,
      isTheory: true,
      credits: cs102.credits,
      fee: 500
    }
  ];

  await Registration.create({
    registrationNumber: 'REG-2026-ODD-61042',
    student: student3._id,
    session: activeOddSession._id,
    sessionName: activeOddSession.name,
    sessionType: 'ODD',
    subjects: reg2Subjects,
    theoryCount: 2,
    nonTheoryCount: 0,
    feeBreakdown: {
      theoryCount: 2,
      theoryFeePerSubject: 500,
      theoryTotal: 1000,
      nonTheoryCount: 0,
      nonTheoryFeePerSubject: 300,
      nonTheoryTotal: 0,
      baseFee: 100,
      totalFee: 1100
    },
    payment: {
      method: 'ONLINE',
      amount: 1100,
      status: 'VERIFIED',
      razorpayOrderId: 'order_mock_9823019842',
      razorpayPaymentId: 'pay_rzp_mock_58291048',
      razorpaySignature: 'sig_mock_3920194821',
      transactionReference: 'pay_rzp_mock_58291048',
      paidAt: '2026-11-14T14:20:00.000Z',
      verifiedAt: '2026-11-14T14:21:00.000Z'
    },
    status: 'APPROVED',
    submittedAt: '2026-11-14T14:20:00.000Z'
  });

  console.log('📝 Sample registrations created.');

  // 7. Initial Audit Logs
  await AuditLog.create({
    action: 'INITIALIZE_SYSTEM',
    performedBy: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    },
    details: {
      message: 'System database seeded with examination sessions, courses, and default fee configurations.'
    },
    ip: '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Admin Account: admin@university.edu / admin123');
  console.log('Student Accounts:');
  console.log('  1) rahul.cs@university.edu (Roll: CS2022001) / student123');
  console.log('  2) priya.cs@university.edu (Roll: CS2022045) / student123');
  console.log('  3) amit.ec@university.edu  (Roll: EC2022012) / student123');
  console.log('----------------------------------------------------');
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding Failed:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
