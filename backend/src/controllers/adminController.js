const { User, Registration, Session, Subject, AuditLog } = require('../models');
const { logAudit } = require('../utils/auditLogger');
const { importResultsFromExcel } = require('../utils/excelImporter');

exports.getDashboardStats = async (req, res) => {
  try {
    const registrations = await Registration.find().populate('student').populate('session');
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeSession = await Session.findOne({ isActive: true });

    let totalCollected = 0;
    let pendingVerification = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let onlineCount = 0;
    let manualCount = 0;

    const deptMap = {};

    registrations.forEach(r => {
      const status = r.payment?.status;
      const method = r.payment?.method;
      const amount = Number(r.feeBreakdown?.totalFee) || 0;

      if (status === 'VERIFIED') {
        totalCollected += amount;
        approvedCount++;
      } else if (status === 'PENDING_VERIFICATION') {
        pendingVerification++;
      } else if (status === 'REJECTED') {
        rejectedCount++;
      }

      if (method === 'ONLINE') onlineCount++;
      if (method === 'MANUAL') manualCount++;

      const dept = r.student?.department || 'Unknown';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    const recentRegistrations = registrations
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    res.json({
      success: true,
      stats: {
        totalRegistrations: registrations.length,
        totalStudents,
        activeSession: activeSession ? { name: activeSession.name, type: activeSession.type } : null,
        totalCollected,
        pendingVerification,
        approvedCount,
        rejectedCount,
        paymentMethods: {
          online: onlineCount,
          manual: manualCount
        },
        departmentDistribution: deptMap
      },
      recentRegistrations
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard statistics.' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to load audit logs.' });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const { search, department, semester } = req.query;
    let students = await User.find({ role: 'student' }).sort({ rollNumber: 1 });

    if (department && department !== 'ALL') {
      students = students.filter(s => s.department === department);
    }
    if (semester && semester !== 'ALL') {
      students = students.filter(s => Number(s.currentSemester) === Number(semester));
    }
    if (search) {
      const term = search.toLowerCase().trim();
      students = students.filter(s =>
        (s.name && s.name.toLowerCase().includes(term)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term))
      );
    }

    // Sanitize password out
    const sanitized = students.map(s => {
      const copy = { ...s };
      delete copy.password;
      return copy;
    });

    res.json({ success: true, count: sanitized.length, students: sanitized });
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve student records.' });
  }
};

exports.updateStudentBacklogs = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { eligibleBacklogs, currentSemester, department, program } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    const updates = {};
    if (Array.isArray(eligibleBacklogs)) updates.eligibleBacklogs = eligibleBacklogs;
    if (currentSemester) updates.currentSemester = Number(currentSemester);
    if (department) updates.department = department;
    if (program) updates.program = program;

    const updated = await User.findByIdAndUpdate(studentId, updates, { new: true });

    await logAudit({
      action: 'UPDATE_STUDENT_RECORD',
      performedBy: req.user,
      details: {
        studentRoll: student.rollNumber,
        studentName: student.name,
        updates
      },
      req
    });

    const sanitized = { ...updated };
    delete sanitized.password;

    res.json({
      success: true,
      message: `Backlog records for student ${student.rollNumber} updated successfully.`,
      student: sanitized
    });
  } catch (error) {
    console.error('Update student backlogs error:', error);
    res.status(500).json({ success: false, message: 'Failed to update student backlog record.' });
  }
};

exports.importResultsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx) file.' });
    }

    const { defaultCurrentSemester } = req.body;
    const result = await importResultsFromExcel(req.file.buffer, {
      currentSemester: defaultCurrentSemester ? Number(defaultCurrentSemester) : null
    });

    await logAudit({
      action: 'IMPORT_EXCEL_RESULTS',
      performedBy: req.user,
      details: {
        fileName: req.file.originalname,
        totalRows: result.totalRows,
        studentsCreated: result.studentsCreated,
        studentsUpdated: result.studentsUpdated,
        totalFailedRecords: result.totalFailedRecords
      },
      req
    });

    res.json({
      success: true,
      message: `Successfully processed ${result.totalRows} rows. Created ${result.studentsCreated} students, updated ${result.studentsUpdated} students with ${result.totalFailedRecords} failure backlog records.`,
      result
    });
  } catch (error) {
    console.error('Import excel results error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process Excel file.' });
  }
};
