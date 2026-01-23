#!/usr/bin/env python3
"""
Convert D2D_logo.png to favicon formats (favicon.ico, favicon-16x16.png, favicon-32x32.png)
Requires: Pillow (PIL)
Install: pip install Pillow
"""

from PIL import Image
import os

# Path to the source logo
LOGO_PATH = "public/D2D_logo.png"
OUTPUT_DIR = "public"

def convert_to_favicon():
    """Convert PNG logo to various favicon formats."""
    
    if not os.path.exists(LOGO_PATH):
        print(f"Error: {LOGO_PATH} not found!")
        return False
    
    try:
        # Open the logo
        img = Image.open(LOGO_PATH)
        
        # Ensure PNG mode
        if img.mode == "RGBA":
            # Keep transparency
            pass
        else:
            img = img.convert("RGBA")
        
        # Create 16x16 favicon
        favicon_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
        favicon_16_path = os.path.join(OUTPUT_DIR, "favicon-16x16.png")
        favicon_16.save(favicon_16_path, "PNG")
        print(f"✓ Created: {favicon_16_path}")
        
        # Create 32x32 favicon
        favicon_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
        favicon_32_path = os.path.join(OUTPUT_DIR, "favicon-32x32.png")
        favicon_32.save(favicon_32_path, "PNG")
        print(f"✓ Created: {favicon_32_path}")
        
        # Create 64x64 favicon (for high-res displays)
        favicon_64 = img.resize((64, 64), Image.Resampling.LANCZOS)
        favicon_64_path = os.path.join(OUTPUT_DIR, "favicon-64x64.png")
        favicon_64.save(favicon_64_path, "PNG")
        print(f"✓ Created: {favicon_64_path}")
        
        # Create favicon.ico (using 32x32)
        favicon_ico_path = os.path.join(OUTPUT_DIR, "favicon.ico")
        favicon_32.save(favicon_ico_path, "ICO")
        print(f"✓ Created: {favicon_ico_path}")
        
        print("\n✓ All favicon formats created successfully!")
        print(f"\nFavicons are now available in: {OUTPUT_DIR}/")
        print("The Next.js app will automatically use these favicons.")
        return True
        
    except Exception as e:
        print(f"Error converting favicon: {e}")
        return False

if __name__ == "__main__":
    print("Converting D2D_logo.png to favicon formats...\n")
    success = convert_to_favicon()
    exit(0 if success else 1)
