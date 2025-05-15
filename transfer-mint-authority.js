const { Keypair, Transaction, Connection, PublicKey } = require("@solana/web3.js");
const { 
    getMint,
    createSetAuthorityInstruction,
    AuthorityType,
    TOKEN_PROGRAM_ID
} = require("@solana/spl-token");
const { bs58 } = require("@coral-xyz/anchor/dist/cjs/utils/bytes");

// Your wallet's private key
const privateKey58 = [187,217,135,207,196,224,247,157,25,201,139,26,72,69,186,29,92,236,212,137,72,29,87,206,116,43,227,228,205,88,4,29,157,60,116,119,89,69,133,216,75,104,106,78,137,22,22,121,82,120,203,148,180,176,2,136,163,99,72,145,124,109,39,2];
const stringPrivateKey = bs58.encode(privateKey58);

const owner = stringPrivateKey;
// Your token's mint address
const tokenMint = new PublicKey("AYPhJd5QmN1qoxqCGJkrcMipNMNExMYMFfYfm4djDfCT");
const sourceWallet = Keypair.fromSecretKey(bs58.decode(owner));

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function checkMintAuthority() {
    try {
        const mintInfo = await getMint(connection, tokenMint);
        console.log("\nCurrent Mint Information:");
        console.log("----------------");
        console.log("Mint Address:", tokenMint.toBase58());
        console.log("Current Mint Authority:", mintInfo.mintAuthority?.toBase58() || "None");
        console.log("Your Wallet:", sourceWallet.publicKey.toBase58());
        console.log("----------------\n");
        
        return mintInfo;
    } catch (error) {
        console.error("Error checking mint authority:", error);
        throw error;
    }
}

async function transferMintAuthority() {
    try {
        // First check current mint authority
        const mintInfo = await checkMintAuthority();
        
        if (!mintInfo.mintAuthority) {
            throw new Error("This token has no mint authority to transfer");
        }

        // Create the transaction
        const transaction = new Transaction();
        
        // Add the set authority instruction
        transaction.add(
            createSetAuthorityInstruction(
                tokenMint,           // mint
                mintInfo.mintAuthority, // current authority
                AuthorityType.MintTokens, // authority type
                sourceWallet.publicKey, // new authority
                [],                  // multiSigners
                TOKEN_PROGRAM_ID     // programId
            )
        );

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sourceWallet.publicKey;

        // Send the transaction
        console.log("Sending transfer authority transaction...");
        const signature = await connection.sendTransaction(transaction, [sourceWallet], {
            commitment: "confirmed",
            maxRetries: 3,
        });

        console.log("Transaction sent:", signature);
        console.log("Waiting for confirmation...");

        // Wait for confirmation
        await connection.confirmTransaction(signature);
        
        // Verify the change
        console.log("\nVerifying new mint authority...");
        await checkMintAuthority();
        
        console.log("\nMint authority transfer complete!");
        return;

    } catch (error) {
        console.error("Error transferring mint authority:", error);
        throw error;
    }
}

// Execute the transfer
transferMintAuthority(); 