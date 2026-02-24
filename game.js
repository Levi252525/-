const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const hudStatus = document.getElementById("hud-status");
const homeScreen = document.getElementById("home-screen");
const playerNameInput = document.getElementById("player-name-input");
const gameSlotPlay = document.getElementById("game-slot-play");
const slotSpiralImage = document.getElementById("slot-spiral-image");
const playerCharacterOptions = document.getElementById("player-character-options");
const botCharacterOptions = document.getElementById("bot-character-options");
const themeOptions = document.getElementById("theme-options");
const placeTapeTrack = document.getElementById("place-tape-track");
const selectedPlaceLabel = document.getElementById("selected-place-label");

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
const BOT_NAMES = ["Rex", "Nova", "Blitz", "Dash", "Vex", "Orbit"];
const PLAYER_CHARACTERS = [
  { id: "classic", label: "Classic", primary: "#2f55c6", accent: "#89b4ff", eye: "#173070" },
  { id: "ember", label: "Ember", primary: "#d35e2d", accent: "#ffc48c", eye: "#642717" },
  { id: "mint", label: "Mint", primary: "#1b9687", accent: "#97f4d1", eye: "#0d4a41" },
  { id: "shadow", label: "Shadow", primary: "#3f4761", accent: "#b6bed8", eye: "#171d2d" },
];
const BOT_CHARACTER_SETS = [
  { id: "wild", label: "Wild", hueShift: 0, satShift: 0, lightShift: 0 },
  { id: "neon", label: "Neon", hueShift: 54, satShift: 16, lightShift: 6 },
  { id: "frost", label: "Frost", hueShift: 192, satShift: -8, lightShift: 10 },
  { id: "sunset", label: "Sunset", hueShift: -38, satShift: 8, lightShift: -2 },
];
const THEMES = [
  {
    id: "skybound",
    label: "Skybound",
    bodyBackground: "radial-gradient(circle at top, #252d5a 0%, #0b1022 55%, #060913 100%)",
    subtitleColor: "#b8c2ff",
    hudBorder: "rgba(255, 255, 255, 0.16)",
    hudBg: "rgba(7, 12, 33, 0.6)",
    homeBg: "linear-gradient(rgba(7, 11, 30, 0.9), rgba(6, 9, 22, 0.9))",
    accent: "rgba(255, 213, 132, 0.95)",
    skyTop: "#15234f",
    skyMid: "#2a4b89",
    skyBottom: "#73b8ff",
    wallDark: "#2f384f",
    wallLight: "#4a5a7b",
    platformBase: "#2f6542",
    platformTop: "#8dd170",
    timerBox: "rgba(9, 14, 37, 0.58)",
    timerStroke: "rgba(188, 205, 255, 0.55)",
    timerLabel: "#c6d7ff",
    timerText: "#f4f8ff",
  },
  {
    id: "neon-night",
    label: "Neon Night",
    bodyBackground: "radial-gradient(circle at top, #3f1962 0%, #120827 58%, #07030f 100%)",
    subtitleColor: "#d9b9ff",
    hudBorder: "rgba(255, 171, 255, 0.34)",
    hudBg: "rgba(32, 8, 53, 0.66)",
    homeBg: "linear-gradient(rgba(28, 7, 46, 0.94), rgba(9, 6, 23, 0.94))",
    accent: "rgba(255, 156, 247, 0.95)",
    skyTop: "#39165a",
    skyMid: "#6a2691",
    skyBottom: "#c06fff",
    wallDark: "#38284b",
    wallLight: "#61407f",
    platformBase: "#3e245b",
    platformTop: "#e89bff",
    timerBox: "rgba(40, 8, 52, 0.6)",
    timerStroke: "rgba(236, 148, 255, 0.7)",
    timerLabel: "#efc5ff",
    timerText: "#fff1ff",
  },
  {
    id: "cryo-core",
    label: "Cryo Core",
    bodyBackground: "radial-gradient(circle at top, #11394c 0%, #071825 56%, #040b12 100%)",
    subtitleColor: "#b8f1ff",
    hudBorder: "rgba(157, 244, 255, 0.3)",
    hudBg: "rgba(6, 25, 35, 0.62)",
    homeBg: "linear-gradient(rgba(4, 28, 38, 0.94), rgba(5, 12, 22, 0.94))",
    accent: "rgba(131, 239, 255, 0.95)",
    skyTop: "#14445b",
    skyMid: "#1f7390",
    skyBottom: "#8fe9ff",
    wallDark: "#2d4859",
    wallLight: "#4f7488",
    platformBase: "#2a5a61",
    platformTop: "#a5f4ff",
    timerBox: "rgba(7, 34, 44, 0.62)",
    timerStroke: "rgba(139, 243, 255, 0.68)",
    timerLabel: "#bef9ff",
    timerText: "#effeff",
  },
  {
    id: "voltage-sunset",
    label: "Voltage Sunset",
    bodyBackground: "radial-gradient(circle at top, #6a2f1b 0%, #261112 58%, #10070a 100%)",
    subtitleColor: "#ffd3b8",
    hudBorder: "rgba(255, 184, 140, 0.35)",
    hudBg: "rgba(42, 16, 12, 0.62)",
    homeBg: "linear-gradient(rgba(49, 18, 12, 0.94), rgba(18, 8, 11, 0.94))",
    accent: "rgba(255, 177, 112, 0.95)",
    skyTop: "#5a2319",
    skyMid: "#a44926",
    skyBottom: "#ffb571",
    wallDark: "#5f2f28",
    wallLight: "#8d4b38",
    platformBase: "#784830",
    platformTop: "#ffcf93",
    timerBox: "rgba(52, 20, 12, 0.62)",
    timerStroke: "rgba(255, 177, 112, 0.7)",
    timerLabel: "#ffd7ae",
    timerText: "#fff4e9",
  },
];
const PLACE_OPTIONS = [
  { id: "skyline-run", label: "Skyline Run" },
  { id: "neon-arc", label: "Neon Arc" },
  { id: "aurora-labs", label: "Aurora Labs" },
  { id: "forge-path", label: "Forge Path" },
  { id: "crystal-bay", label: "Crystal Bay" },
];
const BOUNCE_PAD_COOLDOWN_FRAMES = 14;
const BOUNCE_PAD_PLAYER_STRENGTH = 24.8;
const BOUNCE_PAD_BOT_STRENGTH = 23.6;
const POWER_UP_DURATION_FRAMES = 8 * 60;
const POWER_UP_RESPAWN_MIN_FRAMES = 6 * 60;
const POWER_UP_RESPAWN_MAX_FRAMES = 11 * 60;
const BOT_DIFFICULTY = {
  baseSpeedBoost: 1.45,
  chaseAcceleration: 0.92,
  fleeAcceleration: 0.98,
  chaseBurstFar: 2.9,
  chaseBurstNear: 1.4,
  fleeBurstFar: 2.6,
  fleeBurstNear: 1.15,
  maxVerticalSearch: 235,
  maxHorizontalSearch: 420,
  predictionFrames: 18,
};

