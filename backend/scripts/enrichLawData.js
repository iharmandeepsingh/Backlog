const { User, Subject } = require('../src/models');
const { KNOWN_SUBJECT_CATALOG } = require('../src/utils/excelImporter');

async function enrich() {
  console.log('Enriching Law subjects and demo student data...');

  const createdSubjectMap = {};
  for (const [code, info] of Object.entries(KNOWN_SUBJECT_CATALOG)) {
    let sub = await Subject.findOne({ code });
    if (!sub) {
      sub = await Subject.create({
        code,
        name: info.name,
        semester: info.semester,
        credits: info.credits,
        department: 'SCHOOL OF LAW',
        program: 'B.A., LL.B',
        type: info.type,
        isTheory: info.isTheory
      });
      console.log(`Created subject: ${code} - ${info.name} (Sem ${info.semester}, ${info.type})`);
    }
    createdSubjectMap[code] = sub;
  }

  // Update student 72312720 with failed subjects:
  // Sem 1 (Odd): 5 Theory (23BALB11C01..05) + 1 Practical (23BALB11C06) -> Tests the 4 Theory limit & unlimited practical
  // Sem 2 (Even): 1 Theory (23BALB12C01) + 1 Practical (23BALB12C05) -> Tests the Even session switch
  // Student's currentSemester = 3 (Tests that Sem 3 subjects are NOT shown because current sem regular exams apply!)
  const student = await User.findOne({ rollNumber: '72312720' });
  if (student) {
    const sem1Theory = ['23BALB11C01', '23BALB11C02', '23BALB11C03', '23BALB11C04', '23BALB11C05'];
    const sem1Practical = ['23BALB11C06'];
    const sem2Theory = ['23BALB12C01'];
    const sem2Practical = ['23BALB12C05'];

    const allTestCodes = [...sem1Theory, ...sem1Practical, ...sem2Theory, ...sem2Practical];
    const eligibleBacklogIds = [];
    const failedRecords = [];

    for (const code of allTestCodes) {
      const sDoc = createdSubjectMap[code];
      if (sDoc) {
        eligibleBacklogIds.push(String(sDoc._id));
        failedRecords.push({
          subjectId: sDoc._id,
          code: sDoc.code,
          name: sDoc.name,
          semester: sDoc.semester,
          credits: sDoc.credits,
          type: sDoc.type,
          isTheory: sDoc.isTheory,
          grade: 'F',
          internalMarks: 18,
          externalMarks: 12,
          totalMarks: 30,
          maxMarks: 100,
          sourceFile: 'LAW 2023.xlsx'
        });
      }
    }

    await User.findByIdAndUpdate(student._id, {
      name: 'Aditya Verma (LAW 2023)',
      currentSemester: 3,
      eligibleBacklogs: eligibleBacklogIds,
      failedSubjectRecords: failedRecords
    });

    console.log(`✅ Student 72312720 updated with ${eligibleBacklogIds.length} failed subjects across Sem 1 (Odd) and Sem 2 (Even). Current Semester: 3.`);
  }

  process.exit(0);
}

enrich().catch(err => {
  console.error(err);
  process.exit(1);
});
