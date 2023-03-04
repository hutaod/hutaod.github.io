# JavaScript函数式编程之柯里化探索

JavaScript函数式编程中有不少编程技巧，而柯里化则是很常见的一种，本篇文章将带你了解它的意义和原理，以及运用场景，并实现一个 `curry` 函数。

> 了解运用场景很重要，因为如果只是一堆理论，没有地方使用，那么本身就不存在实用价值，学习的意义就不大了。

## 什么是柯里化？

> 在计算机科学中，柯里化（英語：Currying），又译为卡瑞化或加里化，是把接受多个参数的函数变换成接受一个单一参数（最初函数的第一个参数）的函数，并且返回接受余下的参数而且返回结果的新函数的技术。

这是维基百科上的定义，它的意思用代码呈现出来就是下面这种效果：

```js
//  原函数
function func(a, b, c) {
    return a + b + c;
}

// 正常调用
func(1, 2, 3);

// 被柯里化后可单个调用
const curriedFunc = curry(func); // 把接受多个参数的函数变换成接受一个单一参数
const curriedFunc1 = curriedFunc(1); // 返回一个 “可接受余下的参数 b 和 c ” 的新函数
const curriedFunc2 = curriedFunc1(2); // 返回一个 “可接受余下的参数 c ” 的新函数
// 没有剩余参数，因此返回结果。
const result = curriedFunc2(3); // 6
```

> 上面这种模式有没有感觉有点像 `Generator` ？都可以分开接受参数，都要执行多次才能得到结果，不过 Generator 是使用 next 函数执行的，其实好像没啥关系，这也就突然冒出来的一个想法，然后没有查询到它们之间有啥关系。这段话可以忽略。

上面例子中的写法主要是为了验证 `计算机中的定义的柯里化` ，这里的 `curry` 函数先不要去管它怎么实现的，后面会讲。

但现实编程常常更需要效果是：可以一次传递多个参数，只要没有大于等于函数的参数个数，都返回一个 “可接受余下的参数” 的新函数。比如：


```js
const curriedFunc1 = curriedFunc(1, 2);
// 没有剩余参数，因此返回结果，不会管多余的参数。
const result = curriedFunc2(3, 4); // 6
```

第一次调用，只传递了部分参数，因此返回了一个 “可接受余下的参数” 的新函数，下次调用传入最后一个参数，才会直接返回结果，当然多传递了参数没有影响，计算的是初始函数的参数个数。

当然也可以直接当成原函数调用，一次性传递所有参数：

```js
curriedFunc(1, 2, 3); // 6
```

这时候直接接受了所有参数，没有剩余参数，因此直接返回结果，`curriedFunc` 和 `curry` 就表现一致，这样就没有 `柯里化` 的必要了。

注意到没，每一次调用我都是分开写，而不是直接一次写完，因为如果一次性写完的话，使用意义就不大了，`curriedFunc(1)(2)(3)` 和 `func(1, 2, 3)` 结果没有任何差别，分开来写才是柯里化在编程中的运用的意义所在。

## 柯里化的运用场景和原理探索

上面介绍了 `柯里化` 的含义，其实 `柯里化` 并不是说一定要使用 `curry` 来转化一个函数，然后去分开传递参数，这样的运用场景在 `JavaScript` 实践中其实比较少用到，相反用的特别多的是它的原理，而不是这个根据原理去实现的 `curry` 函数，当然如果你理解了这个本质，那么你可以去使用 `curry` 函数来简化部分代码。

这里先来看一下平时一般会怎么运用 `curry` 的原理，比如需要创建一个请求方法：

```js
// createRequest.js
import axios from "axios";
export function createRequest(config) {
    return (url, params) => {
        return axios.post(url, params, config);
    }
}
```

然后可以在应用初始化的时候单独去创建 request 方法：

```js
// app.js
const request = createRequest(config);
```

使用 request ：

