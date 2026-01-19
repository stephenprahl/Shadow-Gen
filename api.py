from flask import Flask, request, send_file
import cv2
import numpy as np
import math
import tempfile
import os

app = Flask(__name__)

def generate_shadow(fg_path, bg_path, light_angle=45.0, light_elevation=30.0, depth_path=None, output_composite='composite.png', output_shadow='shadow_only.png', output_mask='mask_debug.png'):
    # Load images
    fg = cv2.imread(fg_path, cv2.IMREAD_UNCHANGED)
    bg = cv2.imread(bg_path, cv2.IMREAD_COLOR)
    if fg is None or bg is None:
        raise ValueError("Could not load images")
    # Assume fg has alpha, if not, assume all opaque
    if fg.shape[2] == 3:
        fg = cv2.cvtColor(fg, cv2.COLOR_BGR2BGRA)
        fg[:, :, 3] = 255
    # Resize fg to bg size for simplicity
    fg = cv2.resize(fg, (bg.shape[1], bg.shape[0]))
    # Load depth
    depth = None
    if depth_path:
        depth = cv2.imread(depth_path, cv2.IMREAD_GRAYSCALE)
        if depth is not None:
            depth = cv2.resize(depth, (bg.shape[1], bg.shape[0]))
    # Get mask
    mask = fg[:, :, 3]
    # Find contact: bottom most y for each x
    h, w = mask.shape
    contact = np.full(w, h, dtype=int)
    for x in range(w):
        for y in range(h-1, -1, -1):
            if mask[y, x] > 0:
                contact[x] = y
                break
    # Light direction
    rad_angle = math.radians(light_angle)
    shadow_dir_x = -math.sin(rad_angle)
    shadow_dir_y = math.cos(rad_angle)
    if light_elevation <= 0:
        shadow_length = 1000
    else:
        shadow_length = 200 / math.tan(math.radians(light_elevation))
    dx = shadow_dir_x * shadow_length
    dy = shadow_dir_y * shadow_length
    # Create shadow opacity
    shadow_opacity = np.zeros((h, w), dtype=np.float32)
    for y in range(h):
        for x in range(w):
            if mask[y, x] > 0:
                scale = 1.0
                if depth is not None:
                    depth_val = depth[y, x] / 255.0
                    scale = 1 - depth_val  # higher depth (255) shorter shadow
                sx = int(x + dx * scale)
                sy = int(y + dy * scale)
                if 0 <= sx < w and 0 <= sy < h:
                    d = (y - contact[x]) / 10.0
                    opacity = max(0, 1 - d * 0.05)
                    shadow_opacity[sy, sx] = max(shadow_opacity[sy, sx], opacity)
    # Blur the shadow
    shadow_opacity_blurred = cv2.GaussianBlur(shadow_opacity, (11, 11), 0)
    # Create shadow image
    shadow = np.zeros((h, w, 4), dtype=np.uint8)
    shadow[:, :, :3] = 0
    shadow[:, :, 3] = (shadow_opacity_blurred * 255).astype(np.uint8)
    cv2.imwrite(output_shadow, shadow)
    cv2.imwrite(output_mask, mask)
    # Composite
    bg_rgba = cv2.cvtColor(bg, cv2.COLOR_BGR2BGRA)
    alpha = shadow[:, :, 3] / 255.0
    for c in range(3):
        bg_rgba[:, :, c] = (1 - alpha) * bg_rgba[:, :, c] + alpha * shadow[:, :, c]
    bg_rgba[:, :, 3] = np.maximum(bg_rgba[:, :, 3], shadow[:, :, 3])
    alpha_fg = fg[:, :, 3] / 255.0
    for c in range(3):
        bg_rgba[:, :, c] = (1 - alpha_fg) * bg_rgba[:, :, c] + alpha_fg * fg[:, :, c]
    bg_rgba[:, :, 3] = np.maximum(bg_rgba[:, :, 3], fg[:, :, 3])
    cv2.imwrite(output_composite, bg_rgba)
    print("Shadow generation complete")

@app.route('/generate', methods=['POST'])
def generate():
    # Get uploaded files
    fg_file = request.files['fg']
    bg_file = request.files['bg']
    depth_file = request.files.get('depth')
    
    # Save to temp files
    fg_path = tempfile.mktemp(suffix='.png')
    bg_path = tempfile.mktemp(suffix='.png')
    depth_path = None
    if depth_file:
        depth_path = tempfile.mktemp(suffix='.png')
        depth_file.save(depth_path)
    
    fg_file.save(fg_path)
    bg_file.save(bg_path)
    
    # Get params
    angle = float(request.form.get('angle', 45))
    elevation = float(request.form.get('elevation', 30))
    
    # Generate
    output_composite = tempfile.mktemp(suffix='.png')
    generate_shadow(fg_path, bg_path, angle, elevation, depth_path, output_composite)
    
    # Clean up inputs
    os.remove(fg_path)
    os.remove(bg_path)
    if depth_path:
        os.remove(depth_path)
    
    # Return composite
    response = send_file(output_composite, mimetype='image/png')
    # Clean up output after sending
    @response.call_on_close
    def cleanup():
        os.remove(output_composite)
    return response

if __name__ == '__main__':
    app.run()