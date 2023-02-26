# 函数式编程之函数组合｜理解和推导compose

本篇文章是[JavaScript 函数式编程](https://juejin.cn/book/7173591403639865377) 学习系列第四篇，感兴趣也可以先去看看前几篇内容：

- [一文理解JavaScript中的函数式编程的概念](https://juejin.cn/post/7201800584311455799)
- [JavaScript数据类型对函数式编程的影响](https://juejin.cn/post/7201879428087349304)
- [不可变数据方案之immer.js原理探索](https://juejin.cn/post/7202506471899873339)

突发感想：学习函数式编程的过程，我会经常想到以前写代码的场景，然后发现真的写了很多多余且不好维护的代码，大家有时间可以认真去学一下函数式编程，然后再去对比一下之前写的代码，你会发现，函数式编程中的编程技巧真是一个好东西。

## 前言

函数式编程带给我们的不只是一套理论，从这个理论中，衍生出了一套编程技巧，值得学习，它也能让我们的代码质量提升，不管是代码阅读性和可维护性、还是性能等多方面因素。其实大家现在去看很多框架源码的实现，会发现代码风格都在往函数式编程这个方向演变。

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

但这样嵌套下去，看起来有点懵，特别嵌套层数越来越多的时候，因此出现了 compose 函数，让多个函数可以可以并行：

```js
compose(
    func1,
    func2,
    func3,
    func4
)(value)
```

这样看起来顺序感就强烈了起来，是不是？

compose 的执行顺序是从右往左，也就是执行顺序是：func4 => func3 => func2 => func1；

也有一种从左往右的执行函数，叫做 `pipe` ，也就是管道函数的意思，就是把上一个函数的执行结果传递给下一个函数作为参数，使用方式跟 compose 一样：

```js
pipe(func1, func2, func3, func4)(value);
```

不过执行顺序是：func4 => func3 => func2 => func1；

## 实现 pipe 和 compose 函数

pipe 的执行过程其实和 reduce 类似 。

比如把 pipe 要执行的函数列表放在一个数组里面。

```js
const funcs = [func1, func2, func3, func4];
pipe(...funcs)(value);
```

这个 funcs 数组可以用 reduce 函数来执行，如下：

```
funcs.reduce((value, funcN) => funcN(value), value);
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

理解了吗？不理解可以去看看 [你不知道的 Reduce：函数式语言的“万金油”](https://juejin.cn/book/7173591403639865377/section/7175422666629709884) ，这篇文章让你深入的理解 reduce 的，理解了 reduce ，再看这些问题一眼就明白了。

哇！原来 js 中实现  这么简单啊，这时候要是是面试的时候，面试官可能需要你不使用 `reduce` 或者 `reduceRight` ，那么可以自己实现一个 `reduce` 或者 `reduceRight`。

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

当然 reduce 和 reduceRight 的实现方式也有其他方式，有其他想法的可以评论区交流交流。

## 总结

本篇从了解函数组合，再到实现函数组合的常用函数 compose 和 pipe，它们的运用场景其实非常广泛，很多时候我们在写代码中如果运用函数组合的思想，也会让我们的代码质量上升一个高度。

参考：

- [JavaScript 函数式编程实践指南](https://juejin.cn/book/7173591403639865377)
