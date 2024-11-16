/**
 * @module
 * This snippet comes from the Node documentation for the `module` module.
 * @see https://nodejs.org/api/module.html#import-from-https .
 * This is used to load modules over a URL.
 * There used to be a Node flag to where this wouldn't be needed, starting from Node version 17.6 `--experimental-network-imports`, but it got removed, so this is the only option.
 */
import { get } from 'node:https';

export function load(url, context, nextLoad) {
  // For JavaScript to be loaded over the network, we need to fetch and
  // return it.
  if (url.startsWith('https://')) {
    return new Promise((resolve, reject) => {
      get(url, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({
          // This example assumes all network-provided JavaScript is ES module
          // code.
          format: 'module',
          shortCircuit: true,
          source: data,
        }));
      }).on('error', (err) => reject(err));
    });
  }

  // Let Node.js handle all other URLs.
  return nextLoad(url);
}