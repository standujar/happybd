// ⚠️ IMPORTANT: Configuration du vault pour la distribution de tokens AI16Z
// Cette clé privée doit rester confidentielle !

// Configuration du vault avec support des variables d'environnement
class VaultConfig {
    static getKeypair() {
        // 1. Essayer la variable d'environnement (production)
        let wifKey = null;
        
        // Variables d'environnement Netlify/Vercel
        if (typeof process !== 'undefined' && process.env && process.env.VAULT_WIF_KEY) {
            wifKey = process.env.VAULT_WIF_KEY;
            console.log('✅ Using environment variable for vault key');
        }
        // Variables d'environnement côté client (Netlify)
        else if (typeof window !== 'undefined' && window.ENV && window.ENV.VAULT_WIF_KEY) {
            wifKey = window.ENV.VAULT_WIF_KEY;
            console.log('✅ Using client environment variable for vault key');
        }
        // 2. Fallback vers clé injectée par GitHub Actions
        else {
            // Cette clé sera remplacée par GitHub Actions avec le secret
            wifKey = "__VAULT_WIF_KEY_PLACEHOLDER__";
            console.log('✅ Using injected vault key');
        }
        
        if (!wifKey || wifKey === "YOUR_WIF_KEY_HERE") {
            throw new Error('❌ Vault WIF key not configured. Please set VAULT_WIF_KEY environment variable.');
        }
        
        try {
            // Décoder la clé WIF en utilisant notre implémentation Base58
            const secretKey = base58Decode(wifKey);
            const keypair = solanaWeb3.Keypair.fromSecretKey(secretKey);
            
            console.log('🔑 Vault keypair loaded successfully');
            console.log('📍 Vault address:', keypair.publicKey.toString());
            
            return keypair;
        } catch (error) {
            console.error('❌ Failed to load vault keypair:', error);
            throw new Error('Invalid vault WIF key format');
        }
    }
}

// Rendre disponible globalement
window.VaultConfig = VaultConfig; 