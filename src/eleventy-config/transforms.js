import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import htmlmin from 'html-minifier-terser';
import minifyXml from 'minify-xml';
import { parseHTML } from 'linkedom';
import Image from '@11ty/eleventy-img';

Image.concurrency = os.availableParallelism ? os.availableParallelism() : os.cpus().length;

const isProdMode = process.env.NODE_ENV === 'production';

async function processImage({ imageElement, inputPath, options, attributes }) {
    const imageStats = await Image(inputPath, {
        outputDir: '.cache/@11ty/_images',
        urlPath: '/_images/',
        ...options
    });

    const imageAttributes = Object.assign(
        {},
        attributes ?? {},
        Object.fromEntries(
            [...imageElement.attributes].map((attr) => [attr.name, attr.value])
        )
    );

    const tempElement = imageElement.ownerDocument.createElement('div');
    tempElement.innerHTML = Image.generateHTML(imageStats, imageAttributes);

    imageElement.replaceWith(tempElement.firstElementChild);
}

export default function(eleventyConfig) {
    // преобразование контентных изображений
    eleventyConfig.addTransform('optimizeContentImages', async function(content) {
        if (!this.page.inputPath.includes('/articles/')) {
            return content;
        }

        if (!this.page.outputPath.endsWith('.html')) {
            return content;
        }

        const { document } = parseHTML(content);
        const images = Array.from(document.querySelectorAll('.article__content img'))
            .filter((image) => !image.src.match(/^https?:/));

        if (images.length === 0) {
            return content;
        }

        const articleSourceFolder = path.dirname(this.page.inputPath);

        await Promise.all(images.map(async(image) => {
            const fullImagePath = path.join(articleSourceFolder, image.src);
            const isGif = path.extname(fullImagePath) === '.gif';

            await processImage({
                document,
                imageElement: image,
                inputPath: fullImagePath,
                options: {
                    widths: ['auto', 600, 1200, 2400],
                    // `sharp`, на данный момент, не поддерживает анимированный avif
                    formats: isProdMode && !isGif
                        ? ['svg', 'avif', 'webp', 'auto']
                        : ['svg', 'webp', 'auto'],
                    svgShortCircuit: true,
                    sharpOptions: {
                        animated: true,
                    },
                },
                attributes: {
                    loading: 'lazy',
                    decoding: 'async',
                    sizes: [
                        '(min-width: 1920px) calc((1920px - 2 * 64px) * 5 / 8 - 2 * 16px)',
                        '(min-width: 1240px) calc((100vw - 2 * 64px) * 5 / 8 - 2 * 16px)',
                        '(min-width: 700px) calc(700px - 2 * 16px)',
                        'calc(100vw - 2 * 16px)',
                    ].join(','),
                },
            });
        }));

        return document.toString();
    });

    // преобразование аватаров
    eleventyConfig.addTransform('optimizeAvatarImages', async function(content) {
        if (!this.page.outputPath.endsWith?.('.html')) {
            return content;
        }

        const { document } = parseHTML(content);
        const images = Array.from(document.querySelectorAll('.blob__photo'))
            .filter((image) => !image.src.match(/^https?:/));

        if (images.length === 0) {
            return content;
        }

        await Promise.all(images.map(async(image) => {
            const fullImagePath = path.join(eleventyConfig.dir.input, image.src);

            await processImage({
                imageElement: image,
                inputPath: fullImagePath,
                options: {
                    widths: image.sizes
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
                },
            });
        }));

        return document.toString();
    });

    eleventyConfig.on('eleventy.after', () => {
        const from = '.cache/@11ty/_images/';
        const to = path.join(eleventyConfig.directories.output, '_images');
        fs.cpSync(from, to, { recursive: true });
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

    // добавление на заголовки id с временными метками внутри страниц подкастов
    eleventyConfig.addTransform('podcast-headings', async function(content) {
        if (!this.page?.outputPath?.endsWith?.('html')) {
            return content;
        }

        // игнорируем страницы, не попадающие под url вида `/podcast/<номер подкаста>/`
        if (!(/\podcast\/\d+\//.test(this.page?.url))) {
            return content;
        }

        const { document } = parseHTML(content);

        const titlesMap = Array.from(document.querySelectorAll('.podcast__content h2'))
            .reduce((map, titleElement) => {
                map[titleElement.textContent.trim()] = titleElement;
                return map;
            }, {});

        for (const chapterElement of document.querySelectorAll('.podcast__timecode-chapter')) {
            const titleText = chapterElement.querySelector('.podcast__timecode-title').textContent.trim();
            const timeCode = chapterElement.querySelector('.podcast__timecode-link').textContent.trim();
            titlesMap[titleText]?.setAttribute('id', timeCode);
        }

        return document.toString();
    });

    // добавление id на заголовки и кнопок для копирования ссылок
    eleventyConfig.addTransform('content-headings', async function(content) {
        if (!this.page?.outputPath?.endsWith?.('html')) {
            return content;
        }

        const { document } = parseHTML(content);

        const headings = Array.from(document.querySelectorAll('.content :where(h1, h2, h3, h4, h5, h6)'));

        let headingCounter = 0;

        for (const heading of headings) {
            const headingId = heading.id || `section-${++headingCounter}`;
            heading.id = headingId;
            const headingHTML = heading.innerHTML;
            heading.innerHTML = `
                ${headingHTML}
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
            `;
        }

        return document.toString();
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