const keys = {
  left: false,
  right: false,
};

let jumpRequested = false;
let cameraY = 0;
let introHintFrames = 210;
let playerJumpSignalId = 0;
let playerJumpSignalVy = 0;
let appPhase = "home";
let playerName = "Player";
let selectedPlayerCharacterId = PLAYER_CHARACTERS[0].id;
let selectedBotCharacterSetId = BOT_CHARACTER_SETS[0].id;
let selectedThemeId = THEMES[0].id;
let selectedPlaceId = PLACE_OPTIONS[0].id;
let currentTheme = THEMES[0];

function buildFloorPlatform() {
  return {
    x: WALL_THICKNESS,
    y: WORLD.height - 32,
    w: WORLD.width - WALL_THICKNESS * 2,
    h: 32,
  };
}

function makePowerUpOnPlatform(platform, type, yOffset = 44, size = 24, bobPhase = 0) {
  return {
    type,
    x: platform.x + platform.w * 0.5 - size * 0.5,
    y: platform.y - yOffset,
    w: size,
    h: size,
    bobPhase,
  };
}

function buildEdgePads(platformList, padWidth = 62, padHeight = 8) {
  const floor = platformList[platformList.length - 1];
  return [
    { x: floor.x, y: floor.y, w: padWidth, h: padHeight },
    { x: floor.x + floor.w - padWidth, y: floor.y, w: padWidth, h: padHeight },
  ];
}

