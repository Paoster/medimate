const mongoose = require('mongoose');

const insuranceClaimSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  hospital: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  claimType: {
    type: String,
    enum: ['reimbursement', 'cashless'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true
  },
  documents: [{
    type: mongoose.Schema.ObjectId,
    ref: 'MedicalRecord'
  }],
  remarks: {
    type: String
  },
  insurer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InsuranceClaim', insuranceClaimSchema);
