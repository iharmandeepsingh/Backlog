const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const { User, Subject, Session } = require('../models');
const { logAudit } = require('./auditLogger');

// Standard curriculum mapping for Law and general codes
const KNOWN_SUBJECT_CATALOG = {
  // B.A., LL.B Semester 1 (ODD)
  '23BALB11C01': { name: 'Legal Methods & Indian Legal System', semester: 1, credits: 5, type: 'Theory', isTheory: true },
  '23BALB11C02': { name: 'Law of Contract - I (General Principles)', semester: 1, credits: 5, type: 'Theory', isTheory: true },
  '23BALB11C03': { name: 'Law of Torts & Consumer Protection', semester: 1, credits: 5, type: 'Theory', isTheory: true },
  '23BALB11C04': { name: 'English & Legal Language', semester: 1, credits: 4, type: 'Theory', isTheory: true },
  '23BALB11C05': { name: 'Political Science - I', semester: 1, credits: 4, type: 'Theory', isTheory: true },
  '23BALB11C06': { name: 'Moot Court & Clinical Legal Exercise - I', semester: 1, credits: 2, type: 'Practical', isTheory: false },

  // B.A., LL.B Semester 2 (EVEN)
  '23BALB12C01': { name: 'Law of Contract - II (Specific Relief)', semester: 2, credits: 5, type: 'Theory', isTheory: true },
  '23BALB12C02': { name: 'Constitutional Law - I', semester: 2, credits: 5, type: 'Theory', isTheory: true },
  '23BALB12C03': { name: 'Family Law - I (Hindu Law)', semester: 2, credits: 5, type: 'Theory', isTheory: true },
  '23BALB12C04': { name: 'Sociology - I', semester: 2, credits: 4, type: 'Theory', isTheory: true },
  '23BALB12C05': { name: 'Legal Research & Drafting Clinic', semester: 2, credits: 2, type: 'Practical', isTheory: false },

  // B.A., LL.B Semester 3 (ODD)
  '23BALB13C01': { name: 'Constitutional Law - II', semester: 3, credits: 5, type: 'Theory', isTheory: true },
  '23BALB13C02': { name: 'Family Law - II (Muslim Law)', semester: 3, credits: 5, type: 'Theory', isTheory: true },
  '23BALB13C03': { name: 'Law of Crimes - I (IPC)', semester: 3, credits: 5, type: 'Theory', isTheory: true },
  '23BALB13C04': { name: 'Jurisprudence - I', semester: 3, credits: 5, type: 'Theory', isTheory: true },
  '23BALB13C05': { name: 'Clinical Legal Education & Trial Advocacy', semester: 3, credits: 2, type: 'Practical', isTheory: false },

  // B.A., LL.B Semester 4 (EVEN)
  '23BALB14C01': { name: 'Law of Crimes - II (CrPC)', semester: 4, credits: 5, type: 'Theory', isTheory: true },
  '23BALB14C02': { name: 'Property Law & Transfer of Property', semester: 4, credits: 5, type: 'Theory', isTheory: true },
  '23BALB14C03': { name: 'Administrative Law', semester: 4, credits: 5, type: 'Theory', isTheory: true },
  '23BALB14C04': { name: 'Environmental Law', semester: 4, credits: 4, type: 'Theory', isTheory: true },
  '23BALB14C05': { name: 'Internship Assessment & Viva Voce', semester: 4, credits: 2, type: 'Practical', isTheory: false },

  // B.A., LL.B Semester 5 (ODD)
  '23BALB15C01': { name: 'Company Law & Corporate Governance', semester: 5, credits: 5, type: 'Theory', isTheory: true },
  '23BALB15C02': { name: 'Code of Civil Procedure - I', semester: 5, credits: 5, type: 'Theory', isTheory: true },
  '23BALB15C03': { name: 'Law of Evidence', semester: 5, credits: 5, type: 'Theory', isTheory: true },
  '23BALB15C04': { name: 'Labour & Industrial Law - I', semester: 5, credits: 4, type: 'Theory', isTheory: true },
  '23BALB15C05': { name: 'Moot Court Exercise & Internship', semester: 5, credits: 2, type: 'Practical', isTheory: false }
};

/**
 * Decode admission year (batch) from student enrollment number
 * e.g. 72311390 -> 2nd & 3rd digit is '23' -> 2023 batch (Started 1st year in 2023)
 * e.g. 72312720 -> '23' -> 2023 batch
 * e.g. 72210045 -> '22' -> 2022 batch
 */
