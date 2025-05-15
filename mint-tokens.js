const { Keypair, Transaction, Connection, PublicKey } = require("@solana/web3.js");
const { 
    getAssociatedTokenAddress, 
    createMintToInstruction,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAccount,
    getMint
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

// Amount of tokens to mint
const tokens = 2;

async function checkMintAuthority() {
    try {
        const mintInfo = await getMint(connection, tokenMint);
        console.log("\nMint Information:");
        console.log("----------------");
        console.log("Mint Address:", tokenMint.toBase58());
        console.log("Mint Authority:", mintInfo.mintAuthority?.toBase58() || "None");
        console.log("Your Wallet:", sourceWallet.publicKey.toBase58());
        console.log("Decimals:", mintInfo.decimals);
        console.log("Supply:", mintInfo.supply.toString());
        console.log("----------------\n");
        
        if (!mintInfo.mintAuthority) {
            throw new Error("This token has no mint authority");
        }
        
        if (!mintInfo.mintAuthority.equals(sourceWallet.publicKey)) {
            console.log("\nMint Authority Details:");
            console.log("----------------");
            console.log("Current Mint Authority:", mintInfo.mintAuthority.toBase58());
            console.log("Your Wallet:", sourceWallet.publicKey.toBase58());
            console.log("----------------\n");
            throw new Error("Your wallet is not the mint authority for this token");
        }
        
        return true;
    } catch (error) {
        console.error("Error checking mint authority:", error);
        throw error;
    }
}

async function checkAndCreateATA(owner, mint) {
    try {
        const ata = await getAssociatedTokenAddress(
            mint,
            owner,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        try {
            // Try to get the account info
            await getAccount(connection, ata);
            console.log("ATA exists:", ata.toBase58());
            return ata;
        } catch (e) {
            // Account doesn't exist, create it
            console.log("Creating ATA:", ata.toBase58());
            const tx = new Transaction();
            tx.add(
                createAssociatedTokenAccountInstruction(
                    sourceWallet.publicKey,
                    ata,
                    owner,
                    mint,
                    TOKEN_PROGRAM_ID,
                    ASSOCIATED_TOKEN_PROGRAM_ID
                )
            );

            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;
            tx.feePayer = sourceWallet.publicKey;

            const signature = await connection.sendTransaction(tx, [sourceWallet], {
                commitment: "confirmed",
                maxRetries: 3,
            });
            console.log("ATA creation tx:", signature);
            await connection.confirmTransaction(signature);
            return ata;
        }
    } catch (error) {
        console.error("Error in checkAndCreateATA:", error);
        throw error;
    }
}

async function mintTokens() {
    try {
        // First check if we have mint authority
        await checkMintAuthority();

        // Calculate amount with decimals
        const amount = tokens * 10 ** 9;

        // Check and create ATA if needed
        console.log("Checking destination ATA...");
        const destinationATA = await checkAndCreateATA(sourceWallet.publicKey, tokenMint);
        console.log("Destination ATA:", destinationATA.toBase58());

        // Create the mint transaction
        const transaction = new Transaction();
        
        // Add the mint instruction
        transaction.add(
            createMintToInstruction(
                tokenMint,           // mint
                destinationATA,      // destination
                sourceWallet.publicKey, // authority
                amount,              // amount
                [],                  // multiSigners
                TOKEN_PROGRAM_ID     // programId
            )
        );

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sourceWallet.publicKey;

        // Send the transaction
        console.log("Sending mint transaction...");
        const signature = await connection.sendTransaction(transaction, [sourceWallet], {
            commitment: "confirmed",
            maxRetries: 3,
        });

        console.log("Transaction sent:", signature);
        console.log("Successfully minted", tokens, "tokens");

        // Wait for confirmation
        await connection.confirmTransaction(signature);
        return;

    } catch (error) {
        console.error("Error minting tokens:", error);
        throw error;
    }
}

// Execute the mint function
mintTokens(); 