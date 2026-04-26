"""
Generate a whiteboard-style fallback image from text using Pillow.
Used when the free AI image API is slow or unreachable.
Produces a clean, educational-looking diagram with text and simple shapes.
"""
import sys
import os
import textwrap
import random
from PIL import Image, ImageDraw, ImageFont

def generate_fallback_image(text, output_path, width=512, height=512):
    """Create a whiteboard-style image with the given text and simple decorative elements."""
    img = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fall back to default
    font_large = None
    font_small = None
    try:
        # Try common Windows fonts
        for font_name in ['arial.ttf', 'calibri.ttf', 'segoeui.ttf', 'tahoma.ttf']:
            try:
                font_large = ImageFont.truetype(font_name, 28)
                font_small = ImageFont.truetype(font_name, 18)
                break
            except:
                continue
    except:
        pass
    
    if font_large is None:
        font_large = ImageFont.load_default()
        font_small = font_large

    # Draw a subtle border frame
    margin = 20
    draw.rectangle(
        [margin, margin, width - margin, height - margin],
        outline=(180, 180, 180), width=2
    )
    
    # Draw decorative corner elements
    corner_size = 15
    for cx, cy in [(margin, margin), (width-margin, margin), (margin, height-margin), (width-margin, height-margin)]:
        draw.ellipse([cx-corner_size//2, cy-corner_size//2, cx+corner_size//2, cy+corner_size//2], 
                     fill=(100, 100, 100))

    # Wrap and draw the main text in the center
    max_chars = 30
    wrapped = textwrap.wrap(text[:200], width=max_chars)
    
    # Calculate total text height
    line_height = 35
    total_text_height = len(wrapped) * line_height
    start_y = (height - total_text_height) // 2
    
    for i, line in enumerate(wrapped):
        bbox = draw.textbbox((0, 0), line, font=font_large)
        text_width = bbox[2] - bbox[0]
        x = (width - text_width) // 2
        y = start_y + i * line_height
        draw.text((x, y), line, fill=(30, 30, 30), font=font_large)
    
    # Draw some decorative sketch elements around the text
    # Simple arrows, lines, and shapes to make it look like a whiteboard
    random.seed(hash(text) % 2**32)
    
    # Draw a few random educational-looking elements
    elements = [
        # Lightbulb icon (circle + lines)
        lambda: [
            draw.ellipse([40, 40, 90, 90], outline=(80, 80, 80), width=2),
            draw.line([(65, 90), (65, 110)], fill=(80, 80, 80), width=2),
            draw.line([(55, 105), (75, 105)], fill=(80, 80, 80), width=2),
        ],
        # Arrow pointing right
        lambda: [
            draw.line([(width-120, height-60), (width-50, height-60)], fill=(80, 80, 80), width=2),
            draw.polygon([(width-50, height-70), (width-30, height-60), (width-50, height-50)], fill=(80, 80, 80)),
        ],
        # Star shape
        lambda: [
            draw.polygon([(width-80, 40), (width-70, 70), (width-40, 70), (width-65, 85), 
                          (width-55, 115), (width-80, 95), (width-105, 115), (width-95, 85), 
                          (width-120, 70), (width-90, 70)], outline=(80, 80, 80), width=2),
        ],
        # Underline the text area
        lambda: [
            draw.line([(80, start_y + total_text_height + 15), (width-80, start_y + total_text_height + 15)], 
                      fill=(150, 150, 150), width=1),
        ],
    ]
    
    for elem in elements:
        try:
            elem()
        except:
            pass

    img.save(output_path, 'PNG')
    print(f"Generated fallback image at {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate_fallback_image.py <text> <output_path>")
        sys.exit(1)
    
    text = sys.argv[1]
    output_path = sys.argv[2]
    generate_fallback_image(text, output_path)
