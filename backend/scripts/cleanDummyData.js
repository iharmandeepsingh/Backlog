const { User, Subject, Registration } = require('../src/models');

async function cleanDummyData() {
  console.log('🧹 Purging old random/dummy data...');

  // 1. Remove old dummy students (Rahul, Priya, Amit, etc.)
  const allUsers = await User.find({ role: 'student' });
  let removedUsersCount = 0;
  for (const u of allUsers) {
    if (u.rollNumber !== '72312720' && u.rollNumber !== '72311390') {
      await User.findByIdAndDelete(u._id);
      removedUsersCount++;
      console.log(`  - Deleted dummy student: ${u.name} (${u.rollNumber})`);
    }
  }
  console.log(`✅ Removed ${removedUsersCount} dummy student records.`);

  // 2. Remove all old dummy CS subjects
  const allSubjects = await Subject.find();
  let removedSubsCount = 0;
  for (const s of allSubjects) {
    if (s.code.startsWith('CS') || s.department.toLowerCase().includes('computer')) {
      await Subject.findByIdAndDelete(s._id);
      removedSubsCount++;
    }
  }
  console.log(`✅ Removed ${removedSubsCount} dummy CS subjects.`);

  // 3. Remove all registrations associated with old dummy students
  const validStudents = await User.find();
  const validIds = new Set(validStudents.map(u => String(u._id)));
  const allRegistrations = await Registration.find();
  let removedRegsCount = 0;
  for (const r of allRegistrations) {
    const studentId = String(r.student?._id || r.student);
    if (!validIds.has(studentId)) {
      await Registration.findByIdAndDelete(r._id);
      removedRegsCount++;
    }
  }
  console.log(`✅ Removed ${removedRegsCount} old dummy registrations.`);

  // 4. Verify what remains
  const remainingStudents = await User.find({ role: 'student' });
  const remainingSubjects = await Subject.find();
  const remainingRegs = await Registration.find();

  console.log('\n📊 Clean Database Summary:');
  console.log(`  • Students (${remainingStudents.length}):`);
  remainingStudents.forEach(s => console.log(`      - Roll ${s.rollNumber}: ${s.name} (Sem ${s.currentSemester}, Batch ${s.batchYear})`));
  console.log(`  • Curriculum Subjects (${remainingSubjects.length} subjects from Excel/Catalog):`);
  console.log(`  • Registrations (${remainingRegs.length})`);

  console.log('\n✨ Database is now 100% focused strictly on Excel data!');
  process.exit(0);
}

cleanDummyData().catch(err => {
  console.error(err);
  process.exit(1);
});
