// Типы зомби.
//
// vision:  { range, angle }     — угол полного конуса
// hearing: { threshold, angle, sensitivity }
//          threshold — порог dB, ниже которого зомби глух
//          angle     — полный угол слуха (сзади глухо)
// smell:   { range, angle }     — большой радиус = по шлейфу, малый = по позиции
// scream:  { cooldown }         — только если есть, зомби кричит при виде игрока

export const ZOMBIE_TYPES = {
    walker: {
        name: 'walker',
        speed: 3.2,
        chaseSpeed: 3.2,
        hp: 100,
        color: 0x6a9a4b,
        colorHead: 0x8ab86a,

        vision:  { range: 30, angle: 120 },
        hearing: { threshold: 40, angle: 200, sensitivity: 1.0 },
        smell:   { range: 5, angle: 360 },
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

        vision:  { range: 12, angle: 120 },
        hearing: { threshold: 50, angle: 200, sensitivity: 0.8 },
        smell:   { range: 45, angle: 90 },
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

        vision:  { range: 15, angle: 120 },
        hearing: { threshold: 20, angle: 260, sensitivity: 1.0 },
        smell:   { range: 5, angle: 360 },
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

        vision:  { range: 25, angle: 120 },
        hearing: { threshold: 30, angle: 200, sensitivity: 1.2 },
        smell:   { range: 6, angle: 360 },
        scream:  { cooldown: 4 },

        alert:  { base: 1.4, silencePenalty: 1.0 },
        search: { base: 5, persistence: 2.0, radius: 6 },
    },
};

export const ZOMBIE = {
    attackRange: 1.4,
    attackDamage: 10,
    attackCooldown: 1.0,

    hearingThresholdFallback: 40,   // если у типа нет hearing.threshold
    confidenceGain: 0.8,
    confidenceDecay: 0.4,
    confidenceTrigger: 0.5,

    // Штраф к слуху, если источник сзади (за углом слуха)
    rearHearingPenalty: 15,

    searchTimeout: 6,
    arrivalDist: 1.0,
    confidenceAlertBonus: 0.5,
    chaseLossTimeout: 1.5,
    chaseJumpConfidence: 0.7,
};