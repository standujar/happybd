// Configuration - Update these values
const CONFIG = {
    password: "__SITE_PASSWORD_PLACEHOLDER__", // Will be replaced by GitHub Actions
    tokenMintAddress: "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC", // AI16Z token mint address
    welcomeMessage: "Connecte ton wallet pour récupérer ton cadeau",
    
    // DEBUG MODE - set to false for production
    debug: false, // Change to true to see detailed logs
    
    // AJOUTEZ VOTRE CLÉ ALCHEMY ICI :
    // Allez sur https://alchemy.com, créez un compte, créez une app Solana, copiez l'URL
    alchemyUrl: "https://solana-mainnet.g.alchemy.com/v2/QrL_Gy9cI-3Pe9H_HsaNDklVRKQpXz_-", // Remplacez par votre URL Alchemy
    
    // Multiple RPC endpoints for fallback - using free public endpoints + paid
    rpcUrls: [
        // Si vous avez Alchemy, décommentez cette ligne et mettez votre URL
        // "VOTRE_URL_ALCHEMY_ICI",
        
        // Endpoints mainnet en priorité (AI16Z est sur mainnet)
        "https://api.mainnet-beta.solana.com", // Mainnet principal
        "https://rpc.ankr.com/solana", // Mainnet alternatif
        "https://solana-mainnet.rpc.extrnode.com", // Mainnet alternatif
        
        // Endpoints de test (uniquement pour debug)
        // "https://api.devnet.solana.com", // Devnet (commenté car AI16Z pas disponible)
        // "https://api.testnet.solana.com", // Testnet (commenté car AI16Z pas disponible)
    ],
    clusterUrl: "https://explorer.solana.com"
};

// Global variables
let wallet = null;
let connection = null;
let vaultKeypair = null;
let hasClaimed = false;
let currentRpcIndex = 0;

// Debug logging function
function debugLog(...args) {
    if (CONFIG.debug) {
        console.log(...args);
    }
}

// Essential logging (always shown)
function log(...args) {
    console.log(...args);
}

// Function to get RPC URLs with Alchemy first if configured
function getRpcUrls() {
    const urls = [];
    
    // Add Alchemy URL first if configured
    if (CONFIG.alchemyUrl && CONFIG.alchemyUrl !== "VOTRE_URL_ALCHEMY_ICI") {
        urls.push(CONFIG.alchemyUrl);
        console.log("🚀 Using Alchemy endpoint");
    }
    
    // Add fallback URLs
    urls.push(...CONFIG.rpcUrls);
    
    return urls;
}

// Improved connection creation with better error handling
async function createConnection() {
    console.log("🔄 Creating Solana connection...");
    
    const rpcUrls = getRpcUrls();
    
    for (let i = 0; i < rpcUrls.length; i++) {
        const url = rpcUrls[i];
        try {
            console.log(`🌐 Testing RPC ${i + 1}/${rpcUrls.length}: ${url}`);
            
            const testConnection = new solanaWeb3.Connection(url, 'confirmed');
            
            // Test with a simple call
            await testConnection.getVersion();
            
            console.log(`✅ RPC working: ${url}`);
            return testConnection;
            
        } catch (error) {
            console.log(`❌ RPC failed: ${url} - ${error.message}`);
            if (error.message && typeof error.message === 'string') {
                const errorStr = error.message;
                if (errorStr.includes('403') || errorStr.includes('401')) {
                    try {
                        const errorData = JSON.parse(errorStr.split(' : ')[1] || '{}');
                        console.log(`❌ RPC failed: ${url} - ${errorData.error?.code || error.status} : ${JSON.stringify(errorData)}`);
                    } catch {
                        console.log(`❌ RPC failed: ${url} - ${error.status || 'Unknown'} : ${errorStr}`);
                    }
                } else {
                    console.log(`❌ RPC failed: ${url} - ${errorStr}`);
                }
            }
            
            // Continue to next RPC
            continue;
        }
    }
    
    console.log("⚠️ All RPC endpoints failed, creating fallback connection");
    // Fallback to mainnet-beta even if it might fail
    return new solanaWeb3.Connection("https://api.mainnet-beta.solana.com", 'confirmed');
}

