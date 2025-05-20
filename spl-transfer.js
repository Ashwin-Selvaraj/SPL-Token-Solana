const {Keypair, Transaction, Connection, PublicKey} = require("@solana/web3.js");
const {getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction} = require("@solana/spl-token");

const {bs58} = require("@coral-xyz/anchor/dist/cjs/utils/bytes");

const privateKey58 = [187,217,135,207,196,224,247,157,25,201,139,26,72,69,186,29,92,236,212,137,72,29,87,206,116,43,227,228,205,88,4,29,157,60,116,119,89,69,133,216,75,104,106,78,137,22,22,121,82,120,203,148,180,176,2,136,163,99,72,145,124,109,39,2]
const stringPrivateKey = bs58.encode(privateKey58);

const owner = stringPrivateKey;
//converting the program id to a public key
const splToken = new PublicKey("AYPhJd5QmN1qoxqCGJkrcMipNMNExMYMFfYfm4djDfCT");
const sourceWallet = Keypair.fromSecretKey(bs58.decode(owner));

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const destinationWallet = new PublicKey("2YaZSTKcf8W8tEJLv6jkeRCDVtntENwS8bpVd9koBZTk");
const tokens = 2;

const genATA = async () => {
    let ata = await getAssociatedTokenAddress(
        splToken,
        destinationWallet,
        false
    );
    console.log("ATA - Assciated Token Account", ata);
    

    let transaction = new Transaction();
        //building the transactiuon
        transaction.add(
            createAssociatedTokenAccountInstruction(
                sourceWallet.publicKey,//payer
                ata, // destination wallet
                destinationWallet, //destination wallet
                splToken, //token address
            )
        )

        let tx = await connection.sendTransaction(transaction, [sourceWallet]); //second argument has the signer
        console.log("ATA generated and sent", tx);
        //we have to give some time to the transaction to be confirmed - ATA creation time
        return true;
}

const solanaTransferSPL = async () => {
    let amount = tokens *10**9;
    let sourceWalletATA = await getAssociatedTokenAddress(
        splToken,
        sourceWallet.publicKey,
        false
    );

    let destinationWalletATA = await getAssociatedTokenAddress(
        splToken,
        destinationWallet,
        false
    );

    let sourceATA = sourceWalletATA.toBase58();
    let destinationATA = destinationWalletATA.toBase58();
    console.log("Source ATA", sourceATA);
    console.log("Destination ATA", destinationATA);

    try{
        let transaction = new Transaction();
        //building the transaction
        transaction.add(
            createTransferCheckedInstruction(
                new PublicKey(sourceATA),//ATA
                splToken, // payer - contract address
                new PublicKey(destinationATA), //ATA
                sourceWallet.publicKey, //source wallet
                amount, //amount
                9 //decimal value
            )
        )

        let tx = await connection.sendTransaction(transaction, [sourceWallet]); //second argument has the signer
        console.log("Transaction sent", tx);
        return 
    }
    catch(error){
        let generateATA = await genATA(sourceWallet);
        if(generateATA){
            await new Promise(resolve => setTimeout(resolve, 15000));
            await solanaTransferSPL();
            return;
        }
    }
}

solanaTransferSPL();



// const { Keypair, Transaction, Connection, PublicKey, clusterApiUrl } = require("@solana/web3.js");
// const { 
//     getAssociatedTokenAddress, 
//     createTransferCheckedInstruction, 
//     createAssociatedTokenAccountInstruction, 
//     TOKEN_PROGRAM_ID,
//     ASSOCIATED_TOKEN_PROGRAM_ID,
//     getAccount
// } = require("@solana/spl-token");
// const { bs58 } = require("@coral-xyz/anchor/dist/cjs/utils/bytes");

// // const privateKey58 = [187,217,135,207,196,224,247,157,25,201,139,26,72,69,186,29,92,236,212,137,72,29,87,206,116,43,227,228,205,88,4,29,157,60,116,119,89,69,133,216,75,104,106,78,137,22,22,121,82,120,203,148,180,176,2,136,163,99,72,145,124,109,39,2]
// // const stringPrivateKey = bs58.encode(privateKey58);
// // console.log(stringPrivateKey,"stringPrivateKey");

