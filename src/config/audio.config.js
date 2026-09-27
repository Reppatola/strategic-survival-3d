// Настройки звука.
// Все громкости — множители 0..1 (мастер × источник).
export const AUDIO = {
    masterVolume: 0.5,

    shot: {
        volume: 0.8,     // основной шум выстрела
        thump: 0.4,      // низкочастотный удар для веса
        duration: 0.15,
    },

    // Шаги: три режима различаются по громкости и фильтру.
    // filter — частота среза lowpass. Чем ниже, тем глуше звук.
    step: {
        crouch: { volume: 0.15, duration: 0.06, filter: 400 },
        walk:   { volume: 0.35, duration: 0.08, filter: 800 },
        sprint: { volume: 0.55, duration: 0.10, filter: 1400 },
    },
};