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
            await loadSecureContent();
            
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

async function loadSecureContent() {
    try {
        // Afficher l'écran de chargement
        document.getElementById('password-screen').classList.add('hidden');
        document.getElementById('loading-screen').classList.remove('hidden');
        
        console.log('🔄 Loading secure content from:', CONFIG.secureFolder);
        
        // Charger l'interface sécurisée
        const response = await fetch(CONFIG.secureFolder + 'main.html');
        
        if (!response.ok) {
            throw new Error(`Failed to load secure content: ${response.status}`);
        }
        
        const secureHTML = await response.text();
        
        // Remplacer complètement le contenu de la page
        document.body.innerHTML = secureHTML;
        
        console.log('✅ Secure content loaded successfully!');
        
        // Le nouveau contenu a ses propres scripts qui vont se charger automatiquement
        
    } catch (error) {
        console.error('❌ Failed to load secure content:', error);
        
        // Retourner à l'écran password avec erreur
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('password-screen').classList.remove('hidden');
        showError('Erreur de chargement du contenu sécurisé');
    }
} 