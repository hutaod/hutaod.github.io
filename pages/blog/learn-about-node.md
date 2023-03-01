# 一文了解 node.js

> 本篇文章也同步到了掘金：https://juejin.cn/post/7205208559264792632

## 前言

平时自己会经常用到 `Node.js`，不过一直没有花费太多时间去梳理和探索它，但 `Node.js` 在前端的地位太重要了，它基本上统领了现代前端的基建，而我对 Node.js 相关的知识认知还比较零散杂乱，不成体系，这让我自己每次想要自己去做一些东西的时候，总感觉有点堵，虽然也能正常的去运用它，但遇到问题的时候就只能依靠经验调试，或者去搜索查询，很多理解不够深入，特别是服务端相关的知识体系，因此打算重新学习和梳理一下 `Node.js` 相关体系，并探索它的原理，学习过程中也会把自己的学习总结记录下来，并发到掘金进行分享，如果有问题欢迎 JYM 指出。

本篇文章将用于了解 `Node.js` ，现在社区有很多介绍它的文章，因此我主要把我觉得需要去理解的进行一个总结，借用部分内容也会通过链接链接到原文（有的别人已经写的很清楚了，也是事实的陈述，这种会引用原文，但会添加自己的见解）。

整体思路：

- Node.js 是什么？
    - 简单介绍 Node.js 的定义
    - 理解运行（ runtime ）时概念
    - 理解跨平台概念
    - 结论
- Node.js 能做什么？

## Node.js 是什么？

### 介绍

> Node.js 是一个开源、跨平台的 JavaScript 运行时环境。

这是官网首页上的描述。详细的理解就是：

> Node.js 不是一门新的编程语言，也不是一个 JavaScript 框架，它是一套 JavaScript 运行环境，用来支持 JavaScript 代码的执行。用编程术语来讲，Node.js 是一个 JavaScript 运行时（Runtime）。 

