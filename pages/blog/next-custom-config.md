# Next.js 自定义扩展

## 说明

本文主要讲解两个点：

1. 为什么要给 `next.config.js` 新增自定义配置？（目的）
2. 如何去新增自定义配置？（行动）

先弄清楚原因，再去做某件事，才能事半功倍。

## 为何要给 `next.config.js` 新增自定义配置？

`配置` 的目的：

> 其实工程需要配置文件的目的就是为了简化代码，把复杂代码进行封装起来，仅使用配置就能驱动那些很复杂的代码，让业务开发者只需要知道配置项怎么去配置，而不需要关系具体代码的实现，这也算是 `封装` 的意义之一。

`Next.js` 本身就提供了大量的配置项，其实也可以从配置项看出 `Next.js` 实现了很多强大的功能，让开发者很容易上手。

如果一个简单的项目，基本上默认配置可能就够用了。

但对于实际中的具体业务来说，再全面的配置对于开发者来说，都可能有自己想扩展的配置，自定义扩展也是为了让开发者编写代码更加简洁。

比如说，我需要接入了 Google Analysis （谷歌分析，简称GA）到工程中，但是它有一些配置，我想把它的配置放在 `next.config.js` 中进行配置，然后在工程中去使用。

这样就可以简化业务开发者的关注点，只需要关注 `ga` 的配置项，不再去想关注具体怎么接入到工程的，也可以防止业务开发者不小心改错了实现的代码。

因此，新增新增自定义配置其实也就是想对 `不变的代码` 进行 `封装`。

## 如何去新增自定义配置？

其实在前几天写的[# Next.js中Redux使用方案和wrapper概念](https://juejin.cn/post/7195890834868109373)一文章中有写到 `wrapper` 概念，感兴趣可以去看一下，其实这里也是使用这个概念，不过不是用在函数上，是用在一个配置对象上：

```js
// next.config.js
const { withConfig } = require("next-extends");

// 类型提示
/** @type {import('next-extends').NextConfigExtends} */
const nextConfig = withConfig({
    reactStrictMode: true,
    // 自定义扩展配置
    ga: {
        trackingId: "xxxx",
        // ...其他配置省略
    }
})

module.exports = nextConfig;
```

`withConfig` 的目的就是为了把自定义扩展配置转换成 next.config.js 的本身配置并返回，或者做一些其他处理后，再返还 next.config.js 的本身配置。

具体实现：

```tsx
// next-extends 包
export function withAlConfig(config: NextConfigExtends): NextConfig {
  const { ga, publicRuntimeConfig, ...nextConfig } = config;
  const gaConfig = ga
    ? {
        enabled: (process.env.NODE_ENV === "production" || ga.debug) && ga.trackingId,
        debug: !!ga.debug,
        trackingId: ga.trackingId,
      }
    : {
        enabled: false,
      };
 return {
     ...nextConfig,
     publicRuntimeConfig: {
         ...publicRuntimeConfig,
         ga: gaConfig,
     }
 }
```

这样就简单实现了一个 自定义扩展配置 功能，现在只是把 `ga` 数据进行处理后注入到了 `next.config.js` 的 [publicRuntimeConfig](https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration) 属性，可点击去官方文档查看其作用，在 next.js 应用的 `_document.tsx` 就可以注入 `ga` 代码了。（省略了一些代码）

```tsx
// _document.tsx
import { Html, Head, Main, NextScript, DocumentProps } from "next/document";
import { NextData } from "next-extends";

function Document(
  props: DocumentProps & {
    __NEXT_DATA__: NextData;
  }
) {
  const ga = props.__NEXT_DATA__.runtimeConfig.ga;
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
        {/* 注入ga代码 */}
        {ga.enabled && <script src={`https://www.googletagmanager.com/gtag/js?id=${ga.trackingId}`} defer />}
      </body>
    </Html>
  );
}

export default Document;
```

现在简单的实现了自定义配置的功能，其实注入到 `_document.js` 的代码也可以再次进行封装起来，不暴露在具体业务里面

## 结语

本文只是用了ga的配置来做了一个例子，但实际上还有很多可以进行自定义配置，因为读取配置是可以在整个应用的任何时候。

比如说，如果启动端口号为 `3999` ，而开发环境、测试环境、线网环境的打包命令又不相同时，那么不同环境的 `npm script` 打包命令都需要添加 `--port 3000` 参数，这样会显得比较累赘，那放到 `next.config.js` 中进行配置，是不是更好呢？

希望这篇文章能带给大家一些帮助或者启发，创作不易，欢迎点个赞！

如果用到 `Next.js` 的或者想要使用的小伙伴们，也可以收藏下来，发现有问题的欢迎指出。

下一篇 `Next.js自定义Server`，这篇文章中会实现自定义 `port` 配置，以及讲解自定义 Server 的目的。