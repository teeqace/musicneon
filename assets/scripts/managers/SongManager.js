const SONG_FILE_NAME = 'json/songs.json';

class SongManager {
  constructor() {
    this._songs = {};
  }

  loadSongs() {
    return new Promise((resolve, reject) => {
      cc.loader.loadRes(SONG_FILE_NAME, (error, json) => {
        if (error) {
          resolve({});
        } else {
          this._songs = json;
          resolve(json);
        }
      });
    });
  }

  getSong(id) {
    if (!this._songs[id]) {
      return null;
    }
    return this._songs[id];
  }
}

const __instance = new SongManager;

export default __instance;
