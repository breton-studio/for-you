#!/bin/bash

# Generate black circle icons for Chrome extension
# Circle diameter is 2/3 of the canvas size

# Create a simple SVG with black circle (2/3 size)
cat > /tmp/for-you-black-circle.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="42.67" fill="#000000"/>
</svg>
EOF

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate icons..."
    convert -background none /tmp/for-you-black-circle.svg -resize 16x16 icon-16.png
    convert -background none /tmp/for-you-black-circle.svg -resize 48x48 icon-48.png
    convert -background none /tmp/for-you-black-circle.svg -resize 128x128 icon-128.png
    echo "✓ Icons generated successfully!"
    echo "  - icon-16.png (16x16, circle diameter: ~11px)"
    echo "  - icon-48.png (48x48, circle diameter: ~32px)"
    echo "  - icon-128.png (128x128, circle diameter: ~85px)"
elif command -v sips &> /dev/null; then
    echo "Using sips (macOS) to generate icons..."
    # Convert SVG to PNG using built-in macOS tools
    qlmanage -t -s 128 -o /tmp /tmp/for-you-black-circle.svg 2>/dev/null
    if [ -f /tmp/for-you-black-circle.svg.png ]; then
        sips -z 16 16 /tmp/for-you-black-circle.svg.png --out icon-16.png
        sips -z 48 48 /tmp/for-you-black-circle.svg.png --out icon-48.png
        sips -z 128 128 /tmp/for-you-black-circle.svg.png --out icon-128.png
        echo "✓ Icons generated successfully!"
        echo "  - icon-16.png (16x16, circle diameter: ~11px)"
        echo "  - icon-48.png (48x48, circle diameter: ~32px)"
        echo "  - icon-128.png (128x128, circle diameter: ~85px)"
    else
        echo "Warning: Could not generate PNG from SVG. Trying rsvg-convert..."
        if command -v rsvg-convert &> /dev/null; then
            rsvg-convert -w 16 -h 16 /tmp/for-you-black-circle.svg -o icon-16.png
            rsvg-convert -w 48 -h 48 /tmp/for-you-black-circle.svg -o icon-48.png
            rsvg-convert -w 128 -h 128 /tmp/for-you-black-circle.svg -o icon-128.png
            echo "✓ Icons generated successfully with rsvg-convert!"
        else
            echo "Error: Could not find suitable tool to convert SVG."
            echo "Please install ImageMagick, librsvg, or create icons manually."
        fi
    fi
else
    echo "Warning: No image conversion tool found."
    echo "Please install ImageMagick or create icons manually."
    echo "Icon sizes needed: 16x16, 48x48, 128x128"
fi

# Clean up
rm -f /tmp/for-you-black-circle.svg /tmp/for-you-black-circle.svg.png
