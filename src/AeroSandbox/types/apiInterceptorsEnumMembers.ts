import { ExposedContextsEnum } from "./apiInterceptors";}

export type anyWorkerExceptServiceWorkerEnumMember =
    | ExposedContextsEnum.animationWorklet
    | ExposedContextsEnum.audioWorklet
    | ExposedContextsEnum.dedicatedWorker
    | ExposedContextsEnum.layoutWorklet
    | ExposedContextsEnum.paintWorklet
    | ExposedContextsEnum.sharedStorageWorklet
    | ExposedContextsEnum.sharedWorker;
export type anyWorkerEnumMember =
    | anyWorkerExceptServiceWorkerEnumMember
    | ExposedContextsEnum.serviceWorker;