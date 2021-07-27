import * as webpackModules from "@goosemod/webpack";
import {PlayerStore} from "./PlayerStore";
import {$} from "./Utils";
import {SpotifyControls} from "./SpotifyControls";

const {React} = webpackModules.common;
const {useState, useRef, useEffect} = React;
const Flux = webpackModules.findByProps("Store", "useStateFromStores");
const {useStateFromStores} = Flux;

const canvas = document.createElement("canvas").getContext("2d");

const contextMenu = webpackModules.findByProps(
  "openContextMenu",
  "closeContextMenu"
);

const Menu = webpackModules.findByProps("MenuItem", "MenuStyle");
const VolumeSlider = webpackModules.find(
  (x) =>
    x.default &&
    x.default.render &&
    x.default.render.toString().indexOf(".default.sliderContainer") > -1
).default;
const clipboard = webpackModules.findByProps("SUPPORTS_COPY");

function openContextMenu(event) {
  event.preventDefault();
  contextMenu.openContextMenu(event, () =>
    React.createElement(SpotifyContextMenu)
  );
}

function SpotifyContextMenu(props) {
  const volume = useStateFromStores([PlayerStore], () => PlayerStore.volume);
  return React.createElement(
    "div",
    {className: props.className, style: props.style},
    React.createElement(
      Menu.default,
      {
        navId: "spotify-context",
        onClose: contextMenu.closeContextMenu,
        "aria-label": "Spotify Settings",
      },
      React.createElement(
        Menu.MenuGroup,
        null,
        React.createElement(Menu.MenuControlItem, {
          id: "volume",
          key: "volume",
          label: "Volume",
          control: (props, ref) => {
            return React.createElement(
              VolumeSlider,
              Object.assign({}, props, {
                ref,
                value: volume,
                maxValue: 100,
                onChange: (value) => PlayerStore.setVolume(Math.round(value)),
                "aria-label": "Volume",
              })
            );
          },
        }),
        React.createElement(Menu.MenuItem, {
          id: "open-spotify-url",
          label: "Open in Spotify",
          action: () => {
            window.open("spotify:track:" + PlayerStore.track.id);
          },
        }),
        React.createElement(Menu.MenuItem, {
          id: "copy-url",
          label: "Copy URL",
          action: () => clipboard.copy(PlayerStore.track.url),
        })
      )
    )
  );
}

