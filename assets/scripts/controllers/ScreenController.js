cc.Class({
  extends: cc.Component,

  properties: {
  },

  onLoad() {
    if (this._canvas) {
      return;
    }
    this.screenFit();
  },
  screenFit() {
    this._canvas = this.getComponent(cc.Canvas);
    if (window.innerWidth / window.innerHeight > this._canvas.designResolution.width / this._canvas.designResolution.height) {
      this._canvas.fitHeight = true;
      this._canvas.fitWidth = false;
      let cocos2dGameContainer = document.getElementById('Cocos2dGameContainer');
      if (cocos2dGameContainer) {
        cocos2dGameContainer.style.padding = '0px';
      }
    }
  }
});
