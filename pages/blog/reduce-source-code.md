# 了解reduce原理和探索lodash.reduce的实现原理

## 前言

前一篇 [你真的了解Array.reduce吗？](https://juejin.cn/post/7204316982886826041) 讲解了 reduce 基础使用方法和场景的运用场景。本篇来分析一下 `reduce` 函数本身的实现原理。

实现 reduce 其实挺简单的，因为它本身的运行原理也不难，就是把数组进行遍历，然后组成合适的参数传递给回调函数，只要思路对了，去尝试几次，那么就理解了 reduce 。

最具有代表性的工具库当然是 reduce，因此本篇文章的主要内容会讲解 reduce 的基本实现，以及lodash 中是怎么来实现的，做了什么处理。

## 基本实现

思路：

1. 判断是否有初始值，因为有初始值和没有初始值对回调函数（reducer）执行的次数是有影响的。
2. 遍历数组
3. 组合参数传递给 reducer 进行执行
4. 获取到第三步返回值的时候，要把返回值存储起来，在下一次便利的时候作为reducer第一个参数来替换初始值。
5. 返回最终计算的value值

```js
function reduce(array, reducer, initialValue = null) {
    let value = initialValue === null ? array[0] : initialValue; // 思路1
    let startIndex = initialValue === null ? 1 : 0; // 思路1
    for(let i = startIndex; i < array.length; i++) { // 思路 2
        const item = array[i]
        const res = reducer(value, item, i) // 思路3
        value = res; // 思路4
    }
    return value; // 思路5
}
```

测试一下：

```js
console.log(reduce([1,2,3], (a, b) => (a + b), 0)) // 6
console.log(reduce([1,2,3], (a, b) => (a + b))) // 6
```

看起来是不是挺简单的，代码其实还可以更简洁一点：

```js
function reduce(array, reducer, value = null) {
    value = value === null ? array[0] : value;
    for(let i = null ? 1 : 0; i < array.length; i++) {
        value = reducer(value, array[i], i);
    }
    return value;
}
```

## lodash 中的 reduce 实现有何不同？

lodash中 的 reduce 不仅可以对数组生效，也可以对普通 object 、类数组对象生效。

不过也针对数组其实单独实现了一个 `arrayReduce` 函数，不过没有对外。

来看一下 `reduce` 和 `arrayReduce` 源码

```js
function reduce(collection, iteratee, accumulator) {
  const func = Array.isArray(collection) ? arrayReduce : baseReduce
  const initAccum = arguments.length < 3
  return func(collection, iteratee, accumulator, initAccum, baseEach)
}

function arrayReduce(array, iteratee, accumulator, initAccum) {
  let index = -1
  const length = array == null ? 0 : array.length

  if (initAccum && length) {
    accumulator = array[++index]
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array)
  }
  return accumulator
}
```

看得懂吗？不理解的话看下面一份代码，我把非数组类型的代码去掉，再调一下变量命名和新增注释：

```js
function reduce(array, reducer, value) {
  const noInitialValue = arguments.length < 3 // 用参数的数量来判断是否有初始值
  
  let index = -1 // 遍历索引 - 1，因为下面 while 循环前先加了 1
  const length = array == null ? 0 : array.length // 判断数组是否存在和缓存数组长度
  // 这个if 语句中做了我上面思路1中初始值的问题和遍历次数的问题
  if (noInitialValue && length) { // && length 判断了数组是否为空
    value = array[++index] // 没有有初始值，则取数组中第一为，注意 index 变成了0，下面 while 循环前会先加 1，因此循环次数会少一次。
  }
  while (++index < length) {
    value = reducer(value, array[index], index, array)
  }
  return value
}
```

可以看出其实大部分逻辑还是和前面的简单实现差不多，不过考虑更全一些，有值得借鉴的地方：

1. 参数判断逻辑更有力，不管外界传递了第三个参数是啥，都说明有初始值
2. 考虑了数组不存在或者为空的情况

下面我们再看一下，去除数组相关的代码来看看针对其他对象类型怎么处理的。

```js
function reduce(collection, iteratee, accumulator) {
  const func = baseReduce;
  const initAccum = arguments.length < 3
  return func(collection, iteratee, accumulator, initAccum, baseEach)
}
```

其他类型的都会教给 `baseReduce` 函数去处理。

```
// baseReduce
function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
  // 使用外部传递进来的遍历方法进行遍历对象，然后传递了一个 callback 给 eachFunc
  eachFunc(collection, (value, index, collection) => {
    // 初始值设置，
    accumulator = initAccum
      ? (initAccum = false, value)
      : iteratee(accumulator, value, index, collection)
  })
  return accumulator
}
```

使用外部传递进来的遍历方法进行遍历对象，然后传递了一个 callback 给 eachFunc，来执行 iteratee (也就是前面说的reducer)，callback 内部的代码就和前面 for 循环或者 while 循环的代码类似的，就是组合参数传递给 reducer 进行执行，不过直接看可能有点不好理解中，了解了原理再来看应该可以理解，注意事项：

1. initAccum 为 false 时，说明有初始值，直接执行 iteratee。
2. initAccum 为 true，说明没有初始值，需要添加初始值，因此第一次循环就是赋值给初始值，然后把 initAccum 设置为false，没有进行执行 iteratee，比没有初始值少一次执行，符合逻辑。


`eachFunc` 用的是 `reduce` 中传递进来的 `baseEach`，内部主要就是对对象进行遍历的操作，与本篇文章的内容没有啥关系了，要扩展又有很多内容，因此不再将这个。


## 总结

最近一直在学函数式编程，而 reduce 可以很好的契合函数式编程中的函数组合思想，因此最近几篇文章中都涉及到它，就想一次性把它给写透彻，希望对读者又一些帮助。
