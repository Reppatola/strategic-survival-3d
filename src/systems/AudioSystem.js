// AudioSystem — синтезированные звуки через Web Audio API.
// Не требует файлов: выстрел и шаги генерируются программно.
// Позже легко заменить на реальные .mp3/.ogg, интерфейс не изменится.
import { AUDIO } from '../config/audio.config.js';

export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = false;
    }

    // Браузеры блокируют звук до первого взаимодействия пользователя.
    // Вызывается один раз при первом клике или нажатии клавиши.
    unlock() {
        if (this.enabled) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;

        this.ctx = new AC();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = AUDIO.masterVolume;
        this.masterGain.connect(this.ctx.destination);
        this.enabled = true;
    }

    // --- Выстрел из пистолета ---
    playShot() {
        if (!this.enabled) return;
        const cfg = AUDIO.shot;
        const t = this.ctx.currentTime;
        const dur = cfg.duration;

        // 1. Основной шум — белый шум с полосовым фильтром
        const noise = this._createNoiseBuffer(dur);
        const src = this.ctx.createBufferSource();
        src.buffer = noise;

        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1200;
        bandpass.Q.value = 0.8;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(cfg.volume, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        src.connect(bandpass);
        bandpass.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        src.start(t);
        src.stop(t + dur);

        // 2. Низкочастотный «thump» для веса — синус 120 → 40 Hz
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(cfg.thump, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    // --- Шаг ---
    // type: 'crouch' | 'walk' | 'sprint'
    playStep(type = 'walk') {
        if (!this.enabled) return;
        const cfg = AUDIO.step[type] || AUDIO.step.walk;
        const t = this.ctx.currentTime;
        const dur = cfg.duration;

        const noise = this._createNoiseBuffer(dur);
        const src = this.ctx.createBufferSource();
        src.buffer = noise;

        // Lowpass — глубина шага зависит от режима
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = cfg.filter;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(cfg.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        src.start(t);
        src.stop(t + dur);
    }

    // --- Утилита: белый шум нужной длины ---
    _createNoiseBuffer(duration) {
        const sampleRate = this.ctx.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // --- Ручная громкость (пригодится для меню) ---
    setMasterVolume(v) {
        AUDIO.masterVolume = Math.max(0, Math.min(1, v));
        if (this.masterGain) {
            this.masterGain.gain.value = AUDIO.masterVolume;
        }
    }
}