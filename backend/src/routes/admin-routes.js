const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, requirePrincipal } = require('../middleware/auth');
const {
  getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher,
  resetPassword, importTeachers,
} = require('../controllers/teacher.controller');
const {
  getAttendanceList, getAttendanceLogs, updateAttendance,
} = require('../controllers/attendance.controller');
const { getDashboardStats } = require('../controllers/principal.controller');
const { getSettings, updateSettings } = require('../controllers/settings.controller');
const { getDailyReport, getWeeklyReport, getMonthlyReport, exportExcel, exportPDF } = require('../controllers/reports.controller');
const { getHolidays, createHoliday, updateHoliday, deleteHoliday } = require('../controllers/holiday.controller');

const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/excel')),
  filename: (req, file, cb) => cb(null, `import_${Date.now()}${path.extname(file.originalname)}`),
});
const excelUpload = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') return cb(null, true);
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(authenticate, requirePrincipal);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Teacher Management
router.get('/teachers', getTeachers);
router.get('/teachers/:id', getTeacher);
router.post('/teachers', createTeacher);
router.put('/teachers/:id', updateTeacher);
router.delete('/teachers/:id', deleteTeacher);
router.put('/teachers/:id/reset-password', resetPassword);
router.post('/teachers/import/excel', excelUpload.single('file'), importTeachers);

// Attendance Management
router.get('/attendance', getAttendanceList);
router.get('/attendance/logs', getAttendanceLogs);
router.put('/attendance/:id', updateAttendance);

// Holidays
router.get('/holidays', getHolidays);
router.post('/holidays', createHoliday);
router.put('/holidays/:id', updateHoliday);
router.delete('/holidays/:id', deleteHoliday);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Reports
router.get('/reports/daily', getDailyReport);
router.get('/reports/weekly', getWeeklyReport);
router.get('/reports/monthly', getMonthlyReport);
router.get('/reports/export-excel', exportExcel);
router.get('/reports/export-pdf', exportPDF);

module.exports = router;
