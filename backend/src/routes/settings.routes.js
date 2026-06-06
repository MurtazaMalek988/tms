const express = require('express');
const router = express.Router();
const { authenticate, requirePrincipal } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settings.controller');

router.use(authenticate, requirePrincipal);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
