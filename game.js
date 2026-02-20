const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const hudLives = document.getElementById("hud-lives");
const hudCoins = document.getElementById("hud-coins");
const hudTime = document.getElementById("hud-time");

const WORLD = {
  width: 3250,
  height: 540,
};

const GRAVITY = 0.65;
const MAX_FALL_SPEED = 15;
const CAMERA_FOLLOW_RATIO = 0.35;

const keys = {
  left: false,
  right: false,
};

let jumpQueued = false;
let cameraX = 0;
let goalHintFrames = 0;

const platforms = [
  { x: 0, y: 490, w: 420, h: 50 },
  { x: 500, y: 490, w: 360, h: 50 },
  { x: 920, y: 490, w: 420, h: 50 },
  { x: 1420, y: 490, w: 300, h: 50 },
  { x: 1790, y: 490, w: 390, h: 50 },
  { x: 2260, y: 490, w: 350, h: 50 },
  { x: 2690, y: 490, w: 520, h: 50 },
  { x: 140, y: 410, w: 130, h: 18 },
  { x: 330, y: 350, w: 120, h: 18 },
  { x: 610, y: 390, w: 130, h: 18 },
  { x: 840, y: 325, w: 120, h: 18 },
  { x: 1130, y: 370, w: 130, h: 18 },
  { x: 1520, y: 360, w: 150, h: 18 },
  { x: 1880, y: 320, w: 140, h: 18 },
  { x: 2110, y: 380, w: 130, h: 18 },
  { x: 2390, y: 340, w: 130, h: 18 },
  { x: 2800, y: 360, w: 140, h: 18 },
  { x: 3000, y: 300, w: 140, h: 18 },
];

const hazards = [
  { x: 420, y: 500, w: 80, h: 40 },
  { x: 860, y: 500, w: 60, h: 40 },
  { x: 1340, y: 500, w: 80, h: 40 },
  { x: 1720, y: 500, w: 70, h: 40 },
  { x: 2180, y: 500, w: 80, h: 40 },
  { x: 2610, y: 500, w: 80, h: 40 },
];

const coins = [
  { x: 90, y: 450, collected: false, phase: 0.0 },
  { x: 180, y: 370, collected: false, phase: 0.7 },
  { x: 360, y: 310, collected: false, phase: 1.2 },
  { x: 650, y: 350, collected: false, phase: 1.8 },
  { x: 870, y: 285, collected: false, phase: 2.1 },
  { x: 1160, y: 330, collected: false, phase: 2.8 },
  { x: 1480, y: 450, collected: false, phase: 3.4 },
  { x: 1560, y: 320, collected: false, phase: 4.0 },
  { x: 1910, y: 280, collected: false, phase: 4.5 },
  { x: 2140, y: 340, collected: false, phase: 5.1 },
  { x: 2420, y: 300, collected: false, phase: 5.7 },
  { x: 2740, y: 450, collected: false, phase: 6.2 },
  { x: 2830, y: 320, collected: false, phase: 6.7 },
  { x: 3030, y: 260, collected: false, phase: 7.2 },
  { x: 3150, y: 260, collected: false, phase: 7.7 },
];

const enemies = [
  {
    x: 1030,
    y: 450,
    w: 34,
    h: 40,
    minX: 940,
    maxX: 1285,
    speed: 1.35,
    dir: 1,
    startX: 1030,
    alive: true,
  },
  {
    x: 1908,
    y: 284,
    w: 32,
    h: 36,
    minX: 1882,
    maxX: 1988,
    speed: 1.1,
    dir: 1,
    startX: 1908,
    alive: true,
  },
  {
    x: 2340,
    y: 450,
    w: 34,
    h: 40,
    minX: 2280,
    maxX: 2550,
    speed: 1.25,
    dir: -1,
    startX: 2340,
    alive: true,
  },
];

const goal = { x: 3160, y: 425, w: 32, h: 65 };

const player = {
  x: 60,
  y: 438,
  w: 38,
  h: 52,
  vx: 0,
  vy: 0,
  maxSpeed: 6.2,
  jumpStrength: 13.5,
  onGround: false,
  spawnX: 60,
  spawnY: 438,
  hurtCooldown: 0,
  previousY: 438,
};

const state = {
  mode: "playing",
  lives: 3,
  collectedCoins: 0,
  totalCoins: coins.length,
  startTime: performance.now(),
  finalTime: 0,
};

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
  player.previousY = player.spawnY;
  cameraX = 0;
}

