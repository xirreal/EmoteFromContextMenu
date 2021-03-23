import * as webpackModules from "@goosemod/webpack";
import * as reactUtils from "@goosemod/reactUtils";
import {patch} from "@goosemod/patcher";
import {SpotifyPlayer} from "./SpotifyPlayer";
import {$} from "./Utils";

const moduleCSS = `
.${$("playback-bar")} {
  position: relative;
  height: 0.25em;
  width: 100%;
  background-image: linear-gradient(var(--interactive-active), var(--interactive-active)), linear-gradient(var(--background-primary), var(--background-primary));
  background-size: 0% 100%, 100% 100%;
  background-repeat: no-repeat;
}

.${$("playback-bar")}:hover .${$("playback-thumb")},
.${$("playback-bar")} .${$("playback-thumb")}:hover,
.${$("playback-bar")} .${$("playback-thumb")}.${$("active")} {
  display: inline-block;
}

.${$("playback-thumb")} {
  position: absolute;
  display: none;
  height: 0.8em;
  width: 0.8em;
  background: #fff;
  border-radius: 100%;
  top: 0.125em;
  transform: translate(-0.4em, -0.4em);
  box-shadow: var(--elevation-stroke), var(--elevation-low)
  cursor: ew-resize;
}

.${$("player")} {
  margin: 0.25em;
  height: 2.5em;
  display: flex;
}

.${$("info-box")} {
  display: inline-flex;
  flex-grow: 1;
  flex-shrink: 1;
  flex-direction: column;
  margin: 0.25em 0em 0.25em 0.5em;
  white-space: nowrap;
  max-width: calc(100% - 7.5em);
}

.${$("info-box")}.${$("no-album")} {
  max-width: calc(100% - 5em);
}

.${$("album-name")} {
  height: 1em;
  overflow: hidden;
  font-size: 0.8em;
}


.${$("track-name")} span,
.${$("track-name")} a {
  color: var(--interactive-active);
}

.${$("album-name")} span,
.${$("album-name")} a {
  color: var(--header-secondary);
}

@keyframes ${$("marquee")} {
  0%,5% {
    transform: translate(0, 0);
  }
  80%,100% {
    transform: translate(-100%, 0);
  }
}

.${$("album-name")} a,
.${$("track-name")} a,
.${$("album-name")} span,
.${$("track-name")} span {
  display: inline-block;
  height: inherit;
  width: 100%;
}

.${$("album-name")}:hover span,
.${$("track-name")}:hover span,
.${$("album-name")}:hover a,
.${$("track-name")}:hover a {
  animation: ${$("marquee")} infinite linear 5s;
  text-decoration: underline;
}

.${$("track-name")} {
  height: 1em;
  overflow: hidden;
  width: 100%;
}


.${$("album-image")} img {
  height: inherit;
  width: 100%;
  border-radius: 5%;
}

.${$("album-image")} {
  flex-grow: 0;
  flex-shrink: 0;
  display: inline-block;
  height: 2.5em;
  width: 2.5em;
}


.${$("timestamp")} {
  font-face: monospace;
  color: #ddd;
  font-size: 0.75em;
}

button.${$("button")} {
  background: none;
}

.${$("button")} path {
  fill: var(--interactive-normal);
}

.${$("button")}:hover path {
  fill: var(--interactive-active);
}

.${$("playback")} {
  display: flex;
}

.${$("previous-button")} {
  transform: scaleX(-1);
}

.${$("buttons")} {
  display: inline-flex;
  flex-shrink: 0;
  flex-grow: 0;
}
`;

let unpatch;
let style;

export default {
  goosemodHandlers: {
    onImport: () => {
      style = document.createElement("style");
      style.innerText = moduleCSS;
      document.head.appendChild(style);

      let {React} = webpackModules.common;
      while (!React) {
        webpackModules.generateCommons();
        React = webpackModules.common.React;
      }

      console.log(SpotifyPlayer);

      const AccountClasses = webpackModules.findByProps("usernameContainer");
      const panels = reactUtils.getOwnerInstance(
        document.querySelector(
          `section[class^="panels-"] > .${AccountClasses.container}`
        )
      );
      unpatch = patch(panels.__proto__, "render", (_, ret) => {
        return [React.createElement(SpotifyPlayer), ret];
      });
      panels.forceUpdate();
    },
    onRemove: () => {
      unpatch();
      document.head.removeChild(style);
    },
  },
};
