// Настройки звука.
export const AUDIO = {
    masterVolume: 0.5,

    // Затухание звука с расстоянием для слушателя.
    // volume = 1 / (1 + distance * falloffK)
    // falloffK = 0.05  →  20 м: ×0.5,  100 м: ×0.17,  400 м: ×0.05
    falloffK: 0.05,

    shot: {
        volume: 0.8,
        thump: 0.4,
        duration: 0.15,
    },

    step: {
        crouch: { volume: 0.15, duration: 0.06, filter: 400 },
        walk:   { volume: 0.35, duration: 0.08, filter: 800 },
        sprint: { volume: 0.55, duration: 0.10, filter: 1400 },
    },

    // Крик крикуна — длинный, режущий, с вибрацией.
    scream: {
        volume: 0.9,
        duration: 1.4,
        carrierFreq: 480,      // основная частота «голоса»
        vibratoFreq: 6,        // скорость вибрации
        vibratoDepth: 40,      // амплитуда вибрации, Hz
    },
};