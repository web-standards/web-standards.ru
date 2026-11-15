import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const hashes = new Map();

// Короткий хеш содержимого файла, пересчитывается только при его изменении
export function fileHash(filePath) {
    const { mtimeMs, size } = statSync(filePath);
    const key = `${filePath}:${mtimeMs}:${size}`;

    if (!hashes.has(key)) {
        const hash = createHash('sha256').update(readFileSync(filePath)).digest('hex').slice(0, 8);
        hashes.set(key, hash);
    }

    return hashes.get(key);
}

// '/fonts/font.woff2' → '/fonts/font.woff2?v=1a2b3c4d'
// Ресурсы кешируются как immutable, поэтому адрес должен меняться вместе с ними
export function version(url) {
    const fragmentIndex = url.indexOf('#');
    const pathname = fragmentIndex === -1 ? url : url.slice(0, fragmentIndex);
    const fragment = fragmentIndex === -1 ? '' : url.slice(fragmentIndex);

    if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('?')) {
        return url;
    }

    const filePath = path.join('src', decodeURI(pathname));

    if (!existsSync(filePath)) {
        return url;
    }

    return `${pathname}?v=${fileHash(filePath)}${fragment}`;
}