const PLACE_PROFILES = {
  "skyline-run": {
    id: "skyline-run",
    label: "Skyline Run",
    featureText: "Balanced arena with edge launch pads",
    buildPlatforms: () => [
      { x: WALL_THICKNESS + 75, y: WORLD.height - 128, w: 225, h: 18 },
      { x: WORLD.width - WALL_THICKNESS - 300, y: WORLD.height - 128, w: 225, h: 18 },
      { x: WORLD.width / 2 - 115, y: WORLD.height - 218, w: 230, h: 16 },
      { x: WALL_THICKNESS + 170, y: WORLD.height - 315, w: 190, h: 16 },
      { x: WORLD.width - WALL_THICKNESS - 360, y: WORLD.height - 315, w: 190, h: 16 },
      buildFloorPlatform(),
    ],
    buildBouncePads: (plats) => buildEdgePads(plats, 62, 8),
    buildPowerUps: (plats) => [
      makePowerUpOnPlatform(plats[3], "speed", 44, 24, 0),
      makePowerUpOnPlatform(plats[4], "jump", 44, 24, Math.PI * 0.6),
      makePowerUpOnPlatform(plats[2], "speed", 48, 24, Math.PI * 1.1),
    ],
    rules: {},
  },
  "neon-arc": {
    id: "neon-arc",
    label: "Neon Arc",
    featureText: "Low gravity with a center launch pad",
    buildPlatforms: () => [
      { x: WALL_THICKNESS + 68, y: WORLD.height - 130, w: 220, h: 18 },
      { x: WORLD.width - WALL_THICKNESS - 288, y: WORLD.height - 130, w: 220, h: 18 },
      { x: WORLD.width / 2 - 120, y: WORLD.height - 210, w: 240, h: 16 },
      { x: WALL_THICKNESS + 130, y: WORLD.height - 286, w: 170, h: 16 },
      { x: WORLD.width - WALL_THICKNESS - 300, y: WORLD.height - 286, w: 170, h: 16 },
      { x: WORLD.width / 2 - 98, y: WORLD.height - 372, w: 196, h: 16 },
      buildFloorPlatform(),
    ],
    buildBouncePads: (plats) => {
      const pads = buildEdgePads(plats, 60, 8);
      const center = plats[2];
      pads.push({ x: center.x + center.w * 0.5 - 42, y: center.y, w: 84, h: 8 });
      return pads;
    },
    buildPowerUps: (plats) => [
      makePowerUpOnPlatform(plats[5], "jump", 46, 24, 0.2),
      makePowerUpOnPlatform(plats[3], "speed", 42, 24, 0.8),
      makePowerUpOnPlatform(plats[4], "speed", 42, 24, 1.4),
    ],
    rules: {
      gravityScale: 0.84,
      padPlayerScale: 1.1,
      padBotScale: 1.08,
      powerDurationScale: 1.2,
    },
  },
  "aurora-labs": {
    id: "aurora-labs",
    label: "Aurora Labs",
    featureText: "Dense platforms with rapid power-up cycling",
    buildPlatforms: () => [
      { x: WALL_THICKNESS + 60, y: WORLD.height - 126, w: 180, h: 16 },
      { x: WORLD.width - WALL_THICKNESS - 240, y: WORLD.height - 126, w: 180, h: 16 },
      { x: WORLD.width / 2 - 80, y: WORLD.height - 194, w: 160, h: 14 },
      { x: WALL_THICKNESS + 140, y: WORLD.height - 252, w: 130, h: 14 },
      { x: WORLD.width - WALL_THICKNESS - 270, y: WORLD.height - 252, w: 130, h: 14 },
      { x: WORLD.width / 2 - 70, y: WORLD.height - 316, w: 140, h: 14 },
      { x: WALL_THICKNESS + 205, y: WORLD.height - 378, w: 120, h: 14 },
      { x: WORLD.width - WALL_THICKNESS - 325, y: WORLD.height - 378, w: 120, h: 14 },
      buildFloorPlatform(),
    ],
    buildBouncePads: (plats) => {
      const pads = buildEdgePads(plats, 56, 8);
      pads.push({ x: plats[5].x + plats[5].w * 0.5 - 38, y: plats[5].y, w: 76, h: 8 });
      return pads;
    },
    buildPowerUps: (plats) => [
      makePowerUpOnPlatform(plats[2], "jump", 44, 24, 0.1),
      makePowerUpOnPlatform(plats[6], "speed", 40, 24, 0.8),
      makePowerUpOnPlatform(plats[7], "speed", 40, 24, 1.4),
      makePowerUpOnPlatform(plats[5], "jump", 40, 24, 2),
    ],
    rules: {
      botAccelScale: 1.06,
      powerDurationScale: 1.08,
      powerRespawnScale: 0.62,
    },
  },
  "forge-path": {
    id: "forge-path",
    label: "Forge Path",
    featureText: "Heavy gravity and overcharged launch pads",
    buildPlatforms: () => [
      { x: WALL_THICKNESS + 40, y: WORLD.height - 116, w: 260, h: 18 },
      { x: WORLD.width - WALL_THICKNESS - 300, y: WORLD.height - 116, w: 260, h: 18 },
      { x: WORLD.width / 2 - 150, y: WORLD.height - 212, w: 300, h: 18 },
      { x: WALL_THICKNESS + 130, y: WORLD.height - 300, w: 180, h: 16 },
      { x: WORLD.width - WALL_THICKNESS - 310, y: WORLD.height - 300, w: 180, h: 16 },
      { x: WORLD.width / 2 - 92, y: WORLD.height - 392, w: 184, h: 16 },
      buildFloorPlatform(),
    ],
    buildBouncePads: (plats) => {
      const floor = plats[plats.length - 1];
      return [
        { x: floor.x, y: floor.y, w: 56, h: 8 },
        { x: floor.x + floor.w - 56, y: floor.y, w: 56, h: 8 },
        { x: floor.x + floor.w * 0.5 - 60, y: floor.y, w: 120, h: 8 },
      ];
    },
    buildPowerUps: (plats) => [
      makePowerUpOnPlatform(plats[5], "jump", 44, 24, 0.2),
      makePowerUpOnPlatform(plats[2], "speed", 52, 24, 0.9),
      makePowerUpOnPlatform(plats[3], "speed", 42, 24, 1.6),
      makePowerUpOnPlatform(plats[4], "jump", 42, 24, 2.3),
    ],
    rules: {
      gravityScale: 1.2,
      maxFallScale: 1.16,
      playerAccelScale: 0.93,
      padPlayerScale: 1.28,
      padBotScale: 1.24,
    },
  },
  "crystal-bay": {
    id: "crystal-bay",
    label: "Crystal Bay",
    featureText: "Slippery movement and extended power boosts",
    buildPlatforms: () => [
      { x: WALL_THICKNESS + 70, y: WORLD.height - 134, w: 210, h: 16 },
      { x: WORLD.width - WALL_THICKNESS - 280, y: WORLD.height - 134, w: 210, h: 16 },
      { x: WORLD.width / 2 - 150, y: WORLD.height - 214, w: 300, h: 14 },
      { x: WALL_THICKNESS + 120, y: WORLD.height - 292, w: 190, h: 14 },
      { x: WORLD.width - WALL_THICKNESS - 310, y: WORLD.height - 292, w: 190, h: 14 },
      { x: WORLD.width / 2 - 110, y: WORLD.height - 362, w: 220, h: 14 },
      buildFloorPlatform(),
    ],
    buildBouncePads: (plats) => buildEdgePads(plats, 58, 8),
    buildPowerUps: (plats) => [
      makePowerUpOnPlatform(plats[2], "speed", 48, 24, 0.3),
      makePowerUpOnPlatform(plats[5], "jump", 40, 24, 1),
      makePowerUpOnPlatform(plats[3], "speed", 40, 24, 1.8),
      makePowerUpOnPlatform(plats[4], "jump", 40, 24, 2.5),
    ],
    rules: {
      playerFrictionOffset: 0.11,
      botFrictionOffset: 0.08,
      playerAccelScale: 1.04,
      botAccelScale: 1.06,
      powerDurationScale: 1.24,
      powerRespawnScale: 0.88,
    },
  },
};

const DEFAULT_PLACE_RULES = {
  gravityScale: 1,
  maxFallScale: 1,
  playerAccelScale: 1,
  botAccelScale: 1,
  playerFrictionOffset: 0,
  botFrictionOffset: 0,
  playerSpeedBonus: 0,
  botSpeedBonus: 0,
  padPlayerScale: 1,
  padBotScale: 1,
  powerDurationScale: 1,
  powerRespawnScale: 1,
};

function getPlaceProfile(placeId) {
  return PLACE_PROFILES[placeId] || PLACE_PROFILES["skyline-run"];
}

