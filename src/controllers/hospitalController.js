const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const InsuranceClaim = require('../models/InsuranceClaim');
const { uploadToPinata } = require('../config/pinata');
const { storeDocumentMetadata } = require('../config/web3');

// Get patient records (Basic permission check by ensuring patientId is provided)
const getPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const records = await MedicalRecord.find({ patient: patientId });
    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add diagnosis/treatment record for a patient
const addDiagnosis = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { diagnosis, treatment, admissionDate, dischargeDate, prescriptions } = req.body;

    if (!diagnosis || !treatment) {
      return res.status(400).json({ success: false, message: 'Diagnosis and treatment are required' });
    }

    const documentType = 'diagnosis_and_treatment';

    // Build structured diagnosis document
    const diagnosisDoc = {
      diagnosis,
      treatment,
      admissionDate: admissionDate || null,
      dischargeDate: dischargeDate || null,
      prescriptions: prescriptions || '',
      createdBy: req.user._id,
      createdAt: new Date().toISOString()
    };

    // Convert to Buffer for IPFS upload
    const docBuffer = Buffer.from(JSON.stringify(diagnosisDoc, null, 2));
    const fileName = `diagnosis_${patientId}_${Date.now()}.json`;

    // 1. Upload to IPFS
    const ipfsHash = await uploadToPinata(docBuffer, fileName);

    // 2. Store on Blockchain
    const blockchainTxId = await storeDocumentMetadata(
      patientId,
      documentType,
      ipfsHash
    );

    // Build notes summary from the structured fields
    const notes = `Diagnosis: ${diagnosis} | Treatment: ${treatment}` +
      (admissionDate ? ` | Admitted: ${admissionDate}` : '') +
      (dischargeDate ? ` | Discharged: ${dischargeDate}` : '') +
      (prescriptions ? ` | Rx: ${prescriptions}` : '');

    // 3. Save to MongoDB
    const record = await MedicalRecord.create({
      patient: patientId,
      hospital: req.user._id,
      documentType,
      ipfsHash,
      blockchainTxId,
      notes
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Initiate a cashless claim for a patient
const initiateCashlessClaim = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { amount, documents, remarks } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const claim = await InsuranceClaim.create({
      patient: patientId,
      hospital: req.user._id,
      claimType: 'cashless',
      amount,
      documents,
      remarks
    });

    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search patients by name
const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }
    const patients = await User.find({
      role: 'patient',
      name: { $regex: q, $options: 'i' }
    }).select('name email');
    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPatientRecords,
  addDiagnosis,
  initiateCashlessClaim,
  searchPatients
};
