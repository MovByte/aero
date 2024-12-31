/**
 * TODO: Import the necessary @types
 */

import { APIInterceptor, SupportEnum } from "$types/apiInterceptors";

import { escapeWithOrigin, unescapeWithOrigin } from "$src/shared/escaping/escape";

export default [{
	/** Emulates for the `Clear-Site-Data` header */
	init() {
		const clear = $aero.sec.clear;
		const all = clear.includes("'*'");
		if (all || clear.includes("'storage'")) {
			window.requestFileSystem(
				window.TEMPORARY,
				1024 * 1024,
				(fs: FileSystem) => {
					fs.root.createReader().readEntries(entries => {
						entries.forEach(entry => {
							const path = entry.fullPath;
							if (entry.isDirectory) {
								if (path.startsWith(escapeWithOrigin("")))
									if ("removeRecursively" in entry)
										entry.removeRecursively(() => $aero.logger.log(`Successfully removed the file @ ${path}, as directed by the \`Clear-Site-Data\` header`), (fileErr: FileError) => $aero.logger.error(`Failed to remove file @ ${path}, as directed by the \`Clear-Site-Data\` header: ${fileErr.message}!`));
									else
										$aero.logger.warn(`Can't clear directory, ${path}, as directed by the \`Clear-Site-Data\` header since your browser doesn't support the FileSystemEntry.\`removeRecursively\` method (this is normal the API has been long deprecated)!`);
							} else {
								if ("remove" in entry)
									entry.remove(() => $aero.logger.log(`Successfully removed the file @ ${path}, as directed by the \`Clear-Site-Data\` header`), (fileErr: FileError) => $aero.logger.error(`Failed to remove file @ ${path}, as directed by the \`Clear-Site-Data\` header: ${fileErr.message}!`));
								else
									$aero.logger.warn(`Can't clear directory, ${path}, as directed by the \`Clear-Site-Data\` header since your browser doesn't support the FileSystemEntry.\`remove\` method (this is normal the API has been long deprecated)!`);
							}
						});
					});
				}
			);
		}
	},
	forCors: true,
	globalProp: "requestFileSystem",
	supports: SupportEnum.shippingChromium || SupportEnum.nonstandard
}, {
	proxyHandler: {
		apply: (target, that, args) => {
			const [proxifiedDirPath] = args;
			/** The unescaped dir path */
			const realDirPath = unescapeWithOrigin(proxifiedDirPath);
			args[0] = realDirPath;
			return Reflect.apply(target, that, args);
		}
	},
	globalProp: "FileSystemDirectoryEntry.prototype.getDirectory"
}, {
	proxyHandler: {
		apply: (target, that, args) => {
			const [realDirPath] = args;
			/** The escaped dir path */
			const proxifiedDirPath = escapeWithOrigin(realDirPath);
			args[0] = proxifiedDirPath;
			return Reflect.apply(target, that, args);
		}
	},
	globalProp: "FileSystemDirectoryEntry.prototype.setDirectory"
}] as APIInterceptor[];