// import * as anchor from "@coral-xyz/anchor";
// import * as web3 from "@solana/web3.js";
// import { Program } from "@coral-xyz/anchor";
// import { TokenContract } from "../target/types/token_contract";
// import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
// import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

// describe("token_contract", () => {
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);

//   const program = anchor.workspace.TokenContract as Program<TokenContract>;
  
//   const private_key = "2sMZyKhJE1Qs94Tfzz5RgSnsrdAxXpTohXDnK4A3uyZcMMYhbT9KKaR6NNCWh28umkyv5xBtyF3PEEe4qbQJXfbt"
//   // Create a new keypair for the new authority
//   const newAuthority =  Keypair.fromSecretKey(bs58.decode(private_key));

//   it("should set mint authority to new authority", async () => {
//     // Find PDA for the vault
//     const [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
//       [Buffer.from("vault")],
//       program.programId
//     );

//     // Find PDA for the SPL token mint
//     const [mintPda, mintBump] = PublicKey.findProgramAddressSync(
//       [Buffer.from("spl-token-mint")],
//       program.programId
//     );

//     console.log("Current mint PDA:", mintPda.toBase58());
//     console.log("New authority:", newAuthority.publicKey.toBase58());

//     try {
//       // Send transaction to set mint authority
//       const tx = await program.methods
//         .setMintAuthority()
//         .accounts({
//           splTokenMint: mintPda,
//           vault: vaultPda,
//           payer: provider.wallet.publicKey,
//           anotherAuthority: newAuthority.publicKey,
//           systemProgram: SystemProgram.programId,
//           tokenProgram: TOKEN_PROGRAM_ID,
//           rent: web3.SYSVAR_RENT_PUBKEY,
//         })
//         .signers([newAuthority])
//         .rpc();

//       console.log("Transaction signature:", tx);
//       console.log("New authority public key:", newAuthority.publicKey.toBase58());

//     } catch (error) {
//       console.error("Error setting mint authority:", error);
//       throw error;
//     }
//   });
// }); 