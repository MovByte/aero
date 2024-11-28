import { type Maybe } from 'option-t/maybe';

// TODO: Get rid of block and allow and instead use `getCSPPolicyRules` and helper methods

/**
 * 
 * @param policyName The name of the policy to try to get
 * @returns Gets the rules for a CSP policy if they exist
 */
export default function getCSPPolicyRules(policyName: string): Maybe<string> {
	if ($aero.csp.includes(policyName))
		return $aero.csp[policyName].split(" ");
}