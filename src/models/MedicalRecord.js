const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  hospital: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  documentType: {
    type: String,
    enum: ['aadhaar_card', 'insurance_policy', 'admission_note', 'discharge_summary', 'hospital_bills', 'diagnosis_and_treatment'],
    required: true
  },
  ipfsHash: {
    type: String,
    required: [true, 'IPFS Hash (CID) is required']
  },
  blockchainTxId: {
    type: String,
    required: [true, 'Blockchain Transaction ID is required']
  },
  notes: {
    type: String
  },
  verification: {
    verified: { type: Boolean, default: false },
    confidence: { type: String, enum: ['high', 'medium', 'low', 'none'], default: 'none' },
    detectedType: { type: String },
    message: { type: String }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
