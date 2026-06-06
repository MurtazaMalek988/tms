const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, requirePrincipal } = require('../middleware/auth');
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  resetPassword,
  importTeachers,
} = require('../controllers/teacher.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/excel')),
  filename: (req, file, cb) => cb(null, `import_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') return cb(null, true);
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(authenticate, requirePrincipal);

router.get('/', getTeachers);
router.get('/:id', getTeacher);
router.post('/', createTeacher);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);
router.put('/:id/reset-password', resetPassword);
router.post('/import/excel', upload.single('file'), importTeachers);

module.exports = router;
