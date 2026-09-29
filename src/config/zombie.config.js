// Типы зомби.
//
// vision.angle — ПОЛНЫЙ угол конуса в градусах (60 = ±30°).
// walker:  120° = широкий обзор, как у человека.
// sniffer: 100° = чуть уже, но нюх сильный.
// listener: 100° = средний.
// screamer: 140° = очень широкий.

export const ZOMBIE_TYPES = {
    walker: {
        name: 'walker',
        speed: 3.2,
        hp: 100,
        color: 0x6a9a4b,
        colorHead: 0x8ab86a,
        vision:  { range: 30, angle: 120 },
        hearing: { sensitivity: 1.0 },
        smell:   { range: 8, angle: 180 },   // слабый, круговой
        scream:  null,
        alert:  { base: 0.8, silencePenalty: 1.0 },
        search: { base: 5,   persistence: 1.0, radius: 4 },
    },

    sniffer: {
        name: 'sniffer',
        speed: 2.4,
        hp: 100,
        color: 0x7a6a3a,
        colorHead: 0x9a8a5a,
        vision:  { range: 12, angle: 100 },
        hearing: { sensitivity: 0.6 },
        smell:   { range: 45, angle: 90 },   // сильный, направленный
        scream:  null,
        alert:  { base: 1.1, silencePenalty: 1.0 },
        search: { base: 5,   persistence: 0.6, radius: 6 },
    },

    listener: {
        name: 'listener',
        speed: 3.6,
        hp: 80,
        color: 0x4b7a9a,
        colorHead: 0x6a9aba,
        vision:  { range: 15, angle: 100 },
        hearing: { sensitivity: 2.5 },
        smell:   { range: 10, angle: 180 },
        scream:  null,
        alert:  { base: 0.5, silencePenalty: 1.0 },
        search: { base: 5,   persistence: 2.0, radius: 8 },
    },

    screamer: {
        name: 'screamer',
        speed: 2.5,
        hp: 60,
        color: 0x9a4b4b,
        colorHead: 0xba6a6a,
        vision:  { range: 25, angle: 140 },
        hearing: { sensitivity: 1.2 },
        smell:   { range: 12, angle: 180 },
        scream:  { cooldown: 4, range: 25 },
        alert:  { base: 1.4, silencePenalty: 1.0 },
        search: { base: 5,   persistence: 2.0, radius: 6 },
    },
};

export const ZOMBIE = {
    attackRange: 1.4,
    attackDamage: 10,
    attackCooldown: 1.0,

    hearingThreshold: 18,
    confidenceGain: 0.8,
    confidenceDecay: 0.4,
    confidenceTrigger: 0.5,

    searchTimeout: 6,
    arrivalDist: 1.0,

    confidenceAlertBonus: 0.5,
    chaseLossTimeout: 1.5,
    chaseJumpConfidence: 0.7,
};