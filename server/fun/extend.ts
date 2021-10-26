export function extend<T extends Object>(arg0: T, arg1: T) {
  const keys = Object.keys(arg1);
  keys.forEach((k) => {
    if (typeof (<any>arg0)[k] !== "undefined") return;
    (<any>arg0)[k] = (<any>arg1)[k];
  });
}
