const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { User, Subject, Session, Config, Registration, AuditLog } = require('../src/models');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function migrate() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://harmanprab_db_user:NMnoIC7wmIPMdiLj@cluster0.lqzqt8a.mongodb.net/backlog_exam_portal?retryWrites=true&w=majority';
  console.log('Connecting to MongoDB Atlas at:', uri.replace(/:([^:@]+)@/, ':****@'));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected to MongoDB successfully!');

  const readJson = (filename) => {
    const p = path.join(DATA_DIR, filename);
    if (!fs.existsSync(p)) return [];
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      console.error(`Failed to read ${filename}:`, e.message);
      return [];
    }
  };

  // 1. Migrate Users
  const usersData = readJson('users.json');
  console.log(`\n--- Migrating ${usersData.length} Users ---`);
  for (const u of usersData) {
    const doc = {
      ...u,
      _id: new mongoose.Types.ObjectId(u._id),
      eligibleBacklogs: (u.eligibleBacklogs || []).map(id => new mongoose.Types.ObjectId(id)),
      failedSubjectRecords: (u.failedSubjectRecords || []).map(r => ({
        ...r,
        subjectId: r.subjectId ? new mongoose.Types.ObjectId(r.subjectId) : undefined
      }))
    };
    await User.findByIdAndUpdate(doc._id, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`  ✓ User: ${u.email} (${u.role})`);
  }

  // 2. Migrate Subjects
  const subjectsData = readJson('subjects.json');
  console.log(`\n--- Migrating ${subjectsData.length} Subjects ---`);
  for (const s of subjectsData) {
    const doc = {
      ...s,
      _id: new mongoose.Types.ObjectId(s._id)
    };
    await Subject.findByIdAndUpdate(doc._id, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`  ✓ Subject: ${s.code} - ${s.name}`);
  }

  // 3. Migrate Sessions
  const sessionsData = readJson('sessions.json');
  console.log(`\n--- Migrating ${sessionsData.length} Sessions ---`);
  for (const s of sessionsData) {
    const doc = {
      ...s,
      _id: new mongoose.Types.ObjectId(s._id),
      startDate: new Date(s.startDate),
      endDate: new Date(s.endDate),
      extendedDate: s.extendedDate ? new Date(s.extendedDate) : null,
      extensionHistory: (s.extensionHistory || []).map(h => ({
        ...h,
        extendedAt: new Date(h.extendedAt),
        oldEndDate: new Date(h.oldEndDate),
        newEndDate: new Date(h.newEndDate)
      }))
    };
    await Session.findByIdAndUpdate(doc._id, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`  ✓ Session: ${s.name} [${s.type}]`);
  }

  // 4. Migrate Config
  const configsData = readJson('configs.json');
  console.log(`\n--- Migrating ${configsData.length} Configurations ---`);
  for (const c of configsData) {
    const doc = {
      ...c,
      _id: new mongoose.Types.ObjectId(c._id)
    };
    await Config.findByIdAndUpdate(doc._id, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`  ✓ Config: updatedBy=${c.updatedBy}`);
  }

  // 5. Migrate Registrations
  const registrationsData = readJson('registrations.json');
  console.log(`\n--- Migrating ${registrationsData.length} Registrations ---`);
  for (const r of registrationsData) {
    const doc = {
      ...r,
      _id: new mongoose.Types.ObjectId(r._id),
      student: new mongoose.Types.ObjectId(r.student),
      session: new mongoose.Types.ObjectId(r.session),
      subjects: (r.subjects || []).map(sub => ({
        ...sub,
        subjectId: sub.subjectId ? new mongoose.Types.ObjectId(sub.subjectId) : undefined
      })),
      submittedAt: r.submittedAt ? new Date(r.submittedAt) : new Date(),
      payment: {
        ...r.payment,
        paymentDate: r.payment?.paymentDate ? new Date(r.payment.paymentDate) : null,
        verifiedAt: r.payment?.verifiedAt ? new Date(r.payment.verifiedAt) : null,
        verifiedBy: r.payment?.verifiedBy ? new mongoose.Types.ObjectId(r.payment.verifiedBy) : null
      }
    };
    await Registration.findByIdAndUpdate(doc._id, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`  ✓ Registration: ${r.registrationNumber} (Fee: ₹${r.feeBreakdown?.totalFee || 0})`);
  }

  // 6. Migrate Audit Logs
  const auditLogsData = readJson('audit_logs.json');
  console.log(`\n--- Migrating ${auditLogsData.length} Audit Logs ---`);
  for (const a of auditLogsData) {
    const doc = {
      ...a,
      _id: new mongoose.Types.ObjectId(a._id),
      timestamp: a.timestamp ? new Date(a.timestamp) : new Date()
    };
    await AuditLog.findByIdAndUpdate(doc._id, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  console.log(`  ✓ Successfully migrated ${auditLogsData.length} audit logs.`);

  console.log('\n=======================================');
  console.log('MongoDB Verification Counts:');
  console.log('Users in Mongo:', await User.countDocuments());
  console.log('Subjects in Mongo:', await Subject.countDocuments());
  console.log('Sessions in Mongo:', await Session.countDocuments());
  console.log('Configs in Mongo:', await Config.countDocuments());
  console.log('Registrations in Mongo:', await Registration.countDocuments());
  console.log('AuditLogs in Mongo:', await AuditLog.countDocuments());
  console.log('=======================================');

  console.log('\n🎉 ALL DATA HAS BEEN SUCCESSFULLY MIGRATED TO MONGODB ATLAS!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