function clonePlatformsForProfile(platformList) {
  return platformList.map((platform) => ({ ...platform }));
}

function cloneBouncePadsForProfile(pads) {
  return pads.map((pad, index) => ({ id: index, ...pad, flashFrames: 0 }));
}

function clonePowerUpsForProfile(powerUpList) {
  return powerUpList.map((powerUp, index) => ({
    id: index,
    ...powerUp,
    active: true,
    respawnFrames: 0,
    bobPhase: typeof powerUp.bobPhase === "number" ? powerUp.bobPhase : index * 0.8,
  }));
}

function chooseRandomPlaceId() {
  const randomIndex = Math.floor(Math.random() * PLACE_OPTIONS.length);
  return PLACE_OPTIONS[randomIndex].id;
}

let currentPlaceProfile = getPlaceProfile(selectedPlaceId);
let currentPlaceRules = { ...DEFAULT_PLACE_RULES, ...(currentPlaceProfile.rules || {}) };
let platforms = clonePlatformsForProfile(currentPlaceProfile.buildPlatforms());
let bouncePads = cloneBouncePadsForProfile(currentPlaceProfile.buildBouncePads(platforms));
let powerUps = clonePowerUpsForProfile(currentPlaceProfile.buildPowerUps(platforms));
const hazards = [];

const playerSpawn = {
  x: platforms[0].x + platforms[0].w / 2 - PLAYER_WIDTH / 2,
  y: platforms[0].y - 50,
};

function rebuildArenaForPlace(placeId) {
  const profile = getPlaceProfile(placeId);
  selectedPlaceId = profile.id;
  currentPlaceProfile = profile;
  currentPlaceRules = { ...DEFAULT_PLACE_RULES, ...(profile.rules || {}) };
  platforms = clonePlatformsForProfile(profile.buildPlatforms());
  bouncePads = cloneBouncePadsForProfile(profile.buildBouncePads(platforms));
  powerUps = clonePowerUpsForProfile(profile.buildPowerUps(platforms));

  const spawnPlatform = platforms[0] || platforms[platforms.length - 1];
  playerSpawn.x = spawnPlatform.x + spawnPlatform.w / 2 - PLAYER_WIDTH / 2;
  playerSpawn.y = spawnPlatform.y - 50;

  if (typeof player !== "undefined") {
    player.spawnX = playerSpawn.x;
    player.spawnY = playerSpawn.y;
  }

  updateSelectedPlaceLabel();
  refreshPlaceTapeSelection();
}

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
  speedBoostFrames: 0,
  jumpBoostFrames: 0,
  padCooldown: 0,
};

function createBot(index) {
  const width = 14 + index * 2;
  const height = 40 + index * 4;
  const botSet = getSelectedBotCharacterSet();
  const spawnSlots = [
    platforms[0].x + 20,
    WORLD.width / 2 - width / 2,
    platforms[1].x + platforms[1].w - width - 20,
  ];
  const tintHue = (index * 37 + 40 + botSet.hueShift + 360) % 360;
  const tintSat = clamp(58 + (index % 3) * 12 + botSet.satShift, 26, 94);
  const tintLight = clamp(46 + (index % 3) * 8 + botSet.lightShift, 26, 82);

  return {
    id: index,
    name: BOT_NAMES[index] ?? `Bot ${index + 1}`,
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
    maxSpeed: 6.9 - width * 0.03 + BOT_DIFFICULTY.baseSpeedBoost * 0.35,
    jumpStrength: 12.6 + (height - 40) * 0.08,
    jumpCooldown: 0,
    copyJumpLag: 0,
    copyJumpTimer: 0,
    queuedJumpId: 0,
    lastCopiedJumpId: 0,
    chaseRetargetTimer: 0,
    prefersPlayerTarget: true,
    speedBoostFrames: 0,
    jumpBoostFrames: 0,
    padCooldown: 0,
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
  "./purple-spiral.svg",
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

function sanitizePlayerName(value) {
  const cleaned = (value || "").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 16);
  return cleaned.length > 0 ? cleaned : "Player";
}

function getSelectedPlayerCharacter() {
  return PLAYER_CHARACTERS.find((option) => option.id === selectedPlayerCharacterId) || PLAYER_CHARACTERS[0];
}

function getSelectedBotCharacterSet() {
  return BOT_CHARACTER_SETS.find((option) => option.id === selectedBotCharacterSetId) || BOT_CHARACTER_SETS[0];
}

function getSelectedTheme() {
  return THEMES.find((option) => option.id === selectedThemeId) || THEMES[0];
}

function getSelectedPlace() {
  return PLACE_OPTIONS.find((option) => option.id === selectedPlaceId) || PLACE_OPTIONS[0];
}

function applyTheme(themeId) {
  selectedThemeId = themeId;
  const theme = getSelectedTheme();
  currentTheme = theme;
  document.documentElement.style.setProperty("--app-bg", theme.bodyBackground);
  document.documentElement.style.setProperty("--subtitle-color", theme.subtitleColor);
  document.documentElement.style.setProperty("--hud-border", theme.hudBorder);
  document.documentElement.style.setProperty("--hud-bg", theme.hudBg);
  document.documentElement.style.setProperty("--home-bg", theme.homeBg);
  document.documentElement.style.setProperty("--home-accent", theme.accent);
}

function setHomeScreenVisible(visible) {
  if (homeScreen) {
    homeScreen.hidden = !visible;
  }
}

function updateHomeHud() {
  hudStatus.textContent = "Enter your name, pick character/theme, then start - place is random every run";
}

function applyHomeSlotImage() {
  if (!slotSpiralImage) {
    return;
  }

  const options = [
    "./purple-spiral.png",
    "./purple spiral.png",
    "./purple_spiral.png",
    "./purple-spiral.svg",
  ];
  let index = 0;

  const tryLoad = () => {
    if (index >= options.length) {
      return;
    }
    slotSpiralImage.src = options[index];
    index += 1;
  };

  slotSpiralImage.onerror = tryLoad;
  tryLoad();
}

function renderChoiceButtons(container, options, selectedId, onSelect) {
  if (!container) {
    return;
  }

  container.innerHTML = "";
  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `choice-btn${option.id === selectedId ? " selected" : ""}`;
    button.textContent = option.label;
    button.addEventListener("click", () => onSelect(option.id));
    container.appendChild(button);
  }
}

