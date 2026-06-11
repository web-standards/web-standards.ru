import { parser as htmlToTree } from 'posthtml-parser';

export { htmlToTree };

export function html(strings, ...values) {
    const rawHtmlString = typeof strings === 'string'
        ? strings
        : strings.reduce((result, string, index) => result + string + (index < values.length ? values[index] : ''), '');

    return htmlToTree(rawHtmlString);
}

export function* walk(iterable) {
    const queue = [...iterable];
    while (queue.length > 0) {
        const node = queue.shift();
        yield node;
        if (node.content) {
            queue.push(...node.content);
        }
    }
}

export function hasNodeClass(node, className) {
    return node?.attrs?.class?.split?.(/\s+/).includes(className);
}
