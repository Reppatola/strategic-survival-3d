// Состояние тревоги. Включается, когда шум долго держится высоко.
// Пока отвечает только за состояние — визуал и последствия (волны) добавим позже.
import { NOISE } from '../config/noise.config.js';

const ALERT_ON = 100;         // dB для включения тревоги
const ALERT_OFF = 10;         // dB для выключения (только когда таймер истёк)
const MIN_ALERT_TIME = 12;    // сек минимум в тревоге

export class AlertSystem {
    constructor() {
        this.active = false;
        this.timer = 0;       // сколько ещё секунд тревога не может выключиться
        this.justTriggered = false; // для одноразовой реакции (звук, вспышка)
    }

    update(dt, noiseLevel) {
        this.justTriggered = false;

        if (!this.active) {
            if (noiseLevel >= ALERT_ON) {
                this.active = true;
                this.timer = MIN_ALERT_TIME;
                this.justTriggered = true;
            }
        } else {
            this.timer -= dt;
            if (this.timer <= 0 && noiseLevel <= ALERT_OFF) {
                this.active = false;
            }
        }
    }
}