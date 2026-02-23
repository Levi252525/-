const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const hudStatus = document.getElementById("hud-status");

const WORLD = {
  width: 960,
  height: 860,
};

const WALL_THICKNESS = 30;
const GRAVITY = 0.68;
const MAX_FALL_SPEED = 15;
const CAMERA_FOLLOW_Y = 0.62;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 52;
const BOT_COUNT = 3;
const TOKEN_TRANSFER_COOLDOWN = 14;
const ROUND_TIMER_SECONDS = 20;
const ROUND_DURATION_FRAMES = ROUND_TIMER_SECONDS * 60;
const ELIMINATION_SPIN_FRAMES = 2 * 60;

const keys = {
  left: false,
  right: false,
};

let jumpRequested = false;
let cameraY = 0;
let introHintFrames = 210;
let playerJumpSignalId = 0;
let playerJumpSignalVy = 0;

function buildPlatforms() {
  return [
    { x: WALL_THICKNESS + 75, y: WORLD.height - 128, w: 225, h: 18 },
    { x: WORLD.width - WALL_THICKNESS - 300, y: WORLD.height - 128, w: 225, h: 18 },
    { x: WORLD.width / 2 - 115, y: WORLD.height - 218, w: 230, h: 16 },
    { x: WALL_THICKNESS + 170, y: WORLD.height - 315, w: 190, h: 16 },
    { x: WORLD.width - WALL_THICKNESS - 360, y: WORLD.height - 315, w: 190, h: 16 },
    { x: WORLD.width / 2 - 95, y: WORLD.height - 405, w: 190, h: 16 },
    {
      x: WALL_THICKNESS,
      y: WORLD.height - 32,
      w: WORLD.width - WALL_THICKNESS * 2,
      h: 32,
    },
  ];
}

const platforms = buildPlatforms();
const hazards = [];

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
  alive: true,
};

function createBot(index) {
  const width = 14 + index * 2;
  const height = 40 + index * 4;
  const spawnSlots = [
    platforms[0].x + 20,
    WORLD.width / 2 - width / 2,
    platforms[1].x + platforms[1].w - width - 20,
  ];
  const tintHue = (index * 37 + 40) % 360;
  const tintSat = 58 + (index % 3) * 12;
  const tintLight = 46 + (index % 3) * 8;

  return {
    id: index,
    x: clamp(spawnSlots[index % spawnSlots.length], WALL_THICKNESS, WORLD.width - WALL_THICKNESS - width),
    y: platforms[0].y - height,
    w: width,
    h: height,
    vx: 0,
    vy: 0,
    onGround: false,
    alive: true,
    maxJumps: 3,
    jumpsUsed: 0,
    maxSpeed: 5.8 - width * 0.04,
    jumpStrength: 11.3 + (height - 40) * 0.06,
    jumpCooldown: 0,
    copyJumpLag: 0,
    copyJumpTimer: 0,
    queuedJumpId: 0,
    lastCopiedJumpId: 0,
    chaseRetargetTimer: 0,
    prefersPlayerTarget: true,
    tintHue,
    tintSat,
    tintLight,
    tintAccentLight: Math.min(90, tintLight + 20),
  };
}

const bots = Array.from({ length: BOT_COUNT }, (_, index) => createBot(index));

const state = {
  mode: "playing",
  roundFramesRemaining: ROUND_DURATION_FRAMES,
  eliminationFramesRemaining: 0,
  eliminationTargetType: "none",
  eliminationTargetBotId: -1,
  winnerType: "none",
  winnerBotId: -1,
};

const tokenImage = new Image();
let tokenImageLoaded = false;
tokenImage.onload = () => {
  tokenImageLoaded = true;
};
tokenImage.onerror = () => {
  tokenImageLoaded = false;
};
tokenImage.src = encodeURI("./image-removebg-preview (2).png");

const tokenState = {
  holderType: "player",
  holderBotId: -1,
  transferCooldown: 0,
};

const spiralImage = new Image();
let spiralImageLoaded = false;
const spiralImageOptions = [
  "./purple-spiral.png",
  "./purple spiral.png",
  "./purple_spiral.png",
  "./purple-spiral.webp",
  "./purple spiral.webp",
];

function loadSpiralImage(index) {
  if (index >= spiralImageOptions.length) {
    return;
  }

  spiralImage.onload = () => {
    spiralImageLoaded = true;
  };
  spiralImage.onerror = () => {
    loadSpiralImage(index + 1);
  };
  spiralImage.src = encodeURI(spiralImageOptions[index]);
}

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
loadSpiralImage(0);

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

