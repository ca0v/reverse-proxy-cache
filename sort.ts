export function sort(o: any): any {
  if (null === o) return o;
  if (undefined === o) return o;
  if (typeof o !== "object") return o;
  if (Array.isArray(o)) {
    return o.map((item) => sort(item));
  }
  const keys = Object.keys(o).sort();
  const result = <any>{};
  keys.forEach((k) => (result[k] = sort(o[k])));
  return result;
}
