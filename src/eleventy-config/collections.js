import path from 'node:path';
import fs from 'node:fs';
import fastGlob from 'fast-glob';
import { load as loadYaml } from 'js-yaml';

export default function(eleventyConfig) {
    eleventyConfig.addCollection('tagList', (collection) => {
        const set = new Set();
        for (const item of collection.getAllSorted()) {
            if ('tags' in item.data) {
                let tags = item.data.tags;
                if (typeof tags === 'string') {
                    tags = [tags];
                }
                for (const tag of tags) {
                    set.add(tag);
                }
            }
        }
        return [...set].sort();
    });

    const templatesPaths = fastGlob.sync(['node_modules/podcast/src/episodes/*/*.md']);
    for (const templatePath of templatesPaths) {
        const episodeFolderPath = path.dirname(templatePath);
        const episodeDataFilePath = path.join(episodeFolderPath, 'index.yml');
        const relativePath = path.relative('node_modules/podcast/src/episodes', templatePath);

        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        const templateDataFileContent = fs.readFileSync(episodeDataFilePath, 'utf-8');
        const templateData = loadYaml(templateDataFileContent);

        Object.assign(templateData, {
            permalink: false,
            layout: false,
            tags: ['episodes'],
            eleventyComputed: {
                episode(data) {
                    return data?.page?.fileSlug;
                },
                audio(data) {
                    return `https://web-standards.ru/podcast/episodes/${data.episode}.mp3`;
                },
            },
        });

        eleventyConfig.addTemplate(`episodes/${relativePath}`, templateContent, templateData);
    }

    eleventyConfig.addCollection('people', (collectionAPI) => {
        return collectionAPI.getFilteredByGlob('src/people/*/*.md');
    });

    eleventyConfig.addCollection('articles', (collectionAPI) => {
        return collectionAPI.getFilteredByGlob('src/articles/*/*.md');
    });
};
