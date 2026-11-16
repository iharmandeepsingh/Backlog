const { Session } = require('../models');
const { logAudit } = require('../utils/auditLogger');

exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    res.json({ success: true, sessions });
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

    // Check if within date range
    const now = new Date();
    const start = new Date(session.startDate);
    const end = new Date(session.endDate);
    const isOpen = now >= start && now <= end;

    res.json({
      success: true,
      session,
      isOpen,
      timeRemaining: isOpen ? Math.max(0, end - now) : 0
    });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active session.' });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { name, type, academicYear, startDate, endDate, isActive } = req.body;

    if (!name || !type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, type (ODD/EVEN), start date, and end date are required.'
      });
    }

    const sessionType = type.toUpperCase();
    if (!['ODD', 'EVEN'].includes(sessionType)) {
      return res.status(400).json({
        success: false,
        message: 'Session type must be either ODD or EVEN.'
      });
    }

    if (isActive) {
      // Deactivate other sessions so only one is active at a time
      await Session.updateMany({}, { isActive: false });
    }

    const newSession = await Session.create({
      name: name.trim(),
      type: sessionType,
      academicYear: academicYear || '2026-2027',
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      isActive: Boolean(isActive)
    });

    await logAudit({
      action: 'CREATE_EXAM_SESSION',
      performedBy: req.user,
      details: {
        sessionId: newSession._id,
        name: newSession.name,
        type: newSession.type,
        isActive: newSession.isActive
      },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Examination session created successfully.',
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
    const { name, type, academicYear, startDate, endDate, isActive } = req.body;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Examination session not found.' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (type) {
      const sType = type.toUpperCase();
      if (!['ODD', 'EVEN'].includes(sType)) {
        return res.status(400).json({ success: false, message: 'Type must be ODD or EVEN.' });
      }
      updates.type = sType;
    }
    if (academicYear) updates.academicYear = academicYear;
    if (startDate) updates.startDate = new Date(startDate).toISOString();
    if (endDate) updates.endDate = new Date(endDate).toISOString();

    if (isActive !== undefined) {
      const activeBool = Boolean(isActive);
      if (activeBool) {
        // Deactivate others
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
