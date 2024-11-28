import { type Maybe } from 'option-t/maybe';

// TODO: Check the policy of the parent's too in case this is an iframe
export default list => {
	if (list) {
	}

	return false;
};

/**
 * 
 * @param policyName The name of the policy to try to get
 * @returns Gets the rules for a CSP policy if they exist
 */
export default function getCSPPolicyRules(policyName: string): Maybe<string> {
	if ($aero.csp.includes(policyName))
		return $aero.csp[policyName].split(" ");
}