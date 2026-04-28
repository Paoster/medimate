const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─────────────────────────────────────────────────────────
// Gemini AI Setup
// ─────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DOCUMENT_LABELS = {
  aadhaar_card:            'Aadhaar Card (Indian national ID issued by UIDAI)',
  insurance_policy:        'Insurance Policy Document',
  admission_note:          'Hospital Admission Note',
  discharge_summary:       'Hospital Discharge Summary',
  hospital_bills:          'Hospital Bill / Invoice',
  diagnosis_and_treatment: 'Medical Diagnosis & Treatment Report'
};

// ─────────────────────────────────────────────────────────
// Build the verification prompt
// ─────────────────────────────────────────────────────────
function buildPrompt(claimedType) {
  const claimedLabel = DOCUMENT_LABELS[claimedType] || claimedType;
  const allTypes = Object.entries(DOCUMENT_LABELS)
    .map(([key, label]) => `- ${key}: ${label}`)
    .join('\n');

  return `You are a document verification assistant for a medical insurance platform called MediMate.

A user has uploaded a document and claims it is: "${claimedLabel}" (type key: "${claimedType}")

Your task:
1. Analyze the uploaded document image/PDF.
2. Determine what type of document this actually is.
3. Decide if it matches the claimed type.

The valid document types are:
${allTypes}

Respond in EXACTLY this JSON format (no markdown, no code fences, just raw JSON):
{
  "verified": true or false,
  "confidence": "high", "medium", "low", or "none",
  "detectedType": "the document type key from the list above, or 'unknown'",
  "detectedLabel": "human-readable label of what you detected",
  "message": "A short explanation for the user"
}

Rules:
- "verified" = true only if the document genuinely matches the claimed type.
- "confidence": "high" means you are very sure, "medium" means likely, "low" means uncertain, "none" means clearly wrong or unreadable.
- If the document is a completely different type than claimed, set verified=false and explain what it actually appears to be.
- If the document is too blurry or unreadable, set confidence to "none" with an appropriate message.
- Be concise in your message (1-2 sentences max).`;
}

// ─────────────────────────────────────────────────────────
// Convert buffer to Gemini-compatible inline data
// ─────────────────────────────────────────────────────────
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: mimeType
    }
  };
}

/**
 * Normalize the MIME type for Gemini compatibility
 */
function normalizeMimeType(mimeType) {
  const supported = [
    'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf'
  ];

  if (!mimeType) return 'application/pdf';

  // Map common aliases
  if (mimeType === 'image/jpg') return 'image/jpeg';

  if (supported.includes(mimeType)) return mimeType;

  // Default to PDF for unknown types
  return 'application/pdf';
}

// ─────────────────────────────────────────────────────────
// Main verification function
// ─────────────────────────────────────────────────────────

/**
 * Verify that an uploaded document matches the claimed document type
 * using Google Gemini Vision AI.
 *
 * @param {Buffer} buffer       – The file buffer (from multer)
 * @param {string} mimeType     – The MIME type (e.g. 'application/pdf', 'image/jpeg')
 * @param {string} claimedType  – The document type the user selected
 * @returns {Promise<{verified, confidence, detectedType, message}>}
 */
async function verifyDocument(buffer, mimeType, claimedType) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const normalizedMime = normalizeMimeType(mimeType);
    const filePart = bufferToGenerativePart(buffer, normalizedMime);
    const prompt = buildPrompt(claimedType);

    const result = await model.generateContent([prompt, filePart]);
    const response = result.response;
    const text = response.text().trim();

    // Parse the JSON response from Gemini
    // Strip markdown code fences if Gemini wraps the response
    const jsonStr = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      verified:     !!parsed.verified,
      confidence:   ['high', 'medium', 'low', 'none'].includes(parsed.confidence) ? parsed.confidence : 'none',
      detectedType: parsed.detectedType || 'unknown',
      message:      parsed.message || (parsed.verified ? 'Document verified.' : 'Verification failed.')
    };

  } catch (error) {
    console.error('Gemini verification error:', error.message);

    // If Gemini fails (rate limit, network, etc.), don't block the upload
    // Return a soft pass so the user isn't stuck
    return {
      verified: true,
      confidence: 'low',
      detectedType: claimedType,
      message: 'AI verification temporarily unavailable. Document accepted with low confidence.'
    };
  }
}

module.exports = {
  verifyDocument,
  DOCUMENT_LABELS
};
