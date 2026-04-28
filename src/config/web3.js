const { ethers } = require('ethers');

// Ensure that .env is loaded before calling this if used directly
const provider = new ethers.JsonRpcProvider(process.env.GANACHE_RPC_URL || 'http://127.0.0.1:8545');

// Dummy ABI (we will compile a real one and replace this if needed)
// For now, this ABI matches the simple DocumentStore.sol we will write.
const contractABI = [
  "function storeDocument(string patientId, string docType, string ipfsHash) public returns (uint256)",
  "function getDocument(uint256 id) public view returns (string, string, string, uint256, address)",
  "function getDocumentCount() public view returns (uint256)"
];

const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;

let contractInstance = null;
let wallet = null;

if (privateKey && contractAddress) {
  try {
    wallet = new ethers.Wallet(privateKey, provider);
    contractInstance = new ethers.Contract(contractAddress, contractABI, wallet);
  } catch (error) {
    console.error("Error setting up ethers contract:", error.message);
  }
}

/**
 * Stores document metadata on the blockchain
 * @param {String} patientId 
 * @param {String} docType 
 * @param {String} ipfsHash 
 * @returns {Promise<String>} The transaction hash
 */
const storeDocumentMetadata = async (patientId, docType, ipfsHash) => {
  if (!contractInstance) {
    console.warn("Smart contract not configured properly in .env. Skipping blockchain storage.");
    return "0x_dummy_tx_hash_for_dev_mode";
  }

  try {
    const tx = await contractInstance.storeDocument(patientId, docType, ipfsHash);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error("Error storing document on blockchain:", error);
    throw new Error(`Blockchain tx failed: ${error.message} \n ${error.stack}`);
  }
};

module.exports = {
  storeDocumentMetadata,
  provider
};