function updateSelectedPlaceLabel() {
  if (selectedPlaceLabel) {
    selectedPlaceLabel.textContent = getSelectedPlace().label;
  }
}

function refreshPlaceTapeSelection() {
  if (!placeTapeTrack) {
    return;
  }

  const cards = placeTapeTrack.querySelectorAll(".place-card");
  for (const card of cards) {
    card.classList.toggle("selected", card.dataset.placeId === selectedPlaceId);
  }
}

function renderPlaceTape() {
  if (!placeTapeTrack) {
    return;
  }

  placeTapeTrack.innerHTML = "";
  const tapePlaces = [...PLACE_OPTIONS, ...PLACE_OPTIONS];
  for (const place of tapePlaces) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "place-card";
    card.dataset.placeId = place.id;
    card.textContent = place.label;
    card.disabled = true;
    card.title = "Random place each run";
    placeTapeTrack.appendChild(card);
  }

  updateSelectedPlaceLabel();
  refreshPlaceTapeSelection();
}

function renderHomeOptions() {
  renderChoiceButtons(playerCharacterOptions, PLAYER_CHARACTERS, selectedPlayerCharacterId, (id) => {
    selectedPlayerCharacterId = id;
    renderHomeOptions();
  });

  renderChoiceButtons(botCharacterOptions, BOT_CHARACTER_SETS, selectedBotCharacterSetId, (id) => {
    selectedBotCharacterSetId = id;
    renderHomeOptions();
  });

  renderChoiceButtons(themeOptions, THEMES, selectedThemeId, (id) => {
    applyTheme(id);
    renderHomeOptions();
  });

  renderPlaceTape();
}

function openHomeScreen() {
  appPhase = "home";
  keys.left = false;
  keys.right = false;
  jumpRequested = false;
  setHomeScreenVisible(true);
  updateHomeHud();

  if (playerNameInput) {
    playerNameInput.value = playerName;
    playerNameInput.focus();
    playerNameInput.select();
  }
}

function startGameFromHome() {
  playerName = sanitizePlayerName(playerNameInput ? playerNameInput.value : playerName);
  if (playerNameInput) {
    playerNameInput.value = playerName;
  }

  appPhase = "game";
  setHomeScreenVisible(false);
  resetGame();
}

function initializeHomeScreen() {
  applyTheme(selectedThemeId);
  setHomeScreenVisible(true);
  updateHomeHud();
  renderHomeOptions();

  if (playerNameInput) {
    playerNameInput.value = playerName;
    playerNameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        startGameFromHome();
        event.preventDefault();
      }
    });
  }

  if (gameSlotPlay) {
    gameSlotPlay.addEventListener("click", startGameFromHome);
  }

  applyHomeSlotImage();
}

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

function getPredictedFocusX(focusEntity, mode) {
  const centerX = getEntityCenterX(focusEntity);
  const leadFrames = mode === "chase" ? BOT_DIFFICULTY.predictionFrames : 10;
  const vx = typeof focusEntity.vx === "number" ? focusEntity.vx : 0;
  const lead = clamp(vx * leadFrames, -155, 155);
  return clamp(centerX + lead, WALL_THICKNESS + 8, WORLD.width - WALL_THICKNESS - 8);
}

function randomRangeInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function getCurrentGravity() {
  return GRAVITY * currentPlaceRules.gravityScale;
}

function getCurrentMaxFallSpeed() {
  return MAX_FALL_SPEED * currentPlaceRules.maxFallScale;
}

function getCurrentPadStrength(forBot) {
  return (forBot ? BOUNCE_PAD_BOT_STRENGTH : BOUNCE_PAD_PLAYER_STRENGTH) *
    (forBot ? currentPlaceRules.padBotScale : currentPlaceRules.padPlayerScale);
}

function getEntityMaxSpeed(entity) {
  const placeBonus = entity === player ? currentPlaceRules.playerSpeedBonus : currentPlaceRules.botSpeedBonus;
  return entity.maxSpeed + (entity.speedBoostFrames > 0 ? 2.35 : 0) + placeBonus;
}

function getEntityJumpStrength(entity) {
  return entity.jumpStrength + (entity.jumpBoostFrames > 0 ? 3 : 0);
}

function updateEntityPowerTimers(entity) {
  if (entity.speedBoostFrames > 0) {
    entity.speedBoostFrames -= 1;
  }

  if (entity.jumpBoostFrames > 0) {
    entity.jumpBoostFrames -= 1;
  }

  if (entity.padCooldown > 0) {
    entity.padCooldown -= 1;
  }
}

function getPowerUpY(powerUp) {
  return powerUp.y + Math.sin(powerUp.bobPhase) * 4;
}

function applyPowerUp(entity, type) {
  const durationFrames = Math.max(120, Math.round(POWER_UP_DURATION_FRAMES * currentPlaceRules.powerDurationScale));

  if (type === "speed") {
    entity.speedBoostFrames = durationFrames;
    return;
  }

  if (type === "jump") {
    entity.jumpBoostFrames = durationFrames;
  }
}

function resetPowerUps() {
  for (const powerUp of powerUps) {
    powerUp.active = true;
    powerUp.respawnFrames = 0;
    powerUp.bobPhase = (powerUp.id + 1) * 0.9;
  }
}

