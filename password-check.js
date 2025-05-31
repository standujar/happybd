// Configuration - SEULE le hash du password est ici
const CONFIG = {
    // Hash SHA-256 du password "use_k3nny"
    // Tu peux générer un hash avec: echo -n "use_k3nny" | sha256sum
    passwordHash: "aa4bde2922e6c66d81f6b89379917273485cdd92290ad07d9e70e36477cdd112", // "use_k3nny"
    secureFolder: "secure/"
};

// Simple SHA-256 implementation (ou utilise crypto.subtle.digest)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Gestion de l'input password
document.addEventListener('DOMContentLoaded', function() {
    // Enter key pour le password
    document.getElementById('password-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });
    
    console.log('🔓 Password validator ready');
});

async function checkPassword() {
    const passwordInput = document.getElementById('password-input');
    const errorDiv = document.getElementById('password-error');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const button = document.getElementById('password-btn');
    
    const password = passwordInput.value.trim();
    
    if (!password) {
        showError('Veuillez entrer un mot de passe');
        return;
    }
    
    // Show loading
    button.disabled = true;
    btnText.textContent = 'Vérification...';
    btnLoader.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    
    try {
        // Hash du password entré
        const inputHash = await hashPassword(password);
        
        // Vérification
        if (inputHash === CONFIG.passwordHash) {
            console.log('✅ Password correct, loading secure content...');
            
            btnText.textContent = 'Chargement...';
            
            // Attendre un peu pour l'effet
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Charger le contenu sécurisé
            await loadSecureInterface();
            
        } else {
            console.log('❌ Wrong password');
            showError('Mot de passe incorrect');
        }
    } catch (error) {
        console.error('Password verification error:', error);
        showError('Erreur de vérification');
    }
    
    // Reset button
    button.disabled = false;
    btnText.textContent = '🔓 Entrer';
    btnLoader.classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('password-error');
    const passwordInput = document.getElementById('password-input');
    
    errorDiv.textContent = '❌ ' + message;
    errorDiv.classList.remove('hidden');
    passwordInput.value = '';
    passwordInput.focus();
}

async function loadSecureInterface() {
    try {
        // Afficher l'écran de chargement
        document.getElementById('password-screen').classList.add('hidden');
        document.getElementById('loading-screen').classList.remove('hidden');
        
        console.log('🔄 Loading secure interface...');
        
        // 1. Créer l'interface sécurisée
        await createSecureInterface();
        
        // 2. Charger les scripts sécurisés dynamiquement
        await loadSecureScripts();
        
        console.log('✅ Secure interface loaded successfully!');
        
    } catch (error) {
        console.error('❌ Failed to load secure interface:', error);
        
        // Retourner à l'écran password avec erreur
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('password-screen').classList.remove('hidden');
        showError('Erreur de chargement du contenu sécurisé');
    }
}

async function createSecureInterface() {
    // Masquer l'écran de chargement et remplacer par l'interface principale
    document.getElementById('loading-screen').classList.add('hidden');
    
    // Créer l'interface de claim Kenny
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="card">
            <div class="header">
                <h1 class="title">🎁 Kenny's Birthday Claim</h1>
                <p id="welcome-message" class="subtitle">Connecte ton wallet pour récupérer ton cadeau</p>
            </div>

            <!-- Main Claim Screen -->
            <div id="claim-screen" class="screen active">
                <div id="wallet-section">
                    <button id="connect-wallet" class="wallet-btn" onclick="connectWallet()">
                        Connecter ton Wallet
                    </button>
                    <div id="wallet-info" class="wallet-info hidden">
                        <div class="wallet-address">
                            <span>Connecté : </span>
                            <span id="wallet-address"></span>
                        </div>
                        <button id="disconnect-wallet" onclick="disconnectWallet()">Déconnecter</button>
                    </div>
                </div>

                <!-- Claim Button -->
                <div id="claim-section" class="hidden">
                    <div class="claim-info">
                        <div class="token-info">
                            <div class="token-details">
                                <h3>Quelques tokens</h3>
                                <p>Pour que tu commences à utiliser le Web3</p>
                                
                                <button id="reveal-amount-btn" class="reveal-btn" onclick="revealAmount()">
                                    🎁 Voir mon cadeau
                                </button>
                                
                                <div id="token-amount" class="token-amount hidden">
                                    <div class="token-label">Montant disponible</div>
                                    <div class="token-value">
                                        <span id="token-amount-value"></span>
                                        <span class="token-symbol">AI16Z</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="vault-info" class="vault-info hidden">
                            <div class="vault-address">
                                <strong>Adresse du Vault :</strong>
                                <span id="vault-address-display"></span>
                            </div>
                        </div>
                    </div>
                    <button id="claim-button" class="claim-btn" onclick="claimTokens()">
                        <span id="claim-text">🎁 Récupérer mon Cadeau</span>
                        <div id="claim-loader" class="loader hidden"></div>
                    </button>
                </div>

                <!-- Success/Error Messages -->
                <div id="success-message" class="success hidden">
                    <div class="success-banker">
                        <img src="img/banquier.png" alt="AI16Z Banker" class="banker-image">
                    </div>
                    <h3>🎉 Cadeau Récupéré !</h3>
                    <p>Tes tokens AI16Z ont été transférés avec succès dans ton wallet.</p>
                    <div class="tx-link">
                        <a id="tx-link" href="#" target="_blank">Voir la Transaction</a>
                    </div>
                </div>

                <div id="error-message" class="error hidden">
                    <h3>❌ Échec de la Récupération</h3>
                    <p id="error-text">Quelque chose s'est mal passé. Réessaie.</p>
                </div>
            </div>
        </div>

        <!-- Already Claimed Screen -->
        <div id="claimed-screen" class="screen">
            <div class="container">
                <div class="card">
                    <div class="header">
                        <h1>✅ Déjà Récupéré</h1>
                        <p>Ce cadeau a déjà été récupéré. Merci !</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadSecureScripts() {
    return new Promise((resolve, reject) => {
        let scriptsLoaded = 0;
        const totalScripts = 4; // solana, base58, spl-token, vault, script
        
        function onScriptLoad() {
            scriptsLoaded++;
            if (scriptsLoaded === totalScripts) {
                resolve();
            }
        }
        
        // 1. Charger Solana Web3
        const solanaScript = document.createElement('script');
        solanaScript.src = 'https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js';
        solanaScript.onload = onScriptLoad;
        solanaScript.onerror = () => reject(new Error('Failed to load Solana Web3.js'));
        document.head.appendChild(solanaScript);
        
        // 2. Charger Base58 (inline)
        const base58Script = document.createElement('script');
        base58Script.textContent = `
            const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
            window.bs58 = {
                decode: function(str) {
                    const bytes = [];
                    for (let i = 0; i < str.length; i++) {
                        const char = str[i];
                        const charIndex = BASE58_ALPHABET.indexOf(char);
                        if (charIndex === -1) {
                            throw new Error(\`Invalid character in base58: \${char}\`);
                        }
                        
                        let carry = charIndex;
                        for (let j = 0; j < bytes.length; j++) {
                            carry += bytes[j] * 58;
                            bytes[j] = carry & 0xff;
                            carry >>= 8;
                        }
                        
                        while (carry) {
                            bytes.push(carry & 0xff);
                            carry >>= 8;
                        }
                    }
                    
                    for (let i = 0; i < str.length && str[i] === '1'; i++) {
                        bytes.push(0);
                    }
                    
                    return new Uint8Array(bytes.reverse());
                }
            };
            console.log('✅ Base58 decoder loaded');
        `;
        document.head.appendChild(base58Script);
        onScriptLoad();
        
        // 3. SPL Token implementation (inline)
        const splTokenScript = document.createElement('script');
        splTokenScript.textContent = `
            setTimeout(() => {
                const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
                const ASSOCIATED_TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
                
                window.splToken = {
                    async getAssociatedTokenAddress(mint, owner, allowOwnerOffCurve = false) {
                        const [address] = await solanaWeb3.PublicKey.findProgramAddress(
                            [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
                            ASSOCIATED_TOKEN_PROGRAM_ID
                        );
                        return address;
                    },
                    
                    createTransferInstruction(source, destination, owner, amount, multiSigners = []) {
                        const keys = [
                            { pubkey: source, isSigner: false, isWritable: true },
                            { pubkey: destination, isSigner: false, isWritable: true },
                            { pubkey: owner, isSigner: true, isWritable: false },
                        ];
                        
                        multiSigners.forEach((signer) => {
                            keys.push({ pubkey: signer.publicKey, isSigner: true, isWritable: false });
                        });
                        
                        const data = new Uint8Array(9);
                        data[0] = 3;
                        
                        const amountBig = BigInt(amount);
                        for (let i = 0; i < 8; i++) {
                            data[1 + i] = Number((amountBig >> BigInt(8 * i)) & BigInt(0xff));
                        }
                        
                        return new solanaWeb3.TransactionInstruction({
                            keys, programId: TOKEN_PROGRAM_ID, data,
                        });
                    },
                    
                    createAssociatedTokenAccountInstruction(payer, associatedToken, owner, mint) {
                        const keys = [
                            { pubkey: payer, isSigner: true, isWritable: true },
                            { pubkey: associatedToken, isSigner: false, isWritable: true },
                            { pubkey: owner, isSigner: false, isWritable: false },
                            { pubkey: mint, isSigner: false, isWritable: false },
                            { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
                            { pubkey: solanaWeb3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
                        ];
                        
                        return new solanaWeb3.TransactionInstruction({
                            keys, programId: ASSOCIATED_TOKEN_PROGRAM_ID, data: new Uint8Array(0),
                        });
                    }
                };
                console.log('✅ Manual SPL Token implementation ready!');
            }, 100);
        `;
        document.head.appendChild(splTokenScript);
        onScriptLoad();
        
        // 4. Charger vault.js
        const vaultScript = document.createElement('script');
        vaultScript.src = CONFIG.secureFolder + 'vault.js';
        vaultScript.onload = onScriptLoad;
        vaultScript.onerror = () => reject(new Error('Failed to load vault.js'));
        document.head.appendChild(vaultScript);
        
        // 5. Charger script.js
        const mainScript = document.createElement('script');
        mainScript.src = CONFIG.secureFolder + 'script.js';
        mainScript.onload = onScriptLoad;
        mainScript.onerror = () => reject(new Error('Failed to load script.js'));
        document.head.appendChild(mainScript);
    });
} 