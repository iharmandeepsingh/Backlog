const { Session } = require('../models');
const { logAudit } = require('../utils/auditLogger');

const calculateSessionTimeStatus = (session) => {
  const now = new Date();
  const start = new Date(session.startDate);
  const end = new Date(session.endDate);

  const isUpcoming = now < start;
  const isExpired = now > end;
  const isOpen = session.isActive && now >= start && now <= end;

  const msRemaining = isOpen ? Math.max(0, end - now) : 0;
  const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return {
    isOpen,
    isUpcoming,
    isExpired,
    timeRemaining: msRemaining,
    timeRemainingFormatted: `${daysRemaining}d ${hoursRemaining}h ${minutesRemaining}m`,
    daysRemaining
  };
};

exports.getSessions = async (req, res) => {
  try {
    const rawSessions = await Session.find().sort({ createdAt: -1 });
    const sessions = rawSessions.map(sess => ({
      ...sess,
      ...calculateSessionTimeStatus(sess)
    }));

    res.json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch examination sessions.' });
  }
};

exports.getActiveSession = async (req, res) => {
  try {
    const session = await Session.findOne({ isActive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active examination registration session found at this time.'
      });
    }

    const timeStatus = calculateSessionTimeStatus(session);

    res.json({
      success: true,
      session: {
        ...session,
        isSpecialExam: session.type === 'SPECIAL',
        allowAllSemesters: session.type === 'SPECIAL'
      },
      ...timeStatus
    });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active session.' });
  }
};

exports.createSession = async (req, res) => {
  try {
    const {
      name,
      type,
      academicYear,
      startDate,
      endDate,
      isActive,
      description,
      theoryFeeOverride,
      nonTheoryFeeOverride,
      baseFeeOverride,
      maxTheorySubjectsOverride
    } = req.body;

    if (!name || !type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, type (ODD / EVEN / SPECIAL), start date/time, and end date/time are required.'
      });
    }

    const sessionType = type.toUpperCase().trim();
    if (!['ODD', 'EVEN', 'SPECIAL'].includes(sessionType)) {
      return res.status(400).json({
        success: false,
        message: 'Session type must be ODD, EVEN, or SPECIAL (Special Exam for both Odd & Even semesters).'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start date or end date format.' });
    }
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'Closing date/time must be after the opening date/time.' });
    }

    if (isActive) {
      // Deactivate other sessions so only one is active at a time
      await Session.updateMany({}, { isActive: false });
    }

    const newSession = await Session.create({
      name: name.trim(),
      type: sessionType,
      isSpecialExam: sessionType === 'SPECIAL',
      allowAllSemesters: sessionType === 'SPECIAL',
      academicYear: academicYear || '2026-2027',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      isActive: Boolean(isActive),
      description: description || (sessionType === 'SPECIAL' ? 'Special / Supplementary Examination for Both Odd & Even Semesters' : ''),
      theoryFeeOverride: theoryFeeOverride ? Number(theoryFeeOverride) : null,
      nonTheoryFeeOverride: nonTheoryFeeOverride ? Number(nonTheoryFeeOverride) : null,
      baseFeeOverride: baseFeeOverride ? Number(baseFeeOverride) : null,
      maxTheorySubjectsOverride: maxTheorySubjectsOverride ? Number(maxTheorySubjectsOverride) : null,
      extensionHistory: []
    });

    await logAudit({
      action: 'CREATE_EXAM_SESSION',
      performedBy: req.user,
      details: {
        sessionId: newSession._id,
        name: newSession.name,
        type: newSession.type,
        startDate: newSession.startDate,
        endDate: newSession.endDate,
        isActive: newSession.isActive
      },
      req
    });

    res.status(201).json({
      success: true,
      message: `Examination session "${newSession.name}" created successfully.`,
      session: newSession
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ success: false, message: 'Failed to create examination session.' });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      academicYear,
      startDate,
      endDate,
      isActive,
      description,
      theoryFeeOverride,
      nonTheoryFeeOverride,
      baseFeeOverride,
      maxTheorySubjectsOverride
    } = req.body;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Examination session not found.' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (type) {
      const sType = type.toUpperCase().trim();
      if (!['ODD', 'EVEN', 'SPECIAL'].includes(sType)) {
        return res.status(400).json({ success: false, message: 'Type must be ODD, EVEN, or SPECIAL.' });
      }
      updates.type = sType;
      updates.isSpecialExam = sType === 'SPECIAL';
      updates.allowAllSemesters = sType === 'SPECIAL';
    }
    if (academicYear) updates.academicYear = academicYear;
    if (startDate) updates.startDate = new Date(startDate).toISOString();
    if (endDate) updates.endDate = new Date(endDate).toISOString();
    if (description !== undefined) updates.description = description;

    if (theoryFeeOverride !== undefined) updates.theoryFeeOverride = theoryFeeOverride ? Number(theoryFeeOverride) : null;
    if (nonTheoryFeeOverride !== undefined) updates.nonTheoryFeeOverride = nonTheoryFeeOverride ? Number(nonTheoryFeeOverride) : null;
    if (baseFeeOverride !== undefined) updates.baseFeeOverride = baseFeeOverride ? Number(baseFeeOverride) : null;
    if (maxTheorySubjectsOverride !== undefined) updates.maxTheorySubjectsOverride = maxTheorySubjectsOverride ? Number(maxTheorySubjectsOverride) : null;

    if (isActive !== undefined) {
      const activeBool = Boolean(isActive);
      if (activeBool) {
        await Session.updateMany({ _id: { $ne: id } }, { isActive: false });
      }
      updates.isActive = activeBool;
    }

    const updated = await Session.findByIdAndUpdate(id, updates, { new: true });

    await logAudit({
      action: 'UPDATE_EXAM_SESSION',
      performedBy: req.user,
      details: {
        sessionId: id,
        updatedFields: updates
      },
      req
    });

    res.json({
      success: true,
      message: 'Examination session updated successfully.',
      session: updated
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ success: false, message: 'Failed to update examination session.' });
  }
};

