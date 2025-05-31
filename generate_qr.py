#!/usr/bin/env python3
"""
Script pour générer un QR code pour le site de claim AI16Z
"""

import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

def create_qr_code():
    # URL du site de claim
    url = "https://standujar.github.io/happybd/"
    
    # Charger l'image Kenny
    try:
        kenny_img = Image.open("img/head.png")
        print("✅ Image Kenny chargée")
    except Exception as e:
        print(f"❌ Erreur lors du chargement de img/head.png: {e}")
        return create_simple_qr()
    
    # Télécharger le logo Phantom si pas présent
    phantom_logo_path = "phantom_logo.png"
    if not os.path.exists(phantom_logo_path):
        print("📥 Téléchargement du logo Phantom...")
        try:
            import requests
            # Logo Phantom (version PNG simple)
            phantom_url = "https://phantom.app/img/phantom-logo.png"
            response = requests.get(phantom_url)
            if response.status_code == 200:
                with open(phantom_logo_path, 'wb') as f:
                    f.write(response.content)
                print("✅ Logo Phantom téléchargé")
            else:
                # Créer un logo simple si le téléchargement échoue
                create_phantom_logo_fallback(phantom_logo_path)
        except Exception as e:
            print(f"⚠️ Erreur téléchargement Phantom: {e}")
            create_phantom_logo_fallback(phantom_logo_path)
    
    # Charger le logo Phantom
    try:
        phantom_img = Image.open(phantom_logo_path)
        print("✅ Logo Phantom chargé")
    except Exception as e:
        print(f"⚠️ Erreur logo Phantom: {e}")
        phantom_img = None
    
    # Redimensionner Kenny à une taille appropriée pour le QR code
    kenny_size = 400  # Taille finale
    kenny_img = kenny_img.resize((kenny_size, kenny_size), Image.Resampling.LANCZOS)
    
    # Configuration du QR code avec correction d'erreur élevée (nécessaire avec image de fond)
    qr = qrcode.QRCode(
        version=3,  # Plus grande version pour meilleure lisibilité
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # Correction d'erreur maximale
        box_size=8,
        border=4,
    )
    
    # Ajouter les données
    qr.add_data(url)
    qr.make(fit=True)
    
    # Créer l'image QR code avec transparence
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Redimensionner le QR code pour s'adapter à Kenny
    qr_size = int(kenny_size * 0.7)  # QR code = 70% de la taille de Kenny
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    
    # Créer une image finale avec Kenny en arrière-plan (plus d'espace pour le texte Phantom)
    final_size = kenny_size + 100  # Espace pour le texte
    final_img = Image.new('RGBA', (final_size, final_size + 120), (255, 255, 255, 255))
    
    # Centrer Kenny
    kenny_x = (final_size - kenny_size) // 2
    kenny_y = 20
    
    # Coller Kenny sur l'image finale
    if kenny_img.mode != 'RGBA':
        kenny_img = kenny_img.convert('RGBA')
    final_img.paste(kenny_img, (kenny_x, kenny_y), kenny_img)
    
    # Créer un masque blanc semi-transparent pour le QR code
    qr_overlay = Image.new('RGBA', (qr_size, qr_size), (255, 255, 255, 200))
    
    # Centrer le QR code sur Kenny
    qr_x = (final_size - qr_size) // 2
    qr_y = kenny_y + (kenny_size - qr_size) // 2
    
    # Appliquer le fond semi-transparent
    final_img.paste(qr_overlay, (qr_x, qr_y), qr_overlay)
    
    # Convertir QR code en RGBA et l'appliquer
    qr_img = qr_img.convert('RGBA')
    # Rendre le blanc du QR code transparent
    qr_data = qr_img.getdata()
    new_qr_data = []
    for item in qr_data:
        if item[:3] == (255, 255, 255):  # Si c'est blanc
            new_qr_data.append((255, 255, 255, 0))  # Rendre transparent
        else:
            new_qr_data.append(item)
    qr_img.putdata(new_qr_data)
    
    # Coller le QR code
    final_img.paste(qr_img, (qr_x, qr_y), qr_img)
    
    # Ajouter du texte en bas
    draw = ImageDraw.Draw(final_img)
    
    try:
        # Essayer d'utiliser une police système
        font_title = ImageFont.truetype("Arial.ttf", 28)
        font_subtitle = ImageFont.truetype("Arial.ttf", 18)
    except:
        # Fallback vers la police par défaut
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
    
    # Ajouter le logo Phantom dans le coin
    if phantom_img:
        phantom_size = 60
        phantom_img_resized = phantom_img.resize((phantom_size, phantom_size), Image.Resampling.LANCZOS)
        if phantom_img_resized.mode != 'RGBA':
            phantom_img_resized = phantom_img_resized.convert('RGBA')
        
        # Position en haut à droite
        phantom_x = final_size - phantom_size - 10
        phantom_y = 10
        final_img.paste(phantom_img_resized, (phantom_x, phantom_y), phantom_img_resized)
    
    # Texte principal
    title_text = "🎁 Kenny's AI16Z Claim"
    subtitle_text = "Scanne pour ton cadeau !"
    phantom_text = "📱 Phantom Wallet requis"
    download_text = "phantom.com/download"
    
    # Position du texte (en bas de l'image)
    text_y = kenny_y + kenny_size + 15
    
    # Calculer les positions du texte (centré)
    title_bbox = draw.textbbox((0, 0), title_text, font=font_title)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (final_size - title_width) // 2
    
    subtitle_bbox = draw.textbbox((0, 0), subtitle_text, font=font_subtitle)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (final_size - subtitle_width) // 2
    
    phantom_bbox = draw.textbbox((0, 0), phantom_text, font=font_subtitle)
    phantom_width = phantom_bbox[2] - phantom_bbox[0]
    phantom_x = (final_size - phantom_width) // 2
    
    download_bbox = draw.textbbox((0, 0), download_text, font=font_subtitle)
    download_width = download_bbox[2] - download_bbox[0]
    download_x = (final_size - download_width) // 2
    
    # Dessiner le texte avec ombre pour meilleure lisibilité
    # Ombres
    draw.text((title_x + 2, text_y + 2), title_text, fill="#666666", font=font_title)
    draw.text((subtitle_x + 2, text_y + 35 + 2), subtitle_text, fill="#666666", font=font_subtitle)
    draw.text((phantom_x + 1, text_y + 65 + 1), phantom_text, fill="#666666", font=font_subtitle)
    draw.text((download_x + 1, text_y + 90 + 1), download_text, fill="#666666", font=font_subtitle)
    
    # Texte principal
    draw.text((title_x, text_y), title_text, fill="#f97316", font=font_title)  # Orange Kenny
    draw.text((subtitle_x, text_y + 35), subtitle_text, fill="#ea580c", font=font_subtitle)  # Orange foncé
    draw.text((phantom_x, text_y + 65), phantom_text, fill="#9333ea", font=font_subtitle)  # Violet Phantom
    draw.text((download_x, text_y + 90), download_text, fill="#7c3aed", font=font_subtitle)  # Violet lien
    
    # Convertir en RGB pour la sauvegarde
    final_img = final_img.convert('RGB')
    
    # Sauvegarder
    output_file = "kenny_ai16z_qr.png"
    final_img.save(output_file, quality=95)
    
    print(f"✅ QR code Kenny créé avec succès : {output_file}")
    print(f"🤖 Kenny + QR code combo parfait !")
    print(f"🔗 URL encodée : {url}")
    print(f"📱 Scannez Kenny pour récupérer tes tokens AI16Z !")
    
    return output_file

def create_simple_qr():
    """Version simple sans texte"""
    url = "https://standujar.github.io/happybd/"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    output_file = "ai16z_claim_qr_simple.png"
    img.save(output_file)
    
    print(f"✅ QR code simple créé : {output_file}")
    return output_file

if __name__ == "__main__":
    print("🔄 Génération du QR code pour le site AI16Z claim...")
    
    try:
        # Essayer la version avec texte
        create_qr_code()
    except Exception as e:
        print(f"⚠️ Erreur avec la version complète : {e}")
        print("🔄 Création de la version simple...")
        create_simple_qr()
    
    print("✨ Terminé !") 