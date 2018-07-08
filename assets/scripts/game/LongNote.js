import MessagePipeline from '../utils/MessagePipeline';
import SoundManager from '../managers/SoundManager';

const NOTE_MIN_LEN = 128;
const NOTE_MAX_LEN = 800;
const SPEED = 300;

cc.Class({
  extends: cc.Component,

  properties: {
  },

  // use this for initialization
  onLoad: function () {
    this._longTapStart = false;
    this._noteLenEnd = false;
    this.node.on(cc.Node.EventType.TOUCH_START, this._onPress, this);
    this.node.on(cc.Node.EventType.TOUCH_MOVE, this._onMove, this);
    this.node.on(cc.Node.EventType.TOUCH_END, this._onRelease, this);
    this.node.on(cc.Node.EventType.TOUCH_CANCEL, this._onCancel, this);
  },

  init(noteData) {
    this._noteData = noteData;
    this.node.x = 0;
    this.node.y = 0;
    this.node.height = 0;
    this._noteLenEnd = false;
    this._sounds = noteData.sounds.concat();
    this._children = [];
    this._touchPos = null;
    this._touchFinishOnce = false;

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

  _onPress(event) {
    if (this._touchFinishOnce) {
      return;
    }
    this._longTapStart = true;
    this._touchPos = event.getLocation();
  },

  _onMove(event) {
    if (!this._longTapStart) {
      return;
    }
    // let location = this.node.parent.convertToNodeSpaceAR(event.getLocation());
    if (this.node._hitTest(event.getLocation(), this.node)) {
      this._touchPos = event.getLocation();
    } else {
      cc.log('leave the note');
      this._touchPos = null;
      this._touchFinishOnce = true;
      this.node.emit('noteDelete', this.node);
    }

  },

  _onRelease() {
    if (!this._longTapStart) {
      return;
    }
    this._touchPos = null;
    this._touchFinishOnce = true;
    // this.node.emit('noteDelete', this.node);
  },

  _onCancel() {
    if (!this._longTapStart) {
      return;
    }
    this._touchPos = null;
    this._touchFinishOnce = true;
    // this.node.emit('noteDelete', this.node);
  },

  noteAdd(beatName) {
    if (this._sounds.length === 0) {
      return;
    }
    if (this._sounds[0].beat === beatName) {
      this.node.emit('createLongNoteChild', {
        direction: this._noteData.direction, 
        sound: this._sounds[0].sound,
        longNote: this
      });
      this._sounds.splice(0, 1);
    }
  },

  noteEnd() {
    this._noteLenEnd = true;
  },

  addChild(child) {
    this._children.push(child);
  },

  update(dt) {
    if (NOTE_MAX_LEN > this.node.height) {
      this.node.height = this.node.height + SPEED * dt;
    }
    if (this._longTapStart && this._touchPos) {
      for (let i = 0; i < this._children.length; i++) {
        this._children[i].checkHitNote(this._touchPos);
      }
    }
    if (this._noteLenEnd) {
      let positionChange = this._velocity.mul(dt);
      this.node.setPosition(this.node.position.add(positionChange));
      // this.node.x += dt * 200;
      if (Math.abs(this.node.y) > 500) {
        this.node.emit('noteDelete', this.node);
      }
    }
  }
    
});
