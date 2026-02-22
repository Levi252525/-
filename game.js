const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const hudStatus = document.getElementById("hud-status");

const WORLD = {
  width: 960,
  height: 3600,
};

const WALL_THICKNESS = 30;
const GRAVITY = 0.68;
const MAX_FALL_SPEED = 15;
const CAMERA_FOLLOW_Y = 0.62;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 52;

const keys = {
  left: false,
  right: false,
};

let jumpRequested = false;
let cameraY = 0;
let introHintFrames = 210;

function buildPlatforms() {
  const list = [
    { x: WALL_THICKNESS + 145, y: WORLD.height - 132, w: 250, h: 18 },
    { x: WORLD.width - WALL_THICKNESS - 315, y: WORLD.height - 240, w: 210, h: 16 },
    { x: WALL_THICKNESS + 110, y: WORLD.height - 350, w: 170, h: 16 },
  ];

  let y = WORLD.height - 470;
  for (let i = 0; i < 27; i += 1) {
    const width = i % 6 === 5 ? 220 : 165;
    let x;

    if (i % 3 === 0) {
      x = WALL_THICKNESS + 75 + (i % 2) * 40;
    } else if (i % 3 === 1) {
      x = WORLD.width - WALL_THICKNESS - width - 90 - ((i + 1) % 2) * 35;
    } else {
      x = WORLD.width / 2 - width / 2 + (i % 2 === 0 ? -75 : 75);
    }

    list.push({ x, y, w: width, h: 16 });
    y -= 114;
  }

  list.push({ x: WORLD.width / 2 - 120, y: 176, w: 240, h: 16 });
  list.push({
    x: WALL_THICKNESS,
    y: WORLD.height - 32,
    w: WORLD.width - WALL_THICKNESS * 2,
    h: 32,
  });
  return list;
}

const platforms = buildPlatforms();

function buildHazards() {
  return [];
}

const hazards = buildHazards();
const goal = { x: WORLD.width / 2 - 30, y: 68, w: 60, h: 88 };

const playerSpawn = {
  x: platforms[0].x + platforms[0].w / 2 - PLAYER_WIDTH / 2,
  y: platforms[0].y - 50,
};

const player = {
  x: playerSpawn.x,
  y: playerSpawn.y,
  w: PLAYER_WIDTH,
  h: PLAYER_HEIGHT,
  vx: 0,
  vy: 0,
  maxSpeed: 6.2,
  jumpStrength: 13.6,
  onGround: false,
  maxJumps: 2,
  jumpsUsed: 0,
  spawnX: playerSpawn.x,
  spawnY: playerSpawn.y,
};

const state = {
  mode: "playing",
};

const platformTexture = new Image();
let platformTextureLoaded = false;
let platformTexturePattern = null;
const platformTextureOptions = [
  "./image-removebg-preview.png",
  "./image-removebg-preview (1).png",
  "./pB2YY8tI.webp",
];

function loadPlatformTexture(index) {
  if (index >= platformTextureOptions.length) {
    return;
  }

  platformTexture.onload = () => {
    platformTextureLoaded = true;
    platformTexturePattern = ctx.createPattern(platformTexture, "repeat");
  };
  platformTexture.onerror = () => {
    loadPlatformTexture(index + 1);
  };
  platformTexture.src = encodeURI(platformTextureOptions[index]);
}

loadPlatformTexture(0);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function intersects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function resetPlayerToSpawn() {
  player.x = player.spawnX;
  player.y = player.spawnY;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.jumpsUsed = 0;
  cameraY = WORLD.height - canvas.height;
}

function resetGame() {
  state.mode = "playing";
  jumpRequested = false;
  introHintFrames = 210;
  resetPlayerToSpawn();
  hudStatus.textContent = "No score / no checkpoints";
}

function resolveHorizontalCollisions(entity, solids) {
  for (const solid of solids) {
    if (!intersects(entity, solid)) {
      continue;
    }

    if (entity.vx > 0) {
      entity.x = solid.x - entity.w;
    } else if (entity.vx < 0) {
      entity.x = solid.x + solid.w;
    }

    entity.vx = 0;
  }
}

