// Типы зомби и их характеристики восприятия.
// vision.angle — полный угол конуса в градусах.
// hearing.sensitivity — множитель скорости накопления уверенности.
// smell — нюх, постоянный сигнал по направлению к игроку.

export const ZOMBIE_TYPES = {
    walker: {
        name: 'walker',
        speed: 3.2,
        hp: 100,
        color: 0x6a9a4b,
        colorHead: 0x8ab86a,
        vision:  { range: 30, angle: 60 },
        hearing: { sensitivity: 1.0 },
        smell:   { range: 0, angle: 0 },
        scream:  null,
    },

    sniffer: {
        name: 'sniffer',
        speed: 2.4,
        hp: 100,
        color: 0x7a6a3a,
        colorHead: 0x9a8a5a,
        vision:  { range: 12, angle: 50 },
        hearing: { sensitivity: 0.6 },
        smell:   { range: 45, angle: 90 },
        scream:  null,
    },

    listener: {
        name: 'listener',
        speed: 3.6,
        hp: 80,
        color: 0x4b7a9a,
        colorHead: 0x6a9aba,
        vision:  { range: 15, angle: 60 },
        hearing: { sensitivity: 2.5 },
        smell:   { range: 0, angle: 0 },
        scream:  null,
    },

    screamer: {
        name: 'screamer',
        speed: 2.5,
        hp: 60,
        color: 0x9a4b4b,
        colorHead: 0xba6a6a,
        vision:  { range: 25, angle: 70 },
        hearing: { sensitivity: 1.2 },
        smell:   { range: 0, angle: 0 },
        scream:  { cooldown: 8, range: 25 },
    },
};

export const ZOMBIE = {
    attackRange: 1.4,
    attackDamage: 10,
    attackCooldown: 1.0,
    hearingThreshold: 18,      // dB, с которого начинает накапливаться уверенность
    confidenceGain: 0.8,       // насколько быстро растёт уверенность
    confidenceDecay: 0.4,      // насколько быстро падает
    confidenceTrigger: 0.5,    // порог срабатывания
    searchTimeout: 6,          // сек, после которых SEARCH → IDLE
    arrivalDist: 1.0,          // м, с какого дистанции «пришёл» к цели
};