function updatePowerUps() {
  const participants = getParticipants();
  if (participants.length === 0) {
    return;
  }

  for (const powerUp of powerUps) {
    powerUp.bobPhase += 0.07;

    if (!powerUp.active) {
      if (powerUp.respawnFrames > 0) {
        powerUp.respawnFrames -= 1;
      } else {
        powerUp.active = true;
      }
      continue;
    }

    const pickup = {
      x: powerUp.x,
      y: getPowerUpY(powerUp),
      w: powerUp.w,
      h: powerUp.h,
    };

    for (const participant of participants) {
      if (!intersects(participant.entity, pickup)) {
        continue;
      }

      applyPowerUp(participant.entity, powerUp.type);
      powerUp.active = false;
      const baseRespawn = randomRangeInt(POWER_UP_RESPAWN_MIN_FRAMES, POWER_UP_RESPAWN_MAX_FRAMES);
      powerUp.respawnFrames = Math.max(90, Math.round(baseRespawn * currentPlaceRules.powerRespawnScale));
      break;
    }
  }
}

function updateBouncePads() {
  for (const pad of bouncePads) {
    if (pad.flashFrames > 0) {
      pad.flashFrames -= 1;
    }
  }
}

function tryBounceFromPads(entity, launchStrength) {
  if (entity.padCooldown > 0) {
    return;
  }

  const centerX = getEntityCenterX(entity);
  const feetY = entity.y + entity.h;
  for (const pad of bouncePads) {
    const insidePad = centerX >= pad.x + 6 && centerX <= pad.x + pad.w - 6;
    if (!insidePad) {
      continue;
    }

    const nearSurface = Math.abs(feetY - pad.y) <= 7;
    if (!nearSurface || entity.vy < -1.2) {
      continue;
    }

    entity.y = pad.y - entity.h - 0.01;
    entity.vy = -launchStrength;
    entity.onGround = false;
    entity.jumpsUsed = 0;
    entity.padCooldown = BOUNCE_PAD_COOLDOWN_FRAMES;
    pad.flashFrames = 10;
    return;
  }
}

function getPlayerPowerUpLabel() {
  if (!player.alive) {
    return "Out";
  }

  const active = [];
  if (player.speedBoostFrames > 0) {
    active.push("Speed");
  }
  if (player.jumpBoostFrames > 0) {
    active.push("Jump");
  }

  return active.length > 0 ? active.join("+") : "None";
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
    return playerName;
  }

  if (state.winnerType === "bot") {
    return getBotDisplayName(state.winnerBotId);
  }

  return "Nobody";
}

function getHolderLabel(holder) {
  if (!holder) {
    return "None";
  }

  if (holder.type === "player") {
    return playerName;
  }

  return getBotDisplayName(holder.botId);
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
  hudStatus.textContent =
    `Timer: ${secondsLeft}s | Alive: ${aliveCount} | Holder: ${getHolderLabel(holder)} | Place: ${getSelectedPlace().label} | Power: ${getPlayerPowerUpLabel()}`;
}

function getEliminationTarget() {
  return getParticipantByRef(state.eliminationTargetType, state.eliminationTargetBotId);
}

function getBotDisplayName(botId) {
  const bot = bots.find((candidate) => candidate.id === botId);
  if (!bot) {
    return `Bot ${botId + 1}`;
  }

  return bot.name || `Bot ${botId + 1}`;
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
    player.speedBoostFrames = 0;
    player.jumpBoostFrames = 0;
    player.padCooldown = 0;
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
  bot.speedBoostFrames = 0;
  bot.jumpBoostFrames = 0;
  bot.padCooldown = 0;
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
  player.speedBoostFrames = 0;
  player.jumpBoostFrames = 0;
  player.padCooldown = 0;
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
  rebuildArenaForPlace(chooseRandomPlaceId());
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
  resetPowerUps();
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
  updateEntityPowerTimers(player);

  const acceleration = 0.72 * currentPlaceRules.playerAccelScale;
  const friction = clamp(0.82 + currentPlaceRules.playerFrictionOffset, 0.72, 0.97);
  const effectiveMaxSpeed = getEntityMaxSpeed(player);
  const effectiveJumpStrength = getEntityJumpStrength(player);

  if (keys.left) {
    player.vx -= acceleration;
  }

  if (keys.right) {
    player.vx += acceleration;
  }

  if (!keys.left && !keys.right) {
    player.vx *= friction;
  }

  player.vx = clamp(player.vx, -effectiveMaxSpeed, effectiveMaxSpeed);
  if (Math.abs(player.vx) < 0.04) {
    player.vx = 0;
  }

  if (jumpRequested && player.jumpsUsed < player.maxJumps) {
    player.vy = -effectiveJumpStrength;
    player.onGround = false;
    player.jumpsUsed += 1;
    emitPlayerJumpSignal(player.vy);
  }
  jumpRequested = false;

  player.vy = Math.min(player.vy + getCurrentGravity(), getCurrentMaxFallSpeed());

  player.x += player.vx;
  resolveHorizontalCollisions(player, platforms);
  keepInsideWalls(player);

  player.y += player.vy;
  resolveVerticalCollisions(player, platforms);
  tryBounceFromPads(player, getCurrentPadStrength(false));

  if (player.y < 0) {
    player.y = 0;
    player.vy = 0;
  }

  if (player.y > WORLD.height + 120) {
    const floor = platforms[platforms.length - 1];
    player.y = floor.y - player.h;
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
      bot.prefersPlayerTarget = playerTarget ? nonPlayerTargets.length === 0 || Math.random() < 0.92 : false;
      bot.chaseRetargetTimer = 10;
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
  const focusCenterX = getPredictedFocusX(focusEntity, mode);
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
    if (verticalGap > BOT_DIFFICULTY.maxVerticalSearch) {
      continue;
    }

    const aimX =
      mode === "chase"
        ? clamp(focusCenterX, platform.x + 8, platform.x + platform.w - 8)
        : fleeDirection > 0
          ? platform.x + platform.w - 8
          : platform.x + 8;

    const distanceToAim = Math.abs(aimX - botCenterX);
    if (distanceToAim > BOT_DIFFICULTY.maxHorizontalSearch) {
      continue;
    }

    const verticalToFocus = Math.abs(platform.y - focusEntity.y);
    const distanceFromFocus = Math.abs(aimX - focusCenterX);
    const score =
      mode === "chase"
        ? distanceToAim * 0.52 + verticalGap * 0.34 + verticalToFocus * 0.28
        : distanceToAim * 0.34 + verticalGap * 0.16 - distanceFromFocus * 1.2 + verticalToFocus * 0.04;

    if (score < bestScore) {
      bestScore = score;
      best = { platform, aimX };
    }
  }

  return best;
}

