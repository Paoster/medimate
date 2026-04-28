// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocumentStore {
    
    struct Document {
        uint256 id;
        string patientId;
        string documentType;
        string ipfsHash;
        uint256 timestamp;
        address uploader;
    }

    uint256 public documentCount = 0;
    mapping(uint256 => Document) public documents;

    event DocumentStored(
        uint256 id,
        string patientId,
        string documentType,
        string ipfsHash,
        uint256 timestamp,
        address uploader
    );

    function storeDocument(
        string memory _patientId,
        string memory _documentType,
        string memory _ipfsHash
    ) public returns (uint256) {
        documentCount++;
        
        documents[documentCount] = Document(
            documentCount,
            _patientId,
            _documentType,
            _ipfsHash,
            block.timestamp,
            msg.sender
        );

        emit DocumentStored(
            documentCount,
            _patientId,
            _documentType,
            _ipfsHash,
            block.timestamp,
            msg.sender
        );

        return documentCount;
    }

    function getDocument(uint256 _id) public view returns (
        string memory patientId,
        string memory documentType,
        string memory ipfsHash,
        uint256 timestamp,
        address uploader
    ) {
        require(_id > 0 && _id <= documentCount, "Invalid document ID");
        Document memory doc = documents[_id];
        return (doc.patientId, doc.documentType, doc.ipfsHash, doc.timestamp, doc.uploader);
    }
}
