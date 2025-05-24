import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import assert from "assert";
import BN from "bn.js";
import { TokenContract } from "../target/types/token_contract"
import { PublicKey } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getMint } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("spl program test", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  
  const program = anchor.workspace.TokenContract as anchor.Program<TokenContract>;
  const splTokenMint = new PublicKey("EvfJoTiJ2AxnC6Xo1BHyi8JtPQ7MNP53WkrCCVPknA1i");
  const METADATA_SEED = "metadata";
  const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const MINT_SEED = "mint";
  const payer = program.provider.publicKey;
  
  const metadata = {
    name: "The Meme TV",
    symbol: "MEME TV",
    uri: "https://brown-rear-eagle-173.mypinata.cloud/ipfs/bafkreidlzreqh5g75ogqy4damjc6rs7sz742vzxbuthvgbzza76dualwoq",
    decimals: 9
  }
  const mintAmount = 10;

  const [mint] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from(MINT_SEED)],
    program.programId
  );

  const [metadataAddress] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from(METADATA_SEED),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  it("Initialize", async () => {
    const info = await program.provider.connection.getAccountInfo(mint);
    if (info) {
      return; // Do not attempt to initialize if already initialized
    }
    console.log("  Mint not found. Initializing Program...");

    const context = {
      metadata: metadataAddress,
      mint,
      payer,
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    };


    const txHash = await program.methods
      .initiateToken(metadata)
      .accounts(context)
      .rpc();

    await program.provider.connection.confirmTransaction(txHash, "finalized");
    console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
    const newInfo = await program.provider.connection.getAccountInfo(mint);
    assert(newInfo, "  Mint should be initialized.");
  });

  // it("mint tokens", async () => {
  //   const destination = anchor.utils.token.associatedAddress({
  //     mint: mint,
  //     owner: payer,
  //   });

  //   let initialBalance: number;

  //   try {
  //     const balance = await program.provider.connection.getTokenAccountBalance(destination);
  //     initialBalance = balance.value.uiAmount;
  //   } catch {
  //     // Token account not yet initiated has 0 balance
  //     initialBalance = 0;
  //   }

  //   const context = {
  //     mint,
  //     destination,
  //     payer,
  //     rent: web3.SYSVAR_RENT_PUBKEY,
  //     systemProgram: web3.SystemProgram.programId,
  //     tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
  //     associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
  //   };

  //   const txHash = await program.methods
  //     .mintTokens(new BN(mintAmount * 10 ** metadata.decimals))
  //     .accounts(context)
  //     .rpc();
  //   await program.provider.connection.confirmTransaction(txHash);
  //   console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);

  //   const postBalance = (
  //     await program.provider.connection.getTokenAccountBalance(destination)
  //   ).value.uiAmount;
  //   assert.equal(
  //     initialBalance + mintAmount,
  //     postBalance,
  //     "Compare balances, it must be equal"
  //   );
  // });

  // it("set mint authority", async () => {
  //   const accountInfo = await program.provider.connection.getParsedAccountInfo(mint);
  //   if (
  //     accountInfo.value?.data &&
  //     typeof accountInfo.value.data !== "string" &&
  //     "parsed" in accountInfo.value.data
  //   ) {
  //     const currentMintAuthority = accountInfo.value.data.parsed.info.mintAuthority;
  //     console.log("Current Mint Authority:", currentMintAuthority);
  //   } else {
  //     console.log("This is not a valid parsed token mint account");
  //   }
    
  //   const context = {
  //     splTokenMint: mint,
  //     payer: payer,
  //     anotherAuthority: payer, // :white_check_mark: CEO's wallet or whoever you're transferring authority to
  //     systemProgram: web3.SystemProgram.programId,
  //     tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
  //     rent: web3.SYSVAR_RENT_PUBKEY
  //   };

  //   const txHash = await program.methods.setMintAuthority().accounts(context).rpc();
  //   await program.provider.connection.confirmTransaction(txHash);
  //   console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);

  //   const newInfo = await program.provider.connection.getAccountInfo(mint);
  // }); 

  // it("Custom transfer_token test", async () => {
  //   const sender = program.provider.publicKey; // uses default wallet
  //   const receiver = new PublicKey("2YaZSTKcf8W8tEJLv6jkeRCDVtntENwS8bpVd9koBZTk");
  
  //   // Associated token account for sender
  //   const senderAta = anchor.utils.token.associatedAddress({
  //     mint: mint,
  //     owner: sender,
  //   })
  
  //   // Associated token account for receiver
  //   const receiverAta = anchor.utils.token.associatedAddress({
  //     mint: mint,
  //     owner: receiver,
  //   })
  
  //   // Create ATA for receiver if it doesn't exist
  //   const receiverAtaInfo = await program.provider.connection.getAccountInfo(receiverAta);
  //   if (!receiverAtaInfo) {
  //     const createAtaIx = createAssociatedTokenAccountInstruction(
  //       sender,
  //       receiverAta,
  //       receiver,
  //       mint
  //     );
  
  //     const tx = new anchor.web3.Transaction().add(createAtaIx);
  //     await program.provider.sendAndConfirm(tx, []);
  //     console.log(":white_check_mark: Created receiver ATA");
  //   }

  //   const context = {
  //     tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
  //     from: senderAta,
  //     to: receiverAta,
  //     fromAuthority: sender,
  //   };
  
  //   const transferAmount = new BN(150 * 10 ** 9); // 5 tokens with proper decimals

  //   // Transfer tokens using your custom program method
  //   const txHash = await program.methods
  //     .transferToken(transferAmount)
  //     .accounts(context)
  //     .signers([]) // no extra signer needed; uses provider wallet
  //     .rpc();
  
  //   await program.provider.connection.confirmTransaction(txHash, "finalized");
  //   console.log(":rocket: Custom token transfer TX:", `https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
  
  // });

  // it("burn token", async () => {

  //   // Get the associated token account for the payer
  //   const tokenAccount = anchor.utils.token.associatedAddress({
  //     mint: mint,
  //     owner: payer,
  //   });

  //   // Check if token account exists and has sufficient balance
  //   const tokenAccountInfo = await program.provider.connection.getAccountInfo(tokenAccount);
  //   if (!tokenAccountInfo) {
  //     console.log("Token account does not exist. Creating it...");
  //     // Create the token account if it doesn't exist
  //     const createAtaIx = createAssociatedTokenAccountInstruction(
  //       payer,
  //       tokenAccount,
  //       payer,
  //       mint
  //     );
  //     const tx = new anchor.web3.Transaction().add(createAtaIx);
  //     await program.provider.sendAndConfirm(tx, []);
  //     console.log(":white_check_mark: Created token account");
  //   }

  //   // Get token balance before burn
  //   const balance = await program.provider.connection.getTokenAccountBalance(tokenAccount);
  //   console.log("Token balance before burn:", balance.value.uiAmount);

  //   const context = {
  //     mint,
  //     from: tokenAccount,
  //     authority: payer,
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //   };

  //   console.log("Token Program ID:", context.tokenProgram.toBase58());
  //   const burnAmount = new BN(1 * 10 ** metadata.decimals); // 50 tokens to burn

  //   const txHash = await program.methods
  //     .burnToken(burnAmount)
  //     .accounts(context)
  //     .rpc();

  //   await program.provider.connection.confirmTransaction(txHash, "finalized");
  //   console.log(":rocket: Burn token TX:", `https://explorer.solana.com/tx/${txHash}?cluster=devnet`);

  //   // Get token balance after burn
  //   const postBalance = await program.provider.connection.getTokenAccountBalance(tokenAccount);
  //   console.log("Token balance after burn:", postBalance.value.uiAmount);
  // });

  // it("freeze account", async () => {
  //   const mintInfo = await getMint(program.provider.connection, mint, undefined, TOKEN_PROGRAM_ID);
  //   console.log("Freeze Authority:", mintInfo.freezeAuthority?.toBase58() || "None");
  

  //   const tokenAccount = anchor.utils.token.associatedAddress({
  //     mint: mint,
  //     owner: payer,
  //   })
  
  //   const context = {
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //     account: tokenAccount,
  //     mint: mint,
  //     authority: payer,
  //   };
  
  //   const txHash = await program.methods
  //     .freezeAccount()
  //     .accounts(context)
  //     .rpc();
  
  //   console.log(":white_check_mark: Freeze TX:", `https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
  // });

  it("set merkle root", async () => {
    const wallet = anchor.AnchorProvider.env().wallet as anchor.Wallet;
    const signer = wallet.payer;
  
    console.log("Current wallet pubkey:", signer.publicKey.toBase58());
  
    let claimConfigPda: PublicKey;
    let bump: number;
    [claimConfigPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("claim_config_v2")],
      program.programId
    );
    
  
    // Only call initialize if PDA doesn't exist
    const accountInfo = await program.provider.connection.getAccountInfo(claimConfigPda);
    if (!accountInfo) {
      await program.rpc.initializeClaimConfig(bump, {
        accounts: {
          claimConfig: claimConfigPda,
          authority: signer.publicKey, // ✅ required by your IDL
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [signer],
      });
    } else {
      console.log("PDA already exists. Skipping initialization.");
    }
    
    const newMerkleRoot = Array(32).fill(6);
  
    const context = {
      claimConfig: claimConfigPda,
    };
  
    const txHash = await program.methods
      .setMerkleRoot(newMerkleRoot)
      .accounts(context)
      .rpc();
  
    await program.provider.connection.confirmTransaction(txHash, "finalized");
    console.log(
      ":rocket: Merkle Root set for token TX:",
      `https://explorer.solana.com/tx/${txHash}?cluster=devnet`
    );
  
    const claimConfigAccount = await program.account.claimConfig.fetch(claimConfigPda);
    console.log(":mag: Stored Merkle Root:", claimConfigAccount.merkleRoot);
    assert.deepStrictEqual(claimConfigAccount.merkleRoot, newMerkleRoot);
  });
  
});
