import { upToProxyOrigin } from "$aero/src/shared/upToProxyLocation";
import { storageNomenclature, storagePrefix } from "$aero/src/shared/storage";

// @ts-ignore
declare var openDatabase;

declare global {
    interface Window {
        requestFileSystem: any;
        TEMPORARY: any;
    }
}

if (/*flags.nonstandard*/ true) {
    // Emulates the Clear Site Data header
    navigator.serviceWorker.addEventListener("message", event => {
        if (event.data === "clearExecutionContext") location.reload();
    });
}

// Private scope
{
    const clear = $aero.sec.clear;
    const all = clear.includes("'*'");

    if (all || clear.includes("'cookies'")) {
        function clearCookies(path: string) {
            const cookies = document.cookie.split(";");

            for (const cookie of cookies) {
                const eqPos = cookie.indexOf("=");

                const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;

                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            }
        }

        clearCookies(upToProxyOrigin($aero.prefix, $aero.logger));
    }

    // Storage
    if (all || clear.includes("'storage'")) {
        // iDB
        indexedDB.databases().then(databases => {
            databases.forEach(database => {
                if (
                    database?.name &&
                    database.name.startsWith(storageNomenclature)
                ) {
                    indexedDB.deleteDatabase(database.name);
                }
            });
        });

        // Storage
        function clearStoreAPI(apiName: string) {
            if (apiName in window) {
                // @ts-ignore
                const storage = window[apiName];

                if (storage instanceof Storage) {
                    for (const [key] of Object.entries(storage)) {
                        if (key.startsWith(storagePrefix())) {
                            storage.removeItem(key);
                        }
                    }
                }
            }
        }

        clearStoreAPI("localStorage");
        clearStoreAPI("sessionStorage");

        // WebDatabase (WebSQL);
        if (
            flags.legacy &&
            "openDatabase" in window &&
            localStorage.hasItem("dbNames")
        ) {
            const dbNames = localStorage.getItem("dbNames");
            if (dbNames !== null)
                for (const dbName of dbNames) {
                    // @ts-ignore
                    openDatabase(dbName).transaction(tx => {
                        tx.executeSql(
                            'SELECT name FROM sqlite_master WHERE type="table"',
                            [],
                            // @ts-ignore
                            (tx, data) => {
                                for (let i = 0; i < data.rows.length; i++) {
                                    const tableName = data.rows.item(i).name;

                                    if (
                                        tableName.startsWith(storagePrefix()) &&
                                        tableName !==
                                        "__WebKitDatabaseInfoTable__"
                                    )
                                        tx.executeSql(
                                            `DELETE FROM ${tableName}`
                                        );
                                }
                            }
                        );
                    });
                }
        }

        if (all || clear.includes("'storage'")) {
            // This only works on Chrome
            // TODO: Clear
            if (window.requestFileSystem) {
                window.requestFileSystem(
                    window.TEMPORARY,
                    1024 * 1024,
                    (fs: FileSystem) => {
                        fs.root.createReader().readEntries(entries => {
                            entries.forEach(entry => {
                                if (entry.isDirectory) {
                                    // @ts-ignore
                                    // TODO: Clear any of the directories that .startsWith(storagePrefix())
                                    entry.removeRecursively(() => null); // Stub
                                } else {
                                    // @ts-ignore
                                    // Stub
                                    // TODO: Clear any of the directories that .startsWith(storagePrefix())
                                    entry.remove(() => null);
                                }
                            });
                        });
                    }
                );
            }
        }

        // Service Workers
        navigator.serviceWorker.getRegistrations().then(regs => {
            for (const reg of regs) {
                if (reg.scope.startsWith(upToProxyOrigin())) {
                    reg.unregister();
                }
            }
        });
    }
}
