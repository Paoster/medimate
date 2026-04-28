const MedicalRecord = require('../models/MedicalRecord');
const InsuranceClaim = require('../models/InsuranceClaim');
const User = require('../models/User');
const { uploadToPinata } = require('../config/pinata');
const { storeDocumentMetadata } = require('../config/web3');
const { verifyDocument } = require('../utils/documentVerifier');

// Upload a document
const uploadRecord = async (req, res) => {
  try {
    const { documentType, notes } = req.body;

    // File validation
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    if (!documentType) {
      return res.status(400).json({ success: false, message: 'documentType is required' });
    }

    // Verify document content matches claimed type using Gemini AI
    const verification = await verifyDocument(
      req.file.buffer,
      req.file.mimetype,
      documentType
    );

    // Hard-reject if verification confidence is none (clearly wrong document)
    if (verification.confidence === 'none') {
      return res.status(400).json({
        success: false,
        message: verification.message,
        verification
      });
    }

    // 1. Upload to IPFS using Pinata
    const ipfsHash = await uploadToPinata(req.file.buffer, req.file.originalname);

    // 2. Store metadata on Blockchain via Ganache
    const blockchainTxId = await storeDocumentMetadata(
      req.user._id.toString(),
      documentType,
      ipfsHash
    );

    // 3. Save to MongoDB (include verification result)
    const record = await MedicalRecord.create({
      patient: req.user._id,
      documentType,
      ipfsHash,
      blockchainTxId,
      notes,
      verification
    });

    res.status(201).json({ success: true, data: record, verification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get personal medical records
const getRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.user._id });
    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update profile details
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileDetails: req.body.profileDetails },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Initiate Reimbursement Claim
const initiateClaim = async (req, res) => {
  try {
    const { amount, documents, remarks, insurer, hospital } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const claim = await InsuranceClaim.create({
      patient: req.user._id,
      claimType: 'reimbursement',
      amount,
      documents,
      remarks,
      insurer: insurer || undefined,
      hospital: hospital || undefined
    });

    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get personal claims
const getClaims = async (req, res) => {
  try {
    const claims = await InsuranceClaim.find({ patient: req.user._id }).populate('documents');
    res.status(200).json({ success: true, count: claims.length, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadRecord,
  getRecords,
  updateProfile,
  initiateClaim,
  getClaims
};
