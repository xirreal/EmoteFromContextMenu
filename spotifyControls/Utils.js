import * as webpackModules from "@goosemod/webpack";

export function $(className) {
  return "gm-spotify-controls-" + className;
}

export function findInModules(...search) {
  const {req} = webpackModules;
  return Object.entries(req.m)
    .filter(
      ([id, mod]) =>
        !search.some(
          (find) =>
            !(find instanceof RegExp
              ? mod.toString().match(find)
              : mod.toString().includes(find))
        )
    )
    .map(([i]) => req(i))[0];
}
