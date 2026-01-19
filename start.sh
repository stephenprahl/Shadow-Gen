#!/bin/bash

# Activate the virtual environment
source .venv/bin/activate

# Run the shadow generator with the images from public folder
python shadow_generator.py "ts-shadow/public/B_Lamborghini Red.JPG" "ts-shadow/public/B_Child Room.jpeg" --depth "ts-shadow/public/25_1107O_11974 PB + 1 - Photo Calendar B_Lamborghini HAS.JPG"

echo "Shadow generation completed. Check the output files: composite.png, shadow_only.png, mask_debug.png"