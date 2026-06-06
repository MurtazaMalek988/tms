const express = require('express');
const router = express.Router();
const { authenticate, requirePrincipal } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/principal.controller');

router.use(authenticate, requirePrincipal);

router.get('/dashboard', getDashboardStats);

module.exports = router;
