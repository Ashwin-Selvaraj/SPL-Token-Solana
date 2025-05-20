declare module 'svm-merkle-tree' {
  export enum HashingAlgorithm {
    Keccak = 'keccak',
  }

  export class MerkleTree {
    constructor(algorithm: HashingAlgorithm, hashSize: number);
    add_leaf(data: Buffer): void;
    merklize(): void;
    get_merkle_root(): Uint8Array;
    merkle_proof_index(index: number): MerkleProof;
  }

  export class MerkleProof {
    get_pairing_hashes(): Uint8Array;
  }
} 