function getEntityCenterX(entity) {
  return entity.x + entity.w * 0.5;
}

function getParticipants() {
  const participants = [];
  if (player.alive) {
    participants.push({ type: "player", botId: -1, entity: player });
  }
  for (const bot of bots) {
    if (bot.alive) {
      participants.push({ type: "bot", botId: bot.id, entity: bot });
    }
  }
  return participants;
}

function getParticipantByRef(type, botId) {
  if (type === "player") {
    return player.alive ? { type: "player", botId: -1, entity: player } : null;
  }

  if (type === "bot") {
    const bot = bots.find((candidate) => candidate.id === botId && candidate.alive);
    if (bot) {
      return { type: "bot", botId: bot.id, entity: bot };
    }
  }

  return null;
}

function getCurrentTokenHolder() {
  const currentHolder = getParticipantByRef(tokenState.holderType, tokenState.holderBotId);
  if (currentHolder) {
    return currentHolder;
  }

  const participants = getParticipants();
  if (participants.length === 0) {
    return null;
  }

  const fallback = participants[0];
  tokenState.holderType = fallback.type;
  tokenState.holderBotId = fallback.botId;
  tokenState.transferCooldown = 0;
  return fallback;
}

function setTokenHolder(type, botId) {
  tokenState.holderType = type;
  tokenState.holderBotId = type === "bot" ? botId : -1;
  tokenState.transferCooldown = TOKEN_TRANSFER_COOLDOWN;
}

function assignRandomTokenHolder() {
  const participants = getParticipants();
  if (participants.length === 0) {
    tokenState.holderType = "none";
    tokenState.holderBotId = -1;
    tokenState.transferCooldown = 0;
    return null;
  }

  const selected = participants[Math.floor(Math.random() * participants.length)];
  setTokenHolder(selected.type, selected.botId);
  return selected;
}

function updateTokenTransfer() {
  const participants = getParticipants();
  if (participants.length <= 1) {
    return;
  }

  if (tokenState.transferCooldown > 0) {
    tokenState.transferCooldown -= 1;
    return;
  }

  const holder = getCurrentTokenHolder();
  if (!holder) {
    return;
  }

  for (const participant of participants) {
    if (participant.entity === holder.entity) {
      continue;
    }

    if (intersects(holder.entity, participant.entity)) {
      setTokenHolder(participant.type, participant.botId);
      return;
    }
  }
}

function getWinnerLabel() {
  if (state.winnerType === "player") {
    return "Player";
  }

  if (state.winnerType === "bot") {
    return `Bot ${state.winnerBotId + 1}`;
  }

  return "Nobody";
}

function getHolderLabel(holder) {
  if (!holder) {
    return "None";
  }

  if (holder.type === "player") {
    return "Player";
  }

  return `Bot ${holder.botId + 1}`;
}

function updateHudStatus() {
  const aliveCount = getParticipants().length;

  if (state.mode === "finished") {
    hudStatus.textContent = `Winner: ${getWinnerLabel()} | Press R to reset arena`;
    return;
  }

  if (state.eliminationFramesRemaining > 0) {
    const holder = getParticipantByRef(state.eliminationTargetType, state.eliminationTargetBotId);
    hudStatus.textContent = `Eliminating ${getHolderLabel(holder)}...`;
    return;
  }

  const holder = getCurrentTokenHolder();
  const secondsLeft = Math.ceil(state.roundFramesRemaining / 60);
  hudStatus.textContent = `Timer: ${secondsLeft}s | Alive: ${aliveCount} | Holder: ${getHolderLabel(holder)}`;
}

function getEliminationTarget() {
  return getParticipantByRef(state.eliminationTargetType, state.eliminationTargetBotId);
}

function eliminateParticipant(participant) {
  if (!participant) {
    return;
  }

  if (participant.type === "player") {
    player.alive = false;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.jumpsUsed = 0;
    keys.left = false;
    keys.right = false;
    return;
  }

  const bot = participant.entity;
  bot.alive = false;
  bot.vx = 0;
  bot.vy = 0;
  bot.onGround = false;
  bot.jumpsUsed = 0;
}

