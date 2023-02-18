# Next.js性能优化之ISR渲染入门和原理探索

> [本文也在掘金发布](https://juejin.cn/post/7199812069050171452)

## 前言

术语说明：

- `SSR` —— 服务端渲染
- `SSG` —— 静态生成
- `ISR` —— 增量静态化
- `Date Fetch` 函数 —— 本文特指服务端数据获取的几种函数 `getStaticProps` 、 `getServerSideProps` 、 `getInitialProps` 、 `getStaticPaths` 。

`Next.js` 中最突出的莫过于它的渲染模式，之前写过一篇文章 [《Next.js之前端渲染模式》](https://juejin.cn/post/7160279477690466335) 中分别介绍和对比了几种渲染模式的优劣势，而且其中的 `ISR` 在大部分的业务页面中能起到很关键性的性能优化作用。

最近在使用 `ISR` 功能的时候遇到了一些问题，本篇文章将分享如何更好的去使用 `ISR`，以及在使用的过程中可能会遇到的一些问题和解决方法，其中会涉及到一些原理的探索。

## 为何要使用 `ISR` ？

先分享一下为何要使用 `ISR` ，可能有人还不是很理解这个 `ISR` 是什么。

Next.JS 项目打包时，使用 `getStaticProps` 或者不使用 `Date Fetch` 函数的页面会默认 [`静态化`](https://nextjs.org/docs/basic-features/pages#static-generation) ，也就是会生成`[pageName].html` 的 html 文件，用户访问就后 Next 服务直接读取此 html 文件，不再去动态渲染内容，也就减少了接口的请求，因此，相比 `SSR` 渲染模式，能极大的减少页面访问时间（大部分页面在正常网速能控制在 1s 内显示）和降低服务器的压力。

使用 `getStaticProps` 的静态化页面会导致了一个问题，接口内容更新后，用户访问页面获取到的信息并不会更新，因此需要一种可以在服务运行中动态去触发 SSG 生成的 html 的能力，于是就出现了 `ISR`，让 `SSG` 也能拥有增量更新的能力。

## 使用和功能验证

增量静态化一般有两种使用方式：`定时更新` 和 `指令更新`。

写了一个 [demo](https://github.com/hutaod/test-next13) 工程，可以去自己 clone 下来尝试，下面会也会详细介绍demo实现的主要过程和用里面的 3 个 demo 示例的运行结果来检验一些理论。

### ISR —— 定时更新

新建页面：

```tsx
// src/pages/isr/demo1/index.js
const Demo1 = ({ times }) => {
  return (
    <div>
      <h2>定时刷新</h2>
      <div>刷新次数：{times}</div>
    </div>
  )
}

let times = 0;

export async function getStaticProps() {
  times += 1
  console.log(times)
  return {
    props: {
      times,
    },
    revalidate: 10, // 10秒后访问触发更新
  }
}
```

开发环境 `静态化` 表现和 `ssr` 一样，因此，需要需要打包后运行才能看出效果，运行 build 命令：

```bash
# 构建打包
pnpm build
```

构建过程中会打印 `1` 这时候可以看一下构建产物：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9edaf95ae3994242a9e07368932f22c6~tplv-k3u1fbpfcp-watermark.image?)

构建产物 `.next/server/pages/isr` 目录下已经生成了一个 demo1 的 html 文件，注意这时候 `times` 为 `1` 。

`pnpm start` 启动工程后访问[demo1页面](页面)：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/301aa8b523d8469ba9f7bac6f934c6a4~tplv-k3u1fbpfcp-watermark.image?)

vscode 的控制台打印输出为`1`（build 和 start 都会重新初始化 times），这时候会触发构建;

构建完成之后，再次访问会发现跟首次访问一样的，上面显示的刷新次数还是 `1` ，但是 vscode 的控制台印输出为`2` ，这是因为访问的时候是去构建新的页面，仍然返回上一次构建成功的页面内容，并不会返回当前正在构建的内容。以后每次访问时，控制台打印的数字都会比正在显示的大。

上面的这种现象也能说明官方文档上阐述的一个结论：

> When a request is made to a page that was pre-rendered at build time, it will initially show the cached page 当发出请求让页面进行构建时，它会先返回缓存页面。

### ISR —— 指令更新

我们新建一个 `demo2` 页面，复制 `demo1` 即可，然后去除 `getStaticProps` 函数返回的 `revalidate` 字段：

```tsx
// src/pages/isr/demo2/index.js
export async function getStaticProps() {
  times += 1
  console.log(times)
  return {
    props: {
      times,
    }
  }
}
```

新增一个触发页面更新的接口指令：

```tsx
// src/pages/api/revalidate.js
export default async function revalidateHandler(req, res) {
  // 指令密钥校验
  if (req.query.secret !== MY_SECRET_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' })
  }

  try {
    // 更新 demo2
    await res.revalidate('/isr/demo2')
    // 返回说明更新指令已发出，并不能说明一定更新成功
    return res.json({ revalidated: true })
  } catch (err) {
    // 更新失败
    return res.status(500).send('Error revalidating')
  }
}
```

运行 `pnpm build && pnpm start` ，访问 `demo2` 页面
不管访问多少次，`getStaticProps` 都不会触发，页面上都显示刷新次数为 `1` ：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7b77327c3bf24d2ba3640517b6bc0180~tplv-k3u1fbpfcp-watermark.image?)

然后访问 `http://localhost:3000/api/revalidate?secret=MY_SECRET_TOKEN`，访问后，电脑控制台会打印2，但如果立马快速去访问页面，页面上显示刷新次数还会是 `1` ，因为构建还是需要一定的时间，稍微等一下再去访问就成了 `2`，一般时间在一两秒以上。

[demo](https://github.com/hutaod/test-next13) 工程我部署到了 vercel，可以点击 [页面](https://test-next13-alpha.vercel.app/isr/demo2) 和 [指令](https://test-next13-alpha.vercel.app/api/revalidate?secret=MY_SECRET_TOKEN) 直接去验证，不过因为是外网，有可能访问不了。

### ISR —— 动态路由

上面的两个案例只是一个单页面，如果是动态路由页面，那么也可以添加 `getStaticPaths` 来实现。

demo3 在 demo2 的基础上，修改了一下文件名命名方式，`demo3/index.js` 改成 `demo3/[id].js`，内容新增 `getStaticPaths` 内容：

```
export async function getStaticPaths() {
  // 从接口获取文章列表，使用的时候不用本站的接口，这样在打包的时候会出错。
  const res = await fetch('http://localhost:3000/api/posts/list')
  const posts = await res.json()

  // 处理成 getStaticPaths 需要的返回参数
  const paths = posts.map((post: any) => ({
    params: { id: post.id },
  }))
  
  return { paths, fallback: 'blocking' }
}
```

对应的修改一下页面内容：

```tsx
const Demo3 = ({ name, content }) => {
  return (
    <div>
      <h2>{name}</h2>
      <div dangerouslySetInnerHTML={{ __html: content }}></div>
    </div>
  )
}

export async function getStaticProps(ctx) {
  // 获取详情
  const res = await fetch(`http://localhost:3000/api/posts/detail?id=${ctx.params?.id}`);
  const detail = await res.json()
  return {
    props: {
      ...detail
    }
  }
}
```

在 `src/pages/api/posts` 目录下编写了两个简单的测试接口，这个可以直接去代码里面看，也可以忽略，并不影响。

下面新增动态指令：

```ts
// src/pages/api/revalidate/[id].js
export default async function revalidateHandler(req, res) {
  const { id } = req.query
  // ...省略

  try {
    // 更新 demo3
    await res.revalidate(`/isr/demo3/${id}`)
    // 返回说明更新指令已发出，并不能说明一定更新成功
    return res.json({ revalidated: true })
  } catch (err) {
    // 更新失败
    return res.status(500).send('Error revalidating')
  }
}
```

使用 `getStaticPaths` 来获取需要动态生成的页面时，大部分场景可能不需要使用接口请求获取列表，且不能请求本工程定义的 api 接口，因为只会在构建过程中执行，使用本工程的 api 会报错，而且这里请求接口，如果需要生成的页面过多，会导致构建很慢，一般直接返回 `{ paths: [], fallback: 'blocking' }` 即可，这样在页面 `首次访问`（首个访问页面的用户进行首次访问时会比较慢） 或者被下发 `revalidate指令` 时就可以生成页面内容。可以打开 [demo3](https://test-next13-alpha.vercel.app/isr/demo3/333)，或者本地打开 http://localhost:3000/isr/demo3/[id] 试一下，把 `[id]` 替换成什么数字都可以。

注意事项：

- 动态路由主要需要注意 [`fallback`](https://nextjs.org/docs/api-reference/data-fetching/get-static-paths#fallback-false) ，默认为 false ，这时任何未使用 `paths` 字段返回的路径都将会显示 404 页面，`blocking` 则允许传入其他动态路由参数，一般使用 `blocking` 。
- 构建指令并不一定需要动态指令，也可以全部页面共用一个 `revalidateHandler` ，使用 query 参数来控制，根据具体情况使用即可，但必须注意安全性问题。


## 部署遇到的问题和解决方法

现在主要遇到多进程的疑惑和多服务器负载均衡的问题，后续有更多问题会更新到本篇文章，欢迎大家关注➕点赞👍➕收藏

### 多进程负载均衡的疑惑

部署到线上是使用 pm2 `cluster` 模式启动，因此会启动多个进程，然后就考虑到了一个问题：

> next 服务启动后，每次访问页面，到了 server 端都是只会被分发到一个进程去处理，首次访问就会动态生成一页面的 html 文件，那么第二次访问进入到了第二个进程，这里是不是会读取磁盘内的 html 内容呢？

答案是否定的，经过我多次测试验证，再加上阅读了对应的相关源码，然后得出了一个结论：

> `ISR` 生成 html 文件后，默认并不会读取它，因为写入磁盘之前，存入到了内存中，也就是加了一个变量进行缓存 html 字符串。

如果这时候去手动改动 `html` 文件，会验证上面这个结论。

而 `next` 多进程这里的处理方式也很有意思，每次访问新的进程，都会重新去生成一次 `html` 文件，但是当次的访问请求会返回旧的缓存页面，如果没有旧的内容才返回新的内容。每个进程生成页面后都会被记录，下次访问不再重现生成。

### 多服务器负载均衡怎么处理

前面得出 `next` 服务启动后，不会再读取磁盘的 `html` 内容，也就是如果是多台服务器，那怎么处理呢？

于是就有了这样一个bug：

> 每台服务器都是独立的，磁盘上生成的 `html` 会可能不一样，server 内存中缓存的 `html` 也可能不一样。那么可能多次访问，用户显示的结果却可能不一样。

于是想到了两种解决方法：

- 对页面的 `更新指令` 进行多服务器下发，因为更新指令一般频率比较少，因此不会造成性能上的问题，但是这种只能处理 `指令更新` 的情况
- 共享磁盘➕禁用内存缓存：next 提供了配置参数来禁用 `ISR` 缓存，这种方法可以处理各种情况，但是性能稍微有一点点影响，但影响并不大，每个 html 内容也不会太大

更推荐第二种方式，禁用缓存的方法：

```js
module.exports = {
  experimental: {
    // 默认最大缓存限制为 50MB
    isrMemoryCacheSize: 0,
  },
}
```

也可以看一下[官方文档说明](https://nextjs.org/docs/basic-features/data-fetching/incremental-static-regeneration#self-hosting-isr)

## 总结

本文从 `ISR` 介绍、使用、遇到的问题 三个方面来分析 `增量静态化` ，其中也涉及到了一些原理分析以及需要注意的事项，如果有不清楚欢迎评论区讨论。

下面再总结一下使用 `增量静态化` 的一些问题和注意事项：

1. 如果直接修改了静态化 `html` 的内容，那么访问的时候页面会先显示修改后的内容，但 next 会进行检测页面内容是否正确，不正确会刷新页面内容，但不会纠正磁盘内的 `html` 文件。
2. 如果修改了 `ISR` 的静态化 `html` 的内容，那么首次访问时，也会出现上面那个刷新页面现象，这时会生成新的 `html` 还会纠正磁盘内的 `html` 文件，但是再次去修改 `html` 时，不会出现刷新页面现象，但如果访问的是还未访问的新进程，会纠正磁盘内的 `html` 文件，如果是不是首次访问时，就永远不会纠正
3. 第 2 种情况，如果禁用 `ISR` 缓存的话，每个进程的首次会纠正磁盘内的 `html` 文件，如果是不是首次访问时，就永远不会纠正。但还是会刷新页面内容。
4. 不管是定时还是指令方式，当发出请求让页面进行构建时，它都会先返回缓存页面。
5. `fallback` 更建议设置为 `blocking` ，防止构建时间过长。
6. `pm2` 多进程启动项目不用担心每个进程返回结果不一样，`next` 内部已经进行处理
7. 多服务器负载时，建议使用 `共享磁盘➕禁用内存缓存` 会更好。
