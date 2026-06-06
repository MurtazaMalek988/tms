const express = require('express');
const router = express.Router();
const { authenticate, requirePrincipal } = require('../middleware/auth');
const {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  exportExcel,
  exportPDF,
} = require('../controllers/reports.controller');

router.use(authenticate, requirePrincipal);

router.get('/daily', getDailyReport);
router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);
router.get('/export/excel', exportExcel);
router.get('/export/pdf', exportPDF);

module.exports = router;
