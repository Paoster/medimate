const express = require('express');
const { register, login, getInsurers, getHospitals } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/insurers', getInsurers);
router.get('/hospitals', getHospitals);

module.exports = router;
