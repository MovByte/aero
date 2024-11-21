/**
 * @module
*/
export default (str: string): string =>
    str
        .replace(/`/g, "\\`")
        .replace(/\${/g, String.raw`$\{`)
        .replace(/<\/script>/g, String.raw`<\/script>`);
