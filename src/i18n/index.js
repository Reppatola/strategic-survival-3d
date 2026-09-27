// Система локализации. Одна точка входа для всех текстов.
//
// Использование:
//   import { t } from '../i18n/index.js';
//   t('alert')                 → '⚠ ТРЕВОГА ⚠'
//   t('hud.state.SPRINT')      → 'БЕГ'
//   t('hud.hp')                → 'HP'
//
// Автодетект: navigator.language → 'ru-RU' → берём 'ru'.
// Если языка нет — фолбэк на английский (en).
import en from './locales/en.js';
import ru from './locales/ru.js';
import fr from './locales/fr.js';
import de from './locales/de.js';
import es from './locales/es.js';

const LOCALES = { en, ru, fr, de, es };
const FALLBACK = 'en';

// Определяем язык один раз при загрузке
const detected = detectLanguage();

// Текущий активный язык (можно поменять в рантайме через setLanguage)
let current = detected;
let currentDict = LOCALES[current];

function detectLanguage() {
    // navigator.language — это, например, 'ru-RU', 'en-US', 'fr'
    const raw = (navigator.language || FALLBACK).toLowerCase();
    const code = raw.split('-')[0]; // 'ru-RU' → 'ru'

    if (LOCALES[code]) return code;
    return FALLBACK;
}

// Достаёт значение из словаря по пути 'hud.state.SPRINT'
function resolve(dict, path) {
    const parts = path.split('.');
    let cur = dict;
    for (const p of parts) {
        if (cur == null || typeof cur !== 'object') return undefined;
        cur = cur[p];
    }
    return typeof cur === 'string' ? cur : undefined;
}

// Главная функция перевода
export function t(path) {
    // Пробуем текущий язык
    const val = resolve(currentDict, path);
    if (val !== undefined) return val;

    // Фолбэк на английский
    const fb = resolve(LOCALES[FALLBACK], path);
    if (fb !== undefined) return fb;

    // Совсем ничего — возвращаем путь (видно в HUD, что ключа нет)
    return path;
}

// Ручное переключение языка (пригодится для кнопки в меню)
export function setLanguage(code) {
    if (!LOCALES[code]) return;
    current = code;
    currentDict = LOCALES[code];
}

// Текущий язык — для отладки
export function getLanguage() {
    return current;
}