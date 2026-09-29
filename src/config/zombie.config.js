// Типы зомби.
//
// vision.idle  — широкий обзор в покое (жёлтый конус)
// vision.focus — узкий, но дальний в охоте (красный узкий конус)
//
// FOCUS активируется в ALERT / SEARCH / CHASE.

export const ZOMBIE_TYPES = {
    walker: {
        name: 'walker',
        speed: 3.2,
        chaseSpeed: 3.2,
        hp: 100,
        color: 0x6a9a4b,
        colorHead: 0x8ab86a,

        vision: {
            idle:  { range: 30, angle: 120 },
            focus: { range: 50, angle: 50 },
        },
        hearing: { threshold: 40, angle: 200, sensitivity: 1.0 },
        smell:   { range: 5, angle: 360, lock: false },
        scream:  null,

        alert:  { base: 0.8, silencePenalty: 1.0 },
        search: { base: 5, persistence: 1.0, radius: 4 },
    },

    sniffer: {
        name: 'sniffer',
        speed: 2.4,
        chaseSpeed: 2.4,
        hp: 100,
        color: 0x7a6a3a,
        colorHead: 0x9a8a5a,

        vision: {
            idle:  { range: 12, angle: 120 },
            focus: { range: 20, angle: 50 },
        },
        hearing: { threshold: 50, angle: 200, sensitivity: 0.8 },
        smell:   { range: 45, angle: 90, lock: true },  // не теряет след
        scream:  null,

        alert:  { base: 1.1, silencePenalty: 1.0 },
        search: { base: 5, persistence: 0.6, radius: 6 },
    },

    listener: {
        name: 'listener',
        speed: 1.5,
        chaseSpeed: 4.5,
        hp: 80,
        color: 0x4b7a9a,
        colorHead: 0x6a9aba,

        vision: {
            idle:  { range: 15, angle: 120 },
            focus: { range: 30, angle: 45 },   // самая дальняя «труба»
        },
        hearing: { threshold: 20, angle: 260, sensitivity: 1.0 },
        smell:   { range: 5, angle: 360, lock: false },
        scream:  null,

        alert:  { base: 0.5, silencePenalty: 1.0 },
        search: { base: 5, persistence: 2.0, radius: 8 },
    },

    screamer: {
        name: 'screamer',
        speed: 2.5,
        chaseSpeed: 2.5,
        hp: 60,
        color: 0x9a4b4b,
        colorHead: 0xba6a6a,

        vision: {
            idle:  { range: 25, angle: 120 },
            focus: { range: 40, angle: 50 },
        },
        hearing: { threshold: 30, angle: 200, sensitivity: 1.2 },
        smell:   { range: 6, angle: 360, lock: false },
        scream:  { cooldown: 4 },

        alert:  { base: 1.4, silencePenalty: 1.0 },
        search: { base: 5, persistence: 2.0, radius: 6 },
    },
};

export const ZOMBIE = {
    attackRange: 1.4,
    attackDamage: 10,
    attackCooldown: 1.0,

    hearingThresholdFallback: 40,
    confidenceGain: 0.8,
    confidenceDecay: 0.4,
    confidenceTrigger: 0.5,

    rearHearingPenalty: 15,

    searchTimeout: 6,
    arrivalDist: 1.0,
    confidenceAlertBonus: 0.5,
    chaseLossTimeout: 1.5,
    chaseJumpConfidence: 0.7,

    // Сколько секунд зомби «смотрит вдаль» после того, как увидел информанта,
    // прежде чем сдаться и вернуться в IDLE
    informantWatchTime: 3.0,
};