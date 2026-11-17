const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Subject } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      rollNumber,
      department,
      program = 'B.Tech',
      currentSemester = 5,
      phone = ''
    } = req.body;

    if (!name || !email || !password || !rollNumber || !department) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, roll number, and department are required.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRoll = rollNumber.toUpperCase().trim();

    // Check existing email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Check existing roll number
    const existingRoll = await User.findOne({ rollNumber: cleanRoll });
    if (existingRoll) {
      return res.status(400).json({ success: false, message: 'An account with this roll number already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Pick 2-3 sample initial backlogs from lower semesters if available
    const lowerSemSubjects = await Subject.find({
      department,
      semester: { $lt: Number(currentSemester) }
    });
    const defaultBacklogs = lowerSemSubjects.slice(0, 3).map(s => s._id);

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'student',
      rollNumber: cleanRoll,
      department,
      program,
      currentSemester: Number(currentSemester),
      phone: phone.trim(),
      eligibleBacklogs: defaultBacklogs
    });

    const token = generateToken(newUser);

    const userObj = { ...newUser };
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: 'Student registered successfully.',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    let loginId = req.body.loginId || req.body.email || req.body.rollNumber || req.body.identifier;
    let password = req.body.password;

    if (typeof loginId === 'object' && loginId !== null) {
      password = password || loginId.password;
      loginId = loginId.loginId || loginId.email || loginId.rollNumber || loginId.identifier;
    }

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Email/Roll Number and Password.' });
    }

    const searchStr = String(loginId).trim().toLowerCase();
    const searchRoll = String(loginId).trim().toUpperCase();

    // Find by email or rollNumber
    let user = await User.findOne({ email: searchStr });
    if (!user) {
      user = await User.findOne({ rollNumber: searchRoll });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    const token = generateToken(user);

    const userObj = { ...user };
    delete userObj.password;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userObj
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userObj = { ...user };
    delete userObj.password;

    // Fetch details of assigned backlog subjects
    let backlogSubjects = [];
    if (user.eligibleBacklogs && user.eligibleBacklogs.length > 0) {
      backlogSubjects = await Subject.find({
        _id: { $in: user.eligibleBacklogs }
      });
    }

    res.json({
      success: true,
      user: userObj,
      backlogSubjects
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};
