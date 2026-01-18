Thank you for choosing to join our team. We’d like to give you a small mini-challenge to confirm skills in Python/TypeScript (your choice). ✅

🎯 Mini Challenge: Realistic Shadow Generator

Build a mini app that takes:

🧍‍♂️ Foreground image (you should cutout subject)
🏫 Background image
(⭐ Bonus) 🌫️ Depth map (grayscale 0–255)
…and outputs a final composite where the foreground casts a realistic-looking shadow on the background (not just a blur + offset).

✅ Requirements (must have)

💡 Directional light control
Light angle (0–360°)
Light elevation (0–90°)
🖤 Contact shadow
Dark and sharp near the feet/contact area
Quickly fades out with distance
🌫️ Soft shadow falloff
Blur increases as the shadow moves farther away
Opacity decreases with distance
✂️ Shadow must match the subject silhouette
No oval shadow, no fake drop-shadow filter
⭐ Bonus Mode (advanced)

If a depth map is provided:

Shadow should bend/warp using the depth map (more realistic shadow behavior on uneven surfaces)
🧰 Deliverables

Please submit:

composite.png 🖼️ (final output)
shadow_only.png 🖤 (debug)
mask_debug.png ✂️ (debug)
Source code + README 📄
You can build it as:

🌐 Web app (TypeScript) OR
🐍 Python CLI / pyqt6 UI
Better if you can show that you know how to use both.
📝 What we’re looking for

We don’t need perfect physics — we want something that looks believable, works on different images, and shows real compositing + shadow math. 💪