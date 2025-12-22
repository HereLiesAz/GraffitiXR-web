from PIL import Image, ImageDraw

def create_icon(filename, size, color):
    img = Image.new('RGB', (size, size), color=color)
    d = ImageDraw.Draw(img)
    d.text((10, 10), "GXR", fill=(255, 255, 255))
    img.save(f"public/{filename}")

try:
    create_icon("pwa-192x192.png", 192, (0, 0, 255))
    create_icon("pwa-512x512.png", 512, (255, 0, 0))
    create_icon("apple-touch-icon.png", 180, (128, 0, 128))

    # Favicon is usually 32x32 or 16x16
    img = Image.new('RGB', (32, 32), color=(0, 255, 0))
    img.save("public/favicon.ico", format='ICO')
    print("Icons generated successfully.")
except Exception as e:
    print(f"Error generating icons: {e}")
