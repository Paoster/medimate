const express = require('express');
const { 
  uploadRecord, 
  getRecords, 
  updateProfile, 
  initiateClaim, 
  getClaims 
} = require('../controllers/patientController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes require authentication and patient role
router.use(protect);
router.use(authorize('patient'));

router.post('/upload', upload.single('file'), uploadRecord);
router.get('/records', getRecords);
router.put('/profile', updateProfile);
router.post('/claims', initiateClaim);
router.get('/claims', getClaims);

module.exports = router;
