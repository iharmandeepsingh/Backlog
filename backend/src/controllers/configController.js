const { Config } = require('../models');
const { logAudit } = require('../utils/auditLogger');

const DEFAULT_CONFIG = {
  maxTheorySubjects: 4,
  theoryFeePerSubject: 500,
  nonTheoryFeePerSubject: 300,
  baseRegistrationFee: 100,
  bankDetails: {
    bankName: 'State Bank of India (SBI)',
    accountHolder: 'University Examination Controller Account',
    accountNumber: '389201948201',
    ifscCode: 'SBIN0001423',
    branch: 'University Campus Branch',
    upiId: 'university.exam@sbi',
    instructions: 'Please transfer fee via NEFT/RTGS/IMPS/UPI. Upload clear photo/screenshot of receipt showing UTR / Ref Number.'
  }
};

const getOrCreateConfig = async () => {
  let config = await Config.findOne();
  if (!config) {
    config = await Config.create({
      ...DEFAULT_CONFIG,
      updatedBy: 'System Initializer',
      updatedAt: new Date().toISOString()
    });
  }
  return config;
};

exports.getConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    res.json({ success: true, config });
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve configuration.' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const {
      maxTheorySubjects,
      theoryFeePerSubject,
      nonTheoryFeePerSubject,
      baseRegistrationFee,
      bankDetails
    } = req.body;

    let config = await getOrCreateConfig();

    const previousConfig = {
      maxTheorySubjects: config.maxTheorySubjects,
      theoryFeePerSubject: config.theoryFeePerSubject,
      nonTheoryFeePerSubject: config.nonTheoryFeePerSubject,
      baseRegistrationFee: config.baseRegistrationFee
    };

    const updates = {};
    if (maxTheorySubjects !== undefined) {
      const num = Number(maxTheorySubjects);
      if (isNaN(num) || num < 1) {
        return res.status(400).json({ success: false, message: 'Maximum theory subjects must be at least 1.' });
      }
      updates.maxTheorySubjects = num;
    }

    if (theoryFeePerSubject !== undefined) {
      const fee = Number(theoryFeePerSubject);
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ success: false, message: 'Theory fee must be a valid non-negative number.' });
      }
      updates.theoryFeePerSubject = fee;
    }

    if (nonTheoryFeePerSubject !== undefined) {
      const fee = Number(nonTheoryFeePerSubject);
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ success: false, message: 'Non-theory fee must be a valid non-negative number.' });
      }
      updates.nonTheoryFeePerSubject = fee;
    }

    if (baseRegistrationFee !== undefined) {
      const fee = Number(baseRegistrationFee);
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ success: false, message: 'Base fee must be a valid non-negative number.' });
      }
      updates.baseRegistrationFee = fee;
    }

    if (bankDetails) {
      updates.bankDetails = {
        ...config.bankDetails,
        ...bankDetails
      };
    }

    updates.updatedBy = req.user.name;
    updates.updatedAt = new Date().toISOString();

    const updated = await Config.findByIdAndUpdate(config._id, updates, { new: true });

    // Record in Audit Log
    await logAudit({
      action: 'UPDATE_SYSTEM_CONFIG',
      performedBy: req.user,
      details: {
        previous: previousConfig,
        updated: {
          maxTheorySubjects: updated.maxTheorySubjects,
          theoryFeePerSubject: updated.theoryFeePerSubject,
          nonTheoryFeePerSubject: updated.nonTheoryFeePerSubject,
          baseRegistrationFee: updated.baseRegistrationFee
        }
      },
      req
    });

    res.json({
      success: true,
      message: 'System configuration updated successfully.',
      config: updated
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update system configuration.' });
  }
};
