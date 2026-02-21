# Skybound Sprint (Platformer)

A small browser platformer built with plain HTML, CSS, and JavaScript.

## Objective

Climb upward by jumping from platform to platform and reach the glowing summit gate near the top.

The level includes:

- Side wall barriers on both sides of the tower
- No spike hazards and a safe floor at the bottom
- Platform textures loaded from your downloaded image assets (`image-removebg-preview (1).png` first, with fallbacks)
- Double jump movement (you can jump once more while airborne)

## Controls

- **A / D** or **Left / Right Arrow**: move
- **W / Up Arrow / Space**: jump (double jump enabled)
- **R**: restart after win/loss

## Run locally

Open `index.html` in a browser.

If you prefer serving it from a local web server:

```bash
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`
