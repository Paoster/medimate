require('dotenv').config();
const { ethers } = require('ethers');

async function testConnection() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_RPC_URL || 'http://127.0.0.1:8545');
    console.log("Testing connection to", process.env.GANACHE_RPC_URL);
    const network = await provider.getNetwork();
    console.log("Connected! Network:", network.name, network.chainId);

    const wallet = new ethers.Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY, provider);
    
    // Testing specific ABI
    const contractABI = [
      "function storeDocument(string patientId, string docType, string ipfsHash) public returns (uint256)"
    ];
    const contractAddress = process.env.CONTRACT_ADDRESS;
    console.log("Contract Address:", contractAddress);
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    console.log("Attempting to call storeDocument...");
    const tx = await contract.storeDocument("test-id", "test-doc", "test-hash");
    console.log("Tx sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Tx mined!", receipt.status);

  } catch (error) {
    console.error("FAILED:", error);
  }
}

testConnection();