// const owner = '4kqEbt7VwmePYcC6Qi8dYrqrorLmfTU1N9sGoet3Rd22peqvyc17qZQwEVG2rUfNcUg7va5BwM9Z913Du28XnJYH';
// // Your custom token's mint address
// const tokenMint = new PublicKey('JCbkaacRtqB84vD3wsvgecG5VGQPUSL6ziA4GXkjRnEJ');
// const sourceWallet = Keypair.fromSecretKey(bs58.decode(owner));
// const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// const destWallet = new PublicKey('2YaZSTKcf8W8tEJLv6jkeRCDVtntENwS8bpVd9koBZTk');
// const tokens = 2; // set the amount of tokens to transfer.

// async function checkAndCreateATA(owner, mint) {
//     try {
//         const ata = await getAssociatedTokenAddress(
//             mint,
//             owner,
//             false,
//             TOKEN_PROGRAM_ID,
//             ASSOCIATED_TOKEN_PROGRAM_ID
//         );

//         try {
//             // Try to get the account info
//             await getAccount(connection, ata);
//             console.log("ATA exists:", ata.toBase58());
//             return ata;
//         } catch (e) {
//             // Account doesn't exist, create it
//             console.log("Creating ATA:", ata.toBase58());
//             const tx = new Transaction();
//             console.log(tx,"tx before adding the instruction");
//             console.log(sourceWallet.publicKey,"sourceWallet.publicKey");
//             console.log(ata,"ata");
//             console.log(owner,"owner");
//             console.log(mint,"mint");
//             console.log(TOKEN_PROGRAM_ID,"TOKEN_PROGRAM_ID");
//             console.log(ASSOCIATED_TOKEN_PROGRAM_ID,"ASSOCIATED_TOKEN_PROGRAM_ID");
            
//             tx.add(
//                 createAssociatedTokenAccountInstruction(
//                     sourceWallet.publicKey,
//                     ata,
//                     owner,
//                     mint,
//                     TOKEN_PROGRAM_ID,
//                     ASSOCIATED_TOKEN_PROGRAM_ID
//                 )
//             );
//             console.log(tx,"tx after adding the instruction");
            

//             const { blockhash } = await connection.getLatestBlockhash();
//             tx.recentBlockhash = blockhash;
//             tx.feePayer = sourceWallet.publicKey;

//             const signature = await connection.sendTransaction(tx, [sourceWallet], {
//                 commitment: "confirmed",
//                 maxRetries: 3,
//             });
//             console.log("ATA creation tx:", signature);
//             await connection.confirmTransaction(signature);
//             return ata;
//         }
//     } catch (error) {
//         console.error("Error in checkAndCreateATA:", error);
//         throw error;
//     }
// }

// const solanaTransferSpl = async () => {
//     try {
//         let amount = tokens * 10 ** 9;
        
//         // Check and create ATAs if needed
//         console.log("Checking source ATA...");
//         const sourceATA = await checkAndCreateATA(sourceWallet.publicKey, tokenMint);
        
//         console.log("Checking destination ATA...");
//         const destATA = await checkAndCreateATA(destWallet, tokenMint);

//         console.log("Source ATA:", sourceATA.toBase58());
//         console.log("Destination ATA:", destATA.toBase58());

//         let transaction = new Transaction();
//         console.log(transaction,"transaction before adding the instruction");
//         transaction.add(
//             createTransferCheckedInstruction(
//                 sourceATA,
//                 tokenMint,
//                 destATA,
//                 sourceWallet.publicKey,
//                 amount,
//                 9,
//                 TOKEN_PROGRAM_ID
//             )
//         );

//         console.log(transaction,"transaction with instruction");
        
//         const { blockhash } = await connection.getLatestBlockhash();
//         transaction.recentBlockhash = blockhash;
//         transaction.feePayer = sourceWallet.publicKey;
        
//         console.log("Sending transfer transaction...");
//         const signature = await connection.sendTransaction(transaction, [sourceWallet], {
//             commitment: "confirmed",
//             maxRetries: 3,
//         });
//         console.log('Transfer successful! Signature:', signature);
        
//         await connection.confirmTransaction(signature);
//         return;
//     } catch (error) {
//         console.error("Transfer failed:", error);
//         throw error;
//     }
// }

// solanaTransferSpl()
