export const stringify = (v: Object) => JSON.stringify(v, null, 2);
export const unstringify = (v: string) => JSON.parse(v);
export const verbose = (...v: any[]) => {
    false && console.log(...v);
}
