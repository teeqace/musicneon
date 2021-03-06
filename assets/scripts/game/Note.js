import MessagePipeline from '../utils/MessagePipeline';
import SoundManager from '../managers/SoundManager';

const SPEED = 300;

cc.Class({
  extends: cc.Component,

  properties: {
  },

  // use this for initialization
  onLoad() {
    this.node.on(cc.Node.EventType.TOUCH_START, this._onPress, this);
  },

  onDestroy() {
    this.node.off(cc.Node.EventType.TOUCH_START, this._onPress, this);
  },

  init(noteData) {
    this._noteData = noteData;
    this.node.x = 0;
    this.node.y = 0;

    if (this._noteData.direction === 'LU') {
      this.node.rotation = -60;
    } else if (this._noteData.direction === 'LD') {
      this.node.rotation = -120;
    } else if (this._noteData.direction === 'RU') {
      this.node.rotation = 60;
    } else if (this._noteData.direction === 'RD') {
      this.node.rotation = 120;
    }
    this._velocity = cc.v2(0, SPEED).rotate(-this.node.rotation / 180 * Math.PI);
  },

  _onPress() {
    SoundManager.playSfx(this._noteData.sound);
    this.node.emit('noteDelete', this.node);
  },

  update(dt) {
    let positionChange = this._velocity.mul(dt);
    this.node.setPosition(this.node.position.add(positionChange));
    // this.node.x += dt * 200;
    if (Math.abs(this.node.y) > 500) {
      this.node.emit('noteDelete', this.node);
    }
  }
    
});
