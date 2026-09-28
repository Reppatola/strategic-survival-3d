// Типы зомби и их характеристики восприятия.
//
// ALERT — промежуточное состояние между «заметил» и «бросился».
// Даёт игроку окно среагировать. Длительность зависит от:
//   - base: базовый телеграф для типа
//   - confidence_bonus: чем увереннее сенсор, тем короче (макс -50%)
//   - silence_penalty: множитель >1 для типов без шума движения (резерв на будущее)
//
// SEARCH — состояние после потери цели. Длительность = base × persistence.
// Высокий persistence = упорный, долго ищет. Низкий = быстро переключается.

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

        alert:  { base: 0.8, silencePenalty: 1.0 },
        search: { base: 5,   persistence: 1.0, radius: 4 },
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

        // Нюхач — медленный, принюхивающийся. Телеграф длиннее,
        // но SEARCH короткий: он теряет след и переключается на актуальный запах.
        alert:  { base: 1.1, silencePenalty: 1.0 },
        search: { base: 5,   persistence: 0.6, radius: 6 },
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

        // Слухач рано замечает — короткий телеграф не делает его нечестным.
        // SEARCH длинный: он и так на взводе, дольше прислушивается.
        alert:  { base: 0.5, silencePenalty: 1.0 },
        search: { base: 5,   persistence: 2.0, radius: 8 },
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
        scream:  { cooldown: 4, range: 25 },

        // ALERT = длительность крика (1.4 сек). Игрок слышит крик
        // пока есть окно среагировать, а не до его начала.
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

    // Максимальное сокращение ALERT за счёт уверенности (0.5 = −50%)
    confidenceAlertBonus: 0.5,

    // Через сколько секунд в CHASE без сигнала переходим в SEARCH
    chaseLossTimeout: 1.5,

    // Порог уверенности слуха для прыжка SEARCH → CHASE
    chaseJumpConfidence: 0.7,
};