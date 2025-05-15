const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");
const BN = require("bn.js");

// Configure the client to use the local cluster
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

// Load the program
const program = anchor.workspace.TokenProgram;

// Constants from your test file
const MINT_SEED = "mint";
const METADATA_SEED = "metadata";
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

async function main() {
    try {
        // Find the mint address
        const [mint] = PublicKey.findProgramAddressSync(
            [Buffer.from(MINT_SEED)],
            program.programId
        );

        // Find the metadata address
        const [metadataAddress] = PublicKey.findProgramAddressSync(
            [
                Buffer.from(METADATA_SEED),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );

        // Get the destination ATA
        const destination = await anchor.utils.token.associatedAddress({
            mint: mint,
            owner: provider.publicKey,
        });

        // Amount to mint (10 tokens with 9 decimals)
        const mintAmount = new BN(10 * 10 ** 9);

        // Create the context for minting
        const context = {
            mint,
            destination,
            payer: provider.publicKey,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        };

        // Mint the tokens
        console.log("Minting tokens...");
        const txHash = await program.methods
            .mintToken(mintAmount)
            .accounts(context)
            .rpc();

        console.log("Transaction sent:", txHash);
        console.log(`https://explorer.solana.com/tx/${txHash}?cluster=devnet`);

        // Wait for confirmation
        await provider.connection.confirmTransaction(txHash);

        // Get the new balance
        const balance = await provider.connection.getTokenAccountBalance(destination);
        console.log("New balance:", balance.value.uiAmount, "tokens");

    } catch (error) {
        console.error("Error:", error);
    }
}

main(); 