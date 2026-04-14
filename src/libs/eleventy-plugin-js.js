import * as esbuild from 'esbuild';
import browserslistToEsbuild from 'browserslist-to-esbuild';

export default function(eleventyConfig, options = {}) {
    const formats = options.formats ?? ['js'];

    eleventyConfig.addTemplateFormats(formats);

    eleventyConfig.addExtension(formats, {
        outputFileExtension: 'js',

        read: false,

        compileOptions: {
            permalink() {
                return (data) => {
                    return data.permalink;
                };
            },

            cache: true,
        },

        async compile(inputContent, inputPath) {
            if (typeof options.filter === 'function' && !options.filter(inputContent, inputPath)) {
                return;
            }

            const bundleResult = await esbuild.build({
                entryPoints: [inputPath],
                write: false,
                charset: 'utf8',
                metafile: true,
                minify: false,
                bundle: true,
                target: browserslistToEsbuild(options.targets),
                ...(options.esbuild || {}),
            });

            const entryData = bundleResult.metafile.inputs[inputPath.replace(/^\.\//, '')];
            const dependencies = entryData.imports.map((item) => item.path);
            this.addDependencies(inputPath, dependencies);

            return async function() {
                const [output] = bundleResult.outputFiles;
                return output.text;
            };
        },
    });
}