const decodeBatchYearFromEnrollment = (enrollment) => {
  if (!enrollment) return null;
  const clean = String(enrollment).trim();

  // Pattern: [DeptPrefixDigit][2-digit-year][Sequence] e.g. 72311390
  const stdMatch = clean.match(/^\d(\d{2})\d{4,}$/);
  if (stdMatch) {
    const yy = parseInt(stdMatch[1], 10);
    return 2000 + yy;
  }

  // Generic 4-digit year in roll e.g. CS2022001 -> 2022
  const fourDigit = clean.match(/20(1\d|2\d|3\d)/);
  if (fourDigit) {
    return parseInt(fourDigit[0], 10);
  }

  // Generic 2-digit year after letters e.g. LAW2301
  const twoDigit = clean.match(/[A-Za-z]+(\d{2})/);
  if (twoDigit) {
    const yy = parseInt(twoDigit[1], 10);
    if (yy >= 15 && yy <= 35) return 2000 + yy;
  }

  return null;
};

/**
 * Calculate current academic semester based on batch year, active exam session, and failed semester
 */
const calculateCurrentSemesterFromBatch = (batchYear, activeSession, failedSemester = 1) => {
  if (!batchYear) {
    return Math.max(3, failedSemester + 2);
  }

  let sessionYear = 2024;
  let sessionType = 'ODD';

  if (activeSession) {
    sessionType = activeSession.type || 'ODD';
    if (activeSession.startDate) {
      sessionYear = new Date(activeSession.startDate).getFullYear();
    } else if (activeSession.academicYear) {
      const m = activeSession.academicYear.match(/(\d{4})/);
      if (m) sessionYear = parseInt(m[1], 10);
    }
  }

  // Years since admission:
  // e.g. Batch 2023:
  // In Year 2 (2024): Odd = Sem 3, Even = Sem 4
  // In Year 3 (2025): Odd = Sem 5, Even = Sem 6
  const yearsElapsed = Math.max(1, sessionYear - batchYear);

  let sem = (sessionType === 'ODD')
    ? (2 * (yearsElapsed >= 2 ? 2 : 1) - 1) // Defaults to Semester 3 for batch 2023 in active Odd session
    : (2 * (yearsElapsed >= 2 ? 2 : 1));

  // If active session is Odd and failed sem is 1, candidate takes back in Sem 3
  if (sessionType === 'ODD' && failedSemester === 1) {
    sem = 3;
  }

  // Ensure current semester is strictly greater than the failed semester
  if (sem <= failedSemester) {
    sem = sessionType === 'ODD' ? failedSemester + 2 : failedSemester + 1;
  }

  return sem;
};

/**
 * Parse semester string (e.g. "1ST", "2ND", "3RD", "Sem 4", 5) to integer
 */
const parseSemester = (semVal) => {
  if (typeof semVal === 'number') return semVal;
  if (!semVal) return 1;
  const match = String(semVal).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
};

/**
 * Determine if subject is non-theory by name or code keywords
 */
const isNonTheorySubject = (name = '', code = '') => {
  const text = `${name} ${code}`.toLowerCase();
  return (
    text.includes('lab') ||
    text.includes('practical') ||
    text.includes('moot') ||
    text.includes('clinical') ||
    text.includes('viva') ||
    text.includes('internship') ||
    text.includes('seminar') ||
    text.includes('project') ||
    text.includes('workshop')
  );
};

/**
 * Import student failures from Excel workbook / buffer
 */
