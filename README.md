# 🪙 Basic SPL Token Program on Solana (Anchor Framework)

This repository demonstrates a simple implementation of an SPL (Solana Program Library) token using the [Anchor](https://www.anchor-lang.com/) framework. It includes functionalities like minting, transferring, burning, freezing, and unfreezing tokens.

## 🧱 Prerequisites

Make sure you have the following installed:

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli)
- [Anchor CLI](https://book.anchor-lang.com/getting_started/installation.html)
- [Node.js & npm](https://nodejs.org/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/solana-spl-token-anchor.git
cd solana-spl-token-anchor

## ⚙️ Anchor Workflow

### 1. Initialize Anchor Project (Already Done)

If you were starting from scratch:

```bash
anchor init spl-token-anchor



### 2. Build the Program

Compile the Solana program:

```bash
anchor build


### 3. Deploy the Program to Devnet

Deploy the Solana program:

```bash
anchor deploy

Make sure your CLI is set to Devnet:

```bash
solana config set --url https://api.devnet.solana.com


### 4. Run Tests
Test your program using Anchor’s built-in Mocha framework:

```bash
anchor test
