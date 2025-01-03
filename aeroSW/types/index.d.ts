/**
 * Sec interface.
 * This interface is used to define the security options.
 */
export type Sec = Partial<{
	clear: string[];
	timing: string;
	permsFrame: string;
	perms: string;
	frame: string;
	csp: string;
}>;
