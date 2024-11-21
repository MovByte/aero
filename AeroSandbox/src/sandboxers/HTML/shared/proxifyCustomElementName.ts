const key = "proxified_";
export { key };

export default (name: string) => `${key}_${name}`;