/**
 * Admin action: Extend Deadline / Closing Date & Time for a Session
 */
exports.extendSessionDeadline = async (req, res) => {
  try {
    const { id } = req.params;
    const { newEndDate, reason } = req.body;

    if (!newEndDate) {
      return res.status(400).json({ success: false, message: 'New extended closing date/time is required.' });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Examination session not found.' });
    }

    const newEnd = new Date(newEndDate);
    if (isNaN(newEnd.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid extended date format.' });
    }

    const currentEnd = new Date(session.endDate);
    if (newEnd <= new Date(session.startDate)) {
      return res.status(400).json({ success: false, message: 'New closing date/time must be after the opening date/time.' });
    }

    const history = session.extensionHistory || [];
    const extensionEntry = {
      extendedAt: new Date().toISOString(),
      oldEndDate: session.endDate,
      newEndDate: newEnd.toISOString(),
      reason: reason ? reason.trim() : 'Deadline extended by Examination Controller',
      extendedBy: req.user.name || req.user.email
    };
    history.push(extensionEntry);

    const updates = {
      endDate: newEnd.toISOString(),
      isExtended: true,
      extendedDate: newEnd.toISOString(),
      extensionReason: extensionEntry.reason,
      extensionHistory: history
    };

    const updated = await Session.findByIdAndUpdate(id, updates, { new: true });

    await logAudit({
      action: 'EXTEND_EXAM_SESSION_DEADLINE',
      performedBy: req.user,
      details: {
        sessionId: id,
        sessionName: session.name,
        oldEndDate: session.endDate,
        newEndDate: updates.endDate,
        reason: extensionEntry.reason
      },
      req
    });

    res.json({
      success: true,
      message: `Examination session deadline successfully extended to ${newEnd.toLocaleString()}!`,
      session: updated
    });
  } catch (error) {
    console.error('Extend deadline error:', error);
    res.status(500).json({ success: false, message: 'Failed to extend session deadline.' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    await Session.findByIdAndDelete(id);

    await logAudit({
      action: 'DELETE_EXAM_SESSION',
      performedBy: req.user,
      details: { sessionId: id, name: session.name },
      req
    });

    res.json({ success: true, message: 'Session deleted successfully.' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete session.' });
  }
};
