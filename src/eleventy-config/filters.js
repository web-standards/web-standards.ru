import markdownIt from 'markdown-it';
import htmlmin from 'html-minifier-terser';
import { stripHeadings, stripLists } from '../libs/markdown-transforms.js';

const markdown = markdownIt({
    html: true,
});

export default function(eleventyConfig) {
    eleventyConfig.addFilter('limit', (array, limit) => {
        return array.slice(0, limit);
    });

    eleventyConfig.addFilter('fixLinks', (content) => {
        const reg = /(src="[^(https://)])|(src="\/)|(href="[^(https://)])|(href="\/)/g;
        const prefix = `https://web-standards.ru` + content.url;
        return content.templateContent.replace(reg, (match) => {
            if (match === `src="/` || match === `href="/`) {
                match = match.slice(0, -1);
                return match + prefix;
            } else {
                return match.slice(0, -1) + prefix + match.slice(-1);
            }
        });
    });

    // Даты

    eleventyConfig.addFilter('ruDate', (value) => {
        return value.toLocaleString('ru', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).replace(' г.', '');
    });

    eleventyConfig.addFilter('shortDate', (value) => {
        return value.toLocaleString('ru', {
            month: 'short',
            day: 'numeric',
        }).replace('.', '');
    });

    eleventyConfig.addFilter('isoDate', (value) => {
        return value.toISOString();
    });

    eleventyConfig.addFilter('markdown', (value) => {
        return markdown.render(value);
    });

    eleventyConfig.addFilter('inlineMarkdown', (value) => {
        return markdown.renderInline(value);
    });

    eleventyConfig.addFilter('htmlmin', async(value) => {
        return await htmlmin.minify(
            value, {
                collapseWhitespace: true,
                removeEmptyElements: true,
            }
        );
    });

    eleventyConfig.addFilter('duration', (time) => {
        // если длительность берётся из json-файла, то она задана в миллисекундах
        if (typeof time === 'number') {
            return Math.round(time / 1000);
        }

        return time.split(':').reduceRight((acc, item, index, items) => {
            return acc += parseFloat(item) * Math.pow(60, items.length - 1 - index);
        }, 0);
    });

    const podcastMarkdown = markdownIt({
        html: true,
    })
        .use(stripHeadings)
        .use(stripLists);

    eleventyConfig.addFilter('podcastMarkdown', (content) => {
        return podcastMarkdown.render(content);
    });
};
