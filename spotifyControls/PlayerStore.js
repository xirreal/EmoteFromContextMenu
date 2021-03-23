import * as webpackModules from "@goosemod/webpack";

let {React} = webpackModules.common;
while (!React) {
  webpackModules.generateCommons();
  React = webpackModules.common.React;
}
const Flux = webpackModules.findByProps("Store", "useStateFromStores");
const Dispatcher = webpackModules.findByProps("isDispatching");
const SpotifySocket = webpackModules.findByProps("getActiveSocketAndDevice");
const Spotify = webpackModules.findByProps("SpotifyAPI");
const HTTP = webpackModules.findByProps("put", "get", "post");
const {timeoutPromise} = webpackModules.findByProps("timeoutPromise");

Spotify.SpotifyAPI.post = function (
  accountId,
  accessToken,
  options,
  retries = 1
) {
  options = Object.assign(options, {
    headers: {
      authorization: "Bearer " + accessToken,
    },
  });

  return HTTP.post(options)
    .then((res) => (res.status == 202 ? Promise.reject(res) : res))
    .catch((res) => {
      const retry =
        !options.onlyRetryOnAuthorizationErrors && res.status == 202;
      return (res.status == 401 || retry) && retries > 0
        ? (res.status == 202 ? timeoutPromise(5000) : Promise.resolve())
            .then(() => Spotify.getAccessToken(accountId))
            .then((res2) =>
              Spotify.SpotifyAPI.post(
                accountId,
                res2.body.access_token,
                options,
                retries - 1
              )
            )
            .then(
              (res2) =>
                new Promise((resolve) => setImmediate(() => resolve(res2)))
            )
        : Promise.reject(res);
    });
};

export class SpotifyStore extends Flux.Store {
  initialize() {
    this.track = null;
    this.volume = 0;
    this.playbackState = false;
    this.repeat = false;
    this.device = null;

    this._when = 0;
    this._position = 0;
  }

  set position(position) {
    this._position = position;
    this._when = Date.now();
  }

  get position() {
    if (this.playbackState) {
      return Date.now() - this._when + this._position;
    } else {
      return this._position;
    }
  }

  setPlaying(state) {
    if (state) {
      return this.put("/me/player/play");
    } else {
      return this.put("/me/player/pause");
    }
  }

  setPosition(position) {
    return this.put("/me/player/seek", {
      query: {
        position_ms: Math.round(position),
      },
    });
  }

  setVolume(volume) {
    this.volume = volume;
    this.emitChange();
    return this.put("/me/player/volume", {
      query: {
        volume_percent: volume,
      },
    });
  }

  skip() {
    this.post("/me/player/next");
  }

  previous() {
    this.post("/me/player/previous");
  }

  request(method, url, data) {
    const socket = SpotifySocket.getActiveSocketAndDevice().socket;
    return Spotify.SpotifyAPI[method](
      socket.accountId,
      socket.accessToken,
      Object.assign(
        {
          url: "https://api.spotify.com/v1" + url,
          body: {},
          method: "POST",
        },
        data
      )
    );
  }

  post(url, data) {
    return this.request("post", url, data);
  }
  put(url, data) {
    return this.request("put", url, data);
  }
  get(url, data) {
    return this.request("get", url, data);
  }
}

export const PlayerStore = new SpotifyStore(Dispatcher, (event) => {
  switch (event.type) {
    case "SPOTIFY_PLAYER_STATE": {
      PlayerStore.track = event.track || null;
      if (PlayerStore.track) {
        if (PlayerStore.track.album) {
          PlayerStore.track.album.url = `https://open.spotify.com/album/${PlayerStore.track.album.id}`;
        }
        PlayerStore.track.url = `https://open.spotify.com/track/${PlayerStore.track.id}`;
      }
      PlayerStore.volume = event.volumePercent || 0;
      PlayerStore.playbackState = event.isPlaying || false;
      PlayerStore.repeat = event.repeat || false;
      PlayerStore.device = event.device || null;
      if (!PlayerStore.lockPosition) {
        PlayerStore.position = event.position || null;
      }
      PlayerStore.emitChange();
      break;
    }
  }
});
