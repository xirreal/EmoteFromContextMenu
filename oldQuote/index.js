import {webpackModules} from "@goosemod/discord";
import {contextMenu} from "@goosemod/patcher";

let unpatch;

export default {
  goosemodHandlers: {
    onImport: () => {
      const {ComponentDispatch} = webpackModules.findByProps(
        "ComponentDispatch"
      );
      const {ComponentActions} = webpackModules.findByProps("ComponentActions");
      const {Messages} = webpackModules.findByProps("Messages");

      unpatch = contextMenu.patch("message", {
        label: Messages.QUOTE,
        action: (_, props) => {
          const lines = props.message.content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            lines[i] = "> " + lines[i];
          }

          const out = lines.join("\n") + "\n";

          ComponentDispatch.dispatchToLastSubscribed(
            ComponentActions.INSERT_TEXT,
            {
              content: out,
            }
          );
        },
      });
    },
  },
};
