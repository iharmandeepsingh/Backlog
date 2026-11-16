const { Registration, Session, Subject, Config, User } = require('../models');
const { logAudit } = require('../utils/auditLogger');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const generateRegNumber = (sessionType) => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `REG-${year}-${sessionType}-${rand}`;
};

exports.createRegistration = async (req, res) => {
  try {
    const student = req.user;
    const { subjectIds, paymentMethod, transactionReference, bankName, paymentDate } = req.body;

    // Parse subjectIds if passed as JSON string (from multipart form-data)
    let selectedIds = subjectIds;
    if (typeof subjectIds === 'string') {
      try {
        selectedIds = JSON.parse(subjectIds);
      } catch (e) {
        selectedIds = [subjectIds];
      }
    }

    if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one eligible backlog subject to register.'
      });
    }

    // 1. Validate active session
    const activeSession = await Session.findOne({ isActive: true });
    if (!activeSession) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed. No active examination session found.'
      });
    }

    // Check session date validity
    const now = new Date();
    if (new Date(activeSession.startDate) > now || new Date(activeSession.endDate) < now) {
      return res.status(400).json({
        success: false,
        message: 'Examination registration is not currently open for the active session dates.'
      });
    }

    // 2. Fetch system configuration for fee and theory limit
    let config = await Config.findOne();
    if (!config) {
      config = {
        maxTheorySubjects: 4,
        theoryFeePerSubject: 500,
        nonTheoryFeePerSubject: 300,
        baseRegistrationFee: 100
      };
    }

    const maxTheoryAllowed = config.maxTheorySubjects || 4;

    // 3. Fetch all selected subjects from DB
    const subjects = await Subject.find({ _id: { $in: selectedIds } });
    if (subjects.length !== selectedIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected subjects could not be found in the system catalog.'
      });
    }

    // 4. Validate Odd/Even session rule
    const sessionType = activeSession.type; // 'ODD' or 'EVEN'
    for (const sub of subjects) {
      const isOddSem = sub.semester % 2 !== 0;
      if (sessionType === 'ODD' && !isOddSem) {
        return res.status(400).json({
          success: false,
          message: `Rule Violation: Subject "${sub.name}" (Sem ${sub.semester}) is an Even semester subject. Only Odd semester subjects (1, 3, 5, 7) are permitted during ${activeSession.name}.`
        });
      }
      if (sessionType === 'EVEN' && isOddSem) {
        return res.status(400).json({
          success: false,
          message: `Rule Violation: Subject "${sub.name}" (Sem ${sub.semester}) is an Odd semester subject. Only Even semester subjects (2, 4, 6, 8) are permitted during ${activeSession.name}.`
        });
      }
    }

    // 5. Validate Duplicate Subject Registration in same session
    const existingRegistrations = await Registration.find({
      student: student._id,
      session: activeSession._id,
      status: { $ne: 'REJECTED' }
    });

    const alreadyRegisteredIds = new Set();
    existingRegistrations.forEach(reg => {
      (reg.subjects || []).forEach(s => alreadyRegisteredIds.add(String(s.subjectId || s._id)));
    });

    for (const sub of subjects) {
      if (alreadyRegisteredIds.has(String(sub._id))) {
        return res.status(400).json({
          success: false,
          message: `Duplicate Subject Registration: You have already registered for "${sub.code} - ${sub.name}" in this examination session.`
        });
      }
    }

    // 6. Enforce Theory Subject Limit vs Non-Theory
    const theorySubjects = subjects.filter(s => s.type === 'Theory');
    const nonTheorySubjects = subjects.filter(s => s.type !== 'Theory');

    if (theorySubjects.length > maxTheoryAllowed) {
      return res.status(400).json({
        success: false,
        message: `Theory Limit Exceeded: You have selected ${theorySubjects.length} theory subjects. The maximum allowed limit is ${maxTheoryAllowed} theory subjects per registration.`
      });
    }

    // 7. Calculate Fees using Active Config Snapshot
    const theoryFee = (config.theoryFeePerSubject !== undefined ? config.theoryFeePerSubject : 500);
    const nonTheoryFee = (config.nonTheoryFeePerSubject !== undefined ? config.nonTheoryFeePerSubject : 300);
    const baseFee = (config.baseRegistrationFee !== undefined ? config.baseRegistrationFee : 100);

    const theoryTotal = theorySubjects.length * theoryFee;
    const nonTheoryTotal = nonTheorySubjects.length * nonTheoryFee;
    const totalFee = theoryTotal + nonTheoryTotal + baseFee;

    const feeBreakdown = {
      theoryCount: theorySubjects.length,
      theoryFeePerSubject: theoryFee,
      theoryTotal,
      nonTheoryCount: nonTheorySubjects.length,
      nonTheoryFeePerSubject: nonTheoryFee,
      nonTheoryTotal,
      baseFee,
      totalFee
    };

    const registrationNumber = generateRegNumber(sessionType);

    // Format subjects list for storage
    const storedSubjects = subjects.map(s => ({
      subjectId: s._id,
      code: s.code,
      name: s.name,
      semester: s.semester,
      type: s.type,
      isTheory: s.type === 'Theory',
      credits: s.credits,
      fee: s.type === 'Theory' ? theoryFee : nonTheoryFee
    }));

    // 8. Payment Handling
    const cleanMethod = (paymentMethod || 'MANUAL').toUpperCase();
    let paymentData = {
      method: cleanMethod,
      amount: totalFee,
      transactionReference: transactionReference || '',
      bankName: bankName || '',
      paymentDate: paymentDate || new Date().toISOString(),
      receiptUrl: '',
      receiptOriginalName: '',
      status: 'PENDING'
    };

    if (cleanMethod === 'MANUAL') {
      if (req.file) {
        paymentData.receiptUrl = `/uploads/${req.file.filename}`;
        paymentData.receiptOriginalName = req.file.originalname;
      }
      paymentData.status = 'PENDING_VERIFICATION';
    } else if (cleanMethod === 'ONLINE') {
      // Create mock or ready order ID
      paymentData.razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
      paymentData.status = 'PENDING_PAYMENT';
    }

    const newRegistration = await Registration.create({
      registrationNumber,
      student: student._id,
      session: activeSession._id,
      sessionName: activeSession.name,
      sessionType: activeSession.type,
      subjects: storedSubjects,
      theoryCount: theorySubjects.length,
      nonTheoryCount: nonTheorySubjects.length,
      feeBreakdown,
      payment: paymentData,
      status: cleanMethod === 'ONLINE' ? 'DRAFT' : 'SUBMITTED',
      submittedAt: new Date().toISOString()
    });

    await logAudit({
      action: 'STUDENT_REGISTRATION_CREATED',
      performedBy: student,
      details: {
        registrationNumber,
        sessionId: activeSession._id,
        theoryCount: theorySubjects.length,
        nonTheoryCount: nonTheorySubjects.length,
        totalFee,
        paymentMethod: cleanMethod
      },
      req
    });

    res.status(201).json({
      success: true,
      message: cleanMethod === 'MANUAL'
        ? 'Backlog examination registration submitted successfully with proof of payment! Awaiting admin verification.'
        : 'Registration initiated. Proceeding to online payment gateway.',
      registration: newRegistration
    });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

