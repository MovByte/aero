import { proxyGetString } from "$aero/src/shared/stringProxy";

proxyGetString("File", ["webkitRelativePath"]);

// TODO: Finish all interecptors for functions that create new files

// TODO: Proxy this
/*
FIXME: Don't use this interface
FileSystemEntry = new Proxy(FileSystemEntry, {
	construct() {
		const ret = target.construct(...arguments);

		const toURL = ret.toURL;
		ret.toURL = () => afterPrefix(toURL());
	},
});
*/
