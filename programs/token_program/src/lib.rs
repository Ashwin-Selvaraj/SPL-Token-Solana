use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata as Metaplex,
    },
    token::{MintTo, Mint, mint_to, Token, Transfer, Burn, FreezeAccount, ThawAccount, TokenAccount},
};
use anchor_spl::token;
use anchor_spl::token::spl_token::instruction::AuthorityType;

declare_id!("JCbkaacRtqB84vD3wsvgecG5VGQPUSL6ziA4GXkjRnEJ");

#[program]
pub mod token_contract {
    use super::*;


    pub fn initiate_token(_ctx: Context<InitToken>, metadata: InitTokenParams) -> Result<()> {
        let seeds = &["mint".as_bytes(), &[_ctx.bumps.mint]];
        let signer = [&seeds[..]];

        let token_data: DataV2 = DataV2 {
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let metadata_ctx = CpiContext::new_with_signer(
            _ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                payer: _ctx.accounts.payer.to_account_info(),
                update_authority: _ctx.accounts.mint.to_account_info(),
                mint: _ctx.accounts.mint.to_account_info(),
                metadata: _ctx.accounts.metadata.to_account_info(),
                mint_authority: _ctx.accounts.mint.to_account_info(),
                system_program: _ctx.accounts.system_program.to_account_info(),
                rent: _ctx.accounts.rent.to_account_info(),
            },
            &signer,
        );

        create_metadata_accounts_v3(metadata_ctx, token_data, false, true, None)?;

        msg!("Token mint created successfully.");
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, quantity: u64) -> Result<()> {
        let seeds = &["mint".as_bytes(), &[ctx.bumps.mint]];
        let signer = [&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                &signer,
            ),
            quantity,
        )?;