export function SpotifyPlayer() {
  useEffect(() => {
    if (PlayerStore.setup) {
      PlayerStore.setup();
    }
    return () => {
      if (PlayerStore.dismantle) {
        PlayerStore.dismantle();
      }
    };
  }, []);

  const hasDevice = useStateFromStores(
    [PlayerStore],
    () => !!PlayerStore.device
  );

  const barRef = useRef(null);
  const thumbRef = useRef(null);
  const [thumbStart, setThumbStart] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      setThumbWidth(rect.width);
      setThumbStart(rect.x);
    } else {
      setThumbWidth(0);
      setThumbStart(0);
    }
  }, [barRef.current]);

  const track = useStateFromStores(
    [PlayerStore],
    () => PlayerStore.track,
    null,
    (oldTrack, newTrack) =>
      (oldTrack && oldTrack.id) == (newTrack && newTrack.id)
  );

  const calculatePosition = (event) => {
    const clamped = Math.max(
      thumbStart,
      Math.min(thumbStart + thumbWidth, event.clientX)
    );
    const percent = (clamped - thumbStart) / thumbWidth;
    return percent * track.duration;
  };

  const mouseMove = (event) => {
    if (dragging) {
      const position = calculatePosition(event);
      if (PlayerStore.playbackState) {
        PlayerStore.setPlaying(false);
        PlayerStore.playbackState = false;
      }
      PlayerStore.position = position;
      PlayerStore.lockPosition = true;
      PlayerStore.emitChange();
    }
  };
  const mouseUp = (event) => {
    if (dragging) {
      const position = calculatePosition(event);
      PlayerStore.position = position;
      setDragging(false);
      PlayerStore.emitChange();
      PlayerStore.setPosition(position).then(() => {
        PlayerStore.position = position;
        PlayerStore.lockPosition = false;
        PlayerStore.emitChange();
        if (!PlayerStore.playbackState) {
          PlayerStore.playbackState = true;
          PlayerStore.emitChange();
          PlayerStore.setPlaying(true);
        }
      });
    }
  };
  useEffect(() => {
    if (window) {
      window.addEventListener("mousemove", mouseMove);
      window.addEventListener("mouseup", mouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", mouseUp);
    };
  }, [thumbStart, thumbWidth, dragging, track]);

  const album = useStateFromStores(
    [PlayerStore],
    () => PlayerStore.track && PlayerStore.track.album,
    null,
    (oldAlbum, newAlbum) =>
      (oldAlbum && oldAlbum.id) == (newAlbum && newAlbum.id)
  );

  const image = useStateFromStores(
    [PlayerStore],
    () =>
      PlayerStore.track &&
      PlayerStore.track.album &&
      PlayerStore.track.album.image
  );

  const position = useStateFromStores(
    [PlayerStore],
    () => PlayerStore.position
  );

  const trackNameRef = useRef(null);
  const albumNameRef = useRef(null);

  const [nameWidth, setNameWidth] = useState(null);
  const [albumNameWidth, setAlbumNameWidth] = useState(null);

  const albumText =
    album &&
    `${track.artists.map((artist) => artist.name).join(", ")}${
      album.name && album.name != "" ? ` • ${album.name}` : ""
    }`;

  const [fontFamily, setFontFamily] = useState("Whitney");
  const [albumNameSize, setAlbumNameSize] = useState("12.8px");
  const [nameSize, setNameSize] = useState("16px");
  useEffect(() => {
    if (albumNameRef.current) {
      const computed = getComputedStyle(albumNameRef.current);
      setFontFamily(computed.fontFamily);
      setAlbumNameSize(computed.fontSize);
      setNameSize(getComputedStyle(trackNameRef.current).fontSize);
    }
  }, [albumNameRef.current]);

  useEffect(() => {
    if (track && track.name) {
      canvas.font = `${nameSize} ${fontFamily}`;
      const nameWidth =
        canvas.measureText(track.name).width -
        (trackNameRef.current
          ? trackNameRef.current.getClientRects()[0].width
          : 0);
      setNameWidth(nameWidth);
      if (album) {
        canvas.font = `${albumNameSize} ${fontFamily}`;
        setAlbumNameWidth(
          canvas.measureText(albumText).width -
            (albumNameRef.current
              ? albumNameRef.current.getClientRects()[0].width
              : 0)
        );
      }
    }
  }, [
    albumNameSize,
    nameSize,
    fontFamily,
    albumText,
    track && track.name,
    trackNameRef.current,
    albumNameRef.current,
    album && album.image,
  ]);

  if (!track || !hasDevice) return null;

  const percent = `${(position / track.duration) * 100}%`;

  return React.createElement(
    "div",
    {className: $("player-wrap")},
    React.createElement(
      "div",
      {
        className: $("player"),
      },
      null,
      image &&
        React.createElement(
          album.url ? "a" : "span",
          Object.assign(
            {
              className: $("album-image"),
            },
            album.url && {
              target: "_blank",
              href: album.url,
            }
          ),
          React.createElement("img", {
            src: image.url,
            onError: (err) => {
              PlayerStore.track.album.image = null;
              PlayerStore.emitChange();
            },
            onContextMenu: (event) => openContextMenu(event),
          })
        ),
      React.createElement(
        "div",
        {
          className: $("info-box") + (album.image ? "" : " " + $("no-album")),
        },
        React.createElement(
          "div",
          {
            className: $("track-name"),
            ref: trackNameRef,
          },
          React.createElement(
            track.url ? "a" : "span",
            Object.assign(
              {
                style: {
                  width: nameWidth,
                  animation: nameWidth > 0 ? undefined : "none",
                  animationDuration: `${nameWidth > 0 ? nameWidth / 30 : 5}s`,
                },
                onContextMenu: (event) => openContextMenu(event),
              },
              track.url && {
                target: "_blank",
                href: track.url,
              }
            ),
            track.name
          )
        ),
        React.createElement(
          "div",
          {
            className: $("album-name"),
            ref: albumNameRef,
          },
          React.createElement(
            album.url ? "a" : "span",
            Object.assign(
              {
                style: {
                  animationDuration: `${
                    albumNameWidth > 0 ? albumNameWidth / 30 : 5
                  }s`,
                  width: albumNameWidth,
                  animation: albumNameWidth > 0 ? undefined : "none",
                },
                onContextMenu: (event) => openContextMenu(event),
              },
              album.url && {
                target: "_blank",
                href: album.url,
              }
            ),
            albumText
          )
        )
      ),
      React.createElement(SpotifyControls)
    ),
    React.createElement(
      "div",
      {
        className: $("playback"),
      },
      React.createElement(
        "div",
        {
          className: $("playback-bar"),
          style: {backgroundSize: `${percent} 100%, 100% 100%`},
          ref: barRef,
          onClick: (event) => {
            const position = calculatePosition(event);
            PlayerStore.position = position;
            PlayerStore.lockPosition = true;
            PlayerStore.emitChange();
            PlayerStore.setPosition(position).then(() => {
              PlayerStore.position = position;
              PlayerStore.lockPosition = false;
              PlayerStore.emitChange();
              if (!PlayerStore.playbackState) {
                PlayerStore.playbackState = true;
                PlayerStore.emitChange();
                PlayerStore.setPlaying(true);
              }
            });
          },
        },
        React.createElement("span", {
          className: $("playback-thumb") + (dragging ? " " + $("active") : ""),
          onMouseDown: () => {
            setDragging(true);
          },
          style: {left: percent},
          ref: thumbRef,
        })
      )
    )
  );
}
