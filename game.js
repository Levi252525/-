const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const hudLives = document.getElementById("hud-lives");
const hudHeight = document.getElementById("hud-height");
const hudTime = document.getElementById("hud-time");

const WORLD = {
  width: 960,
  height: 3600,
};

const WALL_THICKNESS = 30;
const GRAVITY = 0.6;
const MAX_FALL_SPEED = 15;
const CAMERA_FOLLOW_Y = 0.62;

const keys = {
  left: false,
  right: false,
};

let jumpQueued = false;
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
  return list;
}

const platforms = buildPlatforms();

function buildHazards() {
  const list = [
    {
      type: "lava",
      x: WALL_THICKNESS,
      y: WORLD.height - 30,
      w: WORLD.width - WALL_THICKNESS * 2,
      h: 30,
    },
  ];

  for (let i = 4; i < platforms.length - 1; i += 5) {
    const platform = platforms[i];
    list.push({
      type: "spikes",
      x: platform.x + 14,
      y: platform.y - 12,
      w: Math.max(42, platform.w - 28),
      h: 12,
    });
  }

  return list;
}

const hazards = buildHazards();
const goal = { x: WORLD.width / 2 - 30, y: 68, w: 60, h: 88 };

const playerSpawn = {
  x: platforms[0].x + platforms[0].w / 2 - 28,
  y: platforms[0].y - 50,
};

const player = {
  x: playerSpawn.x,
  y: playerSpawn.y,
  w: 56,
  h: 46,
  vx: 0,
  vy: 0,
  maxSpeed: 6.2,
  jumpStrength: 13.6,
  onGround: false,
  spawnX: playerSpawn.x,
  spawnY: playerSpawn.y,
  hurtCooldown: 0,
};

const state = {
  mode: "playing",
  lives: 3,
  highestClimb: 0,
  startTime: performance.now(),
  finalTime: 0,
};

const playerSprite = new Image();
let playerSpriteLoaded = false;
const playerSpriteOptions = [
  "./image-removebg-preview (1).png",
  "./image-removebg-preview.png",
  "./pB2YY8tI.webp",
];

function loadPlayerSprite(index) {
  if (index >= playerSpriteOptions.length) {
    return;
  }

  playerSprite.onload = () => {
    playerSpriteLoaded = true;
  };
  playerSprite.onerror = () => {
    loadPlayerSprite(index + 1);
  };
  playerSprite.src = encodeURI(playerSpriteOptions[index]);
}

loadPlayerSprite(0);

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

function currentClimb() {
  return Math.max(0, Math.floor(player.spawnY - player.y));
}

function resetPlayerToSpawn() {
  player.x = player.spawnX;
  player.y = player.spawnY;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  cameraY = WORLD.height - canvas.height;
}

function resetGame() {
  state.mode = "playing";
  state.lives = 3;
  state.highestClimb = 0;
  state.startTime = performance.now();
  state.finalTime = 0;
  player.hurtCooldown = 0;
  jumpQueued = false;
  introHintFrames = 210;
  resetPlayerToSpawn();
  updateHud();
}

function updateHud() {
  const seconds =
    state.mode === "playing"
      ? (performance.now() - state.startTime) / 1000
      : state.finalTime;

  state.highestClimb = Math.max(state.highestClimb, currentClimb());
  hudLives.textContent = `Lives: ${state.lives}`;
  hudHeight.textContent = `Climb: ${state.highestClimb}px`;
  hudTime.textContent = `Time: ${seconds.toFixed(1)}s`;
}

function damagePlayer() {
  if (player.hurtCooldown > 0 || state.mode !== "playing") {
    return;
  }

  state.lives -= 1;
  player.hurtCooldown = 95;

  if (state.lives <= 0) {
    state.mode = "game-over";
    state.finalTime = (performance.now() - state.startTime) / 1000;
  } else {
    resetPlayerToSpawn();
  }

  updateHud();
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

  if (jumpQueued && player.onGround) {
    player.vy = -player.jumpStrength;
    player.onGround = false;
  }
  jumpQueued = false;

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
    damagePlayer();
  }
}

