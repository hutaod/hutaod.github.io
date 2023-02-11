Next.js 接入多语言可以复用前一篇文章讲解的 [React 多语言接入方案](https://juejin.cn/post/7197782794674798648) 部分实现，因此本篇文章的核心将放在 Next.js 的不同点上。

## Next.js 接入多语言

在 Next.js 这类型的框架，我们需要考虑服务端的初始化和客户端的初始化的问题。

在服务端部分的代码一般分成两种类型：

- node server 启动的时候执行的代码
- server 接收到请求，需要进行执行代码，组装页面，然后返回给客户端，这里就是服务端渲染的过程。

`i18next` 初始化之前，我们需要知道需要知道客户端需要渲染的 `语言` 是什么，不然多语言的页面就没法渲染具体内容（除了构建的时候静态化），因此需要从客户端的请求信息中获取。

一般我们在服务端获取客户端 `语言` 类型的方式有以下几种：

1. `hostname` : 根据域名获取，比如 `https://zh-hans.reactjs.org`
2. `pathname` : 根据pathName前缀获取，比如 `https://developer.mozilla.org/zh-CN/docs/Web`
3. `query` : 根据query参数获取，比如 `https://xxx.com?lang=zh-CN`
4. `accept-language` : 根据请求头获取，从请求头中的 `accept-language` 解析获取

服务端渲染的过程基本上都会有一个渲染上下文的概念，因此我们在使用合适的方式获取需要渲染的 `语言` 后，我们需要在渲染上下文的上方进行尽早初始化 `i18next` 。

为了在服务端尽早初始化 `i18nxt`，我们有两个地方进行选择，选择之前我们来看一下 Next.js 渲染执行的代码顺序。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c217477cc7284bdaa4f05aa39c8f80f1~tplv-k3u1fbpfcp-watermark.image?)

`middleware` 是运行在 Edge Runtime，并不能直接和 node 的 js runtime 通信，`Data Fetch Function` 中可以进行初始化，但没有太多必要，实现起来会麻烦不少。因此可以在 `App Component` 中去实现，其实还有一个 Document Component 的，但是这个有一些问题。

服务端初始化代码实现：

```tsx
// src/hocs/withAppI18n.tsx
import React from "react";
import { I18nextProvider, useSSR } from "react-i18next";
import { AppProps, AppType } from "next/app";
import { getResources, i18nextInstance, initI18next, initI18nextInBrowser } from "../i18n";

export const withAppI18n = (App: AppType) => {
  if (process.browser) {
    // 客户端在此处初始化i18n，也就是在加载解析代码的时候就会先初始化，写在 WithI18nApp 函数内部才是渲染内容时初始化
    initI18nextInBrowser();
    return function WithI18nApp(props: AppProps) {
      return (
        <I18nextProvider i18n={i18nextInstance}>
          <App {...props} />
        </I18nextProvider>
      );
    };
  } else {
    return function WithI18nApp(props: AppProps) {
      // 服务端在此处初始化i18n，每次访问重现初始化 i18n 实例
      initI18next(props.router.locale);
      useSSR(getResources(), props.router.locale);
      return (
        <I18nextProvider i18n={i18nextInstance}>
          <App {...props} />
        </I18nextProvider>
      );
    };
  }
};
```

新增一个给 App Component 使用的高阶函数来进行初始化。其中服务端渲染和客户端渲染分开初始化，下面来看实现代码：

```tsx
// src/i18n/index.tsx

// 客户端初始化
export const initI18nextInBrowser = async () => {
  if (!isBrowser) {
    return;
  }
  // 可以下面这一句代码让 initI18next 异步去执行
  await Promise.resolve();
  // 客户端可以直接解析 hostname、pathname、query、navigator.language等地方获取
  const lng = getLang();
  initI18next(lng);
};

// i18nextInstance.init 提取到 initI18next 函数中进行
export const initI18next = (lng: string) => {
  i18nextInstance.init(
    {
      lng: lng,
      // ...省略
      resources: resources,
    },
    (err) => {
      if (err) return console.log("something went wrong loading", err);
    }
  );
};

// 获取所有 resources
export const getResources = () => {
  return resources;
};

```

接入到 APP 组件中：

```
// src/pages/app.tsx

import { withAppI18n } from "../hocs/withAppI18n"

function App() { /** 省略 */}

export default withAppI18n(App);
```

## 注意事项

- 如果多语言页面要做静态化，那么必须保证不同的语言的 url 是不一样的，这样才能在初始化的时候知道应该渲染哪一种语言，因此只适合前文所说的服务端获取客户端 `语言` 类型的方式前两种
- 客户端获取语言的类型可以有更多方法，比如 cookie 等等，可以发挥想象力。
- resources 变量需要注意被不断注入新的翻译资源，因为相当于是存储在 nodejs 全局变量了，每次请求不同的页面去加载不同翻译资源，有一些不确定性的可能，又可能导致 nodejs 内存上涨不少。

## 结语

最近写的基本上都属于一个体系，是自己工作学习中使用 Next.js 的一些心得，也建了一个专栏来进行管理 —— [《Next.js运用实践》](https://juejin.cn/column/7196868559125250104)