function finishMatchIfNeeded() {
  const aliveParticipants = getParticipants();
  if (aliveParticipants.length > 1) {
    return false;
  }

  state.mode = "finished";
  if (aliveParticipants.length === 1) {
    state.winnerType = aliveParticipants[0].type;
    state.winnerBotId = aliveParticipants[0].botId;
  } else {
    state.winnerType = "none";
    state.winnerBotId = -1;
  }

  return true;
}

function startEliminationPhase() {
  const holder = getCurrentTokenHolder();
  if (!holder) {
    finishMatchIfNeeded();
    return;
  }

  state.eliminationFramesRemaining = ELIMINATION_SPIN_FRAMES;
  state.eliminationTargetType = holder.type;
  state.eliminationTargetBotId = holder.botId;
}

function resolveEliminationPhase() {
  if (state.eliminationFramesRemaining <= 0) {
    return;
  }

  state.eliminationFramesRemaining -= 1;
  if (state.eliminationFramesRemaining > 0) {
    return;
  }

  const eliminated = getEliminationTarget();
  eliminateParticipant(eliminated);
  state.eliminationTargetType = "none";
  state.eliminationTargetBotId = -1;

  if (finishMatchIfNeeded()) {
    return;
  }

  assignRandomTokenHolder();
  state.roundFramesRemaining = ROUND_DURATION_FRAMES;
}

function resetPlayerToSpawn() {
  player.alive = true;
  player.x = player.spawnX;
  player.y = player.spawnY;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.jumpsUsed = 0;
  cameraY = WORLD.height - canvas.height;
}

function resetBots() {
  for (let i = 0; i < bots.length; i += 1) {
    Object.assign(bots[i], createBot(i));
  }
}

function emitPlayerJumpSignal(jumpVelocity) {
  playerJumpSignalId += 1;
  playerJumpSignalVy = jumpVelocity;
}

function resetGame() {
  state.mode = "playing";
  state.roundFramesRemaining = ROUND_DURATION_FRAMES;
  state.eliminationFramesRemaining = 0;
  state.eliminationTargetType = "none";
  state.eliminationTargetBotId = -1;
  state.winnerType = "none";
  state.winnerBotId = -1;
  jumpRequested = false;
  introHintFrames = 210;
  playerJumpSignalId = 0;
  playerJumpSignalVy = 0;
  resetPlayerToSpawn();
  resetBots();
  assignRandomTokenHolder();
  updateHudStatus();
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

function keepInsideWalls(entity) {
  const leftLimit = WALL_THICKNESS;
  const rightLimit = WORLD.width - WALL_THICKNESS - entity.w;

  if (entity.x < leftLimit) {
    entity.x = leftLimit;
    entity.vx = 0;
  } else if (entity.x > rightLimit) {
    entity.x = rightLimit;
    entity.vx = 0;
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
    emitPlayerJumpSignal(player.vy);
  }
  jumpRequested = false;

  player.vy = Math.min(player.vy + GRAVITY, MAX_FALL_SPEED);

  player.x += player.vx;
  resolveHorizontalCollisions(player, platforms);
  keepInsideWalls(player);

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

function getBotBehavior(bot) {
  const holder = getCurrentTokenHolder();
  const participants = getParticipants().filter((participant) => participant.entity !== bot);
  if (!holder || participants.length === 0) {
    return { mode: "chase", targetEntity: bot };
  }

  if (holder.type === "bot" && holder.botId === bot.id) {
    const playerTarget = participants.find((participant) => participant.type === "player");
    const nonPlayerTargets = participants.filter((participant) => participant.type === "bot");

    if (bot.chaseRetargetTimer <= 0) {
      bot.prefersPlayerTarget = playerTarget ? nonPlayerTargets.length === 0 || Math.random() < 0.75 : false;
      bot.chaseRetargetTimer = 24;
    } else {
      bot.chaseRetargetTimer -= 1;
    }

    if (bot.prefersPlayerTarget && playerTarget) {
      return { mode: "chase", targetEntity: playerTarget.entity };
    }

    let targetEntity = participants[0].entity;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const participant of participants) {
      const dx = getEntityCenterX(participant.entity) - getEntityCenterX(bot);
      const dy = participant.entity.y - bot.y;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        targetEntity = participant.entity;
      }
    }

    return { mode: "chase", targetEntity };
  }

  const holderEntity = holder.entity;
  const playerTarget = participants.find((participant) => participant.type === "player");
  if (!playerTarget) {
    return { mode: "flee", targetEntity: holderEntity };
  }

  const dxToHolder = getEntityCenterX(holderEntity) - getEntityCenterX(bot);
  const dyToHolder = holderEntity.y - bot.y;
  const distToHolder = dxToHolder * dxToHolder + dyToHolder * dyToHolder;

  const dxToPlayer = getEntityCenterX(playerTarget.entity) - getEntityCenterX(bot);
  const dyToPlayer = playerTarget.entity.y - bot.y;
  const distToPlayer = dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer;

  const threatEntity = distToPlayer <= distToHolder * 1.15 ? playerTarget.entity : holderEntity;
  return { mode: "flee", targetEntity: threatEntity };
}

