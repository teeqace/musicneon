import MessagePipeline from '../utils/MessagePipeline';
import SongManager from '../managers/SongManager';
import SoundManager from '../managers/SoundManager';
const SONG_START_BUFFER = 2.0;

cc.Class({
  extends: cc.Component,

  properties: {
    notePrefab: cc.Prefab,
    longNotePrefab: cc.Prefab,
    longNoteChildPrefab: cc.Prefab,
    loopLabel: cc.Label,
    tempoLabel: cc.Label,
    beatLabel: cc.Label,
    timerLabel: cc.Label,
    titleLabel: cc.Label,
    composerLabel: cc.Label
  },

  onLoad () {
    this._notePool = new cc.NodePool();
    this._longNotePool = new cc.NodePool();
    this._longNoteChildPool = new cc.NodePool();
    MessagePipeline.on('game:reset', this._gameReset, this);
  },

  onDestroy () {
    MessagePipeline.off('game:reset', this._gameReset, this);
  },

  _gameReset() {
    this._songData = SongManager.getSong('song01');
    this._baseTempo = this._songData.baseTempo;
    this._tempoAdjust = 0;
    this._tempoUp = this._songData.tempoUp;
    this._maxTempo = this._songData.maxTempo;
    this._measure = this._songData.measure;
    this._notes = this._songData.notes;
    this._noteLength = this._notes.length;
    this._noteIndex = 0;

    this._loopCount = 0;
    this._bar = 0;
    this._beat = 0;
    this._beatPerBar = 0;
    this._minBeat = 0;
    this._minBeatPerBeat = 0;
    this._minBeatTimer = 0;
    this._songTime = 0;
    this._beatName = '1-1-1';
    this._dispTime();
    this._dispLoop();
    
    this._minBeatTime = 0;
    this._setMinBeatTime();
  
    this.titleLabel.string = this._songData.title;
    this.composerLabel.string = this._songData.composer;
    
    this._songStart = true;
    this._songBufferEnd = false;

    this._longNoteEnds = {};
    this._longNotes = [];
  },

  update (dt) {
    if (!this._songStart) {
      return;
    }
    this._songTime += dt;
    this._dispTime();
    if (!this._songBufferEnd && this._songTime >= SONG_START_BUFFER) {
      this._songBufferEnd = true;
      this._bar = 1;
      this._beat = 1;
      this._minBeat = 1;
      this._doNoteEvent();
    } else {
      this._minBeatTimer += dt;
      if (this._minBeatTimer >= this._minBeatTime) {
        this._minBeatTimer -= this._minBeatTime;
        this._minBeat += 1;
        if (this._minBeat > this._minBeatPerBeat) {
          this._minBeat = 1;
          this._beat += 1;
          // SoundManager.playSfx('tick');
          if (this._beat > this._beatPerBar) {
            this._beat = 1;
            this._bar += 1;
          }
        }
        let isLoop = this._doNoteEvent();
        if (isLoop) {
          this._loopCount += 1;
          this._dispLoop();
          this._doLoop();
        }
      }
    }

    this._dispBeat();

  },

  _doNoteEvent() {
    let isLoop = false;
    this._beatName = `${this._bar}-${this._beat}-${this._minBeat}`;
    for (let i = this._noteIndex; i < this._noteLength; i += 1) {
      if (this._beatName === this._notes[i].beat) {
        let note = this._notes[i];
        if (note.note !== undefined) {
          this._createNote(note.note);
        } else if (note.tempoAdjust !== undefined) {
          this._tempoAdjust = note.tempoAdjust;
          this._setMinBeatTime();
        } else if (note.measure !== undefined) {
          this._measure = note.measure;
          this._setMinBeatTime();
        } else if (note.loopTo !== undefined) {
          let beat = note.loopTo.split('-');
          this._bar = Number(beat[0]);
          this._beat = Number(beat[1]);
          this._minBeat = Number(beat[2]);
          isLoop = true;
          break;
        }
      } else {
        this._noteIndex = i;
        break;
      }
    }
    if (this._longNoteEnds[this._beatName]) {
      let longNotes = this._longNoteEnds[this._beatName];
      if (longNotes.length > 0) {
        for (let li = 0; li < longNotes.length; li++) {
          longNotes[li].noteEnd();
        }
        delete this._longNoteEnds[this._beatName];
      }
    }
    for (let i = 0; i < this._longNotes.length; i++) {
      this._longNotes[i].noteAdd(this._beatName);
    }
    return isLoop;
  },

  _doLoop() {
    this._noteIndex = 0;
    this._beatName = `${this._bar}-${this._beat}-${this._minBeat}`;
    for (let i = 0; i < this._noteLength; i += 1) {
      if (this._beatName === this._notes[i].beat) {
        this._noteIndex = i;
        break;
      }
    }
    this._baseTempo = Math.min(this._baseTempo + this._tempoUp, this._maxTempo);
    this._doNoteEvent();
  },

  _createNote(noteData) {
    let notePrefab = this._getNote(noteData.type);
    let note = notePrefab.getComponent(noteData.type);
    if (!note) {
      return;
    }
    note.init(noteData);
    if (noteData.type === 'LongNote') {
      if (!this._longNoteEnds[noteData.noteEnd]) {
        this._longNoteEnds[noteData.noteEnd] = [];
      }
      this._longNoteEnds[noteData.noteEnd].push(note);
      this._longNotes.push(note);
    }
  },

  _createLongNoteChild(event) {
    let noteData = event.detail;
    let notePrefab;
    if (this._longNoteChildPool.size() > 0) {
      notePrefab = this._longNoteChildPool.get();
    } else {
      notePrefab = cc.instantiate(this.longNoteChildPrefab);
      notePrefab.on('noteDelete', this._noteDelete, this);
    }
    notePrefab.parent = this.node;
    let note = notePrefab.getComponent('LongNoteChild');
    note.init(noteData);
    noteData.longNote.addChild(note);
  },

  _getNote(type) {
    let notePrefab;
    let pool;
    let prefab;
    if (type === 'Note') {
      pool = this._notePool;
      prefab = this.notePrefab;
    } else if (type === 'LongNote') {
      pool = this._longNotePool;
      prefab = this.longNotePrefab;
    }
    cc.log(this._notePool.size());
    // if (pool.size() > 0) {
    //   notePrefab = pool.get();
    // } else {
      notePrefab = cc.instantiate(prefab);
      notePrefab.on('noteDelete', this._noteDelete, this);
      if (type === 'LongNote') {
        notePrefab.on('createLongNoteChild', this._createLongNoteChild, this);
      }
    // }
    notePrefab.parent = this.node;
    return notePrefab;
  },

  _noteDelete(event) {
    let noteNode = event.detail;
    if (noteNode.name === 'Note') {
      this._notePool.put(noteNode);
    } else if (noteNode.name === 'LongNote') {
      this._longNotePool.put(noteNode);
    }
  },

  _setMinBeatTime() {
    let measure = this._measure.split('-');
    let secPer1Beat = 60.0 / (this._baseTempo + this._tempoAdjust);
    this._beatPerBar = measure[0];
    this._minBeatPerBeat = measure[1];
    this._minBeatTime = secPer1Beat / measure[1];
    this._dispTempo();
  },
  
  _dispLoop() {
    this.loopLabel.string = `LOOP:${this._loopCount + 1}`;
  },

  _dispTempo() {
    this.tempoLabel.string = `TEMPO:${this._baseTempo + this._tempoAdjust}`;
  },

  _dispBeat() {
    this.beatLabel.string = this._beatName;
  },

  _dispTime() {
    this.timerLabel.string = `${('0'+Math.floor(this._songTime/60)).slice(-2)}:${('0'+Math.floor(this._songTime%60)).slice(-2)}.${this._getDecimalPlace(this._songTime)}`;
  },

  _getDecimalPlace(number) {
    if (typeof number !== 'number') {
      return null;
    }
   
    let decimal = 0;
    let numbers = number.toString().split('.');
    if (numbers[1]) {
      decimal = (numbers[1] + '00').substr(0, 2);
    } else {
      numbers = '00';
    }
   
    return decimal;
  }
});
