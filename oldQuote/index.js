import * as webpackModules from "@goosemod/webpack";
import { contextMenu } from "@goosemod/patcher";
import { createItem, removeItem } from "@goosemod/settings";

let setting = undefined;

let unpatch;

export default {
  goosemodHandlers: {
    onImport: () => {
      const { ComponentDispatch } = webpackModules.findByProps(
        "ComponentDispatch"
      );
      const { ComponentActions } = webpackModules.findByProps("ComponentActions");
      const { Messages } = webpackModules.findByProps("Messages");

      unpatch = contextMenu.patch("message", {
        label: Messages.QUOTE,
        action: (_, props) => {
          const lines = props.message.content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            lines[i] = "> " + lines[i];
          }

          const author = "<@" + props.message.author.id + "> ";

          const out = lines.join("\n") + "\n";

          if (!setting) {
            ComponentDispatch.dispatchToLastSubscribed(
              ComponentActions.INSERT_TEXT,
              {
                content: out,
              }
            );
          } else {
            ComponentDispatch.dispatchToLastSubscribed(
              ComponentActions.INSERT_TEXT,
              {
                content: out + author,
              }
            );
          }
        },
      });
    },

    onLoadingFinished: () => {
      createItem("Old Quote", [
        "1.0.0",

        {
          type: "header",
          text: "Toggle the following features as per your liking"
        },
        {
          type: "toggle",
          text: "Mention the author",
          subtext: "Adds mention of the author of the message you're quoting to",
          onToggle: (c) => {
            return setting = c;
          },
          isToggled: () => {
            return false;
          }
        }
      ])
    },

    onRemove: () => {
      unpatch();
      removeItem("Old Quote")
    }
  },
};