function chooseBotTargetPlatform(bot, focusEntity, mode) {
  const focusCenterX = getEntityCenterX(focusEntity);
  const botCenterX = getEntityCenterX(bot);
  const focusAbove = focusEntity.y < bot.y - 14;
  const fleeDirection = Math.sign(botCenterX - focusCenterX) || (botCenterX < WORLD.width * 0.5 ? -1 : 1);

  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const platform of platforms) {
    if (platform.h > 24) {
      continue;
    }

    const platformIsAbove = platform.y < bot.y - 8;
    if (mode === "chase" && focusAbove && !platformIsAbove) {
      continue;
    }

    const verticalGap = Math.abs(platform.y - bot.y);
    if (verticalGap > 200) {
      continue;
    }

    const aimX =
      mode === "chase"
        ? clamp(focusCenterX, platform.x + 8, platform.x + platform.w - 8)
        : fleeDirection > 0
          ? platform.x + platform.w - 8
          : platform.x + 8;

    const distanceToAim = Math.abs(aimX - botCenterX);
    if (distanceToAim > 300) {
      continue;
    }

    const verticalToFocus = Math.abs(platform.y - focusEntity.y);
    const distanceFromFocus = Math.abs(aimX - focusCenterX);
    const score =
      mode === "chase"
        ? distanceToAim * 0.65 + verticalGap * 0.4 + verticalToFocus * 0.45
        : distanceToAim * 0.45 + verticalGap * 0.22 - distanceFromFocus * 0.9 + verticalToFocus * 0.08;

    if (score < bestScore) {
      bestScore = score;
      best = { platform, aimX };
    }
  }

  return best;
}

