class MessagePipeline extends cc.EventTarget {
  sendMessage(detail, params) {
    // cc.log(`[System Message] ${detail}`);
    this.emit(detail, params);
  }
}

const __instance = new MessagePipeline();

export default __instance;