function resolveVerticalCollisions(entity, solids) {
  entity.onGround = false;

  for (const solid of solids) {
    if (!intersects(entity, solid)) {
      continue;
    }

    if (entity.vy > 0) {
      entity.y = solid.y - entity.h;
      entity.vy = 0;
      entity.onGround = true;
      entity.jumpsUsed = 0;
    } else if (entity.vy < 0) {
      entity.y = solid.y + solid.h;
      entity.vy = 0;
    }
  }
}

function keepInsideWalls() {
  const leftLimit = WALL_THICKNESS;
  const rightLimit = WORLD.width - WALL_THICKNESS - player.w;

  if (player.x < leftLimit) {
    player.x = leftLimit;
    player.vx = 0;
  } else if (player.x > rightLimit) {
    player.x = rightLimit;
    player.vx = 0;
  }
}

function updatePlayer() {
  const acceleration = 0.72;
  const friction = 0.82;

  if (keys.left) {
    player.vx -= acceleration;
  }

  if (keys.right) {
    player.vx += acceleration;
  }

  if (!keys.left && !keys.right) {
    player.vx *= friction;
  }

  player.vx = clamp(player.vx, -player.maxSpeed, player.maxSpeed);
  if (Math.abs(player.vx) < 0.04) {
    player.vx = 0;
  }

  if (jumpRequested && player.jumpsUsed < player.maxJumps) {
    player.vy = -player.jumpStrength;
    player.onGround = false;
    player.jumpsUsed += 1;
  }
  jumpRequested = false;

  player.vy = Math.min(player.vy + GRAVITY, MAX_FALL_SPEED);

  player.x += player.vx;
  resolveHorizontalCollisions(player, platforms);
  keepInsideWalls();

  player.y += player.vy;
  resolveVerticalCollisions(player, platforms);

  if (player.y < 0) {
    player.y = 0;
    player.vy = 0;
  }

  if (player.y > WORLD.height + 120) {
    player.y = WORLD.height - 32 - player.h;
    player.vy = 0;
    player.onGround = true;
    player.jumpsUsed = 0;
  }
}

function checkHazards() {
  return;
}

function checkGoal() {
  if (!intersects(player, goal) || state.mode !== "playing") {
    return;
  }

  state.mode = "won";
}

function updateCamera() {
  const target = player.y - canvas.height * CAMERA_FOLLOW_Y;
  cameraY = clamp(target, 0, WORLD.height - canvas.height);
}

