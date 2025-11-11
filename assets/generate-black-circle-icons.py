#!/usr/bin/env python3
"""
Generate black circle icons for Chrome extension
Circle diameter is 2/3 of the canvas size
"""

from PIL import Image, ImageDraw

def create_black_circle_icon(size, output_path):
    """Create a black circle icon with 2/3 diameter"""
    # Create transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Calculate circle diameter (2/3 of canvas size)
    diameter = int(size * 2 / 3)

    # Calculate position to center the circle
    offset = (size - diameter) // 2

    # Draw black circle
    draw.ellipse(
        [offset, offset, offset + diameter, offset + diameter],
        fill=(0, 0, 0, 255)  # Solid black
    )

    # Save with anti-aliasing
    img.save(output_path, 'PNG')
    print(f'Created {output_path} ({size}x{size}, circle diameter: {diameter}px)')

if __name__ == '__main__':
    # Generate icons for Chrome extension
    sizes = [
        (16, 'icon-16.png'),
        (48, 'icon-48.png'),
        (128, 'icon-128.png')
    ]

    for size, filename in sizes:
        create_black_circle_icon(size, filename)

    print('✓ All icons generated successfully')
