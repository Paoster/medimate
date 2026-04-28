const express = require('express');
const { 
  getPatientRecords, 
  addDiagnosis, 
  initiateCashlessClaim,
  searchPatients
} = require('../controllers/hospitalController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes require authentication and hospital role
router.use(protect);
router.use(authorize('hospital'));

router.get('/patients/search', searchPatients);
router.get('/patients/:patientId/records', getPatientRecords);
router.post('/patients/:patientId/diagnosis', addDiagnosis);
router.post('/patients/:patientId/claims', initiateCashlessClaim);

module.exports = router;