```js
// pageA.js
async function getListData() {
    const res = await request("/api/xxx", {});
}再
```

返回的 request 函数以后每次只用传递 `url` , `params` 两个参数，而不需要重复传递 `config` 的数据，这样公共部分参数也更好管理配置一些。

看到这里是不是有些清晰了，这不就是使用闭包来缓存数据，事实就是这样的，`柯里化` 本身就是使用闭包来缓存之前传入的函数参数。上面的代码 createRequest 改变一下：

```
// createRequest.js
import axios from "axios";
function postRequest(url, params, config) {
    return axios.post(url, params, config);
}

export const createRequest = curry(postRequest);
```

应用初始化的代码不变，仍然是这样：

```js
// app.js
const request = createRequest(config);
```

使用 request 的时候，也保持 `request("/api/xxx", params)` 不变，最后的结果也不变。

这时候甚至还可以这样使用：

```js
// pageA.js
const getList = request("/api/xxx"); // 只用写一次，就可以在多个地方调用了
let pageNo = 0;
async function getListData() {
    const res = await getList({ pageNo: pageNo });
    pageNo++;
}
async function resetListData() {
    pageNo = 0;
    const res = await getList({ pageNo: 0 });
}
```

现在是不是清楚了？ `柯里化` 可以很大程度的去缓存函数参数，然后简化代码，特别是越复杂应用，越能体现出它的强大能力。

## 实现一个柯里化函数

原理都说明白了，下面我们来实现一个简单版的 `curry` 函数：

实现思路：

1. 记录元函数长度
2. 实现创建“一个返回函数”的函数，函数内部需要判断传递的总参数是否足够，足够则直接执行原函数并返回原函数执行结果，不够则，不够则进行再次 `创建“一个返回函数”的函数`（这里就是递归模式了，跳出递归条件就是所有参数>=原函数）。
3. 需要注意总参数的存储，需要放在 `createCurried` 的参数中来进行传递。

具体代码：

```js
function curry(func) {
    const funcArgsLength = func.length; // 原函数长度
    function createCurried(oldArgs = []) { // oldArgs为已记录的函数参数。
        function curried(...newArgs) { // newArgs每次调用时传递的新参数
            // 参数至少需要传递一个，否则就当传递了一个空的参数，函数执行什么都不处理。
            const args = [...oldArgs, ...(newArgs.length ? newArgs : [undefined] )]
            // 没有剩余参数，则直接执行 func 并返回结果。
            if (args.length >= funcArgsLength) {
                return func(...args);
            }
            // 有剩余参数，因此返回了一个 “可接受余下的参数” 的新函数，也就是创建 curried
            return createCurried([...args]);
        }
        return curried;
    }
    // 返回被一个被柯里化的函数
    return createCurried();
}
```

## 总结

本篇文章的内容从理解柯里化的含义，再从常见使用函数的方法来探索它的运用和原理，最后再简单的实现了一个 `curry` 函数。其实写完后才发现我在写篇文章之前对 `柯里化` 的理解不那么深，自己总结并实现一遍，意义还是挺大的，如果小伙伴们看到这里也可以自己动手去尝试尝试。

本篇文章仅从前端运用的角度来理解，如果看得不过瘾，可以去看看 [JavaScript 函数式编程](https://juejin.cn/book/7173591403639865377) 这本小册，写的很清晰，更与数学中的函数概念一起进行了详细分析。

前面也写了几篇关于函数式编程的，感兴趣可以去看看。

- [一文理解JavaScript中的函数式编程的概念](https://juejin.cn/post/7201800584311455799)
- [JavaScript数据类型对函数式编程的影响](https://juejin.cn/post/7201879428087349304)
- [不可变数据方案之immer.js原理探索](https://juejin.cn/post/7202506471899873339)
- [JavaScript函数式编程之compose和pipe的理解和实现](https://juejin.cn/post/7204839741586505765)