function resetGame() {
  for (const coin of coins) {
    coin.collected = false;
  }

  for (const enemy of enemies) {
    enemy.x = enemy.startX;
    enemy.alive = true;
    enemy.dir = enemy.dir >= 0 ? 1 : -1;
  }

  state.mode = "playing";
  state.lives = 3;
  state.collectedCoins = 0;
  state.startTime = performance.now();
  state.finalTime = 0;

  player.hurtCooldown = 0;
  goalHintFrames = 0;
  jumpQueued = false;

  resetPlayerToSpawn();
  updateHud();
}

function updateHud() {
  const seconds =
    state.mode === "playing"
      ? (performance.now() - state.startTime) / 1000
      : state.finalTime;
  hudLives.textContent = `Lives: ${state.lives}`;
  hudCoins.textContent = `Coins: ${state.collectedCoins} / ${state.totalCoins}`;
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

function updatePlayer() {
  const acceleration = 0.72;
  const friction = 0.82;

  player.previousY = player.y;

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

  player.y += player.vy;
  resolveVerticalCollisions(player, platforms);

  player.x = clamp(player.x, 0, WORLD.width - player.w);

  if (player.y > WORLD.height + 120) {
    damagePlayer();
  }
}

function updateEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    enemy.x += enemy.speed * enemy.dir;
    if (enemy.x <= enemy.minX) {
      enemy.x = enemy.minX;
      enemy.dir = 1;
    } else if (enemy.x + enemy.w >= enemy.maxX) {
      enemy.x = enemy.maxX - enemy.w;
      enemy.dir = -1;
    }
  }
}

function checkHazardCollisions() {
  for (const hazard of hazards) {
    if (intersects(player, hazard)) {
      damagePlayer();
      return;
    }
  }
}

function checkEnemyCollisions() {
  for (const enemy of enemies) {
    if (!enemy.alive || !intersects(player, enemy)) {
      continue;
    }

    const stomped = player.vy > 0 && player.previousY + player.h <= enemy.y + 6;
    if (stomped) {
      enemy.alive = false;
      player.y = enemy.y - player.h;
      player.vy = -9.8;
    } else {
      damagePlayer();
    }
  }
}

function checkCoinCollection() {
  for (const coin of coins) {
    if (coin.collected) {
      continue;
    }

    const coinHitbox = { x: coin.x - 10, y: coin.y - 10, w: 20, h: 20 };
    if (intersects(player, coinHitbox)) {
      coin.collected = true;
      state.collectedCoins += 1;
      updateHud();
    }
  }
}

function checkGoal() {
  if (!intersects(player, goal) || state.mode !== "playing") {
    return;
  }

  if (state.collectedCoins < state.totalCoins) {
    goalHintFrames = 120;
    return;
  }

  state.mode = "won";
  state.finalTime = (performance.now() - state.startTime) / 1000;
  updateHud();
}

function updateCamera() {
  const target = player.x - canvas.width * CAMERA_FOLLOW_RATIO;
  cameraX = clamp(target, 0, WORLD.width - canvas.width);
}