        Ok(())
    }

    pub fn transfer_token(ctx: Context<TransferToken>, amount: u64) -> Result<()> {
        // Create the Transfer struct for our context
        let transfer_instruction = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.from_authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        // Create the Context for our Transfer request
        let cpi_ctx = CpiContext::new(cpi_program, transfer_instruction);

        // Execute anchor's helper function to transfer tokens
        anchor_spl::token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn burn_token(ctx: Context<BurnToken>, amount: u64) -> Result<()> {        
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.from.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::burn(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn freeze_account(ctx: Context<Freeze>) -> Result<()> {
        let cpi_accounts = FreezeAccount {
            account: ctx.accounts.account.clone(),
            mint: ctx.accounts.mint.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);

        // Execute anchor's helper function to freeze an account or mint
        token::freeze_account(cpi_ctx)?;

        Ok(())
    }

    pub fn unfreeze_account(ctx: Context<UnFreeze>) -> Result<()> {
        let cpi_accounts = ThawAccount {
            account: ctx.accounts.account.clone(),
            mint: ctx.accounts.mint.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);

        // Execute anchor's helper function to freeze an account or mint
        token::thaw_account(cpi_ctx)?;

        Ok(())
    }

    pub fn set_mint_authority(ctx: Context<SetMintTokenAuthority>) -> Result<()> {
        let seeds = &["mint".as_bytes(), &[ctx.bumps.spl_token_mint]];
        let signer = [&seeds[..]];
    
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::SetAuthority {
                current_authority: ctx.accounts.spl_token_mint.to_account_info(),
                account_or_mint: ctx.accounts.spl_token_mint.to_account_info(),
            },
            &signer,
        );
    
        token::set_authority(
            cpi_context,
            AuthorityType::MintTokens,
            Some(ctx.accounts.another_authority.key()),
        )?;
        Ok(())
    }

    //MERKLE ROOT - Logic for the merkle root
  

    // pub fn initialize_claim_config(ctx: Context<InitializeClaimConfig>, bump: u8) -> Result<()> {
    //     let claim_config = &mut ctx.accounts.claim_config;
    //     claim_config.bump = bump;
    //     claim_config.merkle_root = [0u8; 32]; // or some default
    //     claim_config.authority = ctx.accounts.authority.key(); // ✅ This is the missing line
    //     Ok(())
    // }
    
    

    // pub fn set_merkle_root(ctx: Context<SetMerkleRoot>, new_root: [u8; 32]) -> Result<()> {
    //     let claim_config = &mut ctx.accounts.claim_config;
    //     // Check if the signer is the authority
    //     require_keys_eq!(
    //         ctx.accounts.authority.key(),
    //         claim_config.authority,
    //         ErrorCode::Unauthorized
    //     );
    //     // Check if the new root is different from the existing one
    //     require!(
    //         claim_config.merkle_root != new_root,
    //         ErrorCode::MerkleRootUnchanged
    //     );
    
    //     // Update the root
    //     claim_config.merkle_root = new_root;
    
    //     Ok(())
    // }    


    pub fn initialize_claim_config(ctx: Context<InitializeClaimConfig>, bump: u8) -> Result<()> {
        let claim_config = &mut ctx.accounts.claim_config;
        claim_config.bump = bump;
        claim_config.merkle_root = [0u8; 32];
        claim_config.authority = ctx.accounts.authority.key(); // you can keep this or remove if unused elsewhere
        Ok(())
    }
    
    pub fn set_merkle_root(ctx: Context<SetMerkleRoot>, new_root: [u8; 32]) -> Result<()> {
        let claim_config = &mut ctx.accounts.claim_config;
    
        require_keys_eq!(
            ctx.accounts.authority.key(),
            claim_config.authority,
            ErrorCode::Unauthorized
        );
    
        require!(
            claim_config.merkle_root != new_root,
            ErrorCode::MerkleRootUnchanged
        );
    
        claim_config.merkle_root = new_root;
        Ok(())
    }


    // Token Claiming Logic - Merkle Tree
    

    

    pub fn claim_tokens(
        ctx: Context<ClaimTokens>,
        bump: u8,
        amount: u64,
        proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        let user_key = ctx.accounts.user.key();
        let leaf = anchor_lang::solana_program::keccak::hashv(&[
            user_key.as_ref(),
            &amount.to_le_bytes(),
        ])
        .0;
        require!(
            verify_merkle_proof(&proof, &ctx.accounts.claim_config.merkle_root, &leaf),
            ErrorCode::MerkleProofVerificationFailed
        );
    
        let status = &mut ctx.accounts.claim_status;
        require!(!status.claimed, ErrorCode::AlreadyClaimed);
        status.claimed = true;
    
        let cpi_accounts = Transfer {
            from: ctx.accounts.token_vault.to_account_info(),
            to: ctx.accounts.user_token_account.clone(),
            authority: ctx.accounts.claim_config.to_account_info(),
        };
    
        // let signer_seeds = &[b"claim_config_v3", &[bump]];
        let signer_seeds: &[&[u8]] = &[b"claim_config_v3", &[bump]];
        let signer = &[&signer_seeds[..]];
    
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
    
        token::transfer(cpi_ctx, amount)?;
    
        Ok(())
    }

}


fn verify_merkle_proof(
    proof: &Vec<[u8; 32]>,
    root: &[u8; 32],
    leaf: &[u8; 32],
) -> bool {
    use anchor_lang::solana_program::keccak::hashv;

    let mut computed = *leaf;

    for p in proof.iter() {
        let data = if computed <= *p {
            [computed.as_ref(), p.as_ref()].concat()
        } else {
            [p.as_ref(), computed.as_ref()].concat()
        };
        computed = hashv(&[&data]).0;
    }

    &computed == root
}


#[derive(Accounts)]
#[instruction(params: InitTokenParams)]
pub struct InitToken<'info> {
    #[account(mut)]
    /// CHECK: UncheckedAccount
    pub metadata: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = [b"mint"],
        bump,
        payer = payer,
        mint::decimals = params.decimals,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metaplex>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct InitTokenParams {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        seeds = [b"mint"],
        bump,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = mint_authority,
        mint::freeze_authority = freeze_authority,
        seeds = [b"mint"],
        bump
    )]
    pub mint: Account<'info, Mint>,

    /// The account that can mint tokens
    pub mint_authority: Signer<'info>,

    /// The account that can freeze token accounts
    pub freeze_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct TransferToken<'info> {
    pub token_program: Program<'info, Token>,
    /// CHECK: The associated token account that we are transferring the token from
    #[account(mut)]
    pub from: UncheckedAccount<'info>,
    /// CHECK: The associated token account that we are transferring the token to
    #[account(mut)]
    pub to: AccountInfo<'info>,
    // the authority of the from account
    pub from_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct BurnToken<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>, // the token mint to burn from

    #[account(mut)]
    pub from: Account<'info, TokenAccount>, // the user's token account to burn from

    pub authority: Signer<'info>, // must be the owner of `from`

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Freeze<'info> {
    pub token_program: Program<'info, Token>,

    /// CHECK: Safe. This is the token account to freeze.
    #[account(mut)]
    pub account: AccountInfo<'info>,

    /// CHECK: Safe. This is the mint associated with the token account.
    pub mint: AccountInfo<'info>,

    /// CHECK: Safe. This must be the current freeze authority of the mint.
    pub authority: Signer<'info>,
}


