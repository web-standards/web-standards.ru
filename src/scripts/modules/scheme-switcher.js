const STORAGE_KEY = 'color-scheme';

const THEMES = {
    AUTO: 'auto',
    LIGHT: 'light',
    DARK: 'dark',
};

const MEDIA = {
    ENABLED: 'all',
    DISABLED: 'not all',
    [THEMES.LIGHT]: '(prefers-color-scheme: light)',
    [THEMES.DARK]: '(prefers-color-scheme: dark)',
};

const COLOR_SCHEME = {
    [THEMES.AUTO]: 'light dark',
    [THEMES.LIGHT]: 'light',
    [THEMES.DARK]: 'dark',
}

const domRefs = {
    meta: {
        [THEMES.LIGHT]: document.head.querySelector('meta[name=theme-color][media*=prefers-color-scheme][media*=light]'),
        [THEMES.DARK]: document.head.querySelector('meta[name=theme-color][media*=prefers-color-scheme][media*=dark]'),
    },
    colorSchemeMeta: document.head.querySelector('meta[name=color-scheme]'),
    switcher: null,
};

function getCurrentTheme() {
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    return storedTheme || THEMES.AUTO;
}

function saveCurrentTheme(theme) {
    if (!theme || theme === THEMES.AUTO) {
        localStorage.removeItem(STORAGE_KEY);
    } else {
        localStorage.setItem(STORAGE_KEY, theme);
    }
}

function applyTheme(theme) {
    theme = theme ?? getCurrentTheme();

    if (domRefs.switcher) {
        for (const button of domRefs.switcher.querySelectorAll('.scheme-switcher__button')) {
            button.setAttribute('aria-pressed', button.value === theme);
        }
    }

    Object.entries(domRefs.meta).forEach(([originalTheme, element]) => {
        element.media = theme === THEMES.AUTO
            ? MEDIA[originalTheme]
            : theme === originalTheme ? MEDIA.ENABLED : MEDIA.DISABLED;
    });

    domRefs.colorSchemeMeta.content = COLOR_SCHEME[theme];
}

applyTheme();

document.addEventListener('DOMContentLoaded', () => {
    domRefs.switcher = document.querySelector('.scheme-switcher');

    domRefs.switcher?.addEventListener('click', (event) => {
        const button = event.target.closest('.scheme-switcher__button');
        if (!button) {
            return;
        }
        const theme = button.value;
        saveCurrentTheme(theme);
        applyTheme(theme);
    });

    window.addEventListener('storage', (event) => {
        if (event.key !== STORAGE_KEY) {
            return;
        }
        const newTheme = event.newValue;
        applyTheme(newTheme);
    });

    applyTheme();
});
