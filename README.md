# Realistic Shadow Generator

A Python CLI tool to generate realistic shadows for composited images.

## Requirements

- Python 3.8+
- OpenCV
- Pillow
- NumPy

Install dependencies: `pip install -r requirements.txt`

## Usage

```bash
python shadow_generator.py foreground.png background.png --angle 45 --elevation 30 --composite composite.png --shadow shadow_only.png --mask mask_debug.png
```

### Arguments

- `fg`: Path to foreground image (with alpha channel for cutout)
- `bg`: Path to background image
- `--depth`: Optional depth map (grayscale)
- `--angle`: Light angle in degrees (0-360, 0 = from top)
- `--elevation`: Light elevation in degrees (0-90, 0 = horizontal)
- `--composite`: Output composite image
- `--shadow`: Output shadow only image
- `--mask`: Output debug mask

## Features

- Directional light control
- Contact shadow (sharp near contact, fades)
- Soft shadow falloff (blur and opacity decrease with distance)
- Shadow matches subject silhouette
- **Bonus**: Depth map warping (shadow bends based on depth, 0=ground, 255=high)

## TypeScript Web App Version

Also available in `ts-shadow/` folder as a web app.