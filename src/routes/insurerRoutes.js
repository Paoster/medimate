const express = require('express');
const { getClaims, updateClaimStatus } = require('../controllers/insurerController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication and insurer role
router.use(protect);
router.use(authorize('insurer'));

router.get('/claims', getClaims);
router.put('/claims/:id', updateClaimStatus);

module.exports = router;
