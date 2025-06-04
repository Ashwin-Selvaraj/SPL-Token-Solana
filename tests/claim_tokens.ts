import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { TokenContract } from "../target/types/token_contract"

describe("claim_tokens_merkle", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.TokenContract as anchor.Program<TokenContract>;

  // Load the JSON file with merkle root and proofs
  const merkleData = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../airdrop_proofs.json"), "utf-8")
  );

  const root = Buffer.from(merkleData.root.slice(2), "hex"); // remove 0x prefix
  const userInfo = merkleData.users[0]; // testing with first user for example

  it("Claim tokens with valid proof", async () => {
    // User keypair for test (simulate user)
    const user = anchor.AnchorProvider.env().wallet as anchor.Wallet;
    const signer = user.payer;
    console.log("Current wallet pubkey:", signer.publicKey.toBase58());

    // Program Derived Address (PDA) for claim config (must match your on-chain seed)
    const [claimConfigPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("claim_config_v3")],
      program.programId
    );

    const [claimStatusPda, claimStatusBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("claim_status"), user.publicKey.toBuffer()],
        program.programId
      );

    // Vault ATA for token vault owned by PDA
    // Assuming you have MINT address hardcoded or imported
    const MINT = new PublicKey("EvfJoTiJ2AxnC6Xo1BHyi8JtPQ7MNP53WkrCCVPknA1i");

    // Associated Token Address for vault owned by PDA
    const vaultAta = anchor.utils.token.associatedAddress({
      mint: MINT,
      owner: claimConfigPda,
    });
    console.log("Vault ATA:", vaultAta.toBase58());
    

    // User's Associated Token Account for the same mint
    const userAta = anchor.utils.token.associatedAddress({
      mint: MINT,
      owner: user.publicKey,
    });
    console.log("User ATA:", userAta.toBase58());
    

    // Parse amount and proof from JSON for claim
    const amount = new BN(userInfo.amount);
    const proof = userInfo.proof.map((p: string) => Buffer.from(p.slice(2), "hex"));

    // NOTE: You must have created claimConfig and vaultAta onchain already with your program
    // This test assumes that

    const context = {
        user: user.publicKey,
        claimConfig: claimConfigPda,
        tokenVault: vaultAta,
        userTokenAccount: userAta,
        claimStatus: claimStatusPda,      // <-- you need the real PDA here
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        mint: MINT                        // <-- add this line
      }
      

    // Build transaction to call claim_tokens
    const tx = await program.methods
      .claimTokens(bump, amount, proof)
      .accounts(context)
      .signers([])
      .rpc();

    console.log("Claim transaction signature:", tx);

    // You can also fetch claimStatus to assert claimed == true here if your program stores that

  });
});