这段话摘自于[Node.js是什么？Node.js简介](http://c.biancheng.net/view/9338.html)

### 理解运行时

上面提到了 `Node.js` 给 `JavaScript` 提供了一个运行环境，提供这个运行环境是用来做啥呢？

我们都知道浏览器本身也给 `JavaScript` 提供了一个运行环境，在这个环境中，JS 可以调用浏览器提供的一些 `API` ，来调用浏览器的一些功能，比如 `DOM` 操作、`window` 对象、如定时器等等，这些 API 都是浏览器的 JavaScript 运行时环境提供的，而在 `chrome` 浏览器，这个运行时环境是 `Chromium`，它会通过执行引擎 `V8` 在 `JavaScript` 执行过程中注入这些 API（运行时环境Chromium和执行引擎V8是从[趣学 Node.js](https://juejin.cn/book/7196627546253819916)中看到的这个说法，查询到的其他资料很少会明确指出）。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/045575168ff64f328bf81d9a26188e7e~tplv-k3u1fbpfcp-watermark.image?)

注意，`V8 引擎` 会解析和执行 `Chromium` 运行时环境提供的 `API`。

这里就可以理解了运行时的概念：运行时是编程语言执行过程中的环境。

扩展一下就是：`JavaScript 运行时` 指的是提供给 `API` 给 `JavaScript` 来调用外界程序功能的运行环境。

`Node.js` 也是使用 `V8 引擎` 进行解析和执行 `JavaScript` ，然后给其注入其指定的 `API` ，然后提供 `JavaScript` 运行的环境，在这个环境中， `JavaScript` 就可以通过 `V8引擎` 调用 `Node.js 运行时环境` 提供的 `API` 来调用服务器的一些功能，比如文件读取、网络请求等功能。

### 理解跨平台

官网描述的一个重要点就是 `跨平台`，这说明 `Node.js` 可以它独立于操作系统，可以在 `Linux` 、`Windows` 和 `macOS` 等多个操作系统上运行。

为了跨平台的特性，`Node.js` 内部的库一般都会处理多平台的兼容性问题，比如 `libuv` 。

### 结论

[菜鸟教程](https://www.runoob.com/nodejs/nodejs-tutorial.html) 上对 `Node.js` 的定义：

1. `Node.js` 就是运行在服务端的 `JavaScript`。
2. `Node.js` 是一个基于 `Chrome JavaScript 运行时` 建立的一个平台。
3. `Node.js` 是一个事件驱动 I/O 服务端 JavaScript 环境，基于 `Google` 的 `V8 引擎` ，`V8 引擎` 执行 `Javascript` 的速度非常快，性能非常好。

我觉得从不同角度来看也可以这样定义。

- 第 1 点，可以用于区分它和浏览器端运行的 `JavaScript`。
- 第 2 点，可以说明它是一个应用程序，用于支持 `JavaScript` 运行时建立的一个应用程序。因为 `Node.js` 本身也是一个开源软件，它在服务器上的安装提供了 `Node` 程序，该程序本身可以使 `JavaScript` 文件在该服务器上执行。
- 第 3 点，就是简单描述 `Node.js`，和官方的定义最接近。

## Node.js 能做什么？

需要知道 `Node.js` 能做什么，就需要知道它本身提供了什么功能，下面我们来根据 `Node.js` 的部分内部模块分析一下 `Node.js` 提供了哪些功能（引用于[Node.js是什么？Node.js简介](http://c.biancheng.net/view/9338.html)）：

模块          | 说明                                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [libuv](https://libuv-docs-chinese.readthedocs.io/zh/latest/)       | 一个强调异步I/O的多平台支持库。但是 libuv 不仅限于 I/O，它还提供了进程管理、线程池、信号处理、定时器等其它功能。Linux 中一切皆文件，这里的 I/O 不仅仅包括文件读写，还包括数据库读写、网络通信（socket）等。|
| npm         | Node.js 包管理器，可以下载包、安装包、卸载包、更新包、上传包等。                                                                                          |
| http_parser | 一款由C语言编写的轻量级 HTTP 解析器，用以支持 Web 应用开发。                                                                                          |
| zlib        | 工业级的数据压缩/解压模块，Nodejs 借助 zlib 来创建同步、异步或者流式的压缩/解压接口。                                                                            |
| OpenSSL     | 该模块提供了经过严密测试的许多加密/解密功能，现代 Web 依赖这些功能来实现安全性，比如 SSL 协议和 https 协议。                                                               |
| c-ares      | 异步 DNS 查询和解析库。

最核心的功能都由 `libuv` 提供，其[官方文档](https://libuv-docs-chinese.readthedocs.io/zh/latest/)介绍的也很详细，有兴趣可以去看看。

从上面提供的功能我们可以分析出来，`Node.js` 中主要核心是为了让 `JavaScript` 可以像 `Python` 、`Ruby` 、 `PHP` 等其它脚本语言一样，可以直接计算机上运行，因此这些语言可以做的很多事 `Node.js` 也都可以做。比如：

- 开发 web 服务器；
- 开发 GUI 程序，比如 `Electron` 嵌入了 `Chromium` 和 `Node.js`，使 Web 开发人员能够创建桌面应用程序；
- CLI 工具，也就是不带界面的命令行程序。
- 网络爬虫等各类脚本工具。

而我们平时的工作也离不开 `Node.js` ，因为它基本上构建了现代前端的整个生态，前端的方方面面都会涉及到它，比如：

- 命令行工具，比如 `React`、`Vue` 等各类脚手架。
- 代码辅助工具，比如 `eslint`、`prettier` 等等。
- 代码打包/编译工具，比如 `webpack` 、 `babel` 等。
- Node.js 进程管理工具 pm2 等等
- BFF 接口开发

上面只是一些例子，当然还有很多事情可以做，基本上 node.js 可以玩的很好的话，全栈都可以一个人玩。

## 最后

`Node.js` 的诞生后给前端的蓬勃发展带来了基础，这也是一个新的方向的开始，才导致了后续新的类似的 `JavaScript 运行时` 诞生，比如 `Deno` 、`Bun` ，而且因为 `Node.js` 生态繁荣的原因， `Deno` 、`Bun` 也会兼容大部分基于 Node.js 规范开发的 npm 包，因此这几个专注于其中之一即可，底层的原理是类似的。

再引入一篇文章的片段来说明一下 Node.js 的起源：

> `Node.js` 是 `2009` 的时候由 `Ryan Dahl` 开发的。 `Ryan` 的本职工作是用 `C++` 写高性能的Web服务器，后来他总结出一个经验，一个高性能服务器应该是满足“事件驱动，非阻塞 I/O”模型的。`C++` 开发起来比较麻烦，于是 `Ryan` 就想找一种更高级的语言，以便快速开发。
> 
> `Ryan` 发现 `JavaScript` 语言本身的特点就是事件驱动并且是非阻塞 I/O 的，而 `Chrome` 的 `JavaScript` 引擎，也就是 `V8 引擎` 是开源的，而且性能特别棒。于是 `Ryan` 就基于 V8 开发了 `Node.js`。
> 
> 摘自于 [Node.js 发展史介绍与安装初体验](https://zhuanlan.zhihu.com/p/550940916)

最后欢迎👏大家关注➕点赞👍➕收藏✨支持一下，有问题欢迎评论区提出。

## 参考

- [Node.js是什么？Node.js简介](http://c.biancheng.net/view/9338.html)
- [introduction-to-js-engines-and-runtimes](https://algodaily.com/lessons/introduction-to-js-engines-and-runtimes)
- [V8 JavaScript 引擎](https://nodejs.dev/zh-cn/learn/the-v8-javascript-engine/)
- [writing cross-platform Node.js](https://shapeshed.com/writing-cross-platform-node)
- [libuv](https://libuv-docs-chinese.readthedocs.io/zh/latest/) 