function updateSingleBot(bot) {
  const behavior = getBotBehavior(bot);
  const focusEntity = behavior.targetEntity;
  const focusCenterX = getEntityCenterX(focusEntity);
  const botCenterX = getEntityCenterX(bot);
  const target = chooseBotTargetPlatform(bot, focusEntity, behavior.mode);
  let targetX = target ? target.aimX : focusCenterX;

  if (behavior.mode === "flee" && !target) {
    const fleeDirection = Math.sign(botCenterX - focusCenterX) || (botCenterX < WORLD.width * 0.5 ? -1 : 1);
    targetX = botCenterX + fleeDirection * 210;
  }

  const acceleration = behavior.mode === "chase" ? 0.58 : 0.64;
  const friction = 0.88;

  let intentX = Math.sign(targetX - botCenterX);
  if (Math.abs(targetX - botCenterX) < 3) {
    intentX = 0;
  }

  if (intentX !== 0) {
    bot.vx += intentX * acceleration;
  } else {
    bot.vx *= friction;
  }

  const distanceToTargetX = Math.abs(targetX - botCenterX);
  const dynamicMaxSpeed =
    bot.maxSpeed + (behavior.mode === "chase" ? (distanceToTargetX > 120 ? 1.8 : 0.75) : distanceToTargetX > 120 ? 1.6 : 0.6);
  bot.vx = clamp(bot.vx, -dynamicMaxSpeed, dynamicMaxSpeed);
  if (Math.abs(bot.vx) < 0.03) {
    bot.vx = 0;
  }

  if (bot.jumpCooldown > 0) {
    bot.jumpCooldown -= 1;
  }

  if (bot.lastCopiedJumpId < playerJumpSignalId && bot.queuedJumpId !== playerJumpSignalId) {
    bot.queuedJumpId = playerJumpSignalId;
    bot.copyJumpTimer = bot.copyJumpLag;
  }

  if (bot.queuedJumpId !== 0) {
    if (bot.copyJumpTimer > 0) {
      bot.copyJumpTimer -= 1;
    } else {
      if (bot.jumpsUsed < bot.maxJumps && bot.jumpCooldown <= 0) {
        const copiedStrength = clamp(
          Math.abs(playerJumpSignalVy),
          Math.max(8.4, bot.jumpStrength - 1.3),
          bot.jumpStrength + 1.6
        );
        bot.vy = -copiedStrength;
        bot.onGround = false;
        bot.jumpsUsed += 1;
        bot.jumpCooldown = 6;
      }

      bot.lastCopiedJumpId = bot.queuedJumpId;
      bot.queuedJumpId = 0;
    }
  }

  const focusAboveBot = focusEntity.y < bot.y - 24;
  const focusNearX = Math.abs(focusCenterX - botCenterX) < 110;
  if (bot.onGround && bot.jumpCooldown <= 0 && bot.queuedJumpId === 0 && (focusAboveBot || behavior.mode === "flee" && focusNearX)) {
    bot.vy = -(bot.jumpStrength + 0.45);
    bot.onGround = false;
    bot.jumpsUsed = 1;
    bot.jumpCooldown = 8;
  } else if (!bot.onGround && bot.jumpCooldown <= 0 && bot.jumpsUsed < bot.maxJumps) {
    const shouldAirJump = behavior.mode === "chase" ? focusAboveBot : focusNearX;
    if (shouldAirJump && bot.vy > -0.75) {
      bot.vy = -(bot.jumpStrength - 0.6);
      bot.jumpsUsed += 1;
      bot.jumpCooldown = 8;
    }
  }

  bot.vy = Math.min(bot.vy + GRAVITY, MAX_FALL_SPEED);

  bot.x += bot.vx;
  resolveHorizontalCollisions(bot, platforms);
  keepInsideWalls(bot);

  bot.y += bot.vy;
  resolveVerticalCollisions(bot, platforms);

  if (bot.y < 0) {
    bot.y = 0;
    bot.vy = 0;
  }

  if (bot.y > WORLD.height + 160) {
    const floor = platforms[platforms.length - 1];
    bot.x = clamp(bot.x, WALL_THICKNESS, WORLD.width - WALL_THICKNESS - bot.w);
    bot.y = floor.y - bot.h;
    bot.vx = 0;
    bot.vy = 0;
    bot.onGround = true;
    bot.jumpsUsed = 0;
    bot.jumpCooldown = 6;
  }
}

function updateBots() {
  for (const bot of bots) {
    if (bot.alive) {
      updateSingleBot(bot);
    }
  }
}

function checkHazards() {
  return;
}

function updateCamera() {
  let focusEntity = null;
  if (player.alive) {
    focusEntity = player;
  } else {
    const holder = getCurrentTokenHolder();
    if (holder) {
      focusEntity = holder.entity;
    } else {
      const survivors = getParticipants();
      focusEntity = survivors.length > 0 ? survivors[0].entity : player;
    }
  }

  const target = focusEntity.y - canvas.height * CAMERA_FOLLOW_Y;
  cameraY = clamp(target, 0, WORLD.height - canvas.height);
}

