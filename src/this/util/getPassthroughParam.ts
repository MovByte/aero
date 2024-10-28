export default (params: URLSearchParams, param: string): string | false => {
    const item = params.get(param);

    if (item) {
        for (const passthroughVal of params.getAll(`_${item}`))
            params.append(item, passthroughVal);
        params.delete(`_${item}`);

        return item;
    }

    return false;
};
