export default (errLogAfterColon: string) => ({
	aeroErrTag: `Aero Error${errLogAfterColon}`,
	devErrTag: `Proxy Site Dev Error${errLogAfterColon}`,
	userErrTag: `User Error${errLogAfterColon}`
});