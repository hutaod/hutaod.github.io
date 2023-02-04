# Next.js中Redux使用方案和wrapper概念

Next.js官方文档中有指出有一个接入 [Redux的例子](https://github.com/vercel/next.js/tree/canary/examples/with-redux)，但是此例子其实只能算是一个纯客户端调用Redux的例子，并没有涉及到在服务端进行请求并把数据传递给客户端的方案。

但官方仓库 examples 目录下面有一个案例 [with-redux-wrapper](https://github.com/vercel/next.js/tree/canary/examples/with-redux-wrapper)，里面用到了 [`next-redux-wrapper`](https://github.com/kirill-konshin/next-redux-wrapper) ，这个库的核心目的就是把 redux 在服务端存储的数据传递给客户端，它只输出了两个 API ：

- `createWrapper` : 创建 `wrapper`;
- `HYDRATE` : 只是一个 `reducer` 的 `action key` ，用于客户端初始化的时候使用的；

本文章主要讲解 `next-redux-wrapper` 的功能和原理，并从中吸取精华，进行简单的改造，使 `wrapper` 能更好的扩展其他能力

## `wrapper` 的概念

`next-redux-wrapper` 引入了一个 `wrapper` 的概念，它的主要功能就是提供给 [Next.js 数据获取](https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props) 方法的上层包裹方法，下面我们来看一下使用代码：

创建 wrapper

```tsx
// wrapper.ts
import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";

import counterReducer from "./features/counter/counterSlice";

export function makeStore() {
  return configureStore({
    reducer: { counter: counterReducer },
  });
}

export const wrapper = createWrapper(makeStore);
```

应用接入 redux

```tsx
// app.js
import { Provider } from "react-redux";
import { wrapper } from "../wrapper";

function App({ Component, ...rest }: AppProps) {
  const { store, props } = wrapper.useWrappedStore(rest);
  return <Component {...props.pageProps} />;
}

export default App;
```

使用 wrapper

```tsx
// 页面文件中
export const getServerSideProps = wrapper.getServerSideProps(({ store }) => async (ctx) => {
    // getServerSideProps 函数本身需要的处理的逻辑代码
})
```

从代码中可以很好理解 `wrapper` 这个概念。这也是函数式编程中对 `高阶函数` 的一种运用，`wrapper.getServerSideProps` 就是通过对传递进去的函数进行了处理，返回一个新的函数。

wrapper 提供了以下几个函数的包裹函数：

- `getServerSideProps` : 对应 `Next.js` 中的 `getServerSideProps`
- `getStaticProps` : 对应 `Next.js` 中的 `getStaticProps`
- `getInitialAppProps` : 对应 `Next.js` 中应用级（app.js） 的 `getInitialProps`
- `getInitialPageProps` : 对应 `Next.js` 中页面级（比如index.js） 的 `getInitialProps`


## 如何把服务端存储的数据传递给客户端

首先，我们需要弄清楚几个问题：我们为什么需要在服务端请求数据后再把数据传递给客户端？

这个问题比较重要，这也是服务端使用 redux 的意义。

一般我们使用 redux 是为了存储一些共享状态，比如：
- 应用公共状态：比如应用全局信息、用户基础信息、用户权限信息等等
- 复杂页面状态：页面复杂度较高时，在深层次子组件需要用到的页面的信息

而服务端使用 redux 的原因：一般在于服务端渲染页面内容时依赖前面描述的的状态，这样就导致这部分信息需要在服务端进行请求初始化，然后存储到 redux 中，页面渲染后，可以直接获取到这部分信息，而不是再去请求一次接口。

`Next.js` 本身服务端传递数据到客户端的方式是把 [Next.js 数据获取](https://nextjs.org/docs/api-reference/data-fetching/get-server-side-props) 方法的返回值注入到 `window.__NEXT_DATA__` 属性里。

而 `next-redux-wrapper` 的 `wrapper` 通过包裹 `Next.js 数据获取` 方法，也可以在其包裹函数内部对返回值进一步注入 redux 数据。

## 重写 `createWrapper`

`next-redux-wrapper` 中引入了 `wrapper` 概念，但是这个 `wrapper` 却不能直接扩展其他信息。

比如说，我还想在 `getServerSideProps` 函数中获取更多公共信息，那怎么办呢？

这部分的信息都属于访问页面的 `上下文` 过程中才初始化的信息，比如请求地址、国家、语言信息等，这些都可以从 `getServerSideProps` 的参数中获取，但需要进行规范化处理，因为逻辑可能比较复杂，为了方便业务开发者不必关心这部分逻辑，也可以利用 `wrapper` 来提供这些信息。比如我想实现下面这种效果：

```tsx
// 页面文件中
export const getServerSideProps = wrapper.getServerSideProps(({ store, i18nInfo }) => async (ctx) => {
    const res = fetch("/api/xxx", {
        language: i18nInfo.language
    });
})
```

业务开发者直接通过 `wrapper.getServerSideProps` 就可以获取到 `i18nInfo` 信息了，而这个信息刚好是服务端请求接口时需要用到的参数，这是一个很常见的🌰。

下面我们就来实现这种能力。

```ts
// createWrapper.ts

// createWrapper 重写
import { AnyAction, Store } from "@reduxjs/toolkit";
import {
  GetStaticProps,
  GetServerSideProps,
  GetServerSidePropsContext,
  GetStaticPropsContext,
  GetStaticPaths,
  GetStaticPathsContext,
  NextComponentType,
  NextPageContext,
} from "next";
import { ParsedUrlQuery } from "querystring";
import { Config, MakeStore, createWrapper as reduxCreateWrapper } from "next-redux-wrapper";
import { AppContext, AppInitialProps } from "next/app";

type GetInitialPageProps<P> = NextComponentType<NextPageContext, any, P>["getInitialProps"];

//FIXME Could be typeof App.getInitialProps & appGetInitialProps (not exported), see https://github.com/kirill-konshin/next-redux-wrapper/issues/412
type GetInitialAppProps<P> = ({ Component, ctx }: AppContext) => Promise<AppInitialProps & { pageProps: P }>;

// 类型声明
export type GetServerSidePropsCallback<O, P extends object = any> = (params: O) => GetServerSideProps<P>;
export type GetStaticPropsCallback<O, P extends object = any> = (params: O) => GetStaticProps<P>;
export type GetStaticPathsCallback<O, P extends ParsedUrlQuery = ParsedUrlQuery> = (params: O) => GetStaticPaths<P>;
export type AppCallback<O, P> = (params: O) => GetInitialAppProps<P>;
export type PageCallback<O, P> = (params: O) => GetInitialPageProps<P>;

// 传递给 enhanceWrapper 的参数信息，因为不同的 ctx 数据类型不一致
export type EnhanceWrapperOptions =
  | { type: "getServerSideProps"; ctx: GetServerSidePropsContext }
  | { type: "getStaticProps"; ctx: GetStaticPropsContext }
  | { type: "getInitialAppProps" | "getInitialPageProps"; ctx: NextPageContext }
  | { type: "getStaticPaths"; ctx: GetStaticPathsContext };

// enhanceWrapper 类型
export type EnhanceWrapper<R> = (options: EnhanceWrapperOptions) => R;

// 重写 createWrapper，让其拥有扩展能力
export const createWrapper = <S extends Store<any, AnyAction>, R>(
  makeStore: MakeStore<S>,
  enhanceWrapper: EnhanceWrapper<R>,
  config?: Config<S>
) => {
  const wrapper = reduxCreateWrapper(makeStore, config);
  function getWrapperEnhanceInfo(options: EnhanceWrapperOptions) {
    return enhanceWrapper(options);
  }
  return {
    ...wrapper,
    // 增强 getServerSideProps
    getServerSideProps: <P extends object = any>(func: GetServerSidePropsCallback<R & { store: S }, P>) => {
      return wrapper.getServerSideProps((store: S) => async (ctx: GetServerSidePropsContext) => {
        return await func({ store, ...getWrapperEnhanceInfo({ type: "getServerSideProps", ctx }) })(ctx);
      });
    },
    // 增强 getStaticProps
    getStaticProps: <P extends object = any>(func: GetStaticPropsCallback<R & { store: S }, P>) => {
      return wrapper.getStaticProps((store) => async (ctx: GetStaticPropsContext) => {
        return await func({ store, ...getWrapperEnhanceInfo({ type: "getStaticProps", ctx }) })(ctx);
      });
    },
    // 增强 getStaticPaths
    getStaticPaths: <P extends ParsedUrlQuery = ParsedUrlQuery>(func: GetStaticPathsCallback<R, P>) => {
      return async (ctx: GetStaticPathsContext) => {
        return await func({ ...getWrapperEnhanceInfo({ type: "getStaticPaths", ctx }) })?.(ctx);
      };
    },
    // 增强 app getStaticProps
    getInitialAppProps: <P extends object = any>(func: AppCallback<R & { store: S }, P>) => {
      return wrapper.getInitialAppProps((store) => async (appCtx: AppContext) => {
        return await func({ store, ...getWrapperEnhanceInfo({ type: "getInitialAppProps", ctx: appCtx.ctx }) })(appCtx);
      });
    },
    // 增强 page getStaticProps
    getInitialPageProps: <P extends object = any>(func: PageCallback<R & { store: S }, P>) => {
      return wrapper.getInitialPageProps((store) => async (ctx: NextPageContext) => {
        return await func({ store, ...getWrapperEnhanceInfo({ type: "getInitialPageProps", ctx: ctx }) })?.(ctx);
      });
    },
  };
};
```

上面已经对 `wrapper` 所有的包裹方法进行了增强，那么我们下面来进行扩展 i18nInfo 等信息。

```ts
// wrapper.ts

import { createWrapper, EnhanceWrapperOptions } from "./createWrapper";

import { createI18nInfo } from "./utils/createI18nInfo";

import { makeStore } from "./store";

// 创建 wrapper，在 createWrapper 内部会进行 store 创建等工作
export const wrapper = createWrapper(makeStore, enhanceWrapper);

// 增强 wrapper，在使用 wrapper 函数时进行注入其他属性
export function enhanceWrapper(options: EnhanceWrapperOptions) {
  const i18nInfo = createI18nInfo(options);
  return {
    i18nInfo,
    // 可以进行应用在服务端需要的其他扩展，扩展以后都可以在 Next.js 中的 fetch data 函数中获取扩展信息
  };
}
```

核心代码的实现和运用代码皆已经过自测，而且也自动支持了扩展熟悉的 `typescript` 类型，如果正在使用 `Next.js` 的小伙伴，也想要使用 `wrapper` 的概念，那就快使用起来！

## 最后

整篇文章的重点就是 `wrapper` , 这是函数式编程的一种运用，我们可以把视线从 `next.js` 中脱离出来，很多地方都可以这样进行运用，把一些复杂逻辑隐藏起来，让我们的业务代码更加简洁。

希望这篇文章能带给大家一些帮助或者启发，创作不易，欢迎点个赞！

如果用到 `Next.js` 的或者想要使用的小伙伴们，也可以收藏下来，发现有问题的欢迎指出。

参考资料：
- [next-redux-wrapper 源码](https://github.com/kirill-konshin/next-redux-wrapper/blob/master/packages/wrapper/src/index.tsx)
