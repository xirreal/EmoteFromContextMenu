import * as webpackModules from "@goosemod/webpack";
// import * as logger from "@goosemod/logger";
// import showToast from "@goosemod/toast";

//let unpatch;

export default {
  goosemodHandlers: {
    onImport: () => {
      const { React } = webpackModules.common;
      const GuildStore = webpackModules.findByProps("getGuilds");
      const EmojiActionCreators = webpackModules.findByProps("uploadEmoji");
      const PermissionStore = webpackModules.findByProps("canWithPartialContext");
      const Constants = webpackModules.findByProps("Permissions");
      const EmojiStore = webpackModules.findByProps("sanitizeEmojiName");
      const Menu = webpackModules.findByProps("MenuItem");

      //const contextMenuLinks = webpackModules.find((module) => module.default && typeof module.default === "function" && module.default.toString().includes('id:"copy-native-link"'));

      // const oldExports = contextMenuLinks.default;
      // contextMenuLinks.default = (url, extra) => {
      //   const old = oldExports(url, extra);
      //   if (!url) return old;

      //   const filename = EmojiStore.sanitizeEmojiName(
      //     url.substring(url.lastIndexOf("/"), url.lastIndexOf("."))
      //   );

      //   const children = Object.entries(GuildStore.getGuilds())
      //     .filter(([id, guild]) =>
      //       PermissionStore.can(Constants.Permissions.MANAGE_EMOJIS, guild)
      //     )
      //     .sort(([id, guild], [id2, guild2]) =>
      //       guild.name.localeCompare(guild2.name)
      //     )
      //     .map(([id, guild]) =>
      //       React.createElement(Menu.MenuItem, {
      //         id: "createEmoji-create-" + id,
      //         label: guild.name,
      //         action: async () => {
      //           let response;
      //           try {
      //             response = await fetch(url, {mode: "cors"});
      //           } catch (err) {
      //             logger.debug(
      //               "Clone Emoji",
      //               "Error fetching from: " + url,
      //               err
      //             );
      //             showToast("Couldn't create emoji.", {type: "error"});
      //             return;
      //           }
      //           await EmojiActionCreators.uploadEmoji(
      //             id,
      //             `data:${response.headers.get("Content-Type")};base64,${btoa(
      //               String.fromCharCode.apply(
      //                 null,
      //                 new Uint8Array(await response.arrayBuffer())
      //               )
      //             )}`,
      //             filename
      //           ).then(() => {
      //             showToast(`Created emoji "${filename}" in ${guild.name}.`);
      //           });
      //         },
      //       })
      //     );

      //   if (!children || !children.length) {
      //     return old;
      //   }

      //   return [
      //     React.createElement(
      //       Menu.MenuItem,
      //       {
      //         id: "createEmoji-create",
      //         label: "Create Emoji: " + filename,
      //         action: () => {},
      //       },
      //       children
      //     ),
      //     ...old,
      //   ];
      // };
      // unpatch = () => (contextMenuLinks.default = oldExports);
    },

    onRemove: () => {
      // unpatch();
    },
  },
};
