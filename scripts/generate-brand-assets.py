import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_brand_assets():
    src_path = r"C:\Users\ASUS\.gemini\antigravity\brain\e960e937-4d57-4e9f-899a-bfaeff3f7087\.user_uploaded\media_1795260472782_5b2da86c.png"
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Source image not found at {src_path}")

    src_img = Image.open(src_path).convert("RGBA")
    bbox = src_img.getbbox()
    crop = src_img.crop(bbox) # (990, 930)

    # 1. Create a high-res master square transparent image (1024x1024)
    # We want the content to occupy ~90% of the canvas (e.g. 920px max dimension)
    # to maintain breathing room and preserve drop shadows.
    master_size = 1024
    content_target_size = 920
    scale = content_target_size / max(crop.size)
    scaled_w = int(round(crop.width * scale))
    scaled_h = int(round(crop.height * scale))
    scaled_content = crop.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)

    master_transparent = Image.new("RGBA", (master_size, master_size), (0, 0, 0, 0))
    paste_x = (master_size - scaled_w) // 2
    paste_y = (master_size - scaled_h) // 2
    master_transparent.paste(scaled_content, (paste_x, paste_y), scaled_content)

    print("Master 1024x1024 transparent created. Bbox:", master_transparent.getbbox())

    # Ensure output directories exist
    os.makedirs("public/brand", exist_ok=True)
    os.makedirs("app", exist_ok=True)

    # 2. Generate transparent logo-mark.png (512x512)
    logo_mark_512 = master_transparent.resize((512, 512), Image.Resampling.LANCZOS)
    logo_mark_512.save("public/brand/logo-mark.png", "PNG", optimize=True)
    print("Saved public/brand/logo-mark.png (512x512, transparent)")

    # 3. Generate Next.js app/icon.png (512x512, transparent)
    logo_mark_512.save("app/icon.png", "PNG", optimize=True)
    print("Saved app/icon.png (512x512, transparent)")

    # 4. Generate transparent favicons
    favicon_32 = master_transparent.resize((32, 32), Image.Resampling.LANCZOS)
    favicon_32.save("public/brand/favicon-32.png", "PNG", optimize=True)
    print("Saved public/brand/favicon-32.png (32x32, transparent)")

    favicon_16 = master_transparent.resize((16, 16), Image.Resampling.LANCZOS)
    favicon_16.save("public/brand/favicon-16.png", "PNG", optimize=True)
    print("Saved public/brand/favicon-16.png (16x16, transparent)")

    # 5. Generate app/favicon.ico and public/favicon.ico (multi-resolution 16, 32, 48)
    favicon_48 = master_transparent.resize((48, 48), Image.Resampling.LANCZOS)
    favicon_48.save("app/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    favicon_48.save("public/favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Saved app/favicon.ico and public/favicon.ico (16, 32, 48 ICO)")

    # 6. Helper for Maskable / Solid Icons (app-icon-512, app-icon-192, apple-icon, app-icon-64)
    # Maskable icons require a solid background (safe zone: inner 80%).
    # We will use the brand background (#09090b) with subtle obsidian depth.
    def create_solid_app_icon(size, content_ratio=0.76):
        bg = Image.new("RGBA", (size, size), (9, 9, 11, 255)) # #09090b
        
        # Subtle radial glow behind the cards in the brand color (indigo/purple #6366f1)
        glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw_glow = ImageDraw.Draw(glow)
        glow_radius = int(size * 0.4)
        center = size // 2
        for r in range(glow_radius, 0, -2):
            alpha = int(28 * (1.0 - (r / glow_radius) ** 1.5))
            draw_glow.ellipse(
                (center - r, center - r, center + r, center + r),
                fill=(99, 102, 241, alpha)
            )
        glow = glow.filter(ImageFilter.GaussianBlur(radius=max(1, size // 20)))
        bg = Image.alpha_composite(bg, glow)

        # Place scaled logo inside safe zone
        icon_dim = int(round(size * content_ratio))
        scale = icon_dim / max(crop.size)
        w = int(round(crop.width * scale))
        h = int(round(crop.height * scale))
        c_resized = crop.resize((w, h), Image.Resampling.LANCZOS)
        
        px = (size - w) // 2
        py = (size - h) // 2
        bg.paste(c_resized, (px, py), c_resized)
        return bg

    # 7. Generate maskable PWA icons
    app_icon_512 = create_solid_app_icon(512, content_ratio=0.78)
    app_icon_512.save("public/brand/app-icon-512.png", "PNG", optimize=True)
    print("Saved public/brand/app-icon-512.png (512x512, maskable)")

    app_icon_192 = create_solid_app_icon(192, content_ratio=0.78)
    app_icon_192.save("public/brand/app-icon-192.png", "PNG", optimize=True)
    print("Saved public/brand/app-icon-192.png (192x192, maskable)")

    app_icon_64 = create_solid_app_icon(64, content_ratio=0.80)
    app_icon_64.save("public/brand/app-icon-64.png", "PNG", optimize=True)
    print("Saved public/brand/app-icon-64.png (64x64, maskable)")

    # 8. Generate iOS apple-icon.png (180x180, solid background required by iOS)
    apple_icon_180 = create_solid_app_icon(180, content_ratio=0.78)
    apple_icon_180.save("app/apple-icon.png", "PNG", optimize=True)
    print("Saved app/apple-icon.png (180x180, iOS)")

    # 9. Generate OpenGraph Social Card (1200x630)
    # Modern dark minimal aesthetic with Geist fonts
    og_w, og_h = 1200, 630
    og = Image.new("RGBA", (og_w, og_h), (9, 9, 11, 255)) # #09090b

    # Add subtle background grid texture
    grid_img = Image.new("RGBA", (og_w, og_h), (0, 0, 0, 0))
    grid_draw = ImageDraw.Draw(grid_img)
    grid_step = 40
    for x in range(0, og_w, grid_step):
        grid_draw.line([(x, 0), (x, og_h)], fill=(255, 255, 255, 6), width=1)
    for y in range(0, og_h, grid_step):
        grid_draw.line([(y, 0), (og_w, y)], fill=(255, 255, 255, 6), width=1)
    og = Image.alpha_composite(og, grid_img)

    # Ambient radial glow behind the logo
    glow_og = Image.new("RGBA", (og_w, og_h), (0, 0, 0, 0))
    draw_og_glow = ImageDraw.Draw(glow_og)
    glow_center_x = 340
    glow_center_y = 315
    for r in range(280, 0, -4):
        alpha = int(45 * (1.0 - (r / 280) ** 1.5))
        draw_og_glow.ellipse(
            (glow_center_x - r, glow_center_y - r, glow_center_x + r, glow_center_y + r),
            fill=(99, 102, 241, alpha)
        )
    glow_og = glow_og.filter(ImageFilter.GaussianBlur(radius=25))
    og = Image.alpha_composite(og, glow_og)

    # Place the Logo on the left side
    logo_display_size = 380
    scale = logo_display_size / max(crop.size)
    lw = int(round(crop.width * scale))
    lh = int(round(crop.height * scale))
    logo_og = crop.resize((lw, lh), Image.Resampling.LANCZOS)
    logo_x = glow_center_x - (lw // 2)
    logo_y = glow_center_y - (lh // 2)
    og.paste(logo_og, (logo_x, logo_y), logo_og)

    # Render Typography on the right side
    draw_text = ImageDraw.Draw(og)

    # Load Geist fonts from system
    font_bold_path = r"C:\Windows\Fonts\Geist-Bold.ttf"
    font_medium_path = r"C:\Windows\Fonts\Geist-Medium.ttf"
    font_regular_path = r"C:\Windows\Fonts\Geist-Regular.ttf"
    font_mono_path = r"C:\Windows\Fonts\GeistMono-Medium.ttf"

    font_eyebrow = ImageFont.truetype(font_mono_path, 16) if os.path.exists(font_mono_path) else ImageFont.load_default()
    font_title = ImageFont.truetype(font_bold_path, 54) if os.path.exists(font_bold_path) else ImageFont.load_default()
    font_desc = ImageFont.truetype(font_regular_path, 22) if os.path.exists(font_regular_path) else ImageFont.load_default()
    font_meta = ImageFont.truetype(font_medium_path, 17) if os.path.exists(font_medium_path) else ImageFont.load_default()

    text_x = 570
    start_y = 175

    # Eyebrow badge
    eyebrow_text = "21ST WORKSPACE  /  GEIST DESIGN SYSTEM"
    eyebrow_bbox = font_eyebrow.getbbox(eyebrow_text)
    ew = eyebrow_bbox[2] - eyebrow_bbox[0]
    eh = eyebrow_bbox[3] - eyebrow_bbox[1]
    
    # Draw pill badge behind eyebrow
    badge_pad_x, badge_pad_y = 12, 6
    draw_text.rounded_rectangle(
        [text_x, start_y, text_x + ew + (badge_pad_x * 2), start_y + eh + (badge_pad_y * 2) + 2],
        radius=4,
        fill=(24, 24, 27, 255),
        outline=(63, 63, 70, 255),
        width=1
    )
    draw_text.text((text_x + badge_pad_x, start_y + badge_pad_y), eyebrow_text, fill=(161, 161, 170, 255), font=font_eyebrow)

    # Main Title
    title_y = start_y + eh + (badge_pad_y * 2) + 24
    draw_text.text((text_x, title_y), "Component Studio", fill=(255, 255, 255, 255), font=font_title)

    # Subtitle / Description
    desc_y = title_y + 70
    draw_text.text((text_x, desc_y), "Interactive React & Tailwind Component Sandbox", fill=(212, 212, 216, 255), font=font_desc)
    draw_text.text((text_x, desc_y + 34), "Real-time AST Analysis • 60fps Interaction Capture", fill=(161, 161, 170, 255), font=font_desc)

    # Divider line
    div_y = desc_y + 90
    draw_text.line([(text_x, div_y), (og_w - 90, div_y)], fill=(39, 39, 42, 255), width=1)

    # Footer meta / tags
    footer_y = div_y + 24
    chips = ["Next.js 15", "Tailwind CSS v4", "Babel AST Engine", "21st.dev Registry"]
    chip_x = text_x
    for chip in chips:
        c_bbox = font_meta.getbbox(chip)
        cw = c_bbox[2] - c_bbox[0]
        ch = c_bbox[3] - c_bbox[1]
        draw_text.rounded_rectangle(
            [chip_x, footer_y, chip_x + cw + 18, footer_y + ch + 12],
            radius=4,
            fill=(18, 18, 20, 255),
            outline=(39, 39, 42, 255),
            width=1
        )
        draw_text.text((chip_x + 9, footer_y + 5), chip, fill=(161, 161, 170, 255), font=font_meta)
        chip_x += cw + 28

    # Border around the entire OG card
    draw_text.rectangle([(0, 0), (og_w - 1, og_h - 1)], outline=(39, 39, 42, 255), width=1)

    og.save("public/brand/og-card.png", "PNG", optimize=True)
    print("Saved public/brand/og-card.png (1200x630)")

if __name__ == "__main__":
    create_brand_assets()
