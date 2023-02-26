# 你真的了解Array.reduce吗？

> 本篇文章也同步到了掘金：https://juejin.cn/post/7204316982886826041

## 前言

我们经常会用到 Array 对象的 reduce 方法，把它用于做一些计算、或者数据组合，发现自己用了那么多年 reduce ，竟然还不是很了解它，最近才发现如果不传递初始值，它也可以正常进行，数组也可以是一个函数数组，来增强我们的代码。

本篇文章将带你重来了解 Array.reduce 和运用场景。

## 重新了解 Array.reduce

我们来看一下 MDN 怎么描述它的：

> **`reduce()`**  方法对数组中的每个元素按序执行一个由您提供的 **reducer** 函数，每一次运行 **reducer** 会将先前元素的计算结果作为参数传入，最后将其结果汇总为单个返回值。

我们来看一下这段代码：

```js
const arr = [1, 2, 3]
const initValue = 10;
function reducer(previousValue, currentValue, currentIndex, arrryTarget) {
    return preValue + currentValue
}
arr.reduce(reducer, initValue) // res === 16
```

reduce 会遍历 arr 数组，数组有多少个，reducer 就会执行多少次。执行过程每一次的参数（arrryTarget都是一样的，因此没有意义，除非在遍历过程中直接改变了原数组，因此这里不考虑）如下：

| `reducer` 重复执行 | `previousValue` | `currentValue` | `currentIndex` | return |
| ---------- | --------- | --------- | ----------- |  ------------ |
| 第一次执行   | `10`      | `1`       | `0`         | `11`         |
| 第二次执行   | `11`      | `2`       | `1`         | `13`         |
| 第三次执行   | `13`      | `3`       | `2`         | `16`         |

这个过程用过 reduce 的应该都知道，MDN 上原话是这样的：

> 第一次执行回调函数时，不存在“上一次的计算结果”。如果需要回调函数从数组索引为 0 的元素开始执行，则需要传递初始值。否则，数组索引为 0 的元素将被作为初始值 *initialValue*，迭代器将从第二个元素开始执行（索引为 1 而不是 0）

也就是第一次执行 reducer 函数时，不存在“上一次的计算结果”。这里传递了初始值，因此 `reducer` 函数才从数组索引为 0 的元素开始执行，也就是 `arr.length` 等于 `reducer` 执行次数。

但如果不传递初始值呢？我们改动一下代码：

```diff
const arr = [1, 2, 3]
- const initValue = 10;
function reducer(previousValue, currentValue, currentIndex, arrryTarget) {
    return preValue + currentValue
}
- arr.reduce(reducer, initValue) // res === 16
+ arr.reduce(reducer) // res === 6
```

这时候 reducer 只会执行 `arr.length - 1` 次。执行过程每一次的参数如下：

| `reducer` 重复执行 | `previousValue` | `currentValue` | `currentIndex` | return |
| ---------- | --------- | --------- | ----------- |  ----------- |
| 第一次执行   | `1`      | `2`       | `1`         | `3`         |
| 第二次执行   | `3`      | `3`       | `2`         | `6`         |

因为没有传递初始值，因此 `reducer` 函数从数组索引为 1 的元素开始执行，首次执行的时候 `arr[0]` 被作为了 `previousValue` ，`currentValue` 为是 `arr[1]`。

现在了 reduce 的基本用法，那么它的运用场景有哪些呢？

## reduce 的运用场景

### 用于计算数据

因为 reducer 函数会重复执行 `array.length` 或者 `array.length - 1`，因此特别适合做一些计算。

比如累加，计算订单总金额等案例：

```js
const orders = [{ id: 1, amount: 10 }, { id: 2, amount: 12 }, { id: 3, amount: 5 }]
const totalAmount = orders.reduce((a, b) => a.amount + b.amount, 0); // 17
```

累加可以，那么 `加减乘除` 中其他三个的原理是一样的，这里不用多说，肯定是可以的，甚至加上 `与` 、`非`的计算也是可以的，比如

```js
[true, true, false, true].reduce((a, b) => a & b); // 有false，按照与逻辑，一定会是false
```

### 将多维数组转为一维数组

reduce 可以很轻松的将二维数组转为一维数组。示例：

```js
[[1,2], [3, 4]].reduce((arrA, arrB) => [...arrA, ...arrB])
```

那是不是封装一下就可以把多维数组组转为一维数组了？当然可以：

```js
function flaten(arr) {
    if(!Array.isArray(arr)) {
        return arr;
    }
    return arr.reduce((result, item) => {
        // 不是数组，则直接放在数组末尾
        if(!Array.isArray(item)) {
            result.push(item);
            return result;
        }
        return result.concat(flaten(item))
    }, [])
}
flaten([1,2, [3, 4], [6, [7, 8]]]) // 8
```

这样就很简单的实现一个深层次的 flaten 。

### 将函数作为参数

将函数作为参数的话，运用场景在哪里？比如：

```js
[func1, func2. func3, func4].reduce((value, funcN) => funcN(value), value)，
```

执行顺序： func1 => func2 => func3 => func4，

这个效果就和 pipe 很像了是不是？这样封装一下就可以让函数执行扁平化。而不是 `func1(func2(func3(func4(value))))` 这样看着难受。有一篇详细的描述了将函数作为参数来实现 pipe 和 compose 函数的过程，不过文章被我不小心删除了，我看还能不能找回，找回再进行链接过去。

### 其他场景

[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) 其实还描述了很多使用场景，大家都可以去探索一下，总之 reduce 的功能很强大，俗称“万金油”不是没有道理的。

这里就简单列一下：

- 计算数组中每个元素出现的次数（如果元素是对象，也可以计算某个值出现的次数）
- 按属性对 object 分类
- 使用扩展运算符和 initialValue 绑定包含在对象数组中的数组
- 数组去重
- 使用 .reduce() 替换 .filter() 或者 .map()，可以替换当然也可以实现。
- 按顺序运行 Promise
- .....

## 最后

js中其实有很多函数功能都很强大，这些函数的强大其实还是因为js本身的机制带来的，函数在js中是一等公民，注定会逐渐影响我们的编码风格，因此大家可以去了解和学习函数式编程，它能让你的代码写的更轻松。

参考：

- [MDN array reduce](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) 
