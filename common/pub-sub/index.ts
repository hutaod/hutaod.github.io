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
    listener(args);
    pub.off(eventName, listener);
  };
  return onceListener;
}

export class PubSub {
  private eventMap: Record<string | symbol, EventInfo[]> = {};
  // 默认最多给特定事件添加了 10 个的监听器
  private maxListeners = 10;
  // 订阅实现
  private addListener = ({
    eventName,
    listener,
    addToHead,
    bak,
  }: { eventName: string | symbol; listener: Listener; addToHead?: boolean; bak?: Listener }) => {
    if (!this.eventMap[eventName]) {
      this.eventMap[eventName] = [];
    }
    // 不能添加超过 maxListeners 的监听逻辑处理
    if (this.eventMap[eventName].length >= this.maxListeners) {
      console.warn(
        `maxListeners: ${this.maxListeners}, ${eventName.toString()} event has add ${this.maxListeners} listener，`
      );
    } else {
      if (addToHead) {
        this.eventMap[eventName].unshift({ listener, bak });
      } else {
        this.eventMap[eventName].push({ listener, bak });
      }
    }
    return this;
  };

  // 订阅
  on = (eventName: string | symbol, listener: Listener) => {
    return this.addListener({ eventName, listener });
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
    return this.addListener({ eventName, listener: onceListener, bak: listener });
  };

  // 获取所有订阅的原始监听器
  listeners = (eventName: string | symbol) => {
    return this.eventMap[eventName]?.map((item) => item.bak || item.listener) || [];
  };

  // 返回名为 eventName 的事件的监听器数组的副本，包括任何封装器（例如由 .once() 创建的封装器）。
  rawListeners = (eventName: string | symbol) => {
    return this.eventMap[eventName]?.map((item) => item.listener) || [];
  };

  // 获取所有订阅数量
  listenerCount = (eventName: string | symbol) => {
    return this.eventMap[eventName]?.length || 0;
  };

  // 获取所有 eventName
  eventNames = () => {
    const eventNames: string[] = [];
    for (const key in this.eventMap) {
      eventNames.push(key);
    }
    return eventNames;
  };

  // 将 listener 函数添加到名为 eventName 的事件的监听器数组的开头。不检查是否已添加 listener。 多次调用传入相同的 eventName 和 listener 组合将导致多次添加和调用 listener。
  prependListener = (eventName: string | symbol, listener: Listener) => {
    return this.addListener({ eventName, listener, addToHead: true });
  };

  // 将名为 eventName 的事件的单次 listener 函数添加到监听器数组的开头。 下次触发 eventName 时，将移除此监听器，然后再调用。
  prependOnceListener = (eventName: string | symbol, listener: Listener) => {
    const onceListener = createOnceListener(this, eventName, listener);
    return this.addListener({ eventName, listener: onceListener, bak: listener, addToHead: true });
  };

  // 当前最大监听器数的值。 该值可以设置为 Infinity（或 0）以指示无限数量的监听器。
  setMaxListeners = (n: number) => {
    this.maxListeners = n;
    return this;
  };

  // 返回当前最大监听器数的值，该值由 setMaxListeners(n) 设置或为默认值 10。
  getMaxListeners = () => {
    return this.maxListeners;
  };
}

export const pubSub = new PubSub();