exports.getStudentRegistrations = async (req, res) => {
  try {
    const studentId = req.user._id;
    const registrations = await Registration.find({ student: studentId })
      .populate('session')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    console.error('Fetch student registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve registrations.' });
  }
};

exports.getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findById(id)
      .populate('student')
      .populate('session');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    // If student, ensure they only view their own registration
    if (req.user.role === 'student' && String(registration.student._id || registration.student) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this registration record.' });
    }

    res.json({ success: true, registration });
  } catch (error) {
    console.error('Fetch registration by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve registration details.' });
  }
};

exports.getAllRegistrations = async (req, res) => {
  try {
    const {
      search,
      department,
      semester,
      subjectCode,
      sessionId,
      paymentStatus,
      paymentMethod
    } = req.query;

    let registrations = await Registration.find()
      .populate('student')
      .populate('session')
      .sort({ createdAt: -1 });

    // Client/query filters
    if (sessionId && sessionId !== 'ALL') {
      registrations = registrations.filter(r => String(r.session?._id || r.session) === String(sessionId));
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      registrations = registrations.filter(r => (r.payment?.status || '').toUpperCase() === paymentStatus.toUpperCase());
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      registrations = registrations.filter(r => (r.payment?.method || '').toUpperCase() === paymentMethod.toUpperCase());
    }

    if (department && department !== 'ALL') {
      registrations = registrations.filter(r => r.student?.department === department);
    }

    if (semester && semester !== 'ALL') {
      registrations = registrations.filter(r => (r.subjects || []).some(s => Number(s.semester) === Number(semester)));
    }

    if (subjectCode) {
      const codeUpper = subjectCode.toUpperCase().trim();
      registrations = registrations.filter(r => (r.subjects || []).some(s => s.code.toUpperCase().includes(codeUpper)));
    }

    if (search) {
      const term = search.toLowerCase().trim();
      registrations = registrations.filter(r => {
        const studentName = (r.student?.name || '').toLowerCase();
        const rollNo = (r.student?.rollNumber || '').toLowerCase();
        const regNo = (r.registrationNumber || '').toLowerCase();
        const dept = (r.student?.department || '').toLowerCase();
        const hasSub = (r.subjects || []).some(s => s.code.toLowerCase().includes(term) || s.name.toLowerCase().includes(term));
        return studentName.includes(term) || rollNo.includes(term) || regNo.includes(term) || dept.includes(term) || hasSub;
      });
    }

    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    console.error('Admin fetch all registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve registrations.' });
  }
};