#[derive(Accounts)]
pub struct UnFreeze<'info> {
    pub token_program: Program<'info, Token>,
    /// CHECK: This is
    pub account: AccountInfo<'info>,
    /// CHECK: This is the token that we want to mint
    pub mint: AccountInfo<'info>,
    /// CHECK: the authority of the mint account
    pub authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct SetMintTokenAuthority<'info> {
    #[account(
        mut,
        seeds = [b"mint"],
        bump,
    )]
    pub spl_token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub another_authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}



//MERKLE ROOT - Logic for the merkle root

// #[derive(Accounts)]
// pub struct InitializeClaimConfig<'info> {
//     #[account(
//         init_if_needed, 
//         payer = authority, 
//         space = 8 + 32 + 32 + 1, 
//         seeds = [b"claim_config_v2"], 
//         bump
//     )]
//     pub claim_config: Account<'info, ClaimConfig>,

//     #[account(mut)]
//     pub authority: Signer<'info>,

//     pub system_program: Program<'info, System>,
// }


// //Store root in a PDA ClaimConfig account:
// #[account]
// pub struct ClaimConfig {
//     pub merkle_root: [u8; 32],
//     pub authority: Pubkey,  // Add this if not already present
//     pub bump: u8,
// }



// #[derive(Accounts)]
// pub struct SetMerkleRoot<'info> {
//     #[account(mut, has_one = authority)]
//     pub claim_config: Account<'info, ClaimConfig>,

//     pub authority: Signer<'info>, // <== Must be signer!
// }

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeClaimConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 1,
        seeds = [b"claim_config_v3"],
        bump
    )]
    pub claim_config: Account<'info, ClaimConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

//Store root in a PDA ClaimConfig account:
#[account]
pub struct ClaimConfig {
    pub merkle_root: [u8; 32],
    pub authority: Pubkey,  // Add this if not already present
    pub bump: u8,
}

#[derive(Accounts)]
pub struct SetMerkleRoot<'info> {
    #[account(
        mut,
        seeds = [b"claim_config_v3"],
        bump,
        has_one = authority   // ✅ This is fine IF...
    )]
    pub claim_config: Account<'info, ClaimConfig>,
    
    pub authority: Signer<'info>, 
}


// Token Claiming Logic - Merkle Tree

#[account]
pub struct ClaimStatus {
    pub claimed: bool,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct ClaimTokens<'info> {
    #[account(
        mut,
        seeds = [b"claim_config_v3"],
        bump,
        has_one = authority // ✅ will now match the account below
    )]
    pub claim_config: Account<'info, ClaimConfig>,

    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"claim_status", user.key().as_ref()],
        bump,
        space = 8 + 1
    )]
    pub claim_status: Account<'info, ClaimStatus>,

    /// CHECK: Verified via CPI
    #[account(mut)]
    pub user_token_account: AccountInfo<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub token_vault: Account<'info, TokenAccount>,

    /// ✅ Required to satisfy `has_one = authority`
    pub authority: Signer<'info>, 

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,
}



#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to update the Merkle root.")]
    Unauthorized,

    #[msg("Merkle root is unchanged.")]
    MerkleRootUnchanged,

    #[msg("You have already claimed.")]
    AlreadyClaimed,
    
    #[msg("Invalid Merkle proof.")]
    MerkleProofVerificationFailed,
}

