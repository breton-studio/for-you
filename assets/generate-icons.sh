#!/bin/bash

# Generate placeholder icons for Chrome extension
# This script creates simple placeholder icons using ImageMagick or base64 encoded PNG

# Create a simple SVG icon
cat > /tmp/for-you-icon.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#34C759" rx="24"/>
  <text x="64" y="80" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">FY</text>
</svg>
EOF

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate icons..."
    convert -background none /tmp/for-you-icon.svg -resize 16x16 assets/icon-16.png
    convert -background none /tmp/for-you-icon.svg -resize 48x48 assets/icon-48.png
    convert -background none /tmp/for-you-icon.svg -resize 128x128 assets/icon-128.png
    echo "Icons generated successfully!"
elif command -v sips &> /dev/null; then
    echo "Using sips (macOS) to generate icons..."
    # Convert SVG to PNG using built-in macOS tools
    qlmanage -t -s 128 -o /tmp /tmp/for-you-icon.svg 2>/dev/null
    if [ -f /tmp/for-you-icon.svg.png ]; then
        sips -z 16 16 /tmp/for-you-icon.svg.png --out assets/icon-16.png
        sips -z 48 48 /tmp/for-you-icon.svg.png --out assets/icon-48.png
        sips -z 128 128 /tmp/for-you-icon.svg.png --out assets/icon-128.png
        echo "Icons generated successfully!"
    else
        echo "Warning: Could not generate PNG from SVG. Please create icons manually."
    fi
else
    echo "Warning: No image conversion tool found."
    echo "Please install ImageMagick or create icons manually."
    echo "Icon sizes needed: 16x16, 48x48, 128x128"
fi

# Clean up
rm -f /tmp/for-you-icon.svg /tmp/for-you-icon.svg.png
