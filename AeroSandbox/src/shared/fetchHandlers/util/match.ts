export default (exp: string, search: string, includeProto = true): boolean =>
	new RegExp(
		exp.replace(includeProto ? /\*/g : /\*(?!:\/\/)/, "[^ ]*"),
		"g"
	).test(search);
