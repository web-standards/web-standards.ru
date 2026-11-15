import { readFile } from 'node:fs/promises';
import fastGlob from 'fast-glob';

// Ищет в собранном сайте адреса ресурсов без ?v=. Сервер кеширует их
// как immutable, поэтому без версии изменения не дойдут до посетителей.
// Демки пропускаются: у них свои ресурсы, которые почти не меняются.

const CACHED_EXTENSION = /\.(css|js|ico|gif|jpe?g|png|svg|webp|avif|woff2?|mp3)$/i;
const EXTERNAL = /^([a-z]+:|\/\/|#)/i;

const TAG = /<(img|source|script|link|use|image|video|audio)\b[^>]*>/gi;
const ATTRIBUTE = /\s(src|href|srcset|imagesrcset|poster)=(["'])(.*?)\2/gi;
const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const STYLE_ATTRIBUTE = /\sstyle=(["'])(.*?)\1/gi;
const CSS_URL = /url\(\s*(["']?)(.*?)\1\s*\)/gi;

function isUnversioned(url) {
    if (EXTERNAL.test(url)) {
        return false;
    }

    const [pathname, query = ''] = url.split('#')[0].split('?');
    return CACHED_EXTENSION.test(pathname) && !/(^|&)v=/.test(query);
}

function cssUrls(css) {
    return [...css.matchAll(CSS_URL)].map((match) => match[2]);
}

function htmlUrls(html) {
    const urls = [];

    for (const [tag] of html.matchAll(TAG)) {
        for (const [, name, , value] of tag.matchAll(ATTRIBUTE)) {
            if (name.endsWith('srcset')) {
                urls.push(...value.split(',').map((candidate) => candidate.trim().split(/\s+/)[0]));
            } else {
                urls.push(value);
            }
        }
    }

    for (const [, css] of html.matchAll(STYLE_BLOCK)) {
        urls.push(...cssUrls(css));
    }

    for (const [, , css] of html.matchAll(STYLE_ATTRIBUTE)) {
        urls.push(...cssUrls(css));
    }

    return urls;
}

const files = await fastGlob('dist/**/*.{html,css}', {
    ignore: ['**/{demo,demos}/**'],
});

const problems = new Map();

for (const file of files) {
    const content = await readFile(file, 'utf8');
    const urls = file.endsWith('.css') ? cssUrls(content) : htmlUrls(content);

    for (const url of urls.filter(isUnversioned)) {
        if (!problems.has(url)) {
            problems.set(url, []);
        }
        problems.get(url).push(file);
    }
}

for (const [url, foundIn] of problems) {
    const more = foundIn.length > 1 ? ` и ещё ${foundIn.length - 1}` : '';
    console.log(`${url}\n    ${foundIn[0]}${more}`);
}

console.log(`\nПроверено файлов: ${files.length}, адресов без версии: ${problems.size}`);
process.exitCode = problems.size > 0 ? 1 : 0;
