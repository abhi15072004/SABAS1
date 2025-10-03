const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendSMS } = require('../config/smsConfig');
const { sendEmail } = require('../config/emailConfig');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ===== SEND OTP =====
router.post('/send-otp', async (req, res) => {
  try {
    const { email, mobile, method } = req.body;

    if ((method === 'email' && !email) || (method === 'mobile' && !mobile)) {
      return res.status(400).json({ message: `${method} required` });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Save OTP to DB
    const query = method === 'email' ? { email } : { mobile };
    await Otp.findOneAndUpdate(query, { otp, otpExpiry }, { upsert: true, new: true });

    // Send OTP
    const result = method === 'email'
      ? await sendEmail(email, 'BabyBus OTP', `Your OTP is ${otp}`)
      : await sendSMS(mobile, `Your OTP is ${otp}`);

    return res.json({
      success: result.success,
      message: result.success ? 'OTP sent successfully' : 'Failed to send OTP'
    });

  } catch (err) {
    console.error('SEND OTP ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ===== VERIFY OTP =====
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, mobile, otp } = req.body;
    const query = email ? { email } : { mobile };

    const otpRecord = await Otp.findOne(query);
    if (!otpRecord) return res.status(400).json({ message: 'OTP not found' });
    if (otpRecord.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (otpRecord.otpExpiry < new Date()) return res.status(400).json({ message: 'OTP expired' });

    // Delete OTP after verification
    await Otp.deleteOne({ _id: otpRecord._id });

    return res.json({ success: true, message: 'OTP verified successfully' });

  } catch (err) {
    console.error('VERIFY OTP ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ===== REGISTER =====
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // Ensure OTP verification is done
    const otpPending = await Otp.findOne({ email }) || await Otp.findOne({ mobile });
    if (otpPending) return res.status(400).json({ message: 'OTP not verified yet' });

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, mobile, password: hashedPassword });
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.json({ success: true, user, token });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
});

// ===== LOGIN =====
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.json({ success: true, user, token });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
