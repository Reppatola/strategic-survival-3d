// === РАЗМЕРЫ ЭКРАНА ===
export const GAME_WIDTH = window.innerWidth;
export const GAME_HEIGHT = window.innerHeight;

// === МИР ===
export const WORLD = {
  halfSize: 195,        // половина размера мира
  groundColor: 0x5d8a48,
  fogColor: 0x9db8c4,
  fogNear: 70,
  fogFar: 170,
};

// === КАМЕРА (one-point perspective) ===
export const CAMERA = {
  fov: 65,              // широкий угол = сильная перспектива
  height: 22,           // высота над героем
  near: 0.1,
  far: 400,
  followLerp: 5,        // скорость следования за героем
};

// === ИГРОК ===
export const PLAYER = {
  walkSpeed: 6,
  sprintSpeed: 10.5,
  crouchSpeed: 3,
  radius: 0.7,           // радиус для коллизий
  modelScale: 0.7,       // ← масштаб модели героя (было 1.0, стало меньше)
};

// === ШУМ (dB) — из VISION.md ===
export const NOISE_DB = {
  max: 150,
  base: { crouch: 30, walk: 50, sprint: 70 },
  critical: 120,
};

// === СВЕТ ===
export const LIGHT = {
  ambientColor: 0xcfe8ff,
  ambientGround: 0x54452e,
  ambientIntensity: 0.85,
  sunColor: 0xfff2dd,
  sunIntensity: 1.6,
};