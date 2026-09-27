// AudioSystem — синтезированные звуки через Web Audio API.
// Позиционные: громкость и панорамирование зависят от точки источника.
import { AUDIO } from '../config/audio.config.js';

export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = false;
    }

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

    setMasterVolume(v) {
        AUDIO.masterVolume = Math.max(0, Math.min(1, v));
        if (this.masterGain) this.masterGain.gain.value = AUDIO.masterVolume;
    }

    // --- Позиционная обёртка ---
    // Считает attenuation и panning по расстоянию от слушателя (игрока).
    // pan: -1 (лево) ... +1 (право)
    _spatialParams(sx, sz, lx, lz) {
        const dx = sx - lx;
        const dz = sz - lz;
        const dist = Math.hypot(dx, dz);
        const volume = 1 / (1 + dist * AUDIO.falloffK);

        // Панорама: относим X-смещение к общему расстоянию.
        // (Игрок смотрит сверху; "право экрана" = +X для камеры сверху с up=Z+)
        const pan = dist > 0.01
            ? Math.max(-1, Math.min(1, dx / Math.max(dist, 10)))
            : 0;

        return { volume, pan };
    }

    // Создаёт цепочку gain → pan → master
    _makeChain(volume, pan) {
        const gain = this.ctx.createGain();
        gain.gain.value = volume;

        let lastNode = gain;
        if (typeof this.ctx.createStereoPanner === 'function') {
            const panner = this.ctx.createStereoPanner();
            panner.pan.value = pan;
            gain.connect(panner);
            lastNode = panner;
        }
        lastNode.connect(this.masterGain);
        return gain;
    }

    // --- Универсальный вызов по имени ---
    // name: 'shot' | 'step_walk' | 'step_crouch' | 'step_sprint' | 'scream'
    playAt(name, sx, sz, listenerX, listenerZ) {
        if (!this.enabled) return;
        const { volume, pan } = this._spatialParams(sx, sz, listenerX, listenerZ);
        if (volume < 0.005) return;

        const chainGain = this._makeChain(volume, pan);

        if (name === 'shot')        this._synthShot(chainGain);
        else if (name === 'scream') this._synthScream(chainGain);
        else if (name.startsWith('step_')) {
            const sub = name.slice(5);
            this._synthStep(chainGain, sub);
        }
    }

    // --- Синтез выстрела ---
    _synthShot(outGain) {
        const cfg = AUDIO.shot;
        const t = this.ctx.currentTime;
        const dur = cfg.duration;

        // Шум
        const src = this.ctx.createBufferSource();
        src.buffer = this._createNoiseBuffer(dur);

        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1200;
        bandpass.Q.value = 0.8;

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(cfg.volume, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        src.connect(bandpass);
        bandpass.connect(nGain);
        nGain.connect(outGain);
        src.start(t);
        src.stop(t + dur);

        // Низкочастотный thump
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

        const oGain = this.ctx.createGain();
        oGain.gain.setValueAtTime(cfg.thump, t);
        oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(oGain);
        oGain.connect(outGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    // --- Синтез шага ---
    _synthStep(outGain, type = 'walk') {
        const cfg = AUDIO.step[type] || AUDIO.step.walk;
        const t = this.ctx.currentTime;
        const dur = cfg.duration;

        const src = this.ctx.createBufferSource();
        src.buffer = this._createNoiseBuffer(dur);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = cfg.filter;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(cfg.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(outGain);
        src.start(t);
        src.stop(t + dur);
    }

    // --- Синтез крика крикуна ---
    // Протяжный вопль: пила с вибрато + шумовая подложка.
    _synthScream(outGain) {
        const cfg = AUDIO.scream;
        const t = this.ctx.currentTime;
        const dur = cfg.duration;

        // 1. Основной тон — пилообразный, с вибрато и скольжением вверх-вниз
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(cfg.carrierFreq * 0.8, t);
        osc.frequency.linearRampToValueAtTime(cfg.carrierFreq * 1.3, t + dur * 0.3);
        osc.frequency.linearRampToValueAtTime(cfg.carrierFreq * 0.7, t + dur);

        // Vibrato через LFO
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = cfg.vibratoFreq;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = cfg.vibratoDepth;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        // 2. Общая огибающая громкости — быстро вверх, долго держится, спад
        const voiceGain = this.ctx.createGain();
        voiceGain.gain.setValueAtTime(0.001, t);
        voiceGain.gain.exponentialRampToValueAtTime(cfg.volume, t + 0.08);
        voiceGain.gain.setValueAtTime(cfg.volume, t + dur * 0.7);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        // 3. Фильтр — убираем резкость высоких
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 900;
        filter.Q.value = 0.7;

        osc.connect(filter);
        filter.connect(voiceGain);
        voiceGain.connect(outGain);

        osc.start(t);
        osc.stop(t + dur);
        lfo.start(t);
        lfo.stop(t + dur);

        // 4. Шумовая подложка для «дыхания»
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._createNoiseBuffer(dur);
        const nf = this.ctx.createBiquadFilter();
        nf.type = 'bandpass';
        nf.frequency.value = 1400;
        nf.Q.value = 1.2;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0, t);
        nGain.gain.linearRampToValueAtTime(cfg.volume * 0.35, t + 0.1);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        noise.connect(nf);
        nf.connect(nGain);
        nGain.connect(outGain);
        noise.start(t);
        noise.stop(t + dur);
    }

    _createNoiseBuffer(duration) {
        const sampleRate = this.ctx.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        return buffer;
    }
}