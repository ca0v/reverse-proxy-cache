export function lowercase<T>(o: T): T {
    let result = <any>{};
    Object.keys(o).sort().forEach(k => result[k.toLowerCase()] = (<any>o)[k]);
    return result;
}
