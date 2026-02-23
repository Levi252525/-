# Skybound Sprint (Platformer)

A small browser platformer built with plain HTML, CSS, and JavaScript.

## Objective

Play an endless short arena in tag mode. The picture holder chases while everyone else tries to run.

The level includes:

- Side wall barriers on both sides of the tower
- Super short arena layout with only a few platforms
- No spike hazards and a safe floor at the bottom
- Platform textures loaded from your downloaded image assets (`image-removebg-preview (1).png` first, with fallbacks)
- Double jump movement (you can jump once more while airborne)
- No score counter and no checkpoint system
- A skinnier player character with slightly higher gravity
- 3 AI bots in tag mode: holder chases non-holders, and non-holders flee the nearest threat (holder or player)
- When a bot holds the picture, it targets the player about 75% of retargets
- A picture token (`image-removebg-preview (2).png`) appears above a random runner and transfers on contact

## Controls

- **A / D** or **Left / Right Arrow**: move
- **W / Up Arrow / Space**: jump (double jump enabled)
- **R**: restart after win/loss

## Run locally

Open `index.html` in a browser.

For Chromebook/offline use, open this alternate launcher:

- `game.html`

If you prefer serving it from a local web server:

```bash
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`
