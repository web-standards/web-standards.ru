export default async function(eleventyConfig) {
    const modules = await Promise.all([
        import('./src/eleventy-config/markdown-library.js'),
        import('./src/eleventy-config/collections.js'),
        import('./src/eleventy-config/filters.js'),
        import('./src/eleventy-config/transforms.js'),
        import('./src/eleventy-config/shortcodes.js'),
        import('./src/eleventy-config/static-files.js'),
        import('./src/eleventy-config/extensions.js'),
    ]);

    modules.forEach(module => module.default(eleventyConfig));

    return {
        dir: {
            input: 'src',
            output: 'dist',
            includes: 'includes',
            layouts: 'layouts',
            data: 'data',
        },
        dataTemplateEngine: 'njk',
        markdownTemplateEngine: false,
        htmlTemplateEngine: 'njk',
        templateFormats: [
            'md',
            'njk',
        ],
    };
};
