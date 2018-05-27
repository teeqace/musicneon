import MessagePipeline from '../utils/MessagePipeline';
import SoundManager from '../managers/SoundManager';
import SongManager from '../managers/SongManager';

cc.Class({
  extends: cc.Component,

  properties: {
  },

  onLoad() {
    let promises = [
      SoundManager.loadAllAudio(),
      SongManager.loadSongs()
    ];
    Promise.all(promises)
      .then(() => {
        MessagePipeline.sendMessage('game:reset');
      });
  }

});
