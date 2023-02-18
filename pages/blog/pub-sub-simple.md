# 实现一个简单的订阅发布功能函数｜参考 EventEmitter

> [本文也在掘金发布](https://juejin.cn/post/7198899707094679613/)

`订阅发布模式` 应该是 JS 最常用的设计模式，也可称之为 `观察者模式`，前端各个方面都会涉及到它，比如：浏览器中的事件监听机制、`nodejs` 中的 `EventEmitter` 、redux 数据传递实现等等。

## 目的

不管是 `浏览器中的事件监听机制` 还是 `nodejs` 中的 `EventEmitter`，都只能在各自的环境进行运行。因此我们需要用一份代码来让多端都可以调用，`EventEmitter` 功能更全面，我们借鉴它来实现一个完整的 `PubSub`。

## 实现

主要参考 [`EventEmitter`](https://nodejs.org/api/events.html#class-eventemitter) 的功能来，本篇文章提供 `简单实现`，下一篇提供了 [`完整实现`，点击即可去查看]()。

实现常用功能： 

- `on` : 用于添加订阅
- `off` : 用于取消订阅
- `once` : 用于添加一次性订阅
- `emit` : 用于发布事件，让订阅者收到通知

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
    this.on(eventName, onceListener);
    return this;
  };
}

// 不需要有全局订阅功能的，可以去掉这个
export const pubSub = new PubSub();
```

实现说明：

- 不管订阅还是发布的时候都需要判读是否有已存在的队列。
- `eventMap` 用于存储订阅相关信息。
- `once` 使用 `createOnceListener` 函数实现，给原`listener` 添加一层包裹，执行一次后自动注销。
- `off` 注销监听时需要考虑 `once` 的 `listener` 被添加了一层包裹，需要用备份的原始 `listener` 来判断。
- `listener` 函数需要考虑有多个参数。
- 操作性的函数的返回值为 `this`，用于链式调用，比如 `pubSub.emit("test").off("test")`

## 总结

实现过程是通过阅读 `EventEmitter` 官方文档的 API 来进行反向实现的，`typescript` 类型可以直接通过 `nodejs` 使用的时候获取，这也一般是想实现某一个功能的方法。

## 测试