function checkHazards() {
  for (const hazard of hazards) {
    if (intersects(player, hazard)) {
      damagePlayer();
      return;
    }
  }
}

function checkGoal() {
  if (!intersects(player, goal) || state.mode !== "playing") {
    return;
  }

  state.mode = "won";
  state.finalTime = (performance.now() - state.startTime) / 1000;
  updateHud();
}

function updateCamera() {
  const target = player.y - canvas.height * CAMERA_FOLLOW_Y;
  cameraY = clamp(target, 0, WORLD.height - canvas.height);
}

function update() {
  if (state.mode !== "playing") {
    if (player.hurtCooldown > 0) {
      player.hurtCooldown -= 1;
    }
    if (introHintFrames > 0) {
      introHintFrames -= 1;
    }
    updateHud();
    return;
  }

  updatePlayer();
  checkHazards();
  checkGoal();
  updateCamera();

  if (player.hurtCooldown > 0) {
    player.hurtCooldown -= 1;
  }

  if (introHintFrames > 0) {
    introHintFrames -= 1;
  }

  updateHud();
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
    ctx.fillStyle = "#36734b";
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = "#8dd170";
    ctx.fillRect(platform.x, platform.y, platform.w, 6);
  }
}

function drawHazards() {
  for (const hazard of hazards) {
    if (hazard.type === "lava") {
      const lava = ctx.createLinearGradient(0, hazard.y, 0, hazard.y + hazard.h);
      lava.addColorStop(0, "#ffb15a");
      lava.addColorStop(0.55, "#ff6339");
      lava.addColorStop(1, "#c72e1f");
      ctx.fillStyle = lava;
      ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
      continue;
    }

    const spikeCount = Math.max(3, Math.floor(hazard.w / 20));
    const spikeWidth = hazard.w / spikeCount;
    ctx.fillStyle = "#f6f8ff";
    for (let i = 0; i < spikeCount; i += 1) {
      const x = hazard.x + i * spikeWidth;
      ctx.beginPath();
      ctx.moveTo(x, hazard.y + hazard.h);
      ctx.lineTo(x + spikeWidth * 0.5, hazard.y);
      ctx.lineTo(x + spikeWidth, hazard.y + hazard.h);
      ctx.closePath();
      ctx.fill();
    }
  }
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
  if (player.hurtCooldown > 0 && Math.floor(player.hurtCooldown / 4) % 2 === 0) {
    return;
  }

  if (playerSpriteLoaded) {
    ctx.save();
    if (player.vx < -0.2) {
      ctx.translate(player.x + player.w / 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(playerSprite, -player.w / 2 - 12, player.y - 14, player.w + 24, player.h + 24);
    } else {
      ctx.drawImage(playerSprite, player.x - 12, player.y - 14, player.w + 24, player.h + 24);
    }
    ctx.restore();
    return;
  }

  ctx.fillStyle = "#2b5fcc";
  ctx.fillRect(player.x, player.y, player.w, player.h);
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
    drawTextCenter(275, `Final Time: ${state.finalTime.toFixed(1)}s`, 30, "#eef7ff");
    drawTextCenter(324, `Best Climb: ${state.highestClimb}px`, 24, "#d9deff");
    drawTextCenter(366, "Press R to play again", 24, "#d9deff");
    return;
  }

  drawTextCenter(220, "Game Over", 56, "#ffb7b7");
  drawTextCenter(275, `Best Climb: ${state.highestClimb}px`, 30, "#eef7ff");
  drawTextCenter(330, "Press R to retry", 24, "#d9deff");
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
  ctx.fillText("Climb upward and reach the glowing summit gate", canvas.width / 2, 48);
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
  return key === "w" || key === "arrowup" || key === " ";
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

  if (keyIsJump(key)) {
    jumpQueued = true;
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
