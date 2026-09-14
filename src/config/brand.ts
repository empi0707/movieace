import { computed, ref } from 'vue';
import defaultLogoUrl from '../assets/img/logo.png';

const DEFAULT_BRAND = 'Brand';
const DEFAULT_PRIMARY_COLOR = '#ff5902';
const BRAND_SESSION_KEY = 'embed-brand';
const LOGO_SESSION_KEY = 'embed-logo';
const COLOR_SESSION_KEY = 'embed-color';

const sanitizeHex = (value: string | null | undefined): string | null => {
    if (!value?.trim()) return null;

    const raw = value.trim();
    const candidate = raw.startsWith('#') ? raw : `#${raw}`;
    const shortMatch = candidate.match(/^#([\da-f]{3})$/i);
    if (shortMatch) {
        const [r, g, b] = shortMatch[1].split('');
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    return /^#[\da-f]{6}$/i.test(candidate)
        ? candidate.toLowerCase()
        : null;
};

const normalizeHex = (value: string | undefined): string =>
    sanitizeHex(value) || DEFAULT_PRIMARY_COLOR;

const hexToRgb = (hex: string): [number, number, number] => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
];

const shade = (rgb: [number, number, number], factor: number): string => {
    const channel = (value: number) => Math.round(value * factor)
        .toString(16)
        .padStart(2, '0');

    return `#${rgb.map(channel).join('')}`;
};

const envBrand = import.meta.env.VITE_BRAND?.trim() || DEFAULT_BRAND;

export const BRAND = ref(envBrand);
export const LOGO_URL = ref(defaultLogoUrl);
export const BRAND_SLUG = computed(() => BRAND.value.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'brand');

export const PRIMARY_COLOR = ref(normalizeHex(import.meta.env.VITE_PRIMARY_COLOR));
export const PRIMARY_COLOR_RGB = computed(() =>
    hexToRgb(PRIMARY_COLOR.value).join(', '));

const isEmbedded = (): boolean => {
    try {
        return window.self !== window.top;
    } catch {
        return true;
    }
};

const sanitizeBrand = (value: string | null): string | null => {
    const clean = value?.replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    return clean ? clean.slice(0, 80) : null;
};

const sanitizeLogoUrl = (value: string | null): string | null => {
    if (!value) return null;

    try {
        const url = new URL(value, window.location.href);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
};

const readSession = (key: string): string | null => {
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
};

const writeSession = (key: string, value: string): void => {
    try {
        sessionStorage.setItem(key, value);
    } catch {
        // Sandboxed iframes can disable storage; the reactive value still works.
    }
};

export const initializeEmbedBranding = (): void => {
    if (!isEmbedded()) return;

    const params = new URLSearchParams(window.location.search);
    const queryBrand = sanitizeBrand(params.get('brand'));
    const queryLogo = sanitizeLogoUrl(params.get('logo'));
    const queryColor = sanitizeHex(params.get('color'));

    const storedBrand = sanitizeBrand(readSession(BRAND_SESSION_KEY));
    const storedLogo = sanitizeLogoUrl(readSession(LOGO_SESSION_KEY));
    const storedColor = sanitizeHex(readSession(COLOR_SESSION_KEY));

    if (queryBrand) {
        BRAND.value = queryBrand;
        writeSession(BRAND_SESSION_KEY, queryBrand);
    } else if (storedBrand) {
        BRAND.value = storedBrand;
    }

    if (queryLogo) {
        LOGO_URL.value = queryLogo;
        writeSession(LOGO_SESSION_KEY, queryLogo);
    } else if (storedLogo) {
        LOGO_URL.value = storedLogo;
    }

    if (queryColor) {
        PRIMARY_COLOR.value = queryColor;
        writeSession(COLOR_SESSION_KEY, queryColor);
    } else if (storedColor) {
        PRIMARY_COLOR.value = storedColor;
    }

    document.title = BRAND.value;
};

export const resetEmbedLogo = (): void => {
    LOGO_URL.value = defaultLogoUrl;
    try {
        sessionStorage.removeItem(LOGO_SESSION_KEY);
    } catch {
        // Ignore unavailable storage in sandboxed iframes.
    }
};

export const applyBrandTheme = (): void => {
    const root = document.documentElement;
    const primaryRgb = hexToRgb(PRIMARY_COLOR.value);
    const primaryRgbValue = PRIMARY_COLOR_RGB.value;

    root.style.setProperty('--ember', PRIMARY_COLOR.value);
    root.style.setProperty('--ember-rgb', primaryRgbValue);
    root.style.setProperty('--ember-600', shade(primaryRgb, 0.84));
    root.style.setProperty('--ember-700', shade(primaryRgb, 0.68));
    root.style.setProperty('--ember-glow', `rgba(${primaryRgbValue}, 0.35)`);
    root.style.setProperty('--ambient', primaryRgbValue);
};