function update() {
  if (state.mode !== "playing") {
    if (introHintFrames > 0) {
      introHintFrames -= 1;
    }
    return;
  }

  updatePlayer();
  checkHazards();
  checkGoal();
  updateCamera();

  if (introHintFrames > 0) {
    introHintFrames -= 1;
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#15234f");
  sky.addColorStop(0.45, "#2a4b89");
  sky.addColorStop(1, "#73b8ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  for (let i = 0; i < 32; i += 1) {
    const x = ((i * 83) % canvas.width) + ((i % 5) - 2) * 3;
    const y = ((i * 141 + Math.floor(cameraY * 0.35)) % canvas.height) - 16;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  for (let i = 0; i < 6; i += 1) {
    const cloudX = ((i * 170 + Math.floor(cameraY * 0.18)) % (canvas.width + 180)) - 100;
    const cloudY = 58 + i * 62;
    drawCloud(cloudX, cloudY, 1 + (i % 2) * 0.28);
  }
}

function drawCloud(x, y, scale) {
  ctx.beginPath();
  ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
  ctx.arc(x + 18 * scale, y - 8 * scale, 14 * scale, 0, Math.PI * 2);
  ctx.arc(x + 38 * scale, y - 2 * scale, 16 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawWalls() {
  const leftWall = { x: 0, y: 0, w: WALL_THICKNESS, h: WORLD.height };
  const rightWall = { x: WORLD.width - WALL_THICKNESS, y: 0, w: WALL_THICKNESS, h: WORLD.height };

  for (const wall of [leftWall, rightWall]) {
    ctx.fillStyle = "#2f384f";
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = "#4a5a7b";
    for (let y = wall.y + 14; y < wall.h; y += 44) {
      ctx.fillRect(wall.x + 5, y, wall.w - 10, 4);
    }
  }
}

function drawPlatforms() {
  for (const platform of platforms) {
    ctx.fillStyle = "#2f6542";
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    if (platformTextureLoaded) {
      if (!platformTexturePattern) {
        platformTexturePattern = ctx.createPattern(platformTexture, "repeat");
      }
      if (platformTexturePattern) {
        ctx.save();
        ctx.globalAlpha = 0.58;
        ctx.translate(platform.x, platform.y);
        ctx.fillStyle = platformTexturePattern;
        ctx.fillRect(0, 0, platform.w, platform.h);
        ctx.restore();
      }
    }
    ctx.fillStyle = "#8dd170";
    ctx.fillRect(platform.x, platform.y, platform.w, 6);
  }
}

function drawHazards() {
  return;
}

function drawGoal() {
  const pulse = 0.6 + Math.sin(performance.now() * 0.008) * 0.25;
  ctx.fillStyle = "#0f2144";
  ctx.fillRect(goal.x + goal.w - 8, goal.y, 8, goal.h);
  ctx.fillStyle = "#84ffe5";
  ctx.globalAlpha = pulse;
  ctx.beginPath();
  ctx.moveTo(goal.x + 4, goal.y + 13);
  ctx.lineTo(goal.x + goal.w - 8, goal.y + 24);
  ctx.lineTo(goal.x + 4, goal.y + 35);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  ctx.fillStyle = "#2f55c6";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = "#89b4ff";
  ctx.fillRect(player.x + 6, player.y + 6, player.w - 12, player.h - 12);

  ctx.fillStyle = "#173070";
  ctx.fillRect(player.x + 11, player.y + 15, 6, 6);
  ctx.fillRect(player.x + player.w - 17, player.y + 15, 6, 6);
}

function drawTextCenter(y, text, size = 36, color = "#f7f9ff") {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, y);
}

function drawOverlay() {
  if (state.mode === "playing") {
    return;
  }

  ctx.fillStyle = "rgba(7, 10, 24, 0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.mode === "won") {
    drawTextCenter(220, "Summit Reached!", 54, "#bafce2");
    drawTextCenter(292, "Press R to play again", 24, "#d9deff");
    return;
  }

  drawTextCenter(220, "Paused", 52, "#eef7ff");
  drawTextCenter(292, "Press R to play", 24, "#d9deff");
}

function drawIntroHint() {
  if (introHintFrames <= 0 || state.mode !== "playing") {
    return;
  }

  const alpha = clamp(introHintFrames / 210, 0, 1);
  ctx.fillStyle = `rgba(8, 12, 33, ${0.45 * alpha})`;
  ctx.fillRect(174, 20, 612, 42);
  ctx.fillStyle = `rgba(247, 251, 255, ${alpha})`;
  ctx.font = '600 20px "Segoe UI", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("Climb upward with double jump and reach the summit gate", canvas.width / 2, 48);
}

function draw() {
  drawBackground();

  ctx.save();
  ctx.translate(0, -cameraY);
  drawWalls();
  drawPlatforms();
  drawHazards();
  drawGoal();
  drawPlayer();
  ctx.restore();

  drawIntroHint();
  drawOverlay();
}

function keyIsJump(key) {
  return key === "w" || key === "arrowup" || key === " " || key === "space" || key === "spacebar";
}

function keyDownHandler(event) {
  const key = event.key.toLowerCase();

  if (key === "a" || key === "arrowleft") {
    keys.left = true;
    event.preventDefault();
  }

  if (key === "d" || key === "arrowright") {
    keys.right = true;
    event.preventDefault();
  }

  if ((keyIsJump(key) || event.code === "Space") && !event.repeat) {
    jumpRequested = true;
    event.preventDefault();
  }

  if (key === "r" && state.mode !== "playing") {
    resetGame();
  }
}

function keyUpHandler(event) {
  const key = event.key.toLowerCase();

  if (key === "a" || key === "arrowleft") {
    keys.left = false;
  }

  if (key === "d" || key === "arrowright") {
    keys.right = false;
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

resetGame();
requestAnimationFrame(gameLoop);
