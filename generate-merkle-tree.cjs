const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');
const fs = require('fs');
const bs58 = require('bs58');

// Replace with your real airdrop data:
const airdropData = [
  {
    address: "2YaZSTKcf8W8tEJLv6jkeRCDVtntENwS8bpVd9koBZTk",
    id: "0",
    value: "10"
  },
  {
    address: "3qfmA6WT19mbMK4DXAZ2J16VihPh5Ax4ihawyc9wx5mP",
    id: "1",
    value: "20"
  }
];

// Create leaf nodes
function createLeaf(address, amount) {
  const addressBuffer = bs58.decode(address); // 32 bytes
  const amountBuffer = Buffer.alloc(8); // u64 little-endian
  amountBuffer.writeBigUInt64LE(BigInt(amount));

  return keccak256(Buffer.concat([addressBuffer, amountBuffer]));
}

const leaves = airdropData.map(entry => createLeaf(entry.address, entry.value));

// Build Merkle Tree (keccak256 + sorted pairs like in Solana contract)
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

const root = tree.getRoot().toString('hex');

console.log("🌳 Merkle Root:", root);

// Generate proofs per user
const output = airdropData.map((entry, index) => {
  const leaf = createLeaf(entry.address, entry.value);
  const proof = tree.getProof(leaf).map(x => '0x' + x.data.toString('hex'));
  return {
    address: entry.address,
    amount: entry.value,
    leaf: '0x' + leaf.toString('hex'),
    proof,
  };
});

// Print result
console.log("\n📦 Airdrop Proofs:");
console.log(JSON.stringify(output, null, 2));

// Optionally save to file
fs.writeFileSync("airdrop_proofs.json", JSON.stringify({ root: '0x' + root, users: output }, null, 2));
