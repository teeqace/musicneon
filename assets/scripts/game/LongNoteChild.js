import MessagePipeline from '../utils/MessagePipeline';
import SoundManager from '../managers/SoundManager';

const SPEED = 300;

cc.Class({
  extends: cc.Component,

  properties: {
  },

  // use this for initialization
  onLoad() {
  },

  init(noteData) {
    this._sound = noteData.sound;
    this._soundPlayed = false;
    this.node.x = 0;
    this.node.y = 0;

    if (noteData.direction === 'LU') {
      this.node.rotation = -60;
    } else if (noteData.direction === 'LD') {
      this.node.rotation = -120;
    } else if (noteData.direction === 'RU') {
      this.node.rotation = 60;
    } else if (noteData.direction === 'RD') {
      this.node.rotation = 120;
    }
    this._velocity = cc.v2(0, SPEED).rotate(-this.node.rotation / 180 * Math.PI);
  },

  checkHitNote(touchPos) {
    if (this._soundPlayed) {
      return;
    }
    if (this.node._hitTest(touchPos, this.node)) {
      SoundManager.playSfx(this._sound);
      this._soundPlayed = true;
    }
  },

  update(dt) {
    let positionChange = this._velocity.mul(dt);
    this.node.setPosition(this.node.position.add(positionChange));
    if (Math.abs(this.node.y) > 500) {
      this.node.emit('noteDelete', this.node);
    }
  }
    
});
