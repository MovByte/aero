// TODO: This will be the runtime version of AeroSandbox

import type { toBeDefinedErrsType } from "../types/global";
import type { err, ok, ResultAsync } from "neverthrow";

import getPropFromTree from "../src/util/getPropFromTree";

import type { Config } from "../types/config";

import initApis from "./initApis";
import isApiIncluded from "./isApiIncluded";

import type { BuildConfig } from "../types/buildConfig";

export default (buildConfig: BuildConfig) =>
	class AeroSandboxRuntime {
		// TODO: Import the types for these from aero
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		proxyNamespaceObj: any;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		aeroSandboxNamespaceObj: any;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		configObj: any;
		mergedFeatureConfig: any;
		// TODO: Remove AeroSandboxBuildConfig
		// TODO: validate the config with 
		constructor(config: Config) {
			typia.assert<Config>(config);

			/** This would be `$aero` */
			// @ts-ignore
			this.proxyNamespaceObj = getPropFromTree(
				buildConfig.proxyNamespaceObj
			);
			// @ts-ignore
			proxyNamespaceObj[OUR_NAMESPACE] = { config };
			/** This would be `$aero.sandbox` */
			// @ts-ignore
			this.aeroSandboxNamespaceObj =
				this.proxyNamespaceObj[buildConfig.aeroSandboxNamespaceObj];
			// @ts-ignore
			aeroSandboxNamespaceObj[toBeDefined] = {};
			// @ts-ignore
			this.configObj = aeroSandboxNamespaceObj[buildConfig.configKey];
			this.mergedFeatureConfig = {
				...this.configObj.featuresConfig,
				...buildConfig.featuresConfig
			};
		}
		// @ts-ignore
		initAPIs(): ResultAsync<
			// You control the APIs from other methods on this class
			void,
			toBeDefinedErrsType
		> {
			const { toBeDefinedErrs, toBeDefined } = initApis({
				proxyNamespaceObj: this.proxyNamespaceObj,
				aeroSandboxNamespaceObj: this.aeroSandboxNamespaceObj,
				featureConfig: this.mergedFeatureConfig
			});

			for (const [globalProp, proxyObject] of Object.entries(
				toBeDefined.self
			)) {
				if (isApiIncluded(globalProp, this.mergedFeatureConfig)) {
					self[globalProp] = proxyObject;
				}
			}
			for (const [
				globalProp,
				proxifiedObjWorkerVersion
			] of Object.entries(toBeDefined.proxifiedObjWorkerVersion)) {
				if (isApiIncluded(globalProp, this.mergedFeatureConfig)) {
					Object.defineProperty(
						self,
						globalProp,
						proxifiedObjWorkerVersion
					);
				}
			}

			return toBeDefinedErrs.length > 0 ? err(toBeDefinedErrs) : ok();
		}
		fakeOrigin(
			proxyOrigin?: Assert<string>
			// TODO: isWorker = false,
			// TODO: Import from Neverthrow
		): void {
			if (proxyOrigin) this.configObj.proxyOrigin = proxyOrigin; // TODO: Make functionality for this config option
			// When this is unset it will proceed with using the prefix to get the URL for the fake origin
		}
		/** This API isn't implemented yet and is here to serve as a placeholder */
		faker: {};
		// TODO: Import the Rewriters from aero
		rewriters;
	};