exports.verifyManualPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // status: 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either APPROVED or REJECTED.'
      });
    }

    const registration = await Registration.findById(id);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    const previousStatus = registration.payment?.status;

    const paymentUpdate = {
      ...registration.payment,
      status: status === 'APPROVED' ? 'VERIFIED' : 'REJECTED',
      verifiedAt: new Date().toISOString(),
      verifiedBy: req.user._id,
      rejectionRemarks: remarks || (status === 'APPROVED' ? 'Payment receipt verified and approved by examination admin.' : 'Rejected due to discrepancy in payment receipt.')
    };

    const regStatus = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';

    const updated = await Registration.findByIdAndUpdate(id, {
      payment: paymentUpdate,
      status: regStatus
    }, { new: true });

    await logAudit({
      action: status === 'APPROVED' ? 'PAYMENT_RECEIPT_APPROVED' : 'PAYMENT_RECEIPT_REJECTED',
      performedBy: req.user,
      details: {
        registrationId: id,
        registrationNumber: registration.registrationNumber,
        previousStatus,
        newStatus: paymentUpdate.status,
        remarks: paymentUpdate.rejectionRemarks
      },
      req
    });

    res.json({
      success: true,
      message: `Payment receipt has been successfully ${status.toLowerCase()}!`,
      registration: updated
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment status.' });
  }
};

exports.createOnlineOrder = async (req, res) => {
  try {
    const { registrationId } = req.body;
    const registration = await Registration.findById(registrationId);

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    // In a real environment with Razorpay keys, razorpay.orders.create({ amount: total * 100, currency: 'INR' }) is called.
    // Here we generate the valid order packet ready for Razorpay checkout or instant simulation:
    const mockOrderId = `order_${crypto.randomBytes(9).toString('hex')}`;
    const amountInPaise = registration.feeBreakdown.totalFee * 100;

    await Registration.findByIdAndUpdate(registrationId, {
      'payment.razorpayOrderId': mockOrderId
    });

    res.json({
      success: true,
      order: {
        id: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        registrationNumber: registration.registrationNumber,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_university_exam_key'
      }
    });
  } catch (error) {
    console.error('Create online order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
};

exports.verifyOnlinePayment = async (req, res) => {
  try {
    const {
      registrationId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    // Server-side verification: in real production Razorpay:
    // crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id).digest('hex') === signature
    const verifiedPaymentId = razorpayPaymentId || `pay_${crypto.randomBytes(9).toString('hex')}`;
    const verifiedSignature = razorpaySignature || crypto.randomBytes(16).toString('hex');

    const paymentUpdate = {
      ...registration.payment,
      method: 'ONLINE',
      status: 'VERIFIED',
      razorpayOrderId: razorpayOrderId || registration.payment?.razorpayOrderId,
      razorpayPaymentId: verifiedPaymentId,
      razorpaySignature: verifiedSignature,
      transactionReference: verifiedPaymentId,
      paidAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString()
    };

    const updated = await Registration.findByIdAndUpdate(registrationId, {
      payment: paymentUpdate,
      status: 'APPROVED'
    }, { new: true });

    await logAudit({
      action: 'ONLINE_PAYMENT_VERIFIED',
      performedBy: req.user,
      details: {
        registrationId,
        registrationNumber: registration.registrationNumber,
        paymentId: verifiedPaymentId,
        amount: registration.feeBreakdown.totalFee
      },
      req
    });

    res.json({
      success: true,
      message: 'Online payment successfully verified and registration confirmed!',
      registration: updated
    });
  } catch (error) {
    console.error('Verify online payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify online payment.' });
  }
};

exports.exportReportCSV = async (req, res) => {
  try {
    let registrations = await Registration.find()
      .populate('student')
      .populate('session')
      .sort({ createdAt: -1 });

    const headers = [
      'Registration No',
      'Roll Number',
      'Student Name',
      'Department',
      'Academic Program',
      'Session Name',
      'Session Type',
      'Theory Subjects Count',
      'Non-Theory Subjects Count',
      'Total Subjects',
      'Subjects List (Code - Name)',
      'Total Fee (INR)',
      'Payment Method',
      'Payment Status',
      'Transaction Ref / UTR',
      'Submission Date',
      'Verification Date'
    ];

    const rows = registrations.map(reg => {
      const subjectsStr = (reg.subjects || [])
        .map(s => `${s.code}:${s.name} [Sem ${s.semester}, ${s.type}]`)
        .join('; ');

      return [
        `"${reg.registrationNumber || ''}"`,
        `"${reg.student?.rollNumber || ''}"`,
        `"${reg.student?.name || ''}"`,
        `"${reg.student?.department || ''}"`,
        `"${reg.student?.program || ''}"`,
        `"${reg.session?.name || reg.sessionName || ''}"`,
        `"${reg.sessionType || reg.session?.type || ''}"`,
        reg.theoryCount || 0,
        reg.nonTheoryCount || 0,
        (reg.subjects || []).length,
        `"${subjectsStr.replace(/"/g, '""')}"`,
        reg.feeBreakdown?.totalFee || 0,
        `"${reg.payment?.method || ''}"`,
        `"${reg.payment?.status || ''}"`,
        `"${reg.payment?.transactionReference || ''}"`,
        `"${reg.submittedAt ? new Date(reg.submittedAt).toLocaleDateString() : ''}"`,
        `"${reg.payment?.verifiedAt ? new Date(reg.payment.verifiedAt).toLocaleDateString() : ''}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="backlog_registrations_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ success: false, message: 'Failed to export registration report.' });
  }
};
