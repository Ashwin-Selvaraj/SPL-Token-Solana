import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import fs from 'fs';

// === CONFIG === //
const RPC_URL = clusterApiUrl('devnet'); // cleaner alternative
const PROGRAM_ID = new PublicKey('JCbkaacRtqB84vD3wsvgecG5VGQPUSL6ziA4GXkjRnEJ');
const MINT = new PublicKey('EvfJoTiJ2AxnC6Xo1BHyi8JtPQ7MNP53WkrCCVPknA1i');
const SEED = 'claim_config_v3';

// Load payer keypair
const payer = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync('/Users/ashwin/.config/solana/id.json', 'utf8')))
);

async function main() {
  const connection = new Connection(RPC_URL, 'confirmed');

  // Derive PDA (vault owner)
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from(SEED)],
    PROGRAM_ID
  );
  console.log('🔐 Derived PDA:', pda.toBase58());

  // Get ATA for the PDA
  const vaultAta = await getAssociatedTokenAddress(
    MINT,
    pda,
    true, // allowOwnerOffCurve = true because PDA is a program-owned address
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  console.log('🏦 Vault ATA:', vaultAta.toBase58());

  // Check if ATA exists
  const vaultAtaInfo = await connection.getAccountInfo(vaultAta);
  if (!vaultAtaInfo) {
    console.log('⏳ Creating Vault ATA...');

    const createIx = createAssociatedTokenAccountInstruction(
      payer.publicKey, // payer
      vaultAta,        // new ATA address
      pda,             // owner of the ATA
      MINT,            // mint
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const tx = new Transaction().add(createIx);
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    console.log('✅ Created Vault ATA tx signature:', sig);
  } else {
    console.log('✅ Vault ATA already exists.');
  }

  // Mint tokens to vault's ATA
  const mintAmount = 10000_000_000_000; // 1 token with 9 decimals
  console.log(`🚀 Minting ${mintAmount} tokens to Vault ATA...`);
  const mintSig = await mintTo(
    connection,
    payer,
    MINT,
    vaultAta,
    payer, // mint authority
    mintAmount
  );
  console.log('✅ Minted tokens. Tx Signature:', mintSig);
}

main().catch((err) => {
  console.error('❌ Error:', err);
});
