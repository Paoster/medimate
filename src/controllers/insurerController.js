const InsuranceClaim = require('../models/InsuranceClaim');

// Get all claims assigned to this specific insurer (can optionally filter by status in query params)
const getClaims = async (req, res) => {
  try {
    // Only fetch claims explicitly assigned to the logged-in insurer
    const filter = { insurer: req.user._id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const claims = await InsuranceClaim.find(filter)
      .populate('patient', 'name email')
      .populate('hospital', 'name email')
      .populate('documents');
      
    res.status(200).json({ success: true, count: claims.length, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Approve or Reject a claim
const updateClaimStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
       return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const claim = await InsuranceClaim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    // Ensure the insurer trying to update this claim is the one it was assigned to
    if (claim.insurer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this claim. It belongs to another insurance company.' });
    }

    claim.status = status;
    if (remarks) {
      claim.remarks = claim.remarks ? `${claim.remarks} | Insurer: ${remarks}` : `Insurer: ${remarks}`;
    }

    await claim.save();

    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getClaims,
  updateClaimStatus
};
