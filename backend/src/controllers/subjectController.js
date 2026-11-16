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
    const student = req.user;
    const activeSession = await Session.findOne({ isActive: true });

    if (!activeSession) {
      return res.status(400).json({
        success: false,
        message: 'No active examination registration session found.'
      });
    }

    const sessionType = activeSession.type; // 'ODD' or 'EVEN'

    // Determine eligible semesters based on session type:
    // ODD session: 1, 3, 5, 7
    // EVEN session: 2, 4, 6, 8
    const oddSemesters = [1, 3, 5, 7];
    const evenSemesters = [2, 4, 6, 8];
    const allowedSemesters = sessionType === 'ODD' ? oddSemesters : evenSemesters;

    // Filter by student's current semester (can only register for subjects in past semesters)
    const eligibleSemesters = allowedSemesters.filter(sem => sem < student.currentSemester);

    // Also find any subjects explicitly assigned to student in eligibleBacklogs
    const assignedIds = (student.eligibleBacklogs || []).map(id => String(id));

    // Find subjects matching department and program in eligible semesters
    const query = {
      department: student.department,
      semester: { $in: eligibleSemesters }
    };
    if (student.program) {
      query.program = student.program;
    }

    let candidateSubjects = await Subject.find(query);

    // Also include any subjects explicitly in student's assigned backlogs if semester matches session type
    if (assignedIds.length > 0) {
      const assignedSubjects = await Subject.find({ _id: { $in: assignedIds } });
      for (const sub of assignedSubjects) {
        // Enforce session odd/even rule even for assigned backlogs
        const isOdd = sub.semester % 2 !== 0;
        const matchesSession = (sessionType === 'ODD' && isOdd) || (sessionType === 'EVEN' && !isOdd);
        if (matchesSession && !candidateSubjects.some(c => String(c._id) === String(sub._id))) {
          candidateSubjects.push(sub);
        }
      }
    }

    // Check subjects already registered by the student in this active session
    const existingRegistrations = await Registration.find({
      student: student._id,
      session: activeSession._id,
      status: { $ne: 'REJECTED' } // if rejected, student might re-register
    });

    const alreadyRegisteredSubjectIds = new Set();
    existingRegistrations.forEach(reg => {
      if (reg.subjects && Array.isArray(reg.subjects)) {
        reg.subjects.forEach(s => {
          alreadyRegisteredSubjectIds.add(String(s.subjectId || s._id));
        });
      }
    });

    // Mark subjects with eligibility status and already registered flag
    const processed = candidateSubjects.map(sub => {
      const isAlreadyRegistered = alreadyRegisteredSubjectIds.has(String(sub._id));
      return {
        ...sub,
        isTheory: sub.type === 'Theory',
        isAlreadyRegistered
      };
    });

    res.json({
      success: true,
      activeSession,
      sessionType,
      allowedSemesters: eligibleSemesters,
      eligibleSubjects: processed
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
