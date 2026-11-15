import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import fastGlob from 'fast-glob';

// Короткий хеш содержимого исходников для ?v= в адресах ресурсов:
// они кешируются как immutable, поэтому адрес должен меняться вместе с ними
async function hashFiles(pattern) {
    const hash = createHash('sha256');
    const paths = (await fastGlob(pattern)).sort();

    for (const path of paths) {
        hash.update(path);
        hash.update(await readFile(path));
    }

    return hash.digest('hex').slice(0, 8);
}

export default async function() {
    return {
        // Шрифты и картинки тоже: их адреса с ?v= попадают в собранный CSS
        styles: await hashFiles('src/{styles,fonts,images}/**/*'),
        scripts: await hashFiles('src/scripts/**/*.js'),
    };
}