function updateSingleBot(bot) {
  updateEntityPowerTimers(bot);

  const behavior = getBotBehavior(bot);
  const focusEntity = behavior.targetEntity;
  const focusCenterX = getEntityCenterX(focusEntity);
  const botCenterX = getEntityCenterX(bot);
  const predictedFocusX = getPredictedFocusX(focusEntity, behavior.mode);
  const effectiveJumpStrength = getEntityJumpStrength(bot);
  const target = chooseBotTargetPlatform(bot, focusEntity, behavior.mode);
  let targetX = target ? target.aimX : predictedFocusX;

  if (behavior.mode === "flee" && !target) {
    const fleeDirection = Math.sign(botCenterX - focusCenterX) || (botCenterX < WORLD.width * 0.5 ? -1 : 1);
    targetX = botCenterX + fleeDirection * 250;
  } else if (behavior.mode === "chase" && target) {
    targetX = target.aimX * 0.62 + predictedFocusX * 0.38;
  }

  const acceleration =
    (behavior.mode === "chase" ? BOT_DIFFICULTY.chaseAcceleration : BOT_DIFFICULTY.fleeAcceleration) *
    currentPlaceRules.botAccelScale;
  const friction = clamp(0.9 + currentPlaceRules.botFrictionOffset, 0.78, 0.98);

  let intentX = Math.sign(targetX - botCenterX);
  if (Math.abs(targetX - botCenterX) < 3) {
    intentX = 0;
  }

  if (intentX !== 0) {
    bot.vx += intentX * acceleration;
  } else {
    bot.vx *= friction;
  }

  if (behavior.mode === "chase" && intentX !== 0 && Math.abs(bot.vx) < 1.3) {
    bot.vx = intentX * 1.3;
  }

  const distanceToTargetX = Math.abs(targetX - botCenterX);
  let dynamicMaxSpeed =
    getEntityMaxSpeed(bot) +
    (behavior.mode === "chase"
      ? distanceToTargetX > 120
        ? BOT_DIFFICULTY.chaseBurstFar
        : BOT_DIFFICULTY.chaseBurstNear
      : distanceToTargetX > 120
        ? BOT_DIFFICULTY.fleeBurstFar
        : BOT_DIFFICULTY.fleeBurstNear);

  if (behavior.mode === "chase" && focusEntity === player) {
    dynamicMaxSpeed += 0.7;
  }

  if (behavior.mode === "flee" && focusEntity === player) {
    dynamicMaxSpeed += 0.55;
  }

  bot.vx = clamp(bot.vx, -dynamicMaxSpeed, dynamicMaxSpeed);
  if (Math.abs(bot.vx) < 0.03) {
    bot.vx = 0;
  }

  if (bot.jumpCooldown > 0) {
    bot.jumpCooldown = Math.max(0, bot.jumpCooldown - 1.2);
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
          Math.max(9.2, effectiveJumpStrength - 1.5),
          effectiveJumpStrength + 1.8
        );
        bot.vy = -copiedStrength;
        bot.onGround = false;
        bot.jumpsUsed += 1;
        bot.jumpCooldown = 4;
      }

      bot.lastCopiedJumpId = bot.queuedJumpId;
      bot.queuedJumpId = 0;
    }
  }

  const focusAboveBot = focusEntity.y < bot.y - 24;
  const focusNearX = Math.abs(focusCenterX - botCenterX) < 110;
  const verticalDelta = focusEntity.y - bot.y;
  const chaseNeedsLift = behavior.mode === "chase" && (focusAboveBot || Math.abs(verticalDelta) > 20);
  const fleeNeedsLift = behavior.mode === "flee" && (focusNearX || Math.abs(verticalDelta) < 72);
  if (bot.onGround && bot.jumpCooldown <= 0 && bot.queuedJumpId === 0 && (chaseNeedsLift || fleeNeedsLift)) {
    bot.vy = -(effectiveJumpStrength + 0.5);
    bot.onGround = false;
    bot.jumpsUsed = 1;
    bot.jumpCooldown = 6;
  } else if (!bot.onGround && bot.jumpCooldown <= 0 && bot.jumpsUsed < bot.maxJumps) {
    const shouldAirJump =
      behavior.mode === "chase"
        ? verticalDelta < -16 || Math.abs(targetX - botCenterX) > 72
        : focusNearX || verticalDelta < -20;
    if (shouldAirJump && bot.vy > -2.4) {
      bot.vy = -(effectiveJumpStrength - 0.75);
      bot.jumpsUsed += 1;
      bot.jumpCooldown = 6;
    }
  }

  bot.vy = Math.min(bot.vy + getCurrentGravity(), getCurrentMaxFallSpeed());

  bot.x += bot.vx;
  resolveHorizontalCollisions(bot, platforms);
  keepInsideWalls(bot);

  bot.y += bot.vy;
  resolveVerticalCollisions(bot, platforms);
  tryBounceFromPads(bot, getCurrentPadStrength(true));

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
  if (appPhase !== "game") {
    return;
  }

  if (state.mode === "playing") {
    updateBouncePads();

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
      updatePowerUps();
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
  sky.addColorStop(0, currentTheme.skyTop);
  sky.addColorStop(0.45, currentTheme.skyMid);
  sky.addColorStop(1, currentTheme.skyBottom);
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
    ctx.fillStyle = currentTheme.wallDark;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = currentTheme.wallLight;
    for (let y = wall.y + 14; y < wall.h; y += 44) {
      ctx.fillRect(wall.x + 5, y, wall.w - 10, 4);
    }
  }
}

