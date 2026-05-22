import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import htmlmin from 'html-minifier-next';
import minifyXml from 'minify-xml';
import Image from '@11ty/eleventy-img';
import { walk, hasNodeClass, html, htmlToTree } from './posthtml-utils.js';

Image.concurrency = os.availableParallelism ? os.availableParallelism() : os.cpus().length;

const isProdMode = process.env.NODE_ENV === 'production';

const CACHE_BASE = '.cache/images';

function filenameFormat(id, src, width, format) {
    const name = path.basename(src, path.extname(src));
    return `${name}-${width}.${format}`;
}

export default function(eleventyConfig) {
    // преобразование контентных изображений
    eleventyConfig.htmlTransformer.addPosthtmlPlugin('html', function (context = {}) {
        const isArticlePage = context.page?.inputPath?.includes?.('/articles/');

        if (!isArticlePage) {
            return () => {}
        }

        return async function (tree) {
            const articleSourceFolder = path.dirname(context.page.inputPath);

            const imageTransformPromises = walk(tree)
                .filter((node) => node.tag)
                .filter((node) => hasNodeClass(node, 'article__content'))
                .take(1)
                .flatMap((node) => walk(node.content))
                .filter((node) => node.tag === 'img')
                .filter((node) => !node.attrs?.src?.match?.(/^https?:/))
                .map(async (node) => {
                    const fullImagePath = path.join(articleSourceFolder, node.attrs.src);
                    const isGif = path.extname(fullImagePath) === '.gif';
                    const imageDir = path.dirname(node.attrs.src);
                    const relativeDir = path.join(path.dirname(context.page.inputPath), imageDir).replace(/^src\//, '');

                    const imageStats = await Image(fullImagePath, {
                        outputDir: path.join(CACHE_BASE, relativeDir),
                        urlPath: imageDir,
                        filenameFormat,
                        widths: ['auto', 600, 1200, 2400],
                        formats: isProdMode && !isGif
                            ? ['svg', 'avif', 'webp', 'auto']
                            : ['svg', 'webp', 'auto'],
                        svgShortCircuit: true,
                        sharpOptions: {
                            animated: true,
                        },
                    });

                    const imageAttributes = Object.assign({}, node.attrs, {
                        loading: 'lazy',
                        decoding: 'async',
                        sizes: [
                            '(min-width: 1920px) calc((1920px - 2 * 64px) * 5 / 8 - 2 * 16px)',
                            '(min-width: 1240px) calc((100vw - 2 * 64px) * 5 / 8 - 2 * 16px)',
                            '(min-width: 700px) calc(700px - 2 * 16px)',
                            'calc(100vw - 2 * 16px)',
                        ].join(','),
                    });

                    const [newImageNode] = htmlToTree(Image.generateHTML(imageStats, imageAttributes));
                    node.attrs = {};
                    Object.assign(node, newImageNode);
                })
                .toArray();

            await Promise.all(imageTransformPromises);
        }
    });

    // преобразование аватаров
    eleventyConfig.htmlTransformer.addPosthtmlPlugin('html', function () {
        return async function (tree) {
            const imageTransformPromises = walk(tree)
                .filter((node) => node.tag === 'img')
                .filter((node) => !node.attrs?.src?.match?.(/^https?:/))
                .filter((node) => hasNodeClass(node, 'blob__photo'))
                .map(async (node) => {
                    const fullImagePath = path.join(eleventyConfig.dir.input, node.attrs.src);
                    const urlDir = path.dirname(node.attrs.src);

                    const imageStats = await Image(fullImagePath, {
                        outputDir: path.join(CACHE_BASE, urlDir),
                        urlPath: urlDir,
                        filenameFormat,
                        widths: node.attrs.sizes
                            .split(',')
                            .flatMap((entry) => {
                                entry = entry.split(/\s+/).at(-1);
                                entry = parseFloat(entry);
                                return [entry, entry * 2];
                            }),
                        formats: isProdMode
                            ? ['svg', 'avif', 'webp', 'auto']
                            : ['svg', 'webp', 'auto'],
                        svgShortCircuit: true,
                    });

                    const imageAttributes = Object.assign({}, node.attrs, {
                        loading: 'lazy',
                        decoding: 'async',
                    });

                    const [newImageNode] = htmlToTree(Image.generateHTML(imageStats, imageAttributes));
                    node.attrs = {};
                    Object.assign(node, newImageNode);
                })
                .toArray();

            await Promise.all(imageTransformPromises);
        }
    });

    eleventyConfig.on('eleventy.after', () => {
        if (fs.existsSync(CACHE_BASE)) {
            fs.cpSync(CACHE_BASE, eleventyConfig.directories.output, { recursive: true });
        }
    });

    eleventyConfig.addTransform('lazyYouTube', (content, outputPath) => {
        let articles = /articles\/([a-zA-Z0-9_-]+)\/index\.html/i;
        let iframes = /<iframe src="https:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]+)"(.*?)><\/iframe>/ig;

        if (outputPath && outputPath.match(articles)) {
            content = content.replace(iframes, (match, p1) => {
                return `
                    <div class="video">
                        <a class="video__link" href="https://youtu.be/${p1}">
                            <picture>
                                <source srcset="https://img.youtube.com/vi/${p1}/maxresdefault.jpg" media="(min-width: 736px)">
                                <img class="video__media" src="https://img.youtube.com/vi/${p1}/mqdefault.jpg" alt="">
                            </picture>
                        </a>
                        <button class="video__button" type="button" aria-label="Запустить видео">
                            <svg width="68" height="48" viewBox="0 0 68 48"><path class="video__button-shape" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"></path><path class="video__button-icon" d="M 45,24 27,14 27,34"></path></svg>
                        </button>
                    </div>`;
            });
        }
        return content;
    });

    // открытие ссылок в новой вкладке внутри страниц эпизодов
    eleventyConfig.htmlTransformer.addPosthtmlPlugin('html', function (context = {}) {
        const isPodcastPage = /\/podcast\/\d+\//.test(context.url);

        if (!isPodcastPage) {
            return () => {};
        }

        return function (tree) {
            walk(tree)
                .filter((node) => node.tag)
                .filter((node) => hasNodeClass(node, 'podcast__content'))
                .take(1)
                .flatMap((node) => walk(node.content))
                .filter((node) => node.tag === 'a')
                .filter((node) => node.attrs?.href?.startsWith?.('http'))
                .forEach((node) => {
                    Object.assign(node.attrs, {
                        target: '_blank',
                        rel: 'noopener'
                    });
                });
        }
    });

    // добавление id на заголовки и кнопок для копирования ссылок
    eleventyConfig.htmlTransformer.addPosthtmlPlugin('html', function () {
        return function (tree) {
            const headings = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
            let headingCounter = 0;
            walk(tree)
                .filter((node) => node.tag)
                .filter((node) => hasNodeClass(node, 'content'))
                .take(1)
                .flatMap((node) => walk(node.content))
                .filter((node) => node.tag && headings.has(node.tag))
                .forEach((node) => {
                    node.attrs ??= {}
                    const headingId = node.attrs.id ?? `section-${++headingCounter}`;
                    node.attrs.id = headingId;
                    node.content = [
                        ...(Array.isArray(node.content) ? node.content : [node.content]),
                        ...html`
                            <span class="tooltip">
                                <button
                                    class="tooltip__button"
                                    data-href="#${headingId}"
                                    aria-labelledby="copy-${headingId}"
                                    aria-label="Копировать ссылку на заголовок"
                                ></button>
                                <span class="tooltip__label" role="tooltip" id="copy-${headingId}">
                                    Скопировать ссылку
                                </span>
                            </span>
                        `
                    ]
                })
        }
    });

    if (isProdMode) {
        eleventyConfig.addTransform('htmlmin', (content, outputPath) => {
            if (outputPath && outputPath.endsWith('.html')) {
                return htmlmin.minify(content, {
                    collapseWhitespace: true,
                    collapseInlineTagWhitespace: true,
                    conservativeCollapse: true,
                    minifyJS: true,
                    minifyCSS: true,
                });
            }
            return content;
        });

        eleventyConfig.addTransform('xmlmin', function(content, outputPath) {
            if (outputPath && outputPath.endsWith('.xml')) {
                return minifyXml(content, {
                    shortenNamespaces: false,
                });
            }
            return content;
        });
    }
};
