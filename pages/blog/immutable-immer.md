# 不可变数据方案之immer.js原理探索

本篇文章是[JavaScript 函数式编程](https://juejin.cn/book/7173591403639865377) 学习系列第三篇，感兴趣也可以先去看看前两篇内容：

- [一文理解JavaScript中的函数式编程的概念](https://juejin.cn/post/7201800584311455799)
- [JavaScript数据类型对函数式编程的影响](https://juejin.cn/post/7201879428087349304)

## 前言

前一篇 [JavaScript数据类型对函数式编程的影响](https://juejin.cn/post/7201879428087349304) 讲到了不可变数据的重要性，而让数据不可变的原理就是 “拷贝数据”。

但如果拷贝的是一个树形结构，层次比较深，看是一个对象，但实际上里面有上百个对象，比如：

```
// 某某公司组织架构
const org = {
    name: "某某公司",
    children: [
        { name: "研发部", children: [{ name: "张三" }, { name: "李四" }] },
        { name: "产品部", children: [{ name: "王五" }] }，
        // 省略 10 个部门，每个部门 10 个人
    ]
}
```

这个 `org` 数据中的 `children` 是 Array 类型的对象，`children` 里面的部门一个是一个基本对象，然后再往下又是 Array 对象 ...... ，上面结构看起来还很简单，但实际上写出来的都有了 9 个对象，如果这个组织有一百个人，至少 100 多个对象，如果为了保持数据不可变，每次修改对象，都要对整个 `org` 进行拷贝的话，那么操作个几十次上百次，很容易造成性能问题，要是原始的数据意外没有销毁的话，还容易造成内存泄露（这是我曾经刚出来工作一两年干过的事情，操作一个增删改查的列表页，没操作几次，浏览器就变卡了，到后面必须得重新刷新页面🙂️）。

因此，当数据规模大、数据拷贝行为频繁时，拷贝将会给我们的应用性能带来巨大的挑战。

于是社区出现了很多来让可变数据不可变的方案，核心目的都是为了 `从最小单元去进行拷贝，没改变的对象数据则进行复用`，而其中最具有代表性和影响力的就是 `immutable.js` 和 `immer.js` 。

immutable.js 底层是持久化数据结构，内部实现比较复杂，后续有机会会专门写一篇 immutable.js 的原理相关的文章。

相比而言，immer.js 的底层是 Proxy 代理模式，这种方式的实现过程比 immutable.js 会简单不少。

## 了解 immer.js

immer.js 最重要最核心的就是 `produce` 函数，也是默认导出函数，其他的导出其实都算是一些辅助性工具函数。

下面我们来看一下 `produce` 的使用示例，验证它是不是实现了 `从最小单元去进行拷贝，没改变的对象数据则进行复用` 这个目的。

```js
import produce from "immer"

const state = [
    { label: "HTML", info: { desc: "超文本标记语言" } },
    { label: "CSS", info: { desc: "层叠样式表" } }
];

const state1 = produce(state, draft => { 
    // 新增了一个对象
    draft.push({ label: "ES5", info: { desc: "基于原型和头等函数的多范式高级解释型编程语言" } });
    // 修改了了一个对象
    draft[1].label = "CSS3";
})

console.log(state === state1) // false
console.log(state.length === state1.length) // false
console.log(state[0] === state1[0]) // true
console.log(state[1] === state1[1]) // false
console.log(state[1].info === state1[1].info) // true
```

可以看出来，每个最小单元的对象，如果进行了修改，则会拷贝对象，如果没有进行修改的对象，则会进行复用。

我们把 state 和 state1 的数据组成画成一个图：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/415305d9b0c14885814af5d47e00a593~tplv-k3u1fbpfcp-watermark.image?)

- draft 新增了字对象，因此改变了 `draft` 自身。
- `draft[1]` 修改了 label，改变了自身`draft[1]`，但实际上会一层层传递上去，也相当于修改了 `draft`

因此，只要对子节点的任何操作，实际上都会拷贝当前对象，当前对象被拷贝，就会影响上一层的对象也会被拷贝，层层递进，最后拷贝到了根结点，但是都是浅拷贝，因此子节点没有变的对象都可以复用。

比如我再修改一下 state1 ，得到了 state2 ：

```
const state2 = produce(state1, draft => {
    draft[2].label = "ES";
})
```

这时候的数据结构对应情况就是变成了：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f827a7fc6d8845d685379c7e1dd345bc~tplv-k3u1fbpfcp-watermark.image?)

## immer.js 数据不可变原理

immer.js 是基于 Proxy 来代理对象的各种操作，然后在数据进行操作时，Proxy 会去拷贝被修改对象，然后再进行数据操作，返回拷贝后并被修改的数据。

我们来使用 `Proxy` 来实现一个极简版的 `produce` 函数。

```ts

function produce(baseState, recipe:) {
  // 用于存储改变后的新数据
  let copyState;
  
  function createState(state) {
      return new Proxy(base, {
        set(target, prop, value) {
          // 值没有变化，则不处理 
          if (target[prop] === value) {
              return true;
          }
          // 有变化，则按照前面说的拷贝对象
          copyState = { ...obj }
          // 修改拷贝后的 state，而不是 target，永远不要改变原数据
          copyState[prop] = value
          return true // 返回 true 才能更新成功
        }
    })
  }

  // 给 baseState 对象添加代理
  const proxy = createState(baseState)
  // 将对象的代理传递给 recipe 回调函数，让外界修改的是代理，而不是原本的对象数据，才能监听到数据改变
  recipe(proxy)
  // 如果 copyState 不存在，表示原数据没有被改变，返回原数据
  return copyState || baseState
}
```

然后我们来简单测试一下：

```
const state = { label: "HTML", info: { desc: "超文本标记语言" } };
const state1 = produce(state, (draft) => {
    draft.label = "H5";
})
console.log(state === state1) // false
console.log(state.info === state1.info) // true
```

可以看出实现的这个极简版的 `produce` 已经可以实现 `从最小单元去进行拷贝，没改变的对象数据则进行复用`，但仅限于修改对象的第一层结构，如果直接修改 `draft.info.desc` 会发现 state 和 state1 都会被改变。

`Proxy` 只会对当前传入进去的一个对象单元进行代理，如果有子对象，并不会进行代理，因此，深层次对象还需要再加处理，就像深拷贝一样，需要进行递归处理，不过 immer.js 中使用了 get 操作拦截，在数据获取的时候来进行处理，有兴趣的可以看一下 [immer.js 源码解析｜分步实现初始版本](https://juejin.cn/post/7203336895887573052) 这篇文章了解一下源码怎么实现的。

immer.js 源码的代码并不少，主要是为了兼容性、处理各种数据类型、以及扩展API，因此做了很多处理，这个后续会单独出一篇分析它最新版内部源码的实现，这里先说一下其内部主要方案：
 
- 默认导出的 `produce` 本身是一个 Immer 类的一个属性方法，也导出了 `Immer` 类。
- 兼容了 Map、Set 数据结构，`Proxy` 本身支持了数组类型。
- 需要兼容ES5时，使用 `Object.defineProperty` 来进行兼容。
- 扩展了不少 API ，主要是为了增强各种功能和使用体验。
- 内部核心实现方法是 `createProxy` ，其内部通过 get 拦截属性获取方法来实现动态给子对象 `Proxy` 化，也就是只有用到的属性才会变成 `Proxy Object` ，没有用到的并不会变。
- 内部基本上把 `Proxy` 的 `handler` 中的 [属性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy) 都使用到了。

## 总结

数据不可变的原理就是 “拷贝数据”，而市面上的不可变数据方案的目的就是让操作数据变成对最小单元对象数据的拷贝和操作，以提高代码执行效率和性能。

参考：

- [JavaScript 函数式编程实践指南](https://juejin.cn/book/7173591403639865377)
- [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy)
