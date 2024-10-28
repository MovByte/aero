/**
 * @module
 * This is a very simple and self-explanatory module...
 */

/**
 * Used in aero's SW to determine if the request is for an HTML file
 * @param type The content type of the request
 * @returns A boolean indicating if the request is for an HTML file
 */
export default (type: string): boolean =>
    type.startsWith("text/html") || type.startsWith("application/xhtml+xml");
