/**
 * TODO: I'll explain this later
 */
export default (params: URLSearchParams, param: string): {
	passthroughParamExists: false;
} | {
	passthroughParamExists: true;
	param: string;
} => {
	const item = params.get(param);

	if (item) {
		for (const passthroughVal of params.getAll(`_${item}`))
			params.append(item, passthroughVal);
		params.delete(`_${item}`);

		return {
			passthroughParamExists: true,
			param: item,
		};
	}

	return { passthroughParamExists: false };
};
