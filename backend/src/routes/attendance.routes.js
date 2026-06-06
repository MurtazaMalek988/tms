const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, requireTeacher, requirePrincipal } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  applyMedicalLeave,
  getTodayStatus,
  getAttendanceList,
  updateAttendance,
} = require('../controllers/attendance.controller');

const certStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/certificates')),
  filename: (req, file, cb) => cb(null, `cert_${Date.now()}${path.extname(file.originalname)}`),
});
const certUpload = multer({
  storage: certStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Teacher routes
router.post('/checkin', authenticate, requireTeacher, checkIn);
router.post('/checkout', authenticate, requireTeacher, checkOut);
router.post('/medical-leave', authenticate, requireTeacher, certUpload.single('certificate'), applyMedicalLeave);
router.get('/today', authenticate, requireTeacher, getTodayStatus);

// Principal routes
router.get('/', authenticate, requirePrincipal, getAttendanceList);
router.put('/:id', authenticate, requirePrincipal, updateAttendance);

module.exports = router;