// Helper function to get a working connection
async function getWorkingConnection() {
    if (connection) {
        try {
            // Quick test of current connection
            await connection.getVersion();
            return connection;
        } catch (error) {
            console.log('Current connection failed, trying alternatives...');
        }
    }
    
    // Try to create a new working connection
    for (let i = 0; i < CONFIG.rpcUrls.length; i++) {
        try {
            const testConnection = new solanaWeb3.Connection(CONFIG.rpcUrls[i], 'confirmed');
            await testConnection.getVersion();
            
            console.log(`✅ New working connection: ${CONFIG.rpcUrls[i]}`);
            connection = testConnection;
            currentRpcIndex = i;
            return testConnection;
        } catch (error) {
            console.log(`❌ Alternative RPC failed: ${CONFIG.rpcUrls[i]}`);
            continue;
        }
    }
    
    // Return original connection as last resort
    return connection || new solanaWeb3.Connection(CONFIG.rpcUrls[0], 'confirmed');
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Check if already claimed FIRST - before any other initialization
    if (checkIfAlreadyClaimed()) {
        return; // Stop initialization if already claimed
    }
    
    try {
        connection = await createConnection();
    } catch (error) {
        console.error('Failed to create connection:', error);
        connection = new solanaWeb3.Connection(CONFIG.rpcUrls[0], 'confirmed');
    }
    
    setupEventListeners();
    
    // SPL Token implementation is now built-in
    console.log('✅ SPL Token ready!');
    
    // Enhanced wallet detection with multiple attempts
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkWallet = () => {
        attempts++;
        console.log(`Wallet detection attempt ${attempts}:`, typeof window.solana !== 'undefined');
        
        if (window.solana) {
            console.log('✅ Wallet found!');
            console.log('Is Phantom:', window.solana.isPhantom);
            console.log('Is connected:', window.solana.isConnected);
            return;
        }
        
        if (attempts < maxAttempts) {
            setTimeout(checkWallet, 500);
        } else {
            console.log('❌ No wallet detected after', maxAttempts, 'attempts');
            console.log('💡 Try:');
            console.log('1. Open this page via HTTP server (not file://)');
            console.log('2. Refresh page');
            console.log('3. Check Phantom permissions');
        }
    };
    
    checkWallet();
});

