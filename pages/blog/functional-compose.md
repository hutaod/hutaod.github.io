# 函数式编程之组合函数compose/pipe的理解和实现

本篇文章是[JavaScript 函数式编程](https://juejin.cn/book/7173591403639865377) 学习系列第四篇，感兴趣也可以先去看看前几篇内容：

- [一文理解JavaScript中的函数式编程的概念](https://juejin.cn/post/7201800584311455799)
- [JavaScript数据类型对函数式编程的影响](https://juejin.cn/post/7201879428087349304)
- [不可变数据方案之immer.js原理探索](https://juejin.cn/post/7202506471899873339)

突发感想：学习函数式编程的过程，我会经常想到以前写代码的场景，然后发现真的写了很多多余且不好维护的代码，大家有时间可以认真去学一下函数式编程，然后再去对比一下之前写的代码，你会发现，函数式编程中的编程技巧真是一个好东西。

## 前言

函数式编程带给我们的不只是一套理论，从这个理论中，衍生出了一套编程技巧，值得学习，它也能让我们的代码质量提升，不管是代码阅读性和可维护性、还是性能等多个方面。其实大家现在去看很多框架源码的实现，会发现代码风格都在往函数式编程这个方向演变。

其实我们平时也不知不觉用到了函数式编程中的很多技巧也比如高阶函数，redux 中的 compose 等等，这些都属于函数式编程的运用方式，也是体现出函数式编程的核心——函数组合。

## 函数组合的概念

函数组合的概念：每一个函数的输出可以是另一个尚未可知的函数的输入。

代码表现其实也就是这样：

```js
func1(
    func2(
        func3(
            func4(value)
        )
    )
);
```

但这样嵌套下去，看起来有点懵，特别嵌套层数越来越多的时候，因此出现了 `compose` 函数，让多个函数可以可以并行：

```js
compose(
    func1,
    func2,
    func3,
    func4
)(value)
```

这样看起来顺序感就强烈了起来，是不是？

`compose` 的执行顺序是从右往左，也就是执行顺序是：func4 => func3 => func2 => func1；

也有一种从左往右的执行函数，叫做 `pipe` ，也就是管道函数的意思，就是把上一个函数的执行结果传递给下一个函数作为参数，使用方式跟 compose 一样：

```js
pipe(func1, func2, func3, func4)(value);
```

不过执行顺序是：func4 => func3 => func2 => func1；

`compose` 和 `pipe` 实现的功能其实是一样的，只是顺序不一样，会影响开发者的一些逻辑，至于开发者喜欢用啥，可以根据自己的理解来，一般如果是顺序逻辑则使用 pipe，倒序逻辑，比如 React 中的高阶组件，就使用 compose 。

## 实现 pipe 和 compose 函数

pipe 的执行过程其实和 reduce 类似 。

比如把 pipe 要执行的函数列表放在一个数组里面。

```js
const funcs = [func1, func2, func3, func4];
pipe(...funcs)(value);
```

这个 funcs 数组可以用 reduce 函数来执行，如下：

```js
funcs.reduce((value, funcN) => {
    // 获取第N个函数的返回值，作为下一个函数执行的参数
    value = funcN(value)
    return value;
}, value);
```

funcN 代表第几个函数，从 `funcs[0]` 开始.

可以看出 pipe 和 reduce 的执行顺序都是一样的，因此可以使用 reduce 来实现 pipe ：

```js
function pipe(...funcs) {
    return (value) => {
        return funcs.reduce((value, funcN) => funcN(value), value);
    }
}
```

`compose` 中函数参数传递 和 `pipe` 相反，因此，我们调用相反的顺序就是 `compose` ，刚好 Array 中也有一个 `reduceRight` 和 reduce 执行顺序相反，因此可以轻松的实现 `compose` ：

```diff
function compose(...funcs) {
    return (value) => {
        return funcs.reduceRight((value, funcN) => funcN(value), value);
    }
}
```

理解了吗？不理解也可以去看看 [你不知道的 Reduce：函数式语言的“万金油”](https://juejin.cn/book/7173591403639865377/section/7175422666629709884) ，这篇文章让你深入的理解 reduce 的，理解了 reduce ，再看这些问题一眼就明白了。

现在是不是发现原来 js 中实现 compose 这么简单！这时候要是是面试的时候，面试官可能需要你不使用 `reduce` 或者 `reduceRight` ，那么可以自己实现一个 `reduce` 或者 `reduceRight`。

```js
function reduce(arr, callback, initValue) {
    for(let i = 0; i < arr.length; i++) {
        const item = arr[i];
        initValue = callback(initValue, item);
    }
    return initValue;
}

function reduceRight(arr, callback, initValue) {
    for(let i = arr.length - 1; i >= 0; i--) {
        const item = arr[i];
        initValue = callback(initValue, item);
    }
    return initValue;
}

function compose(...funcs) {
    return (value) => {
        return reduceRight(funcs, (value, funcN) => funcN(value), value);
    }
}
```

当然 reduce 和 reduceRight 的实现方式这里没有写的很完整，没有考虑不传递参数的情况下，但是在这个地方够用了，如果有其他实现方法的可以评论区交流交流。

在 [你真的了解Array.reduce吗？](https://juejin.cn/post/7204316982886826041) 一文中，我进行了 reduce 的详细介绍，[# 了解reduce原理和探索lodash.reduce的实现原理](# 了解reduce原理和探索lodash.reduce的实现原理)，感兴趣可以去看看。

## 运用场景

它们的运用场景其实非常广泛，特别是逻辑复杂的页面时，我们可以把很复杂的逻辑梳理清晰，然后使用不同的函数去处理，最后再进行组合使用，这样会让我们的代码质量上升一个高度，提升代码的可阅读性和可维护性。

比如，React 中的高阶组件的组合一般会用到 compose ：

```tsx
// performance.js
let firebaseIsInit = false
function withPerformanceReport(Comp) {
    if(!firebaseIsInit) {
        // 初始化
        firebase.init();
    }
    return function WrappedPerformanceReport(props) {
        useEvent(() => {
            // 上报页面性能数据
        }, [])
        return <Comp {...props} />
    }
}

// 主页
function HomePage() {
    return (
        // ...页面内容
    )
}
export default compose(
    withPerformanceReport, // 性能监控
    withTranslation, // 注入翻译方法
    withRedux, // 注入redux
)(HomePage)
```

当然现在 React 更推荐使用 hook 方式，但还是有需要使用到 Hoc（高阶函数）的场景，毕竟 hook 只能运行组件执行过后，而 Hoc 可以在整个应用 render 前，比如前面的初始化 firebase 。

还比如具体业务中的逻辑分层，比如一个提交订单的操作，需要处理商品信息，需要处理优惠信息，需要计算金额，需要做安全校验，数据组合校验、请求接口提交等等逻辑，这些逻辑基本上都可以单独抽离出来的，然后使用 pipe 进行顺序执行。

例子就不多说了，具体业务开发者如果带有这种组合思想，那么会发现还有有很多地方可以用到的。

## 总结

本篇从了解函数组合，再到实现函数组合的常用函数 compose 和 pipe，最后简单的举例两个场景，有需求的小伙伴也可以带着组合思想去尝试尝试。

最近突发一个感想：

> 其实人生何尝不是一个组合，每个阶段的自己都会输出到下一个阶段的自己，并作为下一个阶段的初始值，经过下一个阶段的改造再输出到下下一个阶段的自己......最终走完这一生。

冒出这个想法的时候还感觉挺有趣的。

最后欢迎👏大家关注➕点赞👍➕收藏✨支持一下，有问题欢迎评论区提出。
