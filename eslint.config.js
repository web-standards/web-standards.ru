import globals from 'globals';
import js from '@eslint/js';

const browserScripts = [
    'src/scripts/**/*.js',
    'src/articles/**/*.js',
];

export default [
    js.configs.recommended,

    {
        ignores: browserScripts,
        languageOptions: {
            globals: {
                ...globals.nodeBuiltin,
            },
        },
    },

    {
        files: browserScripts,
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },
];
