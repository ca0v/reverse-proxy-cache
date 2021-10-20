export function deleteHandler(
  switchName: string,
  gatewayFile: string,
  fromCacheWhereResLike: string
) {
  if ("--delete" !== switchName) throw "invalid switch";
  if (!gatewayFile)
    throw `you must specify a target package.json files as the 1st argument`;
}
