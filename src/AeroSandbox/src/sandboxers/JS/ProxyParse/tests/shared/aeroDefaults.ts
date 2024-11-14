/**
 * @module
 * This module contains the defaults for Aero's Rewriters, including the config and the namespaces you can find the objects in.
 * This file is intended for the JS tests, but exists so that you can do whatever you want with it.
 */
import AeroGel from "../../../backends/AeroGel";

// aero defaults
export const propTreeAeroGelSpecific = 'window["<proxyNamespace>"]["<ourNamespace>"].rewriters.js.aeroGel.';
export const propTree = 'window["<proxyNamespace>"]["<ourNamespace>"].rewriters.js.shared.';
/** [key: rewriterName]: rewriter handler */
export const tryRewritersAero = {
	AeroGel: (new (AeroGel.default)({
		aeroGelConfig: {
			propTrees: {
				fakeLet: propTreeAeroGelSpecific + "fakeLet",
				fakeConst: propTreeAeroGelSpecific + "fakeConst",
			},
			proxified: {
				evalFunc: propTree + "proxifiedEval",
				location: propTree + "proxifiedLocation"
			},
			checkFunc: propTree + "checkFunc"
		},
		keywordGenConfig: {
			supportStrings: true,
			supportTemplateLiterals: true,
			supportRegex: true,
		},
		trackers: {
			blockDepth: true,
			propertyChain: true,
			proxyApply: true
		}
	})).jailScript
	// TODO: Add AeroJet
}