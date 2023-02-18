type Listener = (...args: any[]) => void;

type EventInfo = {
  // 监听器
  listener: Listener;
  // 备份，需要改变 listener 时，则需要备份，比如 once
  bak?: Listener;
};

// 创建一次性监听器
function createOnceListener(pub: PubSub, eventName: string | symbol, listener: Listener) {
  const onceListener = (...args: any[]) => {
    // 执行一次后直接取消订阅
    listener(...args);
    pub.off(eventName, listener);
  };
  return onceListener;
}

export class PubSub {
  private eventMap: Record<string | symbol, EventInfo[]> = {};

  // 订阅
  on = (eventName: string | symbol, listener: Listener) => {
    if (!this.eventMap[eventName]) {
      this.eventMap[eventName] = [];
    }
    this.eventMap[eventName].push({ listener });
    return this;
  };

  // 取消订阅
  off = (eventName: string | symbol, listener: Listener) => {
    if (this.eventMap[eventName]) {
      this.eventMap[eventName] = this.eventMap[eventName].filter((item) => {
        // once listener 取消订阅
        if (item.bak) {
          return item.bak !== listener;
        }
        // 正常 listener 取消订阅
        return item.listener !== listener;
      });
    }
    return this;
  };

  // 类似 EventEmitter 中的 emit 函数
  emit = (eventName: string | symbol, ...args: any[]) => {
    this.eventMap[eventName]?.forEach((item) => {
      item.listener(...args);
    });
    return this;
  };

  // 只订阅一次
  once = (eventName: string | symbol, listener: Listener) => {
    const onceListener = createOnceListener(this, eventName, listener);
    if (!this.eventMap[eventName]) {
      this.eventMap[eventName] = [];
    }
    this.eventMap[eventName].push({ listener: onceListener, bak: listener });
    return this;
  };
}

// 不需要有全局订阅功能的，可以去掉这个
export const pubSub = new PubSub();