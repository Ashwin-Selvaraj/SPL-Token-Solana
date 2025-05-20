const { Connection, Keypair, PublicKey, Transaction } = require("@solana/web3.js");
const { 
    getMint,
    createSetAuthorityInstruction,
    AuthorityType,
    TOKEN_PROGRAM_ID
} = require("@solana/spl-token");
const {bs58} = require("@coral-xyz/anchor/dist/cjs/utils/bytes");

// Configuration
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Your wallet's private key (replace with the private key of the current mint authority)
const privateKey58 = [187,217,135,207,196,224,247,157,25,201,139,26,72,69,186,29,92,236,212,137,72,29,87,206,116,43,227,228,205,88,4,29,157,60,116,119,89,69,133,216,75,104,106,78,137,22,22,121,82,120,203,148,180,176,2,136,163,99,72,145,124,109,39,2];
const stringPrivateKey = bs58.encode(privateKey58);
const currentAuthority = Keypair.fromSecretKey(bs58.decode(stringPrivateKey));

// Token mint address
const mintAddress = new PublicKey("AYPhJd5QmN1qoxqCGJkrcMipNMNExMYMFfYfm4djDfCT");

// New authority's public key (replace with the new authority's public key)
const newAuthority = new PublicKey("3qfmA6WT19mbMK4DXAZ2J16VihPh5Ax4ihawyc9wx5mP");

async function changeMintAuthority() {
    try {
        // Get current mint info
        const mintInfo = await getMint(connection, mintAddress);
        console.log("Current mint authority:", mintInfo.mintAuthority?.toBase58() || "None");
        console.log("Current authority wallet:", currentAuthority.publicKey.toBase58());

        // Create the instruction
        const instruction = createSetAuthorityInstruction(
            mintAddress,           // mint
            currentAuthority.publicKey, // current authority
            AuthorityType.MintTokens, // authority type
            newAuthority,          // new authority
            [],                    // multiSigners (empty because we're using the authority directly)
            TOKEN_PROGRAM_ID       // programId
        );

        // Create and send transaction
        const transaction = new Transaction().add(instruction);
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = currentAuthority.publicKey;

        // Sign and send transaction
        const signature = await connection.sendTransaction(transaction, [currentAuthority]);
        console.log("Transaction sent:", signature);
        
        // Wait for confirmation
        await connection.confirmTransaction(signature);
        console.log("Transaction confirmed!");

        // Verify the change
        const updatedMintInfo = await getMint(connection, mintAddress);
        console.log("New mint authority:", updatedMintInfo.mintAuthority?.toBase58());

    } catch (error) {
        console.error("Error:", error);
    }
}

// Run the script
changeMintAuthority(); 