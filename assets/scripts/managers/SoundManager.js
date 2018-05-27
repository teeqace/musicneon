const KEY_BGM = 'musicneon:volume:bgm';
const KEY_SFX = 'musicneon:volume:sfx';
const MAX_AUDIO = 10;
const MAX_NUM_SAME_TIME = 4;
const PATH_BGM = 'audio/bgm';
const PATH_SFX = 'audio/sfx';
const CLIP_NAME_PATTERN = /\/([^\/|.]*)\.(?:mp3)/;

class SoundManager {
  constructor() {
    this._audioBgms = {};
    this._audioSfxs = {};

    cc.audioEngine.setMaxAudioInstance(MAX_AUDIO);
    cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
      this._playingClips = [];
      cc.log('stop all sound');
      cc.audioEngine.stopAll();
    });
  }

  loadAllAudio() {
    let promises = [];
    let promiseBgm = new Promise((resolve, reject) => {
      cc.loader.loadResDir(PATH_BGM, cc.AudioClip, (error, audioClips) => {
        if (error) {
          reject(error);
        } else {
          audioClips.forEach((audioClip) => {
            let id = CLIP_NAME_PATTERN.exec(audioClip)[1];
            this._audioBgms[id] = audioClip;
          });
          resolve();
        }
      });
    });

    let promiseSfx = new Promise((resolve, reject) => {
      cc.loader.loadResDir(PATH_SFX, cc.AudioClip, (error, audioClips) => {
        if (error) {
          reject(error);
        } else {
          audioClips.forEach((audioClip) => {
            let id = CLIP_NAME_PATTERN.exec(audioClip)[1];
            this._audioSfxs[id] = audioClip;
          });
          resolve();
        }
      });
    });

    promises.push(promiseBgm);
    promises.push(promiseSfx);
    return Promise.all(promises);
  }

  get isEnableBGM() {
    return this._getBGMVolume() > 0;
  }

  get isEnableSfx() {
    return this._getSfxVolume() > 0;
  }

  _getBGMVolume() {
    let volume = cc.sys.localStorage.getItem(KEY_BGM);
    return volume ? parseFloat(volume) : 1;
  }
  
  _getSfxVolume() {
    let volume = cc.sys.localStorage.getItem(KEY_SFX);
    return volume ? parseFloat(volume) : 1;
  }
  
  setBGMVolume(value) {
    for (let clipInstance of this._playingClips) {
      if (this._audioBgms[clipInstance.id]) {
        cc.audioEngine.setVolume(clipInstance.clip, value === undefined ? clipInstance.volume : value);
      }
    }
    cc.sys.localStorage.setItem(KEY_BGM, value);
  }
  
  setSfxVolume(value) {
    for (let clipInstance of this._playingClips) {
      if (this._audioSfxs[clipInstance.id]) {
        cc.audioEngine.setVolume(clipInstance.clip, value === undefined ? clipInstance.volume : value);
      }
    }
    cc.sys.localStorage.setItem(KEY_SFX, value);
  }

  muteAll() {
    this._updateVolume(0);
  }

  unmuteAll() {
    this._updateVolume();
  }
  
  _updateVolume(volume) {
    for (let clipInstance of this._playingClips) {
      cc.audioEngine.setVolume(clipInstance.clip, volume === undefined ? clipInstance.volume : volume);
    }
  }

  stopBGM(id) {
    let audioClip = this._audioBgms[id];
    if (!audioClip) {
      return;
    }
    this.stop(id);
  }
  
  stopSfx(id) {
    let audioClip = this._audioSfxs[id];
    if (!audioClip) {
      return;
    }
    this.stop(id);
  }
  
  stop(id) {
    for (let i = this._playingClips.length; i >= 0; i--) {
      let current = this._playingClips[i];
      if (!current) {
        this._playingClips.splice(i, 1);
        continue;
      }
      if (current.id !== id) {
        continue;
      }
      cc.audioEngine.stop(current.clip);
      this._playingClips.splice(i, 1);
    }
  }

  playBGM(id, loop = true, volume = 1) {
    let audioClip = this._audioBgms[id];
    if (!audioClip) {
      return;
    }
    volume *= this._getBGMVolume();
    this.play(id, audioClip, loop, volume);
  }

  playSfx(id, loop = false, volume = 1) {
    let audioClip = this._audioSfxs[id];
    if (!audioClip) {
      return;
    }
    volume *= this._getSfxVolume();
    this.play(id, audioClip, loop, volume);
  }

  play(id, audioClip, loop, volume) {
    let current = this._playingClips.find((child) => child.id === id);
    if (current && !this.canPlayNew(id, loop, volume, current)) {
      return;
    }
    if (cc.sys.OS_ANDROID === cc.sys.os && this._playingClips.length > MAX_AUDIO) {
      let index = this._playingClips.findIndex((child) => !child.loop);
      let clips = this._playingClips.splice(index, 1);
      cc.audioEngine.stop(clips[0].clip);
    }

    let clipId = cc.audioEngine.play(audioClip, loop, volume);
    cc.audioEngine.setFinishCallback(clipId, () => {
      let index = this._playingClips.findIndex((child) => child.id === id && child.clip === clipId);
      this._playingClips.splice(index, 1);
    });
    this._playingClips.push({
      id: id,
      clip: clipId,
      loop: loop,
      volume: volume
    });
  }

  canPlayNew(id, loop, volume, current) {
    if (loop ^ current.loop) {
      cc.warn('╮(๑•́ ₃•̀)╭');
      return false;
    } else if (loop && cc.audioEngine.getVolume(current.clip) === 0) {
      cc.audioEngine.setVolume(current.clip, volume);
      return false;
    } else if (loop) {
      return false;
    }
    if (cc.sys.OS_ANDROID !== cc.sys.os) {
      return true;
    }
    let clipCount = 0;
    for (let clipInstance of this._playingClips) {
      clipCount += clipInstance.id === id ? 1 : 0;
    }
    if (clipCount >= MAX_NUM_SAME_TIME) {
      cc.audioEngine.setVolume(current.clip, volume);
      return false;
    }
    return true;
  }
}

const __instance = new SoundManager;

export default __instance;
