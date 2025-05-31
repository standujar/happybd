#!/usr/bin/env python3
"""
Script pour générer un QR code simple avec Kenny au centre
"""

import qrcode
from PIL import Image, ImageDraw
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
    
    # Configuration du QR code avec correction d'erreur élevée (nécessaire avec logo central)
    qr = qrcode.QRCode(
        version=6,  # Version assez grande pour avoir de la place pour Kenny
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # Correction d'erreur maximale
        box_size=10,
        border=4,
    )
    
    # Ajouter les données
    qr.add_data(url)
    qr.make(fit=True)
    
    # Créer l'image QR code de base
    qr_img = qr.make_image(fill_color="black", back_color="transparent")
    qr_img = qr_img.convert('RGBA')
    
    # Taille du QR code
    qr_size = qr_img.size[0]
    
    # Redimensionner Kenny pour qu'il couvre tout le QR code en arrière-plan
    kenny_bg = kenny_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    if kenny_bg.mode != 'RGBA':
        kenny_bg = kenny_bg.convert('RGBA')
    
    # Créer une image de base avec Kenny en fond
    base_img = Image.new('RGBA', (qr_size, qr_size), (255, 255, 255, 255))
    
    # Appliquer Kenny en arrière-plan avec transparence
    kenny_alpha = Image.new('RGBA', (qr_size, qr_size), (0, 0, 0, 0))
    kenny_alpha.paste(kenny_bg, (0, 0))
    
    # Réduire l'opacité de Kenny pour qu'il ne gêne pas la lecture
    kenny_data = list(kenny_alpha.getdata())
    kenny_faded = []
    for pixel in kenny_data:
        # Réduire l'alpha à 70% pour que Kenny soit bien visible
        new_pixel = (pixel[0], pixel[1], pixel[2], int(pixel[3] * 0.7))
        kenny_faded.append(new_pixel)
    kenny_alpha.putdata(kenny_faded)
    
    # Coller Kenny en fond
    base_img = Image.alpha_composite(base_img, kenny_alpha)
    
    # Définir la couleur orange Kenny en RGB
    ea580c_rgb = (234, 88, 12)  # #ea580c en RGB
    
    # Maintenant traiter le QR code pour un bon contraste
    qr_data = list(qr_img.getdata())
    new_qr_data = []
    
    for pixel in qr_data:
        if pixel[3] > 0:  # Pixel noir du QR code
            # Utiliser orange Kenny foncé pour le contraste
            new_qr_data.append((ea580c_rgb[0], ea580c_rgb[1], ea580c_rgb[2], 255))
        else:  # Pixel transparent (blanc du QR)
            # Laisser transparent pour voir Kenny en fond
            new_qr_data.append((0, 0, 0, 0))
    
    qr_img.putdata(new_qr_data)
    
    # Fusionner le QR code avec le fond Kenny
    final_img = Image.alpha_composite(base_img, qr_img)
    
    # Convertir en RGB pour la sauvegarde
    final_img = final_img.convert('RGB')
    
    # Sauvegarder
    output_file = "kenny_ai16z_qr.png"
    final_img.save(output_file, quality=95)
    
    print(f"✅ QR code Kenny créé avec succès : {output_file}")
    print(f"🔗 URL encodée : {url}")
    
    return output_file

def create_simple_qr():
    """Version simple sans Kenny"""
    url = "https://standujar.github.io/happybd/"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="#ea580c", back_color="white")
    output_file = "ai16z_claim_qr_simple.png"
    img.save(output_file)
    
    print(f"✅ QR code simple créé : {output_file}")
    return output_file

if __name__ == "__main__":
    print("🔄 Génération du QR code Kenny...")
    
    try:
        # Créer le QR code avec Kenny
        create_qr_code()
    except Exception as e:
        print(f"⚠️ Erreur : {e}")
        print("🔄 Création de la version simple...")
        create_simple_qr()
    
    print("✨ Terminé !") 