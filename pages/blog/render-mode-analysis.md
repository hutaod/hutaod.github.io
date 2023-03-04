# 前端各种渲染模式性能对比分析｜让页面在3G网速还能1s打开

## 前言

前段时间先后写了两篇关于前端渲染模式的文章：

- [理解前端基础渲染模式｜CSR、SSR、同构、静态化](https://juejin.cn/post/7204085076504920119)
- [Next.js性能优化之ISR渲染入门和原理探索](https://juejin.cn/post/7199812069050171452)

但缺少了一个性能对比分析，于是写了一个测试案例来分析对比各种渲染模式的首屏性能，分析后还会对比各自的优势。

> 感兴趣的小伙伴可以点一下关注，后续会分享更多的关于 Next.js 的文章（了解、运用、原理、实践、通用方案）

## 方案准备

新建了两个项目：

- 单页应用（spa）：使用 `React` 官方脚手架 `CRA` 搭建。项目地址：[test-react](https://github.com/hutaod/test-react18)
- `Next.js` 应用：按照官方脚手架搭建即可。项目地址：[test-next](https://github.com/hutaod/test-next13)

需要对比的首屏渲染方式：

1. `spa` 应用的 `CSR` 渲染，纯 `CSR` 渲染，后续使用 `CSR` 表示。
2. `Next.js` 应用的 `CSR` ，默认静态化 + 部分内容在客户端渲染。
3. `Next.js` 应用的 `SSR` ，纯服务端渲染。
4. `Next.js` 应用的 `SSG` ，纯静态化渲染。

## 页面内容准备

页面内容和样式基本上保持一致，页面数据接口来源于一个 [cnode 社区的开放 api](https://cnodejs.org/api) 

数据请求方案使用 `axios` ，`CSR` 渲染借助 `swr`。不了解 [`swr`](https://github.com/vercel/swr) 的就把它当把请求代理，给它去请求，请求后返回数据，组件再重新渲染，感兴趣的小伙伴可以去了解一下，这里不了解也不影响。

不想看代码，想看分析的可以根据导航点击到性能分析二级导航。

请求方法简单封装：

```js
import axios from "axios";

const apiBase = "https://cnodejs.org/api/v1";

async function fetcher(apiPath) {
  const res = await axios.get(`${apiBase}${apiPath}`);
  return res.data?.data || [];
}
```

### SPA 应用的 CSR 页面代码

```js
import "./App.css";
import useSWR from "swr";
import fetcher from "./fetcher";

function App() {
  const { data, isLoading } = useSWR("/topics", fetcher);
  return (
    <div className="App">
      <h2>测试客户端渲染</h2>
      {isLoading ? (
        "loading"
      ) : (
        <ul>
          {data.map((item) => (
            <li key={item.id}>
              <a href={`https://cnodejs.org/topic/${item.id}`} target="_blank" rel="noreferrer">
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
```

[点击可去查看具体代码](https://github.com/hutaod/test-react18/blob/main/src/App.js)

### Next 应用的 CSR 页面代码

```js
import styles from './list.module.css';
import useSWR from "swr";
import fetcher from "./fetcher";

function App() {
  const { data, isLoading } = useSWR("/topics", fetcher)
  return (
    <div className={styles.container}>
      <h2>测试Next CSR渲染</h2>
      {isLoading ? "loading" : (
        <ul>
          {data.map((item: any) => (
            <li key={item.id}>
              <a href={`https://cnodejs.org/topic/${item.id}`} target="_blank" rel="noreferrer" >{item.title}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
```

[点击可去查看具体代码](https://github.com/hutaod/test-next13/blob/main/src/pages/test/list-csr.tsx)

### Next 应用的 SSR 页面代码

```js
import styles from './list.module.css';
import axios from "axios";
import fetcher from "./fetcher";

function App({ data, errorMsg }) {
  return (
    <div className={styles.container}>
      <h2>测试Next SSR渲染</h2>
      {errorMsg}
      <ul>
        {data?.map((item: any) => (
          <li key={item.id}>
            <a href={`https://cnodejs.org/topic/${item.id}`} target="_blank" rel="noreferrer" >{item.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function getServerSideProps() {
  let data = [];
  let errorMsg = null;
  const timeStart = Date.now();
  try {
    data = await fetcher("/topics")
  } catch (err) {
    errorMsg = `接口请求异常:${JSON.stringify(err)}`;
  }
  return {
    props: {
      data,
      errorMsg,
      apiDurtion: Date.now() - timeStart,
    }
  }
}

export default App;
```

稍微不同的就是 请求内容提取到了 `getServerSideProps` 中，因为是服务端渲染，接口会影响页面渲染时间，因此记录了一下接口时间。

[点击可去查看具体代码](https://github.com/hutaod/test-next13/blob/main/src/pages/test/list-ssr.tsx)

### Next 应用的 SSG 页面代码

代码和SSR类似，只是把 `getServerSideProps` 改成 `getStaticProps`，因此只附上 `getStaticProps` 这部分代码。

```js
// ...其他代码 SSR 类似
export async function getStaticProps() {
  let data = [];
  let errorMsg = null;
  const timeStart = Date.now();
  try {
    data = await fetcher("/topics");
  } catch (err) {
    errorMsg = `接口请求异常:${JSON.stringify(err)}`;
  }
  return {
    props: {
      data,
      errorMsg,
      apiDurtion: Date.now() - timeStart,
    },
  };
}
```

这里记录了接口请求时间，但是在打包代码的时候请求的，因此对页面渲染时间不影响。

[点击可去查看具体代码](https://github.com/hutaod/test-next13/blob/main/src/pages/test/list-ssg.tsx)

## 性能分析

配置：

- 电脑：macbook pro 2019 16G
- 浏览器：Chrome 隐身模式
- 网速/CPU/缓存条件：Fast 3G / 4x slowdown / 禁用缓存
- 测试方法：Performance insights （注意这个工具的中间部分渲染流程图上并没有完整的白屏时间，但右侧的统计的性能数据是算上的，可以自己去使用 Performance 面板验证一下，或者查看 Network 面板看一下 html 文档的响应时间）

网速调成了 3G 快速模式是为了更好的观察性能，网速太快了页面内容太小时，数据差别不那么明显。

> 注意：不同设备或者所处网络也有可能网速不太一样，再加上网络一般都会有一些波动，就像打游戏突然 460 延迟一样，因此实际上除了本地测试性能，还需要进行一些监控上报。

下面记录的结果都是经过多次测试，然后取中间值，实际上结果基本上相差较小，除了SSR，至于为何，后面再说。

### 单页应用 CSR 性能分析

![WeChatWorkScreenshot_d4e4bf80-1469-4b60-9ba7-23f0e44e0a81.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e02a99514b3c4a839e3a218a09dceb1f~tplv-k3u1fbpfcp-watermark.image?)

- FCP（首次内容绘制）: 1.89s 
- LCP（最大内容绘制）: 2.98s 

FCP 时间长的原因是因为要等 JS 下载完，执行过程中去渲染页面，LCP 与 FCP 跨度大的原因是渲染页面后，还有剩余的 JS 在继续执行，且客户端请求接口也需要等待响应后再进行渲染页面内容。

测试地址（外网地址，可能访问不了，因为vercel的机制，长时间不访问的时候，服务会自动停止，再次访问才重新启动，因此首次访问可能要等很久）：https://test-react18.vercel.app/

### Next.js 应用 CSR 性能分析

![WeChatWorkScreenshot_969510b5-8889-40d4-8769-5f3039815de8.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d0f20066e9dd409fb04c5dd34c922113~tplv-k3u1fbpfcp-watermark.image?)

- FCP（首次内容绘制）: 1.19s 
- LCP（最大内容绘制）: 2.92s 

FCP 明显短了很多，因为 html 下载完就直接进行渲染页面内容了，不需要等待 JS 下载，LCP 与 FCP 跨度比 纯 CSR 更大的原因是渲染页面后，才开始下载 JS，然后再 hydrate， 然后 JS 继续执行，后续和纯 CSR 流程一样，需要等待接口返回再渲染主要内容。

测试地址（外网地址，可能访问不了，因为vercel的机制，长时间不访问的时候，服务会自动停止，再次访问才重新启动，因此首次访问可能要等很久）：https://test-next13-alpha.vercel.app/test/list-csr


### Next.js 应用 SSR 性能分析

![WeChatWorkScreenshot_047432a1-78e4-41b7-b359-84c579e1bd4d.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a51144b7b1914d64bd20012bc546083a~tplv-k3u1fbpfcp-watermark.image?)

- FCP（首次内容绘制）: 2.61s 
- LCP（最大内容绘制）: 2.61s 

FCP 和 LCP 时间一样，但是都比较长，长的原因主要是因为接口请求时间长，下面来看一下服务端接口请求时间（前面代码中有写到）：

![WeChatWorkScreenshot_ad564799-3294-4389-bc09-fcd46f14c57a.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bd8529fa96b6444ab75e6fa0deb7f69a~tplv-k3u1fbpfcp-watermark.image?)

接口请求就耗费了 1s 时间，因此时间上服务端渲染的 FCP 和 LCP 应该在 1.61s ，当然肯定需要请求接口的，因此需要注意，如果是请求的外网接口，那么尽量不要用服务端渲染，影响性能，内网接口一般就很快，大部分接口时间可以在几十毫秒以下。

测试地址：https://test-next13-alpha.vercel.app/test/list-ssr


### Next.js 应用 SSG 性能分析


![WeChatWorkScreenshot_4a8a154b-2cc5-4d5e-bcbb-2c224d527ac6.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/077da8c4edbc4268b935639ab5e95177~tplv-k3u1fbpfcp-watermark.image?)

- FCP（首次内容绘制）: 1.32s 
- LCP（最大内容绘制）: 1.32s 

FCP 和 LCP 时间一样，且都比较长，因为没有接口请求，内容在打包的时候就已经获取了。

测试地址：https://test-next13-alpha.vercel.app/test/list-ssg


## 总结

本篇文章对四种渲染模式都进行了一个测试验证和分析，最后汇总了一个表：

渲染模式        | FCP   | LCP   | 对比分析或注意事项                                                                   |
| ----------- | ----- | ----- | ---------------------------------------------------------------------- |
| 纯 CSR       | 1.89s | 2.98s | FP时间其实很快，但是都是白屏，这也是常常说单页应用白屏时间长的原因。                                    |
| Next.js CSR | 1.19s | 2.92s | FCP比完全SSG快，但LCP可能受到影响，但如果首屏依赖接口数据比较低的情况，是一个不错的选择                       |
| Next.js SSR | 2.61s | 2.61s | 如果是请求的外网接口，那么尽量不要用服务端渲染，影响性能，内网接口一般就很快，大部分接口时间可以在几十毫秒以下。但对服务器会造成一定的压力。 |
| Next.js SSG | 1.32s | 1.32s | 页面在打包时生成，接口请求不能依赖客户端状态

注意测试的时候网速是 Fast 3G，国内现在 5G 都很普遍了，因此除了 SSR 模式受到了接口影响，Next.js SSG 和 Next.js CSR 的 FCP 都在 100ms ~ 300ms，SSG 的 LCP 和 FCP 是一样的，纯 CSR 也会快很多。

还有一些注意事项：

> 页面 html 内容越多，FP 和 FCP 会越慢，但是相比 JS 的体积逐渐变大的影响，还是会小一些，不过 JS 可以强缓存，第二次访问会快很多，但 `JS 解析时间` 注定也是影响性能的重要因素，这个与资源缓存无关。而 html 不能缓存，否则就更新不了（有一些新的模式可能可以更新，这个本文不去探索），因此具体性能情况还是要去多分析。

单个渲染注定很难解决所有问题，因此一般会同时使用多个渲染模式，建议选择渲染模式时优先选择 Next.js SSG ，当然还是根据具体情况来选择。
