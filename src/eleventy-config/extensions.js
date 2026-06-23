import { load as loadYaml } from 'js-yaml';
import eleventyPluginCss from '../libs/eleventy-plugin-css.js';
import eleventyPluginJs from '../libs/eleventy-plugin-js.js';

const isProdMode = process.env.NODE_ENV === 'production';

export default async function(eleventyConfig) {
    eleventyConfig.addDataExtension('yml', (contents) => {
        return loadYaml(contents);
    });

    eleventyConfig.ignores.add('src/**/!(styles)/*.css');
    eleventyConfig.ignores.add('src/styles/fonts.css');

    eleventyConfig.addPlugin(eleventyPluginCss, {
        /** @type (import('lightningcss').BundleAsyncOptions */
        lightningcss: {
            minify: isProdMode,
        },
    });

    eleventyConfig.ignores.add('src/**/!(scripts)/*.js');
    eleventyConfig.ignores.add('src/scripts/modules/**/*.js');

    eleventyConfig.addPlugin(eleventyPluginJs, {
        /** @type (import('esbuild').BuildOptions */
        esbuild: {
            platform: 'browser',
            minify: isProdMode,
        },
    });
}
