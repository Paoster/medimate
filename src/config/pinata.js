const axios = require('axios');
const FormData = require('form-data');

/**
 * Uploads a file buffer to Pinata (IPFS)
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {String} originalName - The original name of the file
 * @returns {Promise<String>} - The IPFS Hash (CID)
 */
const uploadToPinata = async (fileBuffer, originalName) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: originalName
  });

  const pinataOptions = JSON.stringify({
    cidVersion: 0,
  });
  formData.append('pinataOptions', pinataOptions);

  try {
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      }
    });
    return response.data.IpfsHash;
  } catch (error) {
    console.error("Error uploading to Pinata:", error.response ? error.response.data : error.message);
    throw new Error('Failed to upload file to IPFS');
  }
};

module.exports = {
  uploadToPinata
};
