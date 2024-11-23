/**
 * @module
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/destination
 * @see https://fetch.spec.whatwg.org/#requestdestination
 * @see https://www.iana.org/assignments/media-types/media-types.xhtml#:~:text=application
 * 
 * This is meant to emulate a property on the `Request` that is usually only on real SWs and not *Cloudflare Workers*
 * I will make a separate bundle for this, so that you can use it on the *NPM* and *JSR* for your own server-only proxies that happen to work on real SWs
 */

const pluginTypes: string[] = [
	"application/x-shockwave-flash",
	"application/pdf",
	"application/javascript",
	"application/octet-stream"
];
const audioTypes: string[] = [
	"audio/mpeg",
	"audio/wav",
	"audio/aac",
	"audio/ogg",
	"audio/webm",
	"audio/flac"
]
const videoTypes: string[] = [
	"video/mp4",
	"video/webm",
	"video/ogg"
]
/** These support arrays are in order of when they were first supported by major browsers */
const contentTypesBasedOnReqDests: {
	[key: string]: string[];
} = {
	audio: audioTypes,
	audioworklet: [
		"audio/worklet"
	],
	document: [
		"text/xml",
		"application/xml",
		"application/xhtml+xml",
		"text/plain",
		"text/html",
		"application/vnd.ms-office"
	],
	embed: {
		...pluginTypes,
		...audioTypes,
		...videoTypes
	},
	font: [
		"font/woff",
		"font/ttf",
		"application/font-woff2",
		"font/otf",
		"application/x-font-woff",
		"application/vnd.ms-fontobject"
	],
	image: [
		"image/gif",
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/svg+xml",
		"image/apng",
		"image/bmp",
		"image/tiff"
	],
	json: [
		"application/json"
	],
	manifest: [
		"application/manifest+json"
	],
	object: pluginTypes,
	paintworklets: [
		"image/paintworklet"
	],
	report: [
		"application/json"
	],
	script: [
		"application/javascript",
		"text/javascript",
	],
	style: [
		"text/css",
		"application/x-font-woff",
		"font/woff"
	],
	track: [
		"video/mp4",
		"audio/mp4",
		"application/xml"
	],
	video: videoTypes,
	worker: [
		"application/javascript"
	],
	xslt: [
		"application/xslt+xml",
		"application/xml"
	]
};

/**
 * Gets the Request destination from the Response content type
 * @returns The Request destination as per the SW spec
 */
export default function getReqDest(contentType: string): string {
	for (const [targetReqDestType, targetContentTypes] of Object.entries(contentTypesBasedOnReqDests)) {
		if (targetContentTypes.includes(contentType))
			return targetReqDestType;
	}
	return "";
}