function update() {
  if (state.mode !== "playing") {
    if (player.hurtCooldown > 0) {
      player.hurtCooldown -= 1;
    }
    if (goalHintFrames > 0) {
      goalHintFrames -= 1;
    }
    updateHud();
    return;
  }

  updateEnemies();
  updatePlayer();
  checkHazardCollisions();
  checkEnemyCollisions();
  checkCoinCollection();
  checkGoal();
  updateCamera();

  if (player.hurtCooldown > 0) {
    player.hurtCooldown -= 1;
  }

  if (goalHintFrames > 0) {
    goalHintFrames -= 1;
  }

  updateHud();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#66bbff");
  sky.addColorStop(0.55, "#b4e5ff");
  sky.addColorStop(1, "#e9f8ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const mountainBandColors = [
    { color: "rgba(53, 112, 169, 0.28)", speed: 0.2, baseY: 360, amp: 80 },
    { color: "rgba(31, 84, 133, 0.32)", speed: 0.35, baseY: 410, amp: 65 },
  ];

  for (const band of mountainBandColors) {
    ctx.fillStyle = band.color;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let i = -2; i <= 9; i += 1) {
      const peakX = i * 180 - (cameraX * band.speed) % 180;
      const peakY = band.baseY - (i % 2 === 0 ? band.amp : band.amp * 0.45);
      ctx.lineTo(peakX, peakY);
      ctx.lineTo(peakX + 90, band.baseY);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
  for (let i = 0; i < 7; i += 1) {
    const cloudX = (i * 190 - (cameraX * 0.45) % 1180) + 70;
    const cloudY = 70 + (i % 3) * 42;
    drawCloud(cloudX, cloudY, 1 + (i % 2) * 0.25);
  }
}

function drawCloud(x, y, scale) {
  ctx.beginPath();
  ctx.arc(x, y, 16 * scale, 0, Math.PI * 2);
  ctx.arc(x + 18 * scale, y - 8 * scale, 14 * scale, 0, Math.PI * 2);
  ctx.arc(x + 34 * scale, y, 15 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatforms() {
  for (const platform of platforms) {
    ctx.fillStyle = "#467f43";
    ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = "#8fce6a";
    ctx.fillRect(platform.x, platform.y, platform.w, 7);
  }
}

function drawHazards() {
  for (const hazard of hazards) {
    const lavaGradient = ctx.createLinearGradient(0, hazard.y, 0, hazard.y + hazard.h);
    lavaGradient.addColorStop(0, "#ffcf66");
    lavaGradient.addColorStop(0.45, "#ff6f3f");
    lavaGradient.addColorStop(1, "#c02f1d");
    ctx.fillStyle = lavaGradient;
    ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);

    ctx.fillStyle = "rgba(255, 245, 194, 0.6)";
    for (let x = hazard.x + 6; x < hazard.x + hazard.w; x += 14) {
      ctx.beginPath();
      ctx.arc(x, hazard.y + 8, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCoins() {
  const now = performance.now();
  for (const coin of coins) {
    if (coin.collected) {
      continue;
    }

    const bob = Math.sin(now * 0.007 + coin.phase) * 3.8;
    const y = coin.y + bob;
    ctx.fillStyle = "#f3cb35";
    ctx.beginPath();
    ctx.arc(coin.x, y, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#9f7214";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 245, 176, 0.8)";
    ctx.beginPath();
    ctx.arc(coin.x - 2, y - 2, 3.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }

    ctx.fillStyle = "#9f3f2a";
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    ctx.fillStyle = "#ff9368";
    ctx.fillRect(enemy.x + 4, enemy.y + 7, enemy.w - 8, enemy.h - 12);

    ctx.fillStyle = "#191919";
    ctx.fillRect(enemy.x + 7, enemy.y + 13, 4, 4);
    ctx.fillRect(enemy.x + enemy.w - 11, enemy.y + 13, 4, 4);
  }
}

function drawGoal() {
  ctx.fillStyle = "#324f88";
  ctx.fillRect(goal.x + goal.w - 6, goal.y, 6, goal.h);

  const unlocked = state.collectedCoins === state.totalCoins;
  ctx.fillStyle = unlocked ? "#78f7df" : "#8ea2cb";
  ctx.beginPath();
  ctx.moveTo(goal.x, goal.y + 10);
  ctx.lineTo(goal.x + goal.w - 6, goal.y + 20);
  ctx.lineTo(goal.x, goal.y + 30);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer() {
  if (player.hurtCooldown > 0 && Math.floor(player.hurtCooldown / 4) % 2 === 0) {
    return;
  }

  ctx.fillStyle = "#2f55c6";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = "#89b4ff";
  ctx.fillRect(player.x + 4, player.y + 6, player.w - 8, player.h - 10);

  ctx.fillStyle = "#173070";
  ctx.fillRect(player.x + 8, player.y + 16, 6, 6);
  ctx.fillRect(player.x + player.w - 14, player.y + 16, 6, 6);
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

  ctx.fillStyle = "rgba(7, 10, 24, 0.64)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state.mode === "won") {
    drawTextCenter(225, "You Win!", 56, "#bafce2");
    drawTextCenter(278, `Final Time: ${state.finalTime.toFixed(1)}s`, 28, "#eef7ff");
    drawTextCenter(328, "Press R to play again", 24, "#d9deff");
    return;
  }

  drawTextCenter(225, "Game Over", 56, "#ffb7b7");
  drawTextCenter(278, `Coins Collected: ${state.collectedCoins}`, 28, "#eef7ff");
  drawTextCenter(328, "Press R to retry", 24, "#d9deff");
}

function drawGoalHint() {
  if (goalHintFrames <= 0 || state.mode !== "playing") {
    return;
  }

  const alpha = clamp(goalHintFrames / 120, 0, 1);
  ctx.fillStyle = `rgba(8, 12, 33, ${0.45 * alpha})`;
  ctx.fillRect(270, 20, 420, 40);
  ctx.fillStyle = `rgba(247, 251, 255, ${alpha})`;
  ctx.font = '600 20px "Segoe UI", sans-serif';
  ctx.textAlign = "center";
  const missing = state.totalCoins - state.collectedCoins;
  ctx.fillText(`Collect ${missing} more coin(s) to unlock the portal`, canvas.width / 2, 46);
}

function draw() {
  drawBackground();

  ctx.save();
  ctx.translate(-cameraX, 0);
  drawPlatforms();
  drawHazards();
  drawCoins();
  drawEnemies();
  drawGoal();
  drawPlayer();
  ctx.restore();

  drawGoalHint();
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
