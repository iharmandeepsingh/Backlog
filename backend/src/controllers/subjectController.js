const { Subject, Session, Registration, User } = require('../models');
const { logAudit } = require('../utils/auditLogger');

exports.getAllSubjects = async (req, res) => {
  try {
    const { department, semester, type, program, search } = req.query;
    const query = {};

    if (department && department !== 'ALL') query.department = department;
    if (semester && semester !== 'ALL') query.semester = Number(semester);
    if (type && type !== 'ALL') query.type = type;
    if (program && program !== 'ALL') query.program = program;

    let subjects = await Subject.find(query).sort({ semester: 1, code: 1 });

    if (search) {
      const term = search.toLowerCase();
      subjects = subjects.filter(s =>
        s.code.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term) ||
        s.department.toLowerCase().includes(term)
      );
    }

    res.json({ success: true, count: subjects.length, subjects });
  } catch (error) {
    console.error('Fetch subjects error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve subjects.' });
  }
};

exports.getEligibleBacklogs = async (req, res) => {
  try {
    const studentUser = await User.findById(req.user._id);
    if (!studentUser) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const activeSession = await Session.findOne({ isActive: true });
    // Determine session type requested (ODD or EVEN) or fallback to active session
    const requestedType = req.query.sessionType
      ? req.query.sessionType.toUpperCase()
      : (activeSession ? activeSession.type : 'ODD');

    const currentSemester = Number(studentUser.currentSemester || 1);

    // Collect all failed subjects explicitly associated with this student
    const failedIds = new Set((studentUser.eligibleBacklogs || []).map(String));
    const failedRecords = studentUser.failedSubjectRecords || [];

    failedRecords.forEach(rec => {
      if (rec.subjectId) failedIds.add(String(rec.subjectId));
    });

    const failedIdsArray = Array.from(failedIds);

    let failedSubjectsDocs = [];
    if (failedIdsArray.length > 0) {
      failedSubjectsDocs = await Subject.find({ _id: { $in: failedIdsArray } });
    }

    // Check subjects already registered in this active session
    const alreadyRegisteredSubjectIds = new Set();
    if (activeSession) {
      const existingRegistrations = await Registration.find({
        student: studentUser._id,
        session: activeSession._id,
        status: { $ne: 'REJECTED' }
      });
      existingRegistrations.forEach(reg => {
        if (reg.subjects && Array.isArray(reg.subjects)) {
          reg.subjects.forEach(s => {
            alreadyRegisteredSubjectIds.add(String(s.subjectId || s._id));
          });
        }
      });
    }

    // Process all failed subjects
    const allFailedSubjects = [];
    const eligibleSubjects = [];
    const isSpecial = (requestedType === 'SPECIAL' || (activeSession && activeSession.type === 'SPECIAL'));

    for (const sub of failedSubjectsDocs) {
      const subSem = Number(sub.semester);
      const isOdd = subSem % 2 !== 0;
      const isPrevious = subSem < currentSemester;
      // In SPECIAL session, student can fill ANY backlog of BOTH odd and even semesters
      const matchesType = isSpecial || (requestedType === 'ODD' && isOdd) || (requestedType === 'EVEN' && !isOdd);
      const isAlreadyRegistered = alreadyRegisteredSubjectIds.has(String(sub._id));

      const failDetail = failedRecords.find(r =>
        String(r.subjectId) === String(sub._id) || r.code === sub.code
      );

      const enriched = {
        ...sub,
        isTheory: sub.type === 'Theory' || sub.isTheory === true,
        grade: failDetail?.grade || 'F',
        marks: failDetail?.totalMarks ?? null,
        internalMarks: failDetail?.internalMarks ?? null,
        externalMarks: failDetail?.externalMarks ?? null,
        maxMarks: failDetail?.maxMarks ?? 100,
        sourceFile: failDetail?.sourceFile || null,
        isPrevious,
        isCurrentSemester: subSem === currentSemester,
        matchesType,
        isAlreadyRegistered
      };

      allFailedSubjects.push(enriched);

      // CRITICAL RULE:
      // 1. Strictly previous semester (< currentSemester) - current semester excluded!
      // 2. Matches Odd or Even session type
      // 3. Must be a subject student actually failed in
      if (isPrevious && matchesType) {
        eligibleSubjects.push(enriched);
      }
    }

    eligibleSubjects.sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code));
    allFailedSubjects.sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code));

    res.json({
      success: true,
      activeSession,
      sessionType: requestedType,
      isSpecialExam: isSpecial,
      allowAllSemesters: isSpecial,
      currentSemester,
      studentRollNumber: studentUser.rollNumber,
      studentName: studentUser.name,
      department: studentUser.department,
      program: studentUser.program,
      eligibleSubjects,
      allFailedSubjects,
      eligibleCount: eligibleSubjects.length,
      totalFailedCount: allFailedSubjects.length
    });
  } catch (error) {
    console.error('Get eligible backlogs error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve eligible backlog subjects.' });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const { code, name, semester, credits, department, program = 'B.Tech', type = 'Theory' } = req.body;

    if (!code || !name || !semester || !department) {
      return res.status(400).json({
        success: false,
        message: 'Subject code, name, semester, and department are required.'
      });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await Subject.findOne({ code: cleanCode, department });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Subject with code ${cleanCode} already exists in ${department}.`
      });
    }

    const isTheory = type.toLowerCase() === 'theory';

    const newSubject = await Subject.create({
      code: cleanCode,
      name: name.trim(),
      semester: Number(semester),
      credits: Number(credits) || 3,
      department,
      program,
      type: isTheory ? 'Theory' : (type || 'Practical'),
      isTheory
    });

    await logAudit({
      action: 'CREATE_SUBJECT',
      performedBy: req.user,
      details: {
        code: newSubject.code,
        name: newSubject.name,
        semester: newSubject.semester,
        type: newSubject.type
      },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully.',
      subject: newSubject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ success: false, message: 'Failed to create subject.' });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, semester, credits, department, program, type } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const updates = {};
    if (code) updates.code = code.toUpperCase().trim();
    if (name) updates.name = name.trim();
    if (semester !== undefined) updates.semester = Number(semester);
    if (credits !== undefined) updates.credits = Number(credits);
    if (department) updates.department = department;
    if (program) updates.program = program;
    if (type) {
      updates.type = type;
      updates.isTheory = type.toLowerCase() === 'theory';
    }

    const updated = await Subject.findByIdAndUpdate(id, updates, { new: true });

    await logAudit({
      action: 'UPDATE_SUBJECT',
      performedBy: req.user,
      details: { subjectId: id, updates },
      req
    });

    res.json({
      success: true,
      message: 'Subject updated successfully.',
      subject: updated
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ success: false, message: 'Failed to update subject.' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    await Subject.findByIdAndDelete(id);

    await logAudit({
      action: 'DELETE_SUBJECT',
      performedBy: req.user,
      details: { subjectId: id, code: subject.code, name: subject.name },
      req
    });

    res.json({ success: true, message: 'Subject removed successfully.' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete subject.' });
  }
};
