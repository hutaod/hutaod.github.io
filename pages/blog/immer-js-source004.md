# immer.js 源码解析｜分步实现初始版本

## 前言

现在很多项目都会用到 immer.js 来保证数据的不可变性，本篇不讲它的用法，只讲怎么去使用 `Proxy` 实现它，下面我们来自己实现一个最基础的版本，也就是类似 `immer.js` 的 [首个 github tag 版本](https://github.com/immerjs/immer/releases/tag/v0.0.4)，虽然这个版本过去很多年了，`immer` 最新版本已经发展的比较复杂了，添加了很多东西，但实际上最常用的核心原理都是类似的，如果只是想了解它的原理和实现思考，看这一篇也可以了。

## 梳理思路

目的：保证数据的不可变性，也就是保证修改数据不会直接改变当前对象，而是最小单元的去 `复制` 对象，然后再进行更改，以防其他使用该对象的地方出现异常。在 [JavaScript数据类型对函数式编程的影响](https://juejin.cn/post/7201879428087349304) 一文中有详细介绍可变数据的危害，不了解的可以去看看。

核心思路：

- 使用 `Proxy` 来实现对对象属性的 `增删改查` 的监听
- 使用 `handler.get` 来拦截对象的读取属性操作，查到的属性值如果是一个对象，那么需要对该象进行代理，也就是对子对象也要使用 `Proxy` 来管理，因此需要记录每一个被 Proxy 的对象，这里将会新增 `proxys` 内部状态来存储原对象和代理对象的关系。
- 使用 `handler.set` 来监听 `增` 和 `改`，因为被代理的对象每一次修改对象的属性值，都会被 proxy 监听到，监听到修改后需要对对该对象进行 `拷贝` ，然后对拷贝的对象进行修改，而不直接修改原对象，永远不要直接修改原对象，因此需要记录每一个被拷贝的对象，这里将会新增 `copys` 内部状态来存储原对象和拷贝对象的关系。
- 使用 `handler.has` 来监听 in 操作符的查找方式。
- 使用 `handler.ownKeys` 来拦截 `Object.getOwnPropertyNames()` 和 `Object.getOwnPropertySymbols()` 属性获取，也可以拦截 `Object.keys()` 和 `Reflect.ownKeys()`。
- 使用 `handler.deleteProperty` 来拦截删除操作，有拷贝的删除拷贝的属性，不能删除原对象。

## 实现 immer.js

从前面思路中我们可以得出，需要两个内部状态 `proxys` 、 `copys` 。

```ts
const copys = new Map(); // 用于缓存被修改的对象，key 为原对象，value 为修改后的对象
const proxys = new Map(); // 用于存储被代理的对象，key 为原对象，value 为代理对象
```

注意核心点：被代理的对象不一定被修改，被修改的一定被代理和拷贝。

数据如果被修改了很多次，那么我们获取正确数据的方法就是先查找数据是否被拷贝，被拷贝说明一定被修改了，没有被拷贝，说明没有被修改，因此实现一个 `getCurrentSource` 方法来查找对象，需要获取最新对象直接使用这个方法来查找：

```js
// 返回当前资源对象，有 copy 返回 copy 没有则返回 base
function getCurrentSource(base) {
    const copy = copies.get(base);
    return copy || base;
}
```

那么我们可以先定义 `handler` 的 `has` 、 `ownKeys` 查询对象数据的方法:

```js
const handler = {
    has(target, prop) {
        return prop in getCurrentSource(target);
    },
    ownKeys(target) {
        return Reflect.ownKeys(getCurrentSource(target));
    },
};
```

这两个方法都是用来拦截对象 key 的查找方式：`in` 查找符、`Object.keys()` 等等。

下面就还有剩下三个方法定义，我们先来实现创建代理的方法 `createProxy` :

```js
// 创建 proxy
function createProxy(base) {
    // 对象和数组进行劫持
    if (isPlainObject(base) || Array.isArray(base)) {
        let proxy = proxies.get(base);
        // 避免重复设置 Proxy 代理
        if (!proxy) {
            proxy = new Proxy(base, handler);
            // 备案
            proxies.set(base, proxy);
        }
        return proxy;
    }
    return base;
};

// 判断是否是计划中的普通对象
function isPlainObject(value) {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

```

创建代理主要是需要注意：被代理过的对象避免重复被代理，只有普通对象和数组才需要被代理。

下面我们来对初始对象进行代理，以及被访问的属性进行代理。

```js
function produce(baseState, recipe) {
  // ...
  const handler = {
    get(target, prop) {
      // 获取访问对象的拷贝，不能使用 target 是因为 target 可能被代理并且修改过多次
      const currentSource = getCurrentSource(target);
      // 给访问的对象的属性进行创建代理（不需要创建代理的其他类型值，createProxy 内部自己处理）
      return createProxy(currentSource[prop]);
    },
  };
  // 给根对象创建代理
  const proxy = createProxy(baseState);
  // ...
}
```

`get` 方法的实现主要需要注意点：同一个属性可能被多次获取，并且被修改过，因此要优先判断是否被拷贝过，有拷贝直接从拷贝对象中去拿取属性，然后对拷贝的对象的属性进行设置代理（对象才会被代理，其他基本数据类型会直接返回），这里不是很好理解，大家可以去测试测试。

然后 handler 就只剩下 `set` 和 `delete` 处理了，来细想一下，set 主要是需要做 `拷贝` 和赋值操作，delete 做删除操作。

```js
const handler = {
    set(target, prop, value) {
          // 值没有变化，则不处理
          if (target[prop] === value) {
            return true;
          }
          // 值有变化，则进行拷贝再赋值
          const copy = getOrCreateCopy(target);
          // 给拷贝对象设置值
          copy[prop] = value;
          return true;
    },
    deleteProperty(target, property) {
          // 有拷贝的删除拷贝的属性，不能删除原对象
          const copy = getOrCreateCopy(target);
          delete copy[property];
          return true;
    },
};

// 获取 copy 元对象，没有则进行创建
function getOrCreateCopy(base) {
    let copy = copies.get(base);
    if (!copy) {
        // 浅拷贝
        copy = Array.isArray(base) ? [...base] : { ...base };
        // 备案
        copies.set(base, copy);
    }
    return copy;
}
```

`set` 需要注意如果值没有变化，则不需要进行拷贝。

`deleteProperty` 需要注意不能删除原对象，要先拷贝，获取拷贝的对象进行删除。

现在 handler 已经实现了，但我们最终的数据还需给出去，因此需要检查数据，然后返回给修改后的数据给外部。

```js
// 处理数据，返回被修改后的数据
function finalize(state) {
    if (isPlainObject(state) || Array.isArray(state)) {
        // 未改变直接返回
        if (!hasChanges(state)) {
            return state;
        }
        // 改变的对象，则获取副本进行递归检查
        const copy = getOrCreateCopy(state);
        if (Array.isArray(copy)) {
            // 数组处理方式，检查子节点
            copy.forEach((value, index) => {
                copy[index] = finalize(copy[index]);
            });
        } else {
            // 普通对象处理方式，检查子属性值
            Object.keys(copy).forEach((prop) => {
                copy[prop] = finalize(copy[prop]);
            });
        }
        return Object.freeze(copy);
    }
    return state;
}

const proxy = createProxy(baseState);
// 把代理后的数据传递给 recipe 函数，让用户修改被代理的对象
recipe(proxy);
// 返回被修改后的数据。
return finalize(baseState);
```

最后结果是被 `finalize` 函数处理后的数据，其实也就是去 `copies` 去查找数据，被放进去的一定是被修改的数据，但这里引入了一个 `hasChanges` 方法判断数据是否被改变，没有这个方法就需要对整个对象进行递归处理了，比较暴力，因此来看一下 `hasChanges` 进行优化的。

```js
// 检测对象是否修改了，需要检测子对象是否被修改
function hasChanges(base) {
    const proxy = proxies.get(base);
    if (!proxy) return false; // 没有被代理，说明没有修改过子对象
    if (copies.has(base)) return true; // 一个对象被复制了，那一定被改变了
    // 递归检查子数据
    const keys = Object.keys(base);
    for (let i = 0; i < keys.length; i++) {
        const value = base[keys[i]];
        // 对象或者数组需要再次使用 `hasChanges` 递归检查。
        if ((Array.isArray(value) || isPlainObject(value)) && hasChanges(value)) {
            return true;
        }
    }
    // 其他数据类型都是原始类型，不要判断，直接返回 false。
    return false;
}
```

如果对象没有被代理，那么肯定没有被访问过，还记得前面的出的一个推断吗？

> 被代理的对象不一定被修改，被修改的对象一定被代理和拷贝

因此没以排除没有被代理的数据，这里就可以筛选出很大部分没有被改变的数据，主要也是这里机进行了一个优化。

被拷贝的对象，一定被修改，但子对象不一定被修改，因此后面进行了递归检查。

最后附上完整代码：

```js
function produce(baseState, recipe) {
  // 用于缓存被修改的对象，key 为原对象，value 为修改后的对象
  const copies = new Map();
  // 用于存储被代理的对象，key 为原对象，value 为代理对象
  const proxies = new Map();

  const handler = {
    get(target, prop) {
      // 增加一个 get 的劫持，返回一个 Proxy
      return createProxy(getCurrentSource(target)[prop]);
    },
    set(target, prop, value) {
      // 值没有变化，则不处理
      if (target[prop] === value) {
        return true;
      }
      // 值有变化，则进行拷贝再赋值
      const copy = getOrCreateCopy(target);
      copy[prop] = value; // 给拷贝对象设置值
      return true;
    },
    has(target, prop) {
      return prop in getCurrentSource(target);
    },
    ownKeys(target) {
      return Reflect.ownKeys(getCurrentSource(target));
    },
    deleteProperty(target, property) {
      // 有拷贝的删除拷贝的属性，不能删除原对象
      const copy = getOrCreateCopy(target);
      delete copy[property];
      return true;
    },
  };

  // 返回当前资源对象，有 copy 返回 copy 没有则返回 base
  function getCurrentSource(base) {
    const copy = copies.get(base);
    return copy || base;
  }

  // 获取 copy 元对象，没有则进行创建
  function getOrCreateCopy(base) {
    let copy = copies.get(base);
    if (!copy) {
      // 浅拷贝
      copy = Array.isArray(base) ? [...base] : { ...base };
      // 备案
      copies.set(base, copy);
    }
    return copy;
  }
  // 创建 proxy
  function createProxy(base) {
    // 对象和数组进行劫持
    if (isPlainObject(base) || Array.isArray(base)) {
      let proxy = proxies.get(base);
      // 避免重复设置 Proxy 代理
      if (!proxy) {
        proxy = new Proxy(base, handler);
        proxies.set(base, proxy);
      }
      return proxy;
    }
    return base;
  }

  // 检测对象是否修改了，需要检测子对象是否被修改
  function hasChanges(base) {
    const proxy = proxies.get(base);
    if (!proxy) return false; // 没有被代理，说明没有修改过子对象
    if (copies.has(base)) return true; // 一个对象被复制了，那一定被改变了
    // 递归检查子数据
    const keys = Object.keys(base);
    for (let i = 0; i < keys.length; i++) {
      const value = base[keys[i]];
      // 对象或者数组需要再次使用 `hasChanges` 递归检查。
      if ((Array.isArray(value) || isPlainObject(value)) && hasChanges(value)) {
        return true;
      }
    }
    // 其他数据类型都是原始类型，不要判断，直接返回 false。
    return false;
  }

  // 处理数据，返回被修改后的数据
  function finalize(state) {
    if (isPlainObject(state) || Array.isArray(state)) {
      // 未改变直接返回
      if (!hasChanges(state)) {
        return state;
      }
      // 改变的对象，则获取副本进行递归检查
      const copy = getOrCreateCopy(state);
      if (Array.isArray(copy)) {
        // 数组处理方式，检查子节点
        copy.forEach((value, index) => {
          copy[index] = finalize(copy[index]);
        });
      } else {
        // 普通对象处理方式，检查子属性值
        Object.keys(copy).forEach((prop) => {
          copy[prop] = finalize(copy[prop]);
        });
      }
      return Object.freeze(copy);
    }
    return state;
  }

  const proxy = createProxy(baseState);
  // 把代理后的数据传递给 recipe 函数，让用户修改被代理的对象
  recipe(proxy);
  // 返回被修改后的数据。
  return finalize(baseState);
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export default produce;
```

相比原始版本，进行删减一点点代码，但并不影响功能。

## 总结

immer.js 的原理其实还是挺简单的，但了解它内部运行的机制，也对自己的使用更容易理解一些，知其然知其所以然，是我们程序员一步一步成长的方向。

在写这篇文章中，我也去看了好几个版本的代码，最新版过于复杂，为了兼容性、处理各种数据类型、以及扩展API等功能做了很多处理，因此思来想去，还是先写一个原始版的源码解析，因为其中的实现原理是类似的，只是实现方式随着时间推移官方在不断改进，让它越来越成熟，让开发者更加信任它，但本质是没有怎么变化的。

以后把 immer.js 最新版的全部实现过程看完并理解后，也许会把其中的细节知识单独写一些讲解类文章，然后再整梳理其演变的过程和完整版本的解析。
