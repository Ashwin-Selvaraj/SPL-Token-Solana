
import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import assert from "assert";
import BN from "bn.js";
import { TokenContract } from "../target/types/token_contract"
import { PublicKey } from '@solana/web3.js';

describe("spl program test", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  
  const program = anchor.workspace.TokenContract as anchor.Program<TokenContract>;
  const splTokenMint = new PublicKey("AYPhJd5QmN1qoxqCGJkrcMipNMNExMYMFfYfm4djDfCT");
  const METADATA_SEED = "metadata";
  const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const MINT_SEED = "mint";
  const payer = program.provider.publicKey;
  console.log("payer", payer);
  
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

  it("mint tokens", async () => {
    const destination = anchor.utils.token.associatedAddress({
      mint: mint,
      owner: payer,
    });

    let initialBalance: number;

    try {
      const balance = await program.provider.connection.getTokenAccountBalance(destination);
      initialBalance = balance.value.uiAmount;
    } catch {
      // Token account not yet initiated has 0 balance
      initialBalance = 0;
    }

    const context = {
      mint,
      destination,
      payer,
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    };

    const txHash = await program.methods
      .mintTokens(new BN(mintAmount * 10 ** metadata.decimals))
      .accounts(context)
      .rpc();
    await program.provider.connection.confirmTransaction(txHash);
    console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);

    const postBalance = (
      await program.provider.connection.getTokenAccountBalance(destination)
    ).value.uiAmount;
    assert.equal(
      initialBalance + mintAmount,
      postBalance,
      "Compare balances, it must be equal"
    );
  });

  it("set mint authority", async () => {
    const accountInfo = await program.provider.connection.getParsedAccountInfo(mint);
    if (
      accountInfo.value?.data &&
      typeof accountInfo.value.data !== "string" &&
      "parsed" in accountInfo.value.data
    ) {
      const currentMintAuthority = accountInfo.value.data.parsed.info.mintAuthority;
      console.log("Current Mint Authority:", currentMintAuthority);
    } else {
      console.log("This is not a valid parsed token mint account");
    }
    
    const context = {
      splTokenMint: mint,
      payer: payer,
      anotherAuthority: payer, // ✅ CEO's wallet or whoever you're transferring authority to
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      rent: web3.SYSVAR_RENT_PUBKEY
    };

    const txHash = await program.methods.setMintAuthority().accounts(context).rpc();
    await program.provider.connection.confirmTransaction(txHash);
    console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);

    const newInfo = await program.provider.connection.getAccountInfo(mint);
  }); 
});





