// Физическая модель шума.
// Каждый импульс: L0 (стартовый dB), k (затухание, dB/сек).
// Непрерывная база — от движения.
// Формула суммы: LΣ = 10·log10( Σ 10^(Li/10) )

export const NOISE = {
    // --- Непрерывная база от движения ---
    base: {
        crouch: 30,
        walk: 50,
        sprint: 70,
    },

    // --- Импульсы ---
    // level — стартовый dB, decay — dB/сек, "слышен до 18 dB" вычисляется
    impulses: {
        melee:       { name: 'melee',       level: 20,  decay: 80 },
        door:        { name: 'door',        level: 15,  decay: 80 },
        axe:         { name: 'axe',         level: 35,  decay: 70 },
        box:         { name: 'box',         level: 40,  decay: 65 },
        hammer:      { name: 'hammer',      level: 45,  decay: 65 },
        glass:       { name: 'glass',       level: 60,  decay: 70 },
        shot:        { name: 'shot',        level: 110, decay: 70 },
        shotgun:     { name: 'shotgun',     level: 125, decay: 55 },
        rifle:       { name: 'rifle',       level: 130, decay: 60 },
        boom:        { name: 'boom',        level: 145, decay: 45 },
    },

    silentThreshold: 0.5,
    max: 150,
    criticalEnter: 120,
    criticalExit: 60,
    lerpSpeed: 6,

    // --- Акустика ---
    // Затухание с расстоянием: L(d) = L0 − 20·log10(d / d0), d0 = 1 м
    distanceFalloff: 20,

    // Порог чувствительности зомби (сколько dB должно до него дойти)
    hearingThreshold: 18,
};