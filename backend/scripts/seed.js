const path = require('path');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../src/config/db');
const { User, Subject, Session, Config, Registration, AuditLog } = require('../src/models');
const { importResultsFromExcel } = require('../src/utils/excelImporter');

const seedDatabase = async () => {
  console.log('🌱 Starting Clean Database Seeding (Excel Centric)...');
  await connectDB();

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

  // 3. Admin Account
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await User.create({
    name: 'Dr. Ramesh Sharma',
    email: 'admin@university.edu',
    password: adminPassword,
    role: 'admin',
    department: 'Examination Control Division',
    program: 'University Administration',
    phone: '+91 98765 43210'
  });
  console.log('👑 Admin user created: admin@university.edu');

  // 4. Examination Sessions
  const oddSession = await Session.create({
    name: 'Winter 2026 Examination (Odd Semesters 1, 3, 5)',
    type: 'ODD',
    academicYear: '2026-2027',
    startDate: new Date('2026-11-01').toISOString(),
    endDate: new Date('2026-12-31T23:59:59').toISOString(),
    isActive: true
  });

  const evenSession = await Session.create({
    name: 'Summer 2027 Examination (Even Semesters 2, 4, 6)',
    type: 'EVEN',
    academicYear: '2026-2027',
    startDate: new Date('2027-04-01').toISOString(),
    endDate: new Date('2027-05-31T23:59:59').toISOString(),
    isActive: false
  });
  console.log('📅 Examination sessions initialized.');

  // 5. Ingest Results Directly from Excel Sheet (LAW 2023.xlsx)
  const excelPath = path.join(__dirname, '..', '..', 'LAW 2023.xlsx');
  console.log(`📄 Ingesting failure data from: ${excelPath}`);
  const importResult = await importResultsFromExcel(excelPath);

  console.log('✅ Excel Import Complete in Seed:');
  console.log(`   - Total Rows: ${importResult.totalRows}`);
  console.log(`   - Students Ingested: ${importResult.studentsCreated + importResult.studentsUpdated}`);
  console.log(`   - Failed Records Mapped: ${importResult.totalFailedRecords}`);

  // 6. Log system initialization
  await AuditLog.create({
    action: 'INITIALIZE_SYSTEM',
    performedBy: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    },
    details: {
      message: 'System database seeded strictly from Excel result sheet (LAW 2023.xlsx).'
    },
    ip: '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  console.log('\n🎉 Clean Seeding Completed! Only actual Excel data is present in the system.');
  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
