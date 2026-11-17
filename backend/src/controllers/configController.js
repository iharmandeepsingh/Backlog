const { Config } = require('../models');
const { logAudit } = require('../utils/auditLogger');

const DEFAULT_CONFIG = {
  maxTheorySubjects: 4,
  theoryFeePerSubject: 500,
  nonTheoryFeePerSubject: 300,
  baseRegistrationFee: 100,
  // Special / Supplementary Examination Fee Configuration
  specialTheoryFeePerSubject: 1000,
  specialNonTheoryFeePerSubject: 600,
  specialBaseRegistrationFee: 200,
  specialMaxTheorySubjects: 6,
  allowSpecialExamRegistration: true,
  specialExamInstructions: 'Special / Supplementary Examination permits eligible students to clear backlogs across both Odd and Even semesters simultaneously.',
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
  } else {
    // Ensure all special fee fields exist if older config
    let needsUpdate = false;
    const updates = {};
    if (config.specialTheoryFeePerSubject === undefined) {
      updates.specialTheoryFeePerSubject = DEFAULT_CONFIG.specialTheoryFeePerSubject;
      needsUpdate = true;
    }
    if (config.specialNonTheoryFeePerSubject === undefined) {
      updates.specialNonTheoryFeePerSubject = DEFAULT_CONFIG.specialNonTheoryFeePerSubject;
      needsUpdate = true;
    }
    if (config.specialBaseRegistrationFee === undefined) {
      updates.specialBaseRegistrationFee = DEFAULT_CONFIG.specialBaseRegistrationFee;
      needsUpdate = true;
    }
    if (config.specialMaxTheorySubjects === undefined) {
      updates.specialMaxTheorySubjects = DEFAULT_CONFIG.specialMaxTheorySubjects;
      needsUpdate = true;
    }
    if (config.allowSpecialExamRegistration === undefined) {
      updates.allowSpecialExamRegistration = true;
      needsUpdate = true;
    }
    if (config.specialExamInstructions === undefined) {
      updates.specialExamInstructions = DEFAULT_CONFIG.specialExamInstructions;
      needsUpdate = true;
    }

    if (needsUpdate) {
      config = await Config.findByIdAndUpdate(config._id, updates, { new: true });
    }
  }
  return config;
};

exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
exports.getOrCreateConfig = getOrCreateConfig;

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
      specialTheoryFeePerSubject,
      specialNonTheoryFeePerSubject,
      specialBaseRegistrationFee,
      specialMaxTheorySubjects,
      allowSpecialExamRegistration,
      specialExamInstructions,
      bankDetails
    } = req.body;

    let config = await getOrCreateConfig();

    const previousConfig = {
      maxTheorySubjects: config.maxTheorySubjects,
      theoryFeePerSubject: config.theoryFeePerSubject,
      nonTheoryFeePerSubject: config.nonTheoryFeePerSubject,
      baseRegistrationFee: config.baseRegistrationFee,
      specialTheoryFeePerSubject: config.specialTheoryFeePerSubject,
      specialNonTheoryFeePerSubject: config.specialNonTheoryFeePerSubject,
      specialBaseRegistrationFee: config.specialBaseRegistrationFee,
      specialMaxTheorySubjects: config.specialMaxTheorySubjects
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

    // Special Exam configurations
    if (specialTheoryFeePerSubject !== undefined) {
      const fee = Number(specialTheoryFeePerSubject);
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ success: false, message: 'Special theory fee must be a non-negative number.' });
      }
      updates.specialTheoryFeePerSubject = fee;
    }

    if (specialNonTheoryFeePerSubject !== undefined) {
      const fee = Number(specialNonTheoryFeePerSubject);
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ success: false, message: 'Special non-theory fee must be a non-negative number.' });
      }
      updates.specialNonTheoryFeePerSubject = fee;
    }

    if (specialBaseRegistrationFee !== undefined) {
      const fee = Number(specialBaseRegistrationFee);
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ success: false, message: 'Special base fee must be a non-negative number.' });
      }
      updates.specialBaseRegistrationFee = fee;
    }

    if (specialMaxTheorySubjects !== undefined) {
      const num = Number(specialMaxTheorySubjects);
      if (isNaN(num) || num < 1) {
        return res.status(400).json({ success: false, message: 'Special max theory subjects must be at least 1.' });
      }
      updates.specialMaxTheorySubjects = num;
    }

    if (allowSpecialExamRegistration !== undefined) {
      updates.allowSpecialExamRegistration = Boolean(allowSpecialExamRegistration);
    }

    if (specialExamInstructions !== undefined) {
      updates.specialExamInstructions = specialExamInstructions.trim();
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
          baseRegistrationFee: updated.baseRegistrationFee,
          specialTheoryFeePerSubject: updated.specialTheoryFeePerSubject,
          specialNonTheoryFeePerSubject: updated.specialNonTheoryFeePerSubject,
          specialBaseRegistrationFee: updated.specialBaseRegistrationFee,
          specialMaxTheorySubjects: updated.specialMaxTheorySubjects
        }
      },
      req
    });

    res.json({
      success: true,
      message: 'System configuration and special exam fees updated successfully.',
      config: updated
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update system configuration.' });
  }
};
