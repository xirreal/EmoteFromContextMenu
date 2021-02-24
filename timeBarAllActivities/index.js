import * as webpackModules from "@goosemod/webpack";

let unpatch;

export default {
  goosemodHandlers: {
    onImport: () => {
      const shouldRenderTimeBar = webpackModules.find(
        (module) =>
          module.default &&
          typeof module.default === "function" &&
          module.default.toString().match(/return null!=.&&.+?\.party\.id\)/)
      );

      const oldExports = shouldRenderTimeBar.default;
      shouldRenderTimeBar.default = function (activity) {
        // dont ever do this unless you have no other option
        const stack = new Error().stack;
        if (
          stack.includes("renderTimeBar") ||
          stack.includes("renderTimePlayed")
        )
          return activity != null;
        return oldExports(activity);
      };
      unpatch = () => (shouldRenderTimeBar.default = oldExports);
    },

    onRemove: () => {
      unpatch();
    },
  },
};