function setupEventListeners() {
    // Enter key for password input
    document.getElementById('password-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });
}

function checkPassword() {
    const passwordInput = document.getElementById('password-input');
    const errorDiv = document.getElementById('password-error');
    
    if (passwordInput.value === CONFIG.password) {
        showScreen('claim-screen');
        errorDiv.classList.add('hidden');
        document.getElementById('welcome-message').textContent = CONFIG.welcomeMessage;
    } else {
        errorDiv.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

async function connectWallet() {
    try {
        // Enhanced wallet detection
        if (typeof window.solana === 'undefined') {
            // Wait a bit for wallet injection
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (typeof window.solana === 'undefined') {
                showPhantomDownloadPrompt();
                throw new Error('Aucun wallet Solana détecté. Veuillez installer Phantom Wallet.');
            }
        }

        // Check if wallet is Phantom specifically
        console.log('Wallet detected:', window.solana.isPhantom ? 'Phantom' : 'Other Solana wallet');
        
        // Connect to wallet
        const response = await window.solana.connect();
        wallet = window.solana;
        
        // Update UI
        document.getElementById('connect-wallet').classList.add('hidden');
        document.getElementById('wallet-info').classList.remove('hidden');
        document.getElementById('claim-section').classList.remove('hidden');
        
        const address = response.publicKey.toString();
        document.getElementById('wallet-address').textContent = 
            address.slice(0, 4) + '...' + address.slice(-4);
        
        console.log('Wallet connected:', address);
        
        // Ne pas charger automatiquement le montant
        // L'utilisateur devra cliquer sur "Voir mon cadeau"
        
    } catch (error) {
        showError('Failed to connect wallet: ' + error.message);
    }
}

async function disconnectWallet() {
    try {
        if (wallet) {
            await wallet.disconnect();
        }
        wallet = null;
        
        // Update UI
        document.getElementById('connect-wallet').classList.remove('hidden');
        document.getElementById('wallet-info').classList.add('hidden');
        document.getElementById('claim-section').classList.add('hidden');
        
        console.log('Wallet disconnected');
        
    } catch (error) {
        console.error('Error disconnecting wallet:', error);
    }
}

async function claimTokens() {
    if (!wallet || !wallet.publicKey) {
        showError('Please connect your wallet first');
        return;
    }

    if (hasClaimed) {
        showError('Tokens have already been claimed');
        return;
    }

    try {
        // Show loading state
        setClaimLoading(true);
        hideMessages();

        // Ensure we have a working connection
        connection = await getWorkingConnection();

        // Initialize vault keypair - must match your wallet with tokens
        if (!vaultKeypair) {
            // Use the new VaultConfig system
            if (window.VaultConfig && window.VaultConfig.getKeypair) {
                console.log('🔑 Using VaultConfig to get vault keypair for claim...');
                vaultKeypair = window.VaultConfig.getKeypair();
                console.log('✅ Vault keypair loaded from VaultConfig for claim');
                
                // Show vault address in UI
                document.getElementById('vault-address-display').textContent = vaultKeypair.publicKey.toString();
                document.getElementById('vault-info').classList.remove('hidden');
            } else {
                throw new Error('VaultConfig not found! Make sure vault.js is properly loaded.');
            }
        }

        console.log('Starting token transfer...');
        console.log('From vault:', vaultKeypair.publicKey.toString());
        console.log('To user wallet:', wallet.publicKey.toString());

        // First, determine what token program AI16Z uses
        const mint = new solanaWeb3.PublicKey(CONFIG.tokenMintAddress);
        console.log('🔍 Checking AI16Z mint info to determine token program...');
        const mintInfo = await connection.getAccountInfo(mint);
        const actualTokenProgram = mintInfo ? mintInfo.owner.toString() : 'unknown';
        console.log('AI16Z token program:', actualTokenProgram);
        
        let tokenProgramId;
        if (actualTokenProgram === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb') {
            tokenProgramId = new solanaWeb3.PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'); // Token-2022
            console.log('✅ Using Token-2022 program');
        } else {
            tokenProgramId = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'); // Classic SPL
            console.log('✅ Using classic SPL Token program');
        }

        // Get or create token accounts
        let fromTokenAccount, toTokenAccount, needsAccountCreation = false;
        
        try {
            
            // For destination (user wallet), calculate ATA manually for Token-2022
            console.log('🔍 Calculating ATA address manually for Token-2022...');
            
            // Calculate Associated Token Address manually for Token-2022
            const ASSOCIATED_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
            
            const seeds = [
                wallet.publicKey.toBytes(),
                tokenProgramId.toBytes(), // Token-2022 program
                mint.toBytes(),
            ];
            
            const [ataAddress] = await solanaWeb3.PublicKey.findProgramAddress(
                seeds,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );
            
            toTokenAccount = ataAddress;
            console.log('✅ Manual ATA calculation:', toTokenAccount.toString());
            
            // For source (vault), calculate ATA manually for Token-2022
            console.log('🔍 Calculating vault ATA address manually for Token-2022...');
            
            const vaultSeeds = [
                vaultKeypair.publicKey.toBytes(),
                tokenProgramId.toBytes(), // Token-2022 program
                mint.toBytes(),
            ];
            
            const [vaultAtaAddress] = await solanaWeb3.PublicKey.findProgramAddress(
                vaultSeeds,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );
            
            const standardFromTokenAccount = vaultAtaAddress;
            console.log('✅ Manual vault ATA calculation:', standardFromTokenAccount.toString());
            
            // Check if standard ATA exists for vault
            const fromAccountInfo = await connection.getAccountInfo(standardFromTokenAccount);
            
            if (fromAccountInfo) {
                // Standard ATA exists, use it
                fromTokenAccount = standardFromTokenAccount;
                console.log('✅ Using standard vault ATA:', fromTokenAccount.toString());
            } else {
                // Standard ATA doesn't exist, search for alternative accounts
                console.log('❌ Standard vault ATA not found, searching alternatives...');
                
                const allTokenAccounts = await connection.getTokenAccountsByOwner(
                    vaultKeypair.publicKey,
                    { 
                        mint: mint,
                        programId: tokenProgramId  // Use the detected token program
                    }
                );
                
                if (allTokenAccounts.value.length === 0) {
                    throw new Error('No AI16Z token accounts found for vault');
                }
                
                // Find account with tokens
                let foundAccount = null;
                for (const account of allTokenAccounts.value) {
                    try {
                        const balance = await connection.getTokenAccountBalance(account.pubkey);
                        if (Number(balance.value.amount) > 0) {
                            foundAccount = account.pubkey;
                            console.log('✅ Found vault account with tokens:', foundAccount.toString());
                            console.log('   Balance:', balance.value.uiAmount, 'AI16Z');
                            break;
                        }
                    } catch (error) {
                        console.log('Error checking account balance:', error);
                    }
                }
                
                if (!foundAccount) {
                    throw new Error('No vault token accounts contain AI16Z tokens');
                }
                
                fromTokenAccount = foundAccount;
            }
            
            // Check destination account - first try calculated ATA, then search existing accounts
            console.log('🔍 Checking destination account...');
            console.log('Expected user ATA:', toTokenAccount.toString());
            const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
            
            // Search for existing user accounts
            console.log('🔍 Searching for existing user AI16Z accounts...');
            
            // First check if the calculated ATA already exists
            if (toAccountInfo) {
                console.log('✅ User ATA already exists, no creation needed');
                needsAccountCreation = false;
            } else {
                // ATA doesn't exist, search for existing accounts
                const userTokenAccounts = await connection.getTokenAccountsByOwner(
                    wallet.publicKey,
                    { 
                        mint: mint,
                        programId: tokenProgramId  // Use the detected token program
                    }
                );
                
                if (userTokenAccounts.value.length > 0) {
                    // User already has an AI16Z account, use the first one
                    toTokenAccount = userTokenAccounts.value[0].pubkey;
                    console.log('✅ Found existing user AI16Z account:', toTokenAccount.toString());
                    needsAccountCreation = false;
                } else {
                    console.log('❌ No existing AI16Z accounts found for user');
                    console.log('⚠️ Will create ATA with Token-2022 program');
                    // toTokenAccount is already correctly calculated above
                    needsAccountCreation = true;
                }
            }
            
            if (needsAccountCreation) {
                console.log('⚠️ Destination token account does not exist');
                console.log('Will let transfer instruction handle account creation automatically...');
            } else {
                console.log('✅ Destination token account exists');
            }
            
        } catch (error) {
            console.error('Error setting up token accounts:', error);
            throw new Error('Failed to setup token accounts: ' + error.message);
        }

        // Get vault token balance (we already have the correct fromTokenAccount)
        let balance, tokenAmount;
        
        try {
            balance = await connection.getTokenAccountBalance(fromTokenAccount);
            tokenAmount = balance.value.amount;
            console.log('✅ Got token balance:', balance.value.uiAmount, 'AI16Z');
            
            if (!tokenAmount || tokenAmount === '0') {
                throw new Error('No tokens available in vault account');
            }
        } catch (error) {
            console.error('Error getting token balance:', error);
            throw new Error('Failed to get vault token balance: ' + error.message);
        }
        
        console.log('Token amount to transfer:', tokenAmount);

        // Transfer all available tokens (or set a specific amount)
        const transferAmount = parseInt(tokenAmount); // Transfer all tokens
        console.log('Transfer amount (raw):', transferAmount);

        // Make sure all PublicKey parameters are properly typed
        const sourcePubkey = new solanaWeb3.PublicKey(fromTokenAccount.toString());
        const destinationPubkey = new solanaWeb3.PublicKey(toTokenAccount.toString());
        const ownerPubkey = new solanaWeb3.PublicKey(vaultKeypair.publicKey.toString());
        const mintPubkey = new solanaWeb3.PublicKey(CONFIG.tokenMintAddress);
        const walletPubkey = new solanaWeb3.PublicKey(wallet.publicKey.toString());

        // Direct transfer approach - let SPL Token handle account creation
        console.log('Using direct transfer approach...');
        
        // Transfer tokens using SPL Token library with automatic account creation
        console.log('Transferring tokens...');
        
        // Verify source account exists
        console.log('🔍 Verifying source account...');
        const sourceAccountInfo = await connection.getAccountInfo(fromTokenAccount);
        
        if (!sourceAccountInfo) {
            throw new Error('Source token account not found: ' + fromTokenAccount.toString());
        }
        
        console.log('✅ Source account verified, proceeding with transfer...');
        console.log('Source:', fromTokenAccount.toString());
        console.log('Destination:', toTokenAccount.toString());
        console.log('Amount:', transferAmount, 'raw tokens (', transferAmount / 1e9, 'AI16Z)');
        
        // Create transfer instruction manually with basic SPL Token functions
        console.log('Creating transfer instruction...');
        
        // Two-step approach: Create account first, then transfer
        if (needsAccountCreation) {
            console.log('Step 1: Creating destination account manually for Token-2022...');
            
            // Create account manually with correct Token-2022 instructions
            const ASSOCIATED_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
            const SYSTEM_PROGRAM_ID = new solanaWeb3.PublicKey('11111111111111111111111111111111');
            const RENT_PROGRAM_ID = new solanaWeb3.PublicKey('SysvarRent111111111111111111111111111111111');
            
            // Create Associated Token Account instruction manually for Token-2022
            const createAccountIx = new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: vaultKeypair.publicKey, isSigner: true, isWritable: true }, // payer
                    { pubkey: toTokenAccount, isSigner: false, isWritable: true }, // associatedTokenAddress
                    { pubkey: wallet.publicKey, isSigner: false, isWritable: false }, // owner
                    { pubkey: mint, isSigner: false, isWritable: false }, // mint
                    { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false }, // systemProgram
                    { pubkey: tokenProgramId, isSigner: false, isWritable: false }, // tokenProgram (Token-2022)
                ],
                programId: ASSOCIATED_TOKEN_PROGRAM_ID,
                data: new Uint8Array(0), // No data needed for ATA creation
            });
            
            const createTx = new solanaWeb3.Transaction().add(createAccountIx);
            createTx.feePayer = vaultKeypair.publicKey;
            
            const { blockhash: createBlockhash } = await connection.getLatestBlockhash('confirmed');
            createTx.recentBlockhash = createBlockhash;
            
            createTx.partialSign(vaultKeypair);
            
            console.log('Sending account creation transaction...');
            const createSignature = await connection.sendRawTransaction(createTx.serialize(), {
                skipPreflight: true,
                preflightCommitment: 'processed'
            });
            
            console.log('✅ Account creation transaction sent:', createSignature);
            
            // Wait for confirmation
            console.log('⏳ Waiting for account creation confirmation...');
            let attempts = 0;
            while (attempts < 30) {
                try {
                    const status = await connection.getSignatureStatus(createSignature);
                    if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
                        console.log('✅ Account creation confirmed');
                        break;
                    }
                    if (status?.value?.err) {
                        console.error('Account creation error:', status.value.err);
                        throw new Error('Account creation failed: ' + JSON.stringify(status.value.err));
                    }
                } catch (e) {
                    if (e.message.includes('Account creation failed')) throw e;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
            
            if (attempts >= 30) {
                throw new Error('Account creation timeout');
            }
            
            // Wait a bit more for propagation
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Step 2: Transfer tokens
        console.log('Step 2: Creating transfer transaction...');
        const transferTx = new solanaWeb3.Transaction();
        
        // Create transfer instruction manually for Token-2022
        console.log('💡 Creating manual transfer instruction for Token-2022...');
        
        // Transfer instruction data for Token-2022: [12, amount_as_8_bytes_little_endian, decimals]
        const transferData = new Uint8Array(10);
        transferData[0] = 12; // TransferChecked instruction discriminator for Token-2022
        
        // Write amount as little-endian 64-bit integer
        const amount = BigInt(transferAmount);
        const view = new DataView(transferData.buffer);
        view.setBigUint64(1, amount, true); // true = little-endian
        transferData[9] = 9; // AI16Z has 9 decimals
        
        const transferIx = new solanaWeb3.TransactionInstruction({
            keys: [
                { pubkey: fromTokenAccount, isSigner: false, isWritable: true }, // source
                { pubkey: mint, isSigner: false, isWritable: false }, // mint
                { pubkey: toTokenAccount, isSigner: false, isWritable: true }, // destination
                { pubkey: vaultKeypair.publicKey, isSigner: true, isWritable: false }, // owner
            ],
            programId: tokenProgramId, // Token-2022 program
            data: transferData,
        });
        
        transferTx.add(transferIx);
        console.log('✅ Transfer instruction added');
        transferTx.feePayer = vaultKeypair.publicKey;
        
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transferTx.recentBlockhash = blockhash;
        
        transferTx.partialSign(vaultKeypair);
        
        console.log('Sending transfer transaction (vault pays)...');
        
        // Vault pays all fees - completely free for user
        let signature;
        try {
            // Method 1: Current connection
            signature = await connection.sendRawTransaction(transferTx.serialize(), {
                skipPreflight: true,
                preflightCommitment: 'processed'
            });
            console.log('✅ Transfer sent via method 1');
        } catch (method1Error) {
            console.log('❌ Transfer method 1 failed:', method1Error.message);
            
            try {
                // Method 2: Alternative connection
                const altConnection = await getWorkingConnection();
                signature = await altConnection.sendRawTransaction(transferTx.serialize(), {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed'
                });
                console.log('✅ Transfer sent via method 2 (alternative RPC)');
            } catch (method2Error) {
                console.log('❌ Transfer method 2 failed:', method2Error.message);
                throw new Error('All transfer methods failed: ' + method2Error.message);
            }
        }

        console.log('✅ Transfer transaction sent:', signature);

        // Wait for confirmation using polling instead of WebSocket
        console.log('⏳ Waiting for transfer confirmation...');
        let transferConfirmed = false;
        let transferAttempts = 0;
        const maxTransferAttempts = 30; // 30 seconds max
        
        while (!transferConfirmed && transferAttempts < maxTransferAttempts) {
            try {
                const status = await connection.getSignatureStatus(signature);
                if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
                    transferConfirmed = true;
                    console.log('✅ Transfer completed successfully!');
                    break;
                }
                if (status?.value?.err) {
                    console.log('❌ Transfer failed with error:', status.value.err);
                    throw new Error('Transfer failed: ' + JSON.stringify(status.value.err));
                }
            } catch (e) {
                if (e.message.includes('Transfer failed')) {
                    throw e; // Re-throw transfer errors
                }
                console.log('Transfer polling attempt', transferAttempts + 1, 'failed:', e.message);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            transferAttempts++;
        }
        
        if (!transferConfirmed) {
            throw new Error('Transfer confirmation timed out after 30 seconds');
        }

        // Mark as claimed
        markAsClaimed();
        
        // Show success
        showSuccess(signature);
        
    } catch (error) {
        console.error('Claim error:', error);
        showError('Failed to claim tokens: ' + error.message);
    } finally {
        setClaimLoading(false);
    }
}

async function getOrCreateTokenAccount(owner, mint) {
    try {
        // Ensure we have a working connection
        const workingConnection = await getWorkingConnection();
        
        // Get associated token account address using the new API
        const associatedTokenAccount = await window.splToken.getAssociatedTokenAddress(
            mint,
            owner,
            false // allowOwnerOffCurve
        );

        // Check if account exists with retry logic
        let accountInfo = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                accountInfo = await workingConnection.getAccountInfo(associatedTokenAccount);
                break;
            } catch (error) {
                retryCount++;
                if (error.message.includes('403') || error.message.includes('forbidden')) {
                    console.log(`RPC rate limited, trying different endpoint... (${retryCount}/${maxRetries})`);
                    
                    // Get a new working connection
                    const newConnection = await getWorkingConnection();
                    if (newConnection !== workingConnection) {
                        continue; // Try with new connection
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                } else {
                    throw error;
                }
            }
        }
        
        if (!accountInfo) {
            // Create associated token account instruction
            const createInstruction = window.splToken.createAssociatedTokenAccountInstruction(
                vaultKeypair.publicKey, // payer
                associatedTokenAccount, // ata
                owner, // owner
                mint // mint
            );

            const transaction = new solanaWeb3.Transaction().add(createInstruction);
            const { blockhash } = await workingConnection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = vaultKeypair.publicKey;
            transaction.partialSign(vaultKeypair);

            const signature = await workingConnection.sendRawTransaction(
                transaction.serialize(),
                { skipPreflight: false, preflightCommitment: 'confirmed' }
            );
            await workingConnection.confirmTransaction(signature, 'confirmed');
            console.log('✅ Token account created:', associatedTokenAccount.toString());
        }

        return associatedTokenAccount;
    } catch (error) {
        console.error('Error with token account:', error);
        throw error;
    }
}

