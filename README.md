# 🎁 AI16Z Token Claim Site

Un site élégant et sécurisé pour offrir des tokens AI16Z à quelqu'un de spécial.

## ✨ Fonctionnalités

- 🔐 **Protection par mot de passe** - Empêche les accès non autorisés
- 💼 **Connexion wallet** - Compatible avec Phantom, Solflare, Backpack, etc.
- 🪙 **Transfert automatique** - Transfert direct depuis un wallet vault vers le wallet connecté
- 🔒 **Usage unique** - Empêche les réclamations multiples
- 📱 **Design responsive** - Fonctionne parfaitement sur mobile et desktop
- ⚡ **Interface moderne** - Design glassmorphism avec animations fluides

## 🚀 Déploiement rapide

### Option 1: Netlify Drop (10 secondes)
1. Va sur https://app.netlify.com/drop
2. Fais glisser ce dossier entier dedans
3. Ton site sera en ligne immédiatement !

### Option 2: Vercel
1. Connecte-toi sur https://vercel.com
2. Clique "New Project" → Import depuis GitHub
3. Déploiement automatique !

### Option 3: GitHub Pages
1. Crée un nouveau repo GitHub
2. Upload ces fichiers
3. Va dans Settings → Pages → Choisis la branche main
4. Ton site sera disponible à `https://ton-username.github.io/repo-name`

## 🔧 Configuration

### 1. Mot de passe et message
Édite le fichier `script.js` ligne 2-7 :

```javascript
const CONFIG = {
    password: "ai16z-birthday", // ⬅️ Change ce mot de passe
    tokenMintAddress: "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
    welcomeMessage: "Joyeux anniversaire ! Clique pour recevoir ton cadeau AI16Z.", // ⬅️ Personnalise ce message
    rpcUrl: "https://api.mainnet-beta.solana.com",
    clusterUrl: "https://explorer.solana.com"
};
```

### 2. Phrase secrète du vault
Édite le fichier `vault.js` et ajoute ta phrase secrète Phantom :

```javascript
window.vaultSeedPhrase = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12";
```

#### Comment obtenir ta phrase secrète depuis Phantom :

1. **Ouvre Phantom wallet**
2. **Clique sur ⚙️ Settings** 
3. **Va dans "Security & Privacy"**
4. **Clique "Export Secret Recovery Phrase"**
5. **Entre ton mot de passe**
6. **Copie les 12-24 mots** et colle-les dans `vault.js`

### 3. Mint address du token (optionnel)
Si tu utilises un autre token que AI16Z, change le `tokenMintAddress` dans `script.js`.

## 📁 Structure des fichiers

```
├── index.html      # Page principale
├── styles.css      # Styles modernes
├── script.js       # Logique principale (à configurer)
├── vault.js        # Clé privée du vault (à configurer)
├── img/            # Images du site
│   ├── head.png    # Logo principal AI16Z
│   └── banquier.png # Image du banquier
└── README.md       # Ce fichier
```

## 🔒 Sécurité

⚠️ **IMPORTANT** :
- Ne jamais partager ta clé privée
- Ne jamais commit `vault.js` dans un repo public
- Garde une sauvegarde sécurisée de ta clé privée
- Teste d'abord avec un petit montant

## 🎯 Comment ça marche

1. **Ton ami reçoit le lien** → `https://ton-site.com`
2. **Il entre le mot de passe** → Accès à la page de claim
3. **Il connecte son wallet** → Phantom/Solflare/etc.
4. **Il clique "Réclamer"** → Les tokens sont transférés automatiquement
5. **Success !** → Il voit la confirmation de transaction

## 🐛 Résolution de problèmes

### "Vault private key not configured"
- Tu dois remplacer les zéros dans `vault.js` par ta vraie clé privée

### "No tokens available in vault"
- Assure-toi que le wallet vault contient des tokens AI16Z

### "Please install a Solana wallet"
- L'utilisateur doit installer Phantom, Solflare ou un autre wallet Solana

### "Failed to connect wallet"
- Vérifier que le wallet est déverrouillé
- Essayer de rafraîchir la page

## 🎨 Personnalisation

Tu peux facilement personnaliser :
- **Couleurs** → Édite `styles.css`
- **Messages** → Édite les textes dans `index.html`
- **Images** → Remplace `head.png` et `banquier.png` dans le dossier `img/`
- **Logo/icônes** → Ajoute tes propres images dans le dossier `img/`

## 🚀 Bon cadeau !

Ton site de claim AI16Z est prêt ! Il ne reste plus qu'à :
1. Configurer le mot de passe et la clé privée
2. Déployer sur Netlify/Vercel/GitHub Pages
3. Envoyer le lien à ton ami

**Exemple final :** `https://ton-site.com` → Il entre le mot de passe → Connecte son wallet → Reçoit ses tokens ! 🎉 