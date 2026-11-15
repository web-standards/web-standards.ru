import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import zlib from 'node:zlib';
import fastGlob from 'fast-glob';

const brotliCompress = promisify(zlib.brotliCompress);

const isProdMode = process.env.NODE_ENV === 'production';

// Brotli-сжатые копии текстовых файлов: Caddy отдаёт их через precompressed
export default function(eleventyConfig) {
    if (!isProdMode) {
        return;
    }

    eleventyConfig.on('eleventy.after', async () => {
        const paths = await fastGlob('**/*.{html,css,js,svg,xml,json,txt}', {
            cwd: eleventyConfig.directories.output,
            absolute: true,
        });

        await Promise.all(paths.map(async (path) => {
            const content = await readFile(path);
            const compressed = await brotliCompress(content, {
                params: {
                    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
                    [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
                    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: content.length,
                },
            });

            if (compressed.length < content.length) {
                await writeFile(`${path}.br`, compressed);
            }
        }));
    });
};
