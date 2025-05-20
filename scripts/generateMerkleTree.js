const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const fs = require('fs');
const { PublicKey } = require('@solana/web3.js');

// Read the whitelist values
const whitelistValues = JSON.parse(fs.readFileSync('./MerkleTree/whitelistValues.json', 'utf8'));

// Function to create a leaf node
function createLeaf(address, amount) {
    // Convert Solana address to bytes
    const addressBytes = new PublicKey(address).toBytes();
    
    // Convert amount to 8-byte little-endian buffer
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(BigInt(amount), 0);
    
    // Create isClaimed byte (0 for not claimed)
    const isClaimed = Buffer.from([0]);
    
    // Combine all parts
    return Buffer.concat([addressBytes, amountBuffer, isClaimed]);
}

// Create leaves for the Merkle tree
const leaves = whitelistValues.map(item => 
    createLeaf(item.address, item.value)
);

// Create the Merkle tree
const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

// Get the root
const root = merkleTree.getRoot();
console.log('Merkle Root:', '0x' + root.toString('hex'));

// Generate proofs for each address
const proofs = whitelistValues.map((item, index) => {
    const leaf = createLeaf(item.address, item.value);
    const proof = merkleTree.getProof(leaf);
    
    return {
        address: item.address,
        amount: item.value,
        index: index,
        proof: proof.map(p => '0x' + p.data.toString('hex'))
    };
});

// Save the proofs to a file
fs.writeFileSync(
    './MerkleTree/proofs.json', 
    JSON.stringify(proofs, null, 2)
);

console.log('Proofs have been saved to ./MerkleTree/proofs.json');

// Example of how to verify a proof
const verifyProof = (address, amount, index, proof) => {
    const leaf = createLeaf(address, amount);
    return merkleTree.verify(proof, leaf, root);
};

// Test verification
const testAddress = whitelistValues[0].address;
const testAmount = whitelistValues[0].value;
const testProof = proofs[0].proof;
console.log('\nVerification test for first address:');
console.log('Is valid:', verifyProof(testAddress, testAmount, 0, testProof)); 