function setClaimLoading(isLoading) {
    const button = document.getElementById('claim-button');
    const text = document.getElementById('claim-text');
    const loader = document.getElementById('claim-loader');
    
    if (isLoading) {
        button.disabled = true;
        text.textContent = 'Claiming...';
        loader.classList.remove('hidden');
    } else {
        button.disabled = false;
        text.textContent = 'Récupérer mon cadeau';
        loader.classList.add('hidden');
    }
}

function showSuccess(signature) {
    const successDiv = document.getElementById('success-message');
    const txLink = document.getElementById('tx-link');
    
    txLink.href = `${CONFIG.clusterUrl}/tx/${signature}`;
    txLink.textContent = 'View Transaction';
    
    successDiv.classList.remove('hidden');
    document.getElementById('claim-section').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

function showPhantomDownloadPrompt() {
    // Créer une popup pour télécharger Phantom
    const popup = document.createElement('div');
    popup.className = 'phantom-popup';
    popup.innerHTML = `
        <div class="phantom-popup-content">
            <div class="phantom-logo">
                <div class="phantom-icon">🧡</div>
            </div>
            <h3>Wallet requis</h3>
            <p>Pour récupérer ton cadeau, connecte ton Phantom Wallet !</p>
            <div class="phantom-buttons">
                <a href="https://phantom.app/download" target="_blank" class="phantom-download-btn">
                    🚀 Télécharger Phantom
                </a>
                <button onclick="closePhantomPopup()" class="phantom-close-btn">
                    Plus tard
                </button>
            </div>
            <div class="phantom-platforms">
                <small>Disponible sur iOS, Android, Chrome, Firefox, Brave et Edge</small>
            </div>
        </div>
        <div class="phantom-overlay" onclick="closePhantomPopup()"></div>
    `;
    
    document.body.appendChild(popup);
    
    // Ajouter les styles
    if (!document.getElementById('phantom-styles')) {
        const styles = document.createElement('style');
        styles.id = 'phantom-styles';
        styles.textContent = `
            .phantom-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .phantom-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }
            
            .phantom-popup-content {
                background: white;
                border-radius: 20px;
                padding: 30px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
                position: relative;
                z-index: 10001;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                border: 3px solid #f97316;
            }
            
            .phantom-logo {
                margin-bottom: 20px;
            }
            
            .phantom-icon {
                font-size: 60px;
                background: linear-gradient(135deg, #f97316, #ea580c);
                width: 80px;
                height: 80px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto;
                box-shadow: 0 8px 16px rgba(249, 115, 22, 0.3);
            }
            
            .phantom-popup-content h3 {
                color: #ea580c;
                margin: 20px 0 10px 0;
                font-size: 24px;
            }
            
            .phantom-popup-content p {
                color: #666;
                margin-bottom: 25px;
                line-height: 1.5;
            }
            
            .phantom-buttons {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
                flex-direction: column;
            }
            
            .phantom-download-btn {
                background: linear-gradient(135deg, #f97316, #ea580c);
                color: white;
                text-decoration: none;
                padding: 15px 25px;
                border-radius: 12px;
                font-weight: 600;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
            }
            
            .phantom-download-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(249, 115, 22, 0.4);
            }
            
            .phantom-close-btn {
                background: #f3f4f6;
                color: #666;
                border: none;
                padding: 12px 25px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .phantom-close-btn:hover {
                background: #e5e7eb;
            }
            
            .phantom-platforms {
                color: #9ca3af;
                font-size: 12px;
            }
            
            @media (max-width: 480px) {
                .phantom-popup-content {
                    margin: 10px;
                    padding: 20px;
                }
                
                .phantom-buttons {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

function closePhantomPopup() {
    const popup = document.querySelector('.phantom-popup');
    if (popup) {
        popup.remove();
    }
}

function hideMessages() {
    document.getElementById('success-message').classList.add('hidden');
    document.getElementById('error-message').classList.add('hidden');
}

// Cookie management functions
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function checkIfAlreadyClaimed() {
    // Check cookie instead of localStorage
    const claimed = getCookie('kenny-ai16z-claimed');
    if (claimed === 'true') {
        hasClaimed = true;
        showClaimedMessage();
        return true;
    }
    return false;
}

function markAsClaimed() {
    hasClaimed = true;
    // Set cookie for 365 days (1 year)
    setCookie('kenny-ai16z-claimed', 'true', 365);
    console.log('🍪 Claim status saved in cookie for 1 year');
}

function showClaimedMessage() {
    // Replace entire page content with "already claimed" message
    document.body.innerHTML = `
        <div style="
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 20px;
        ">
            <div style="
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(249, 115, 22, 0.1);
                border: 3px solid #f97316;
                max-width: 500px;
                width: 100%;
            ">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #f97316, #ea580c);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px auto;
                    font-size: 40px;
                ">
                    ✅
                </div>
                <h1 style="
                    color: #ea580c;
                    margin: 0 0 20px 0;
                    font-size: 28px;
                    font-weight: 700;
                ">
                    Cadeau déjà récupéré !
                </h1>
                <p style="
                    color: #9a3412;
                    margin: 0 0 30px 0;
                    font-size: 18px;
                    line-height: 1.5;
                ">
                    Tu as déjà récupéré ton cadeau. <br>
                    Attends l'année prochaine.
                </p>
                <div style="
                    background: #fed7aa;
                    border-radius: 12px;
                    padding: 20px;
                    border-left: 4px solid #f97316;
                ">
                    <p style="
                        color: #9a3412;
                        margin: 0;
                        font-size: 14px;
                        font-weight: 500;
                    ">
                        💡 Si tu penses qu'il s'agit d'une erreur, contacte Gigachad.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// SPL Token functions are now implemented inline in HTML

async function loadTokenAmount() {
    try {
        // Get a working connection first
        const workingConnection = await getWorkingConnection();
        
        // Initialize vault keypair if not already done
        if (!vaultKeypair) {
            // Use the new VaultConfig system
            if (window.VaultConfig && window.VaultConfig.getKeypair) {
                console.log('🔑 Using VaultConfig to get vault keypair...');
                vaultKeypair = window.VaultConfig.getKeypair();
                console.log('✅ Vault keypair loaded from VaultConfig');
                
                // Verify this matches your expected address
                if (vaultKeypair.publicKey.toString() !== '4PiDLqAsGChptsT7w7ndDgFUG65Y8YqXG68zWBDs2Uzn') {
                    console.warn('⚠️ Vault address mismatch!');
                    console.warn('Expected: 4PiDLqAsGChptsT7w7ndDgFUG65Y8YqXG68zWBDs2Uzn');
                    console.warn('Generated:', vaultKeypair.publicKey.toString());
                } else {
                    console.log('✅ Vault address matches expected address!');
                }
            } else {
                console.error('❌ VaultConfig not found! Make sure vault.js is loaded.');
                document.getElementById('token-amount-value').textContent = 'Available';
                document.getElementById('token-amount').classList.remove('hidden');
                return;
            }
        }

        // Check token program first
        const mint = new solanaWeb3.PublicKey(CONFIG.tokenMintAddress);
        const mintInfo = await workingConnection.getAccountInfo(mint);
        const actualTokenProgram = mintInfo ? mintInfo.owner.toString() : 'unknown';
        
        let tokenProgramId;
        if (actualTokenProgram === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb') {
            tokenProgramId = new solanaWeb3.PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'); // Token-2022
        } else {
            tokenProgramId = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'); // Classic SPL
        }
        
        // Get vault token account with manual Token-2022 calculation
        console.log('🔍 Calculating vault ATA for token amount...');
        const ASSOCIATED_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
        
        const vaultSeeds = [
            vaultKeypair.publicKey.toBytes(),
            tokenProgramId.toBytes(), // Token-2022 program
            mint.toBytes(),
        ];
        
        const [vaultTokenAccount] = await solanaWeb3.PublicKey.findProgramAddress(
            vaultSeeds,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        console.log('🔍 Vault token account address (ATA):', vaultTokenAccount.toString());
        
        // Check if token account exists
        const accountInfo = await workingConnection.getAccountInfo(vaultTokenAccount);
        
        if (!accountInfo) {
            console.log('❌ Standard ATA not found, searching for alternative token accounts...');
            
            // Search for all token accounts owned by the vault using correct token program
            const allTokenAccounts = await workingConnection.getTokenAccountsByOwner(
                vaultKeypair.publicKey,
                { 
                    mint: new solanaWeb3.PublicKey(CONFIG.tokenMintAddress),
                    programId: tokenProgramId  // Use the detected token program (Token-2022 or classic)
                }
            );
            
            console.log('🔍 Found', allTokenAccounts.value.length, 'AI16Z token accounts for vault:');
            
            if (allTokenAccounts.value.length > 0) {
                for (let i = 0; i < allTokenAccounts.value.length; i++) {
                    const tokenAccount = allTokenAccounts.value[i];
                    console.log(`Token Account ${i + 1}:`, tokenAccount.pubkey.toString());
                    
                    try {
                        const balance = await workingConnection.getTokenAccountBalance(tokenAccount.pubkey);
                        console.log(`Balance: ${balance.value.uiAmount} AI16Z`);
                        
                        if (balance.value.uiAmount > 0) {
                            // Found tokens! Update UI
                            const tokenAmount = balance.value.uiAmount;
                            let formattedAmount;
                            if (tokenAmount >= 1000000) {
                                formattedAmount = (tokenAmount / 1000000).toFixed(2) + 'M';
                            } else if (tokenAmount >= 1000) {
                                formattedAmount = (tokenAmount / 1000).toFixed(2) + 'K';
                            } else if (tokenAmount >= 1) {
                                formattedAmount = tokenAmount.toFixed(2);
                            } else if (tokenAmount > 0) {
                                formattedAmount = tokenAmount.toFixed(6);
                            }
                            
                                        document.getElementById('token-amount-value').textContent = formattedAmount;
            // Ne pas afficher automatiquement
            
            console.log('✅ Found tokens in alternative account:', tokenAmount, 'AI16Z');
            return;
                        }
                    } catch (error) {
                        console.log(`Error getting balance for account ${i + 1}:`, error);
                    }
                }
            }
            
            // If still no tokens found, check the vault's SOL balance to make sure it's the right wallet
            try {
                const solBalance = await workingConnection.getBalance(vaultKeypair.publicKey);
                console.log('💰 Vault SOL balance:', solBalance / 1e9, 'SOL');
                
                // Also check all token accounts (not just AI16Z) using detected program
                const allAccounts = await workingConnection.getTokenAccountsByOwner(
                    vaultKeypair.publicKey,
                    { programId: tokenProgramId }  // Use the detected token program
                );
                
                console.log('🔍 Total token accounts owned by vault:', allAccounts.value.length);
                
                for (let i = 0; i < Math.min(allAccounts.value.length, 5); i++) {
                    const account = allAccounts.value[i];
                    try {
                        const accountData = account.account.data;
                        // Parse token account data to get mint
                        const mintOffset = 0;
                        const mint = new solanaWeb3.PublicKey(accountData.slice(mintOffset, mintOffset + 32));
                        
                        const balance = await workingConnection.getTokenAccountBalance(account.pubkey);
                        console.log(`Token Account ${i + 1}: ${account.pubkey.toString()}`);
                        console.log(`  Mint: ${mint.toString()}`);
                        console.log(`  Balance: ${balance.value.uiAmount}`);
                    } catch (error) {
                        console.log(`Error parsing account ${i + 1}:`, error);
                    }
                }
            } catch (error) {
                console.log('Error checking vault details:', error);
            }
            
                    document.getElementById('token-amount-value').textContent = 'Available';
        // Ne pas afficher automatiquement
        console.log('Token account not found, but claim will still work');
        return;
        }

        // Get token balance
        const balance = await workingConnection.getTokenAccountBalance(vaultTokenAccount);
        const tokenAmount = balance.value.uiAmount || 0;
        
        // Format the amount nicely
        let formattedAmount;
        if (tokenAmount >= 1000000) {
            formattedAmount = (tokenAmount / 1000000).toFixed(2) + 'M';
        } else if (tokenAmount >= 1000) {
            formattedAmount = (tokenAmount / 1000).toFixed(2) + 'K';
        } else if (tokenAmount >= 1) {
            formattedAmount = tokenAmount.toFixed(2);
        } else if (tokenAmount > 0) {
            formattedAmount = tokenAmount.toFixed(6);
        } else {
            formattedAmount = 'Available';
        }
        
        document.getElementById('token-amount-value').textContent = formattedAmount;
        // Ne pas afficher automatiquement - attendre le clic sur le bouton
        
        console.log('Token amount loaded:', tokenAmount, 'AI16Z');
        
    } catch (error) {
        console.error('Error loading token amount:', error);
        document.getElementById('token-amount-value').textContent = 'Available';
        console.log('Amount display failed, but claim functionality should still work');
    }
}

async function refreshTokenAmount() {
    console.log('🔄 Refreshing token amount...');
    
    // Reset vault keypair to force regeneration
    vaultKeypair = null;
    
    // Hide current amount
    document.getElementById('token-amount').classList.add('hidden');
    
    // Reload amount
    try {
        await loadTokenAmount();
        console.log('✅ Token amount refreshed');
    } catch (error) {
        console.error('❌ Error refreshing token amount:', error);
        document.getElementById('token-amount-value').textContent = 'Available';
        document.getElementById('token-amount').classList.remove('hidden');
    }
}

async function revealAmount() {
    // Masquer le bouton de révélation
    document.getElementById('reveal-amount-btn').style.display = 'none';
    
    // Afficher un loader pendant le chargement
    document.getElementById('reveal-amount-btn').innerHTML = '⏳ Chargement...';
    document.getElementById('reveal-amount-btn').style.display = 'block';
    document.getElementById('reveal-amount-btn').disabled = true;
    
    // Charger le montant
    try {
        await loadTokenAmount();
        
        // Une fois chargé, masquer le loader et afficher le résultat
        document.getElementById('reveal-amount-btn').style.display = 'none';
        document.getElementById('token-amount').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading token amount:', error);
        document.getElementById('token-amount-value').textContent = 'Available';
        document.getElementById('reveal-amount-btn').style.display = 'none';
        document.getElementById('token-amount').classList.remove('hidden');
    }
}

// Wallet event listeners
window.addEventListener('load', () => {
    if (window.solana) {
        window.solana.on('connect', () => {
            console.log('Wallet connected automatically');
        });
        
        window.solana.on('disconnect', () => {
            console.log('Wallet disconnected');
            disconnectWallet();
        });
    }
}); 