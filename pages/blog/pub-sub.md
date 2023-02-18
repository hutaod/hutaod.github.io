# 实现一个超完整的订阅发布功能函数｜参考 EventEmitter

> [本文也在掘金发布](https://juejin.cn/post/7199086162991235130)

前一篇文章 [《实现一个简单的订阅发布功能函数｜参考 EventEmitter》](https://juejin.cn/post/7198899707094679613/) 实现了简单版本的订阅发布功能函数，本篇文章将完整实现 `Node.js` 中的 `EventEmitter`。

## 实现

`EventEmitter` 中有一些重复功能的函数，或者已经移除的函数，这里不会进行实现。

主要会新增以下功能：

- 新增默认最大订阅限制，且可进行更改
- 可获取所有的订阅事件名称
- 可根据事件名获取所有的监听函数
- 默认是往订阅事件队列尾部新增，现在新增 可往队列头部添加订阅事件 的功能

根据 [简单版实现](https://juejin.cn/post/7198899707094679613/) 为基础，再根据功能来新增一些属性和方法。

需要新增内部属性：

- `maxListeners`，默认最多给特定事件添加了 10 个的订阅，如果超过了则不会生效，且会有警告提示，如果需要更多，则需要调用 `setMaxListeners` 进行设置。
- `addListener`，抽离新增订阅的实现，用于复用

需要新增功能函数：

- `listeners` 获取
- `rawListeners` 获取所有订阅的原始监听函数
- `listenerCount` 获取所有订阅数量
- `eventNames` 获取所有订阅事件名 
- `prependListener` 从头部新增订阅，如果代码中需要先执行的订阅，才需要用到
- `prependOnceListener` 从头部新增一次性订阅，如果代码中需要先执行的订阅，才需要用到
- `setMaxListeners` 设置最大订阅数量
- `getMaxListeners` 获取最大订阅数量


完整代码实现：

```tsx
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
```

注意事项：

- `on` 、`once` 、`prependListener` 、`prependOnceListener` 几个新增 `listener` 的函数都不检查是否已添加 `listener`，多次调用传入相同的 `eventName` 和 `listener` 组合将导致多次添加和调用`listener` ，因此需要注意不要多次注入。

## 总结

如果你的应用非常大，需要非常精细的管理事件，那么可以使用完整版实现，如果不是的话，可以使用简单版本。
