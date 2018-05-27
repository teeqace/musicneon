import MessagePipeline from '../utils/MessagePipeline';
import SoundManager from '../managers/SoundManager';

cc.Class({
  extends: cc.Component,

  properties: {
  },

  // use this for initialization
  onLoad: function () {
    this.node.on(cc.Node.EventType.TOUCH_START, this._onPress, this);
    this.node.on(cc.Node.EventType.TOUCH_END, this._onRelease, this);
    this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onRelease, this);
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
    this._velocity = cc.v2(0, 200).rotate(-this.node.rotation / 180 * Math.PI);
  },

  _onPress() {
    SoundManager.playSfx(this._noteData.sound);
    this.node.emit('noteDelete', this.node);
  },

  _onRelease() {
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