function drawPlatforms() {
  for (const platform of platforms) {
    ctx.fillStyle = currentTheme.platformBase;
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
    ctx.fillStyle = currentTheme.platformTop;
    ctx.fillRect(platform.x, platform.y, platform.w, 6);
  }
}

function drawBouncePads() {
  for (const pad of bouncePads) {
    const flash = pad.flashFrames / 10;
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 175, 74, ${0.24 + flash * 0.44})`;
      ctx.fillRect(pad.x - 6, pad.y - 10, pad.w + 12, pad.h + 14);
    }

    ctx.fillStyle = "#eb7e1e";
    ctx.fillRect(pad.x, pad.y - 5, pad.w, pad.h);
    ctx.fillStyle = "#ffd59e";
    ctx.fillRect(pad.x + 6, pad.y - 3, pad.w - 12, 3);
  }
}

function drawPowerUps() {
  for (const powerUp of powerUps) {
    if (!powerUp.active) {
      continue;
    }

    const y = getPowerUpY(powerUp);
    const centerX = powerUp.x + powerUp.w * 0.5;
    const centerY = y + powerUp.h * 0.5;
    const pulse = (Math.sin(powerUp.bobPhase * 2.2) + 1) * 0.5;
    const color = powerUp.type === "speed" ? "#6eefff" : "#ffd46b";
    const glyph = powerUp.type === "speed" ? "S" : "J";

    ctx.fillStyle = `rgba(255, 255, 255, ${0.12 + pulse * 0.18})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, powerUp.w * 0.62 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, powerUp.w * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(20, 29, 61, 0.95)";
    ctx.font = "700 14px \"Segoe UI\", sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(glyph, centerX, centerY + 5);
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

    ctx.fillStyle = "rgba(15, 22, 46, 0.78)";
    ctx.fillRect(bot.x - 10, bot.y - 20, bot.w + 20, 14);
    ctx.fillStyle = "#f4f7ff";
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(bot.name, bot.x + bot.w * 0.5, bot.y - 9);
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

  const playerCharacter = getSelectedPlayerCharacter();
  ctx.fillStyle = playerCharacter.primary;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.fillStyle = playerCharacter.accent;
  ctx.fillRect(player.x + 6, player.y + 6, player.w - 12, player.h - 12);

  ctx.fillStyle = playerCharacter.eye;
  ctx.fillRect(player.x + 11, player.y + 15, 6, 6);
  ctx.fillRect(player.x + player.w - 17, player.y + 15, 6, 6);

  ctx.fillStyle = "rgba(15, 22, 46, 0.78)";
  ctx.fillRect(player.x - 10, player.y - 20, player.w + 20, 14);
  ctx.fillStyle = "#f4f7ff";
  ctx.font = '700 11px "Segoe UI", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(playerName, player.x + player.w * 0.5, player.y - 9);
}

function drawTextCenter(y, text, size = 36, color = "#f7f9ff") {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, y);
}

function drawScreenTimer() {
  if (appPhase !== "game") {
    return;
  }

  const rawSeconds = Math.ceil(state.roundFramesRemaining / 60);
  const secondsLeft = state.mode === "finished" ? 0 : Math.max(0, rawSeconds);
  const timerText = `${String(secondsLeft).padStart(2, "0")}s`;
  const x = canvas.width - 166;
  const y = 20;
  const w = 146;
  const h = 52;

  ctx.fillStyle = currentTheme.timerBox;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = currentTheme.timerStroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = currentTheme.timerLabel;
  ctx.font = '600 12px "Segoe UI", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("TIMER", x + w / 2, y + 16);

  ctx.fillStyle = currentTheme.timerText;
  ctx.font = '800 24px "Segoe UI", sans-serif';
  ctx.fillText(timerText, x + w / 2, y + 43);
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
  ctx.fillText(`${getSelectedPlace().label}: ${currentPlaceProfile.featureText}`, canvas.width / 2, 48);
}

function draw() {
  drawBackground();

  ctx.save();
  ctx.translate(0, -cameraY);
  drawWalls();
  drawPlatforms();
  drawBouncePads();
  drawPowerUps();
  drawHazards();
  drawEliminationSpiral();
  drawBots();
  drawPlayer();
  drawTokenIcon();
  ctx.restore();

  drawIntroHint();
  drawScreenTimer();
  drawOverlay();
}

function keyIsJump(key) {
  return key === "w" || key === "arrowup" || key === " " || key === "space" || key === "spacebar";
}

function keyDownHandler(event) {
  const key = event.key.toLowerCase();

  if (appPhase !== "game") {
    if (key === "enter") {
      startGameFromHome();
      event.preventDefault();
    }
    return;
  }

  if (key === "h") {
    openHomeScreen();
    event.preventDefault();
    return;
  }

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
  if (appPhase !== "game") {
    return;
  }

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

initializeHomeScreen();
requestAnimationFrame(gameLoop);