function update() {
  if (state.mode === "playing") {
    if (state.eliminationFramesRemaining > 0) {
      resolveEliminationPhase();
      updateCamera();
    } else {
      if (player.alive) {
        updatePlayer();
      } else {
        jumpRequested = false;
      }

      updateBots();
      updateTokenTransfer();
      checkHazards();

      if (!finishMatchIfNeeded()) {
        state.roundFramesRemaining -= 1;
        if (state.roundFramesRemaining <= 0) {
          state.roundFramesRemaining = 0;
          startEliminationPhase();
        }
      }

      updateCamera();
    }
  }

  if (introHintFrames > 0) {
    introHintFrames -= 1;
  }

  updateHudStatus();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#15234f");
  sky.addColorStop(0.45, "#2a4b89");
  sky.addColorStop(1, "#73b8ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  for (let i = 0; i < 26; i += 1) {
    const x = ((i * 109) % canvas.width) + ((i % 5) - 2) * 3;
    const y = ((i * 87 + Math.floor(cameraY * 0.33)) % canvas.height) - 16;
    ctx.fillRect(x, y, 2, 2);
  }
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

function drawBots() {
  for (const bot of bots) {
    if (!bot.alive) {
      continue;
    }

    ctx.fillStyle = `hsl(${bot.tintHue}, ${bot.tintSat}%, ${bot.tintLight}%)`;
    ctx.fillRect(bot.x, bot.y, bot.w, bot.h);

    const insetX = Math.max(2, Math.floor(bot.w * 0.17));
    const insetY = Math.max(4, Math.floor(bot.h * 0.15));
    const insetW = Math.max(2, bot.w - insetX * 2);
    const insetH = Math.max(4, bot.h - insetY * 2);
    ctx.fillStyle = `hsl(${bot.tintHue}, ${Math.max(22, bot.tintSat - 22)}%, ${bot.tintAccentLight}%)`;
    ctx.fillRect(bot.x + insetX, bot.y + insetY, insetW, insetH);

    ctx.fillStyle = "#152447";
    const eyeSize = Math.max(2, Math.floor(bot.w * 0.16));
    const eyeY = bot.y + Math.max(8, Math.floor(bot.h * 0.28));
    const leftEyeX = bot.x + Math.max(2, Math.floor(bot.w * 0.24));
    const rightEyeX = bot.x + bot.w - Math.max(2, Math.floor(bot.w * 0.24)) - eyeSize;
    ctx.fillRect(leftEyeX, eyeY, eyeSize, eyeSize);
    ctx.fillRect(rightEyeX, eyeY, eyeSize, eyeSize);
  }
}

function drawFallbackSpiral(radius) {
  ctx.strokeStyle = "rgba(212, 129, 255, 0.92)";
  ctx.lineWidth = Math.max(2.5, radius * 0.08);
  ctx.beginPath();

  const turns = 4.2;
  const steps = 88;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * Math.PI * 2 * turns;
    const distance = radius * t;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}

function drawEliminationSpiral() {
  if (state.eliminationFramesRemaining <= 0) {
    return;
  }

  const target = getEliminationTarget();
  if (!target) {
    return;
  }

  const elapsedFrames = ELIMINATION_SPIN_FRAMES - state.eliminationFramesRemaining;
  const progress = clamp(elapsedFrames / ELIMINATION_SPIN_FRAMES, 0, 1);
  const rotation = progress * Math.PI * 7;
  const centerX = target.entity.x + target.entity.w * 0.5;
  const centerY = target.entity.y + target.entity.h * 0.5;
  const size = Math.max(target.entity.w, target.entity.h) + 56;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.globalAlpha = 0.86;

  if (spiralImageLoaded) {
    ctx.drawImage(spiralImage, -size / 2, -size / 2, size, size);
  } else {
    drawFallbackSpiral(size * 0.45);
  }

  ctx.restore();
}

function drawTokenIcon() {
  const holder = getCurrentTokenHolder();
  if (!holder) {
    return;
  }

  const markerSize = 30;
  const x = holder.entity.x + holder.entity.w * 0.5 - markerSize * 0.5;
  const y = holder.entity.y - markerSize - 10;

  if (tokenImageLoaded) {
    ctx.drawImage(tokenImage, x, y, markerSize, markerSize);
    return;
  }

  ctx.fillStyle = "#ffd766";
  ctx.beginPath();
  ctx.arc(x + markerSize / 2, y + markerSize / 2, markerSize / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  if (!player.alive) {
    return;
  }

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
  if (state.mode !== "finished") {
    return;
  }

  ctx.fillStyle = "rgba(6, 10, 28, 0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawTextCenter(canvas.height * 0.42, `${getWinnerLabel()} wins!`, 44, "#f4f6ff");
  drawTextCenter(canvas.height * 0.53, "Press R to reset arena", 28, "#d9ddf6");
}

function drawIntroHint() {
  if (introHintFrames <= 0 || state.mode !== "playing") {
    return;
  }

  const alpha = clamp(introHintFrames / 210, 0, 1);
  ctx.fillStyle = `rgba(8, 12, 33, ${0.45 * alpha})`;
  ctx.fillRect(164, 20, 632, 42);
  ctx.fillStyle = `rgba(247, 251, 255, ${alpha})`;
  ctx.font = '600 20px "Segoe UI", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("Endless arena tag: holder chases, others flee", canvas.width / 2, 48);
}

function draw() {
  drawBackground();

  ctx.save();
  ctx.translate(0, -cameraY);
  drawWalls();
  drawPlatforms();
  drawHazards();
  drawEliminationSpiral();
  drawBots();
  drawPlayer();
  drawTokenIcon();
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

  if (key === "r") {
    resetGame();
    event.preventDefault();
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
