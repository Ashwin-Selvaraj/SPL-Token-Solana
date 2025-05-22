// use anchor_lang::prelude::*;
// use anchor_spl::{
//     associated_token::AssociatedToken,
//     metadata::{
//         create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
//         Metadata as Metaplex,
//     },
//     token::{mint_to, Mint, MintTo, Token, TokenAccount},
// };
// declare_id!("JCbkaacRtqB84vD3wsvgecG5VGQPUSL6ziA4GXkjRnEJ");

// #[program]
// mod token_program {
//     use super::*;

    // pub fn initiate_token(_ctx: Context<InitToken>, metadata: InitTokenParams) -> Result<()> {
    //     let seeds = &["mint".as_bytes(), &[_ctx.bumps.mint]];
    //     let signer = [&seeds[..]];

    //     let token_data: DataV2 = DataV2 {
    //         name: metadata.name,
    //         symbol: metadata.symbol,
    //         uri: metadata.uri,
    //         seller_fee_basis_points: 0,
    //         creators: None,
    //         collection: None,
    //         uses: None,
    //     };

    //     let metadata_ctx = CpiContext::new_with_signer(
    //         _ctx.accounts.token_metadata_program.to_account_info(),
    //         CreateMetadataAccountsV3 {
    //             payer: _ctx.accounts.payer.to_account_info(),
    //             update_authority: _ctx.accounts.mint.to_account_info(),
    //             mint: _ctx.accounts.mint.to_account_info(),
    //             metadata: _ctx.accounts.metadata.to_account_info(),
    //             mint_authority: _ctx.accounts.mint.to_account_info(),
    //             system_program: _ctx.accounts.system_program.to_account_info(),
    //             rent: _ctx.accounts.rent.to_account_info(),
    //         },
    //         &signer,
    //     );

    //     create_metadata_accounts_v3(metadata_ctx, token_data, false, true, None)?;

    //     msg!("Token mint created successfully.");
    //     Ok(())
    // }

    // pub fn mint_tokens(ctx: Context<MintTokens>, quantity: u64) -> Result<()> {
    //     let seeds = &["mint".as_bytes(), &[ctx.bumps.mint]];
    //     let signer = [&seeds[..]];

    //     mint_to(
    //         CpiContext::new_with_signer(
    //             ctx.accounts.token_program.to_account_info(),
    //             MintTo {
    //                 authority: ctx.accounts.mint.to_account_info(),
    //                 to: ctx.accounts.destination.to_account_info(),
    //                 mint: ctx.accounts.mint.to_account_info(),
    //             },
    //             &signer,
    //         ),
    //         quantity,
    //     )?;

    //     Ok(())
    // }

// }

// #[derive(Accounts)]
// #[instruction(params: InitTokenParams)]
// pub struct InitToken<'info> {
//     #[account(mut)]
//     /// CHECK: UncheckedAccount
//     pub metadata: UncheckedAccount<'info>,
//     #[account(
//         init,
//         seeds = [b"mint"],
//         bump,
//         payer = payer,
//         mint::decimals = params.decimals,
//         mint::authority = mint,
//     )]
//     pub mint: Account<'info, Mint>,
//     #[account(mut)]
//     pub payer: Signer<'info>,
//     pub rent: Sysvar<'info, Rent>,
//     pub system_program: Program<'info, System>,
//     pub token_program: Program<'info, Token>,
//     pub token_metadata_program: Program<'info, Metaplex>,
// }

// #[derive(Accounts)]
// pub struct MintTokens<'info> {
//     #[account(
//         mut,
//         seeds = [b"mint"],
//         bump,
//         mint::authority = mint,
//     )]
//     pub mint: Account<'info, Mint>,
//     #[account(
//         init_if_needed,
//         payer = payer,
//         associated_token::mint = mint,
//         associated_token::authority = payer,
//     )]
//     pub destination: Account<'info, TokenAccount>,
//     #[account(mut)]
//     pub payer: Signer<'info>,
//     pub rent: Sysvar<'info, Rent>,
//     pub system_program: Program<'info, System>,
//     pub token_program: Program<'info, Token>,
//     pub associated_token_program: Program<'info, AssociatedToken>,
// }

// #[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
// pub struct InitTokenParams {
//     pub name: String,
//     pub symbol: String,
//     pub uri: String,
//     pub decimals: u8,
// }

// pub struct Initialize {}



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

