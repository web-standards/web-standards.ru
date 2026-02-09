export default {
    data: {
        permalink: '/podcast/feed/index.xml',
    },

    duration(time) {
        // если длительность берётся из json-файла, то она задана в миллисекундах
        if (typeof time === 'number') {
            return Math.round(time / 1000);
        }

        return time.split(':').reduceRight((acc, item, index, items) => {
            return acc = parseFloat(item) * Math.pow(60, items.length - 1 - index);
        }, 0);
    },

    async getEpisodes(data) {
        const { episodes } = data.collections;

        const result = await Promise.all(
            episodes.map(async(episode) => {
                const hosts = episode.data.hosts.join(', ');
                return `
                    <item>
                        <title>${episode.fileSlug}. ${episode.data.title}</title>
                        <link>${data.podcast.url}${episode.fileSlug}/</link>
                        <pubDate>${episode.date.toUTCString()}</pubDate>
                        <description><![CDATA[
                            <h2>Ведущие</h2>
                            <p>${hosts}</p>
                            ${episode.data.chapters
                                ? `<h2>Темы</h2><ul>${episode.data.chapters
                                    .map((chapter) => `<li>${chapter.time} ${chapter.title}</li>`)
                                    .join('')}</ul>`
                                : ''
                            }
                            ${await this.htmlmin(episode.content)}
                        ]]></description>
                        <guid isPermaLink='true'>${data.podcast.url}episodes/${episode.fileSlug}.mp3</guid>
                        <enclosure
                            type='audio/mpeg'
                            url='${data.podcast.url}episodes/${episode.fileSlug}.mp3'
                            length='${episode.data.fileSize}'
                        />
                        <itunes:episode>${episode.fileSlug}</itunes:episode>
                        <itunes:duration>${this.duration(episode.data.duration)}</itunes:duration>
                        <itunes:author>${hosts}</itunes:author>
                        <itunes:explicit>${data.podcast.explicit}</itunes:explicit>
                        <itunes:summary>${this.ruDate(episode.date)}: ${episode.data.title}. ${hosts}</itunes:summary>
                        <itunes:image href='${data.podcast.url}cover.png'/>
                    </item>
                `;
            })
        );

        return result.join('');
    },

    async render(data) {
        return `
            <?xml version='1.0' encoding='utf-8'?>
            <rss
                version='2.0'
                xmlns:atom='http://www.w3.org/2005/Atom'
                xmlns:itunes='http://www.itunes.com/dtds/podcast-1.0.dtd'
                xmlns:content='http://purl.org/rss/1.0/modules/content/'
            >
                <channel>
                    <title>${data.podcast.title}</title>
                    <description><![CDATA[${this.inlineMarkdown(data.podcast.description)}]]></description>
                    <copyright>${data.podcast.copyright}</copyright>
                    <language>${data.podcast.language}</language>
                    <link>${data.podcast.url}</link>

                    <atom:link href='${data.podcast.url}feed/' rel='self' type='application/rss+xml'/>

                    <itunes:subtitle>${data.podcast.subtitle}</itunes:subtitle>
                    <itunes:type>${data.podcast.type}</itunes:type>
                    <itunes:author>${data.podcast.author}</itunes:author>
                    <itunes:explicit>${data.podcast.explicit}</itunes:explicit>
                    <itunes:owner>
                        <itunes:name>${data.podcast.owner.name}</itunes:name>
                        <itunes:email>${data.podcast.owner.email}</itunes:email>
                    </itunes:owner>
                    <itunes:image href='${data.podcast.url}cover.png'/>

                    ${data.podcast.categories
                        .map(
                            (category) =>
                                `<itunes:category text='${category.title}'>${
                                    category.items
                                        ? category.items
                                            .map((category) => `<itunes:category text='${category}'/>`)
                                            .join('')
                                        : ''
                                }</itunes:category>`
                        )
                        .join('')}

                    ${await this.getEpisodes(data)}
                </channel>
            </rss>
        `;
    },
};
