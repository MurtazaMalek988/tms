const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, requireTeacher } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  applyMedicalLeave,
  getTodayStatus,
} = require('../controllers/attendance.controller');

const certStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/certificates')),
  filename: (req, file, cb) => cb(null, `cert_${Date.now()}${path.extname(file.originalname)}`),
});
const certUpload = multer({
  storage: certStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// All teacher routes require authentication and teacher role
router.use(authenticate, requireTeacher);

// Attendance routes
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.post('/medical-leave', certUpload.single('certificate'), applyMedicalLeave);
router.get('/attendance/today', getTodayStatus);

module.exports = router;
