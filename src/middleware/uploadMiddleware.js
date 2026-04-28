const multer = require('multer');

// Configure multer to use memory storage
// The file is kept in memory as a Buffer before being sent to IPFS
const storage = multer.memoryStorage();

const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

module.exports = upload;
