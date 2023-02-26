# JavaScript数据类型对函数式编程的影响

> 最近在看 [《JavaScript 函数式编程实践指南》](https://juejin.cn/book/7173591403639865377)，里面把函数式编程讲的很详细，本文算是学习笔记，也算是转换成自己的想法后的输出。

前文 [一文理解JavaScript中的函数式编程的概念](https://juejin.cn/editor/7200981881651036217) 中写了函数式编程的概念，本篇文章继上文之后，来梳理 JavaScript 数据类型对函数式编程的影响。

## 前言

函数式编程编程的核心就是 `纯函数` 和 `控制副作用` ，为了让 `纯函数` 保持纯粹，纯函数的参数或者内部引用的外部数据应该是不可变数据。但 JavaScript 中的数据类型并不是都是不可变的，而数据类型的可变性，很有可能让 `纯函数` 变的不纯。

因此，本篇文章的目的有两点：

- 重新探索 JavaScript 的数据类型来了解的可变数据的根源。
- JavaScript 的可变数据数据是怎么让 `纯函数` 变得不纯的？

## JavaScript中 的数据类型中的可变数据

在 JavaScript 中，数据类型有以下 8 种：

- `null`
- `undefined`
- `boolean`
- `number`
- `symbol` -- 在 es6 中被加入
- `bigint` -- es6+ 被加入
- `object`

注意点：

> 在 JavaScript 中，变量是没有类型的，值才有类型。变量可以在任何时候，持有任何值。

### 原始类型（基本类型）

上面 8 中类型除了 `object` ，其他都是原始类型，原始类型存储的都是值，其特点有两点：

- 没有方法可以直接调用
- 原始类型的数据是不可被改变的，改变一个变量的值，并不是把值改变了，而是让变量拥有新的值。

注意点：

- `'1'.toString()`或者`false.toString()`等可以用的原因是被强制转换成了 String 类型也就是对象类型，所以可以调用 `toString` 函数。
- 对于`null`来说，很多人会认为它是个对象类型，其实是错误的。`typeof null` 会输出 `object`，这只是 JS 存在的一个悠久 Bug，而且好像永远不会也不会被修复，因为有太多已经存在的 web 的内容依存着这个 bug。注: 在 JS 的最初版本中使用的是 32 位系统，为了性能考虑使用低位存储变量的类型信息，`000`开头代表是对象，然而 `null` 表示为全零，所以将它错误的判断为 `object` 。虽然现在的内部类型判断代码已经改变了，但是对于这个 Bug 却是一直流传下来。

### 对象类型（引用类型）

而除了原始类型，剩下的 `object` 就是对象类型，和原始类型的不同点在于：原始类型存储的是值，对象类型存储的是地址。

经典示例：
```js
var c = 1;
var d = c;
d = 2;
console.log(c === d) // false

var a = {
    name: "张三",
    age: 20
}
var b = a;
b.age = 21;
console.log(a.age === b.age) // true
```

示例中把变量 a 的值给到了变量 b ， b 修改了age 属性，但是 a 的 age 属性也跟着变了，是因为 `var b = a` 是 a 把对象的引用地址赋值给 b ，这时候 a 和 b 指向的是内存中的同一个数据。

而 c 给 d 的是值，并不是一个引用，相当于复制了一份数据。

因此可以知道原型类型的数据是不可变的，而对象类型的数据是可变的。

## JavaScript 为何能会让纯函数变得不纯？

JavaScript 中的对象类型的数据是可变，而可变性，就代表了不确定性，`纯函数` 中使用了不确性的数据就会导致不纯，因为其违背了 `纯函数` 的特征：不受外界影响，不影响外界。

下面来看一个例子：

A 同学写了这么一段代码，初始化生成了一个 “zhangsan” 用户。

```js
export const defaultUserInfo = {
    name: "名称",
    age: 20,
    hobby: ["玩耍"]
};
export function initUser(userTemplate, name, age) {
    const newUser = userTemplate;
    newUser.name = name;
    newUser.age = age;
    return newUser;
}
const zhangsan = userInit(userDefaultInfo, "zhangsan", 21);
```

然后 B 同学在开发其他页面的时候，看到有初始化用户信息的方法，然后直接复制过去，初始化了一个 “lisi” 用户。

```js
import { defaultUserInfo, initUser } from "xxx模块"。

const lisi = userInit(userDefaultInfo, "lisi", 21);
```

检测的时候看到自己初始化的用户信息正确的就没有去检查之前 A 同学的是否是正确的，上线后发现所有的用户都变成了 lisi 。因为 `userDefaultInfo` 是一个引用类型，`userInit(userDefaultInfo, "xxx", xx)` 操作的都是内存中的同一个对象。其原因就是因为 A 和 B 开发者犯了一个错误，把可变数据传递到了 `userInit` 函数内部进行处理，哪怕进行了浅层拷贝，也出现了问题。究其原因还是因为给函数传递进去了一个 `可变数据`。

我们校验一个 `纯函数` 有效性的关键依据，永远是“针对已知的输入，能否给出符合预期的输出”，而上面例子中 `initUser` 函数没有违背这个规则，但是在可变数据的影响下，让它产生了 `副作用`，对外界已有的数据造成了影响。
 
## 总结

本篇先分析了 JavaScript中 的数据类型中的可变数据，然后再探索了其可变数据数据对 `纯函数` 造成的影响，究其原因还是因为可变数据会使数据的变化变得隐蔽，进而使函数的行为变得难以预测，因此我们在使用 object 类型数据时，一定要注意函数内部不要直接进行改变参数内容，从而导致一些不可预测的bug。
