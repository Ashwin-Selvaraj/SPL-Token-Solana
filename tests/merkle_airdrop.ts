import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MerkleTreeTokenClaimer } from "../target/types/merkle_tree_token_claimer";
import { expect } from "chai";
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, createMint, mintTo, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { HashingAlgorithm, MerkleTree } from "svm-merkle-tree";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

describe("merkle-tree-token-claimer", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = anchor.Wallet.local();

  const program = anchor.workspace.MerkleTreeTokenClaimer as Program<MerkleTreeTokenClaimer>;

  let authority = wallet.payer;
  let mint: PublicKey;
  let newAddress: Keypair;
  let airdropState: PublicKey;
  let merkleTree: MerkleTree;
  let vault: PublicKey;
  let newData: AirdropTokenData;

  interface AirdropTokenData {
    address: PublicKey;
    amount: number;
    isClaimed: boolean;
  }
  let merkleTreeData: AirdropTokenData[];

  before(async () => {
    // Create mint
    mint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9
    );

    // Find PDA for airdrop state
    [airdropState] = PublicKey.findProgramAddressSync(
      [Buffer.from("merkle_tree"), mint.toBuffer()],
      program.programId
    );

    // Get vault address
    const vaultAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      authority,
      mint,
      airdropState,
      true
    );
    vault = vaultAccount.address;

    // Airdrop SOL to authority
    const signature = await provider.connection.requestAirdrop(
      authority.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Generate test data
    merkleTreeData = Array.from({ length: 5 }, () => ({
      address: Keypair.generate().publicKey,
      amount: Math.floor(Math.random() * 1000),
      isClaimed: false,
    }));
    
    // Create Merkle Tree
    merkleTree = new MerkleTree(HashingAlgorithm.Keccak, 32);
    merkleTreeData.forEach((entry) => {
      const entryBytes = Buffer.concat([
        entry.address.toBuffer(),
        Buffer.from(new anchor.BN(entry.amount).toArray('le', 8)),
        Buffer.from([entry.isClaimed ? 1 : 0]),
      ]);
      merkleTree.add_leaf(entryBytes);
    });
    merkleTree.merklize();
  });

  it("Initialize airdrop data", async () => {
    const merkleRoot = Array.from(merkleTree.get_merkle_root()) as number[];
    const totalAirdropAmount = merkleTreeData.reduce((sum, entry) => sum + entry.amount, 0);

    // Mint tokens to vault
    await mintTo(
      provider.connection,
      authority,
      mint,
      vault,
      authority,
      totalAirdropAmount
    );

    await program.methods
      .initializeAirdropData(merkleRoot, new anchor.BN(totalAirdropAmount))
      .accountsPartial({
        airdropState,
        mint,
        vault,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      })
      .signers([authority])
      .rpc();

    const account = await program.account.airdropState.fetch(airdropState);
    expect(account.merkleRoot).to.deep.equal(merkleRoot);
  });

  it("Update root", async () => {
    const newData = {
      address: Keypair.generate().publicKey,
      amount: Math.floor(Math.random() * 1000),
      isClaimed: false,
    };
    merkleTreeData.push(newData);
    
    const entryBytes = Buffer.concat([
      newData.address.toBuffer(),
      Buffer.from(new anchor.BN(newData.amount).toArray('le', 8)),
      Buffer.from([newData.isClaimed ? 1 : 0]),
    ]);
    merkleTree.add_leaf(entryBytes);
    merkleTree.merklize();

    const newMerkleRoot = Array.from(merkleTree.get_merkle_root()) as number[];

    await program.methods
      .updateTree(newMerkleRoot)
      .accountsPartial({
        airdropState,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    const account = await program.account.airdropState.fetch(airdropState);
    expect(account.merkleRoot).to.deep.equal(newMerkleRoot);
  });

  it("Perform claim with whitelisted address", async () => {
    newAddress = Keypair.generate();
    newData = {
      address: newAddress.publicKey,
      amount: Math.floor(Math.random() * 1000),
      isClaimed: false,
    };
    merkleTreeData.push(newData);
    
    const entryBytes = Buffer.concat([
      newData.address.toBuffer(),
      Buffer.from(new anchor.BN(newData.amount).toArray('le', 8)),
      Buffer.from([newData.isClaimed ? 1 : 0]),
    ]);
    merkleTree.add_leaf(entryBytes);
    merkleTree.merklize();

    const newMerkleRoot = Array.from(merkleTree.get_merkle_root()) as number[];

    await program.methods
      .updateTree(newMerkleRoot)
      .accountsPartial({
        airdropState,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    const index = merkleTreeData.findIndex(data => 
      data.address.equals(newAddress.publicKey)
    );
    expect(index).to.not.equal(-1, "Address not found in Merkle tree data");

    const proof = merkleTree.merkle_proof_index(index);
    const proofArray = Buffer.from(proof.get_pairing_hashes());

    // Airdrop SOL to new address
    const signature = await provider.connection.requestAirdrop(
      newAddress.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    const signerAta = await getAssociatedTokenAddress(mint, newAddress.publicKey);

    await program.methods
      .claimAirdrop(new anchor.BN(newData.amount), proofArray, new anchor.BN(index))
      .accountsPartial({
        airdropState,
        mint,
        vault,
        signerAta,
        signer: newAddress.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      })
      .signers([newAddress])
      .rpc();
  });
});