const importResultsFromExcel = async (filePathOrBuffer, options = {}) => {
  let workbook;
  if (typeof filePathOrBuffer === 'string') {
    workbook = xlsx.readFile(filePathOrBuffer);
  } else {
    workbook = xlsx.read(filePathOrBuffer, { type: 'buffer' });
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: null });

  const activeSession = await Session.findOne({ isActive: true });
  const defaultPasswordHash = await bcrypt.hash('student123', 10);
  const targetCurrentSemester = options.currentSemester ? Number(options.currentSemester) : null;

  let studentsCreated = 0;
  let studentsUpdated = 0;
  let failedRecordsCount = 0;
  const processedStudents = new Map(); // rollNumber -> student object

  for (let rowIndex = 0; rowIndex < rawRows.length; rowIndex++) {
    const row = rawRows[rowIndex];

    // 1. Extract Student identification
    const rollRaw = row['ENROLEMENT NO'] || row['ENROLLMENT NO'] || row['ROLL NO'] || row['RollNumber'] || row['Enrollment'];
    if (!rollRaw) continue;

    const rollNumber = String(rollRaw).trim();
    const rawName = row['STUDENT NAME'] || row['NAME'] || row['StudentName'] || `Student ${rollNumber}`;
    const studentName = String(rawName).trim();
    const department = String(row['INSTITUTION:'] || row['DEPARTMENT'] || row['Department'] || 'School of Law').trim();
    const program = String(row['PROGRAMME NAME:'] || row['PROGRAM'] || row['Programme'] || 'B.A., LL.B').trim();
    const semester = parseSemester(row['SEMESTER:'] || row['SEMESTER'] || row['Semester']);
    const sourceFile = String(row['SOURCE FILE'] || 'LAW 2023.xlsx').trim();

    // Decode batch year from enrollment number (e.g. 72311390 -> 2023)
    const batchYear = decodeBatchYearFromEnrollment(rollNumber) || 2023;

    // 2. Detect subject columns
    const subjectEntries = [];

    // Check for indexed subject columns (Sub Code1, Sub Code2, etc.)
    for (let i = 1; i <= 20; i++) {
      const codeKey = `Sub Code${i}`;
      if (row[codeKey]) {
        subjectEntries.push({
          code: String(row[codeKey]).trim(),
          credits: Number(row[`TotalCr${i}`]) || 5,
          grade: String(row[`LG${i}`] || '').trim().toUpperCase(),
          totalMarks: Number(row[`TTOT${i}`]) || Number(row[`TOT MARKS${i}`]) || 0,
          internalMarks: Number(row[`IAT${i}`]) || 0,
          externalMarks: Number(row[`UET${i}`]) || 0,
          maxMarks: Number(row[`TOT MARKS${i}`]) || 100,
          remark: String(row[`__EMPTY_${i}`] || row[`Remark${i}`] || '').trim().toUpperCase()
        });
      }
    }

    // Generic columns if no indexed columns found
    if (subjectEntries.length === 0) {
      const genericCode = row['Sub Code'] || row['Subject Code'] || row['SubjectCode'] || row['CODE'];
      if (genericCode) {
        subjectEntries.push({
          code: String(genericCode).trim(),
          credits: Number(row['TotalCr'] || row['Credits']) || 5,
          grade: String(row['LG'] || row['Grade'] || row['Result'] || '').trim().toUpperCase(),
          totalMarks: Number(row['TTOT'] || row['Total']) || 0,
          internalMarks: Number(row['IAT'] || row['Internal']) || 0,
          externalMarks: Number(row['UET'] || row['External']) || 0,
          maxMarks: Number(row['TOT MARKS'] || row['MaxMarks']) || 100,
          remark: String(row['Remark'] || '').trim().toUpperCase()
        });
      }
    }

    // 3. Process each subject failure
    for (const entry of subjectEntries) {
      const isFail = (
        entry.grade === 'F' ||
        entry.grade === 'FAIL' ||
        entry.grade === 'AB' ||
        entry.grade === 'ABSENT' ||
        entry.grade === 'RA' ||
        entry.remark === 'RE' ||
        (entry.totalMarks < 40 && entry.grade !== 'P')
      );

      if (!isFail) continue; // Only failures / supplis are backlogs!

      failedRecordsCount++;

      // Subject catalog details
      const catalogInfo = KNOWN_SUBJECT_CATALOG[entry.code];
      const subjectName = catalogInfo?.name || `Subject (${entry.code})`;
      const subjectSem = catalogInfo?.semester || semester;
      const subjectCredits = catalogInfo?.credits || entry.credits || 5;
      const isTheory = catalogInfo ? catalogInfo.isTheory : !isNonTheorySubject(subjectName, entry.code);
      const subjectType = catalogInfo ? catalogInfo.type : (isTheory ? 'Theory' : 'Practical');

      // Ensure Subject exists in database
      let subjectDoc = await Subject.findOne({ code: entry.code });
      if (!subjectDoc) {
        subjectDoc = await Subject.create({
          code: entry.code,
          name: subjectName,
          semester: subjectSem,
          credits: subjectCredits,
          department,
          program,
          type: subjectType,
          isTheory
        });
      }

      // Group student failure records by rollNumber
      let studentData = processedStudents.get(rollNumber);
      if (!studentData) {
        // Format friendly display name
        let formattedName = studentName;
        if (studentName === 'A' || studentName === 'B') {
          formattedName = `Student ${studentName} (${rollNumber})`;
        }

        studentData = {
          rollNumber,
          name: formattedName,
          department,
          program,
          batchYear,
          failedSubjectRecords: [],
          failedSubjectIds: new Set(),
          maxFailedSemester: subjectSem
        };
        processedStudents.set(rollNumber, studentData);
      }

      if (subjectSem > studentData.maxFailedSemester) {
        studentData.maxFailedSemester = subjectSem;
      }

      if (!studentData.failedSubjectIds.has(String(subjectDoc._id))) {
        studentData.failedSubjectIds.add(String(subjectDoc._id));
        studentData.failedSubjectRecords.push({
          subjectId: subjectDoc._id,
          code: entry.code,
          name: subjectName,
          semester: subjectSem,
          credits: subjectCredits,
          type: subjectType,
          isTheory,
          grade: entry.grade || 'F',
          internalMarks: entry.internalMarks,
          externalMarks: entry.externalMarks,
          totalMarks: entry.totalMarks,
          maxMarks: entry.maxMarks,
          sourceFile
        });
      }
    }
  }

  // 4. Save students to database
  const importedList = [];

  for (const [rollNumber, sData] of processedStudents.entries()) {
    let existingUser = await User.findOne({ rollNumber });

    // Determine current semester:
    // User can override, otherwise calculate from batchYear (e.g. Batch 2023 in Year 2 -> Sem 3)
    let currentSem;
    if (targetCurrentSemester) {
      currentSem = targetCurrentSemester;
    } else {
      currentSem = calculateCurrentSemesterFromBatch(sData.batchYear, activeSession, sData.maxFailedSemester);
    }

    const failedIdsArray = Array.from(sData.failedSubjectIds);

    if (existingUser) {
      const mergedBacklogs = [...new Set([...(existingUser.eligibleBacklogs || []).map(String), ...failedIdsArray])];
      const existingRecords = existingUser.failedSubjectRecords || [];
      const newCodes = new Set(sData.failedSubjectRecords.map(r => r.code));
      const filteredExisting = existingRecords.filter(r => !newCodes.has(r.code));
      const mergedRecords = [...filteredExisting, ...sData.failedSubjectRecords];

      await User.findByIdAndUpdate(existingUser._id, {
        name: existingUser.name?.startsWith('Student') ? sData.name : (existingUser.name || sData.name),
        department: sData.department,
        program: sData.program,
        batchYear: sData.batchYear,
        currentSemester: currentSem,
        eligibleBacklogs: mergedBacklogs,
        failedSubjectRecords: mergedRecords
      });
      studentsUpdated++;
      importedList.push({
        rollNumber,
        name: sData.name,
        batchYear: sData.batchYear,
        currentSemester: currentSem,
        backlogCount: mergedBacklogs.length,
        status: 'UPDATED'
      });
    } else {
      const email = `${rollNumber.toLowerCase()}@university.edu`;
      const newUser = await User.create({
        name: sData.name,
        email,
        password: defaultPasswordHash,
        role: 'student',
        rollNumber,
        department: sData.department,
        program: sData.program,
        batchYear: sData.batchYear,
        currentSemester: currentSem,
        phone: '+91 98000 00000',
        eligibleBacklogs: failedIdsArray,
        failedSubjectRecords: sData.failedSubjectRecords
      });
      studentsCreated++;
      importedList.push({
        rollNumber,
        name: newUser.name,
        email,
        batchYear: sData.batchYear,
        currentSemester: currentSem,
        backlogCount: failedIdsArray.length,
        status: 'CREATED'
      });
    }
  }

  return {
    success: true,
    totalRows: rawRows.length,
    studentsCreated,
    studentsUpdated,
    totalFailedRecords: failedRecordsCount,
    importedStudents: importedList
  };
};

module.exports = {
  importResultsFromExcel,
  decodeBatchYearFromEnrollment,
  calculateCurrentSemesterFromBatch,
  KNOWN_SUBJECT_CATALOG,
  parseSemester,
  isNonTheorySubject
};
