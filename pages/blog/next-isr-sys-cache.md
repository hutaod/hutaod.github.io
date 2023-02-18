# Next.js源码之ISR渲染文件缓存｜FileSystemCache

> [本文也在掘金发布](https://juejin.cn/post/7200027424419266621)

## 前言

这是第一次准备细写 `Next.js` 源码，所以写先叨叨几句。

想要完全弄懂一门开源框架，那么学习源码是必要过程，否则就是知其然不知其所以然。

`Next.js` 使用了也有三年多，但是前几年用的版本比较老，使用的还是源码被篡改过很多的版本，也一直在找借口没去好好弄懂 `Next.js`，虽然对 `Next.js` 源码理解还不那么深，但也偶尔也会看一些源码，寻求在开发中遇到的一些问题和自身的疑问。

`Next.js` 太大了，顶层也不是只有一个大模块，不像 `React` ，因此我不会从整体来读源码，不然容易把自己噎着，也不好下手，反而从具体的某个细节开始，然后慢慢往上去理解更多的源码，这样让自己更容易理解和吸收，这是不是符合一句俗话：`一口吃不成个胖子`。

所以会有很多篇幅很小，可能只介绍一个功能函数或者一个类，这也算是一个学习笔记，但会在合适的机会把一个完整的功能进行整体分析并写成好的文章进行分享。

读源码从来不是一个目的，解决一些实际问题以及增强自己的能力才是目的。

至于为什么先讲 `FileSystemCache` 类，是因为前两天为了搞清楚 ISR 缓存策略，看 `ISR` 缓存过程源码看到了这个类。

## FileSystemCache 类分析

源码位置: `packages/next/src/server/lib/incremental-cache/file-system-cache.ts`

作用：next 实现 `增量静态化` 时，用于缓存系统资源请求的一个类。

说明：

- 缓存算法是一个重点
- 兼容不同目录模式（主要是兼容 `nextConfig.experimental.appDir` 开启 app 目录模式，写了不少代码来兼容），这部分会跳过，兼容代码是最影响阅读代码的。
- `fetchCache` 请求缓存，可通过 `nextConfig.experimental.fetchCache` 设置，默认为 false ，也写了一大堆代码。这部分暂时忽略掉，这个是 nextjs 13 的新功能。（后续开始分析新功能时再说这部分）

我先贴了源码进来，可快速略过：

```tsx
import LRUCache from 'next/dist/compiled/lru-cache'
import path from '../../../shared/lib/isomorphic/path'
import type { CacheHandler, CacheHandlerContext, CacheHandlerValue } from './'

let memoryCache: LRUCache<string, CacheHandlerValue> | undefined

export default class FileSystemCache implements CacheHandler {
  private fs: CacheHandlerContext['fs']
  // 是否刷新磁盘
  private flushToDisk?: CacheHandlerContext['flushToDisk']
  // 服务输出资源路径
  private serverDistDir: CacheHandlerContext['serverDistDir']
  // 是否是 app 目录，next.js 13 新目录方式
  private appDir: boolean

  constructor(ctx: CacheHandlerContext) {
    // 把需要的参数存储到 私有变量
    this.fs = ctx.fs
    this.flushToDisk = ctx.flushToDisk
    this.serverDistDir = ctx.serverDistDir
    this.appDir = !!ctx._appDir

    // maxMemoryCacheSize > 0 时，且 memoryCache 不存在时，初始化 memoryCache
    if (ctx.maxMemoryCacheSize && !memoryCache) {
      memoryCache = new LRUCache({
        // 缓存内存大小
        max: ctx.maxMemoryCacheSize,
        // 用于计算存储长度的函数
        length({ value }) {
          // 针对不同文件类型处理
          if (!value) {
            return 25
          } else if (value.kind === 'REDIRECT') {
            return JSON.stringify(value.props).length
          } else if (value.kind === 'IMAGE') {
            throw new Error('invariant image should not be incremental-cache')
          } else if (value.kind === 'FETCH') {
            return JSON.stringify(value.data || '').length
          }
          // 缓存大小估计：html 字节长度加上 pageData 长度
          return (
            value.html.length + (JSON.stringify(value.pageData)?.length || 0)
          )
        },
      })
    }
  }
  // 获取缓存数据
  public async get(key: string, fetchCache?: boolean) {
    // 从缓存中获取数据
    let data = memoryCache?.get(key)

    // 没有缓存时，检测磁盘中是否有 静态html文件
    if (!data) {
      try {
        // 获取文件路径，fetchCache 现在调用 get方法 时都是 false
        const { filePath, isAppPath } = await this.getFsPath({
          pathname: fetchCache ? key : `${key}.html`,
          fetchCache,
        })
        // 读取缓存数据
        const fileData = await this.fs.readFile(filePath)
        // 读取文件修改时间
        const { mtime } = await this.fs.stat(filePath)

        if (fetchCache) {
          const lastModified = mtime.getTime()
          // 返回内存缓存数据
          data = {
            lastModified,
            value: JSON.parse(fileData),
          }
        } else {
          // app 目录读取页面内容
          const pageData = isAppPath
            ? await this.fs.readFile(
                (
                  await this.getFsPath({ pathname: `${key}.rsc`, appDir: true })
                ).filePath
              )
              // 读取页面对应的.json文件。每个增量生成的静态资源都有这个.json文件，
            : JSON.parse(
                await this.fs.readFile(
                  await (
                    await this.getFsPath({
                      pathname: `${key}.json`,
                      appDir: false,
                    })
                  ).filePath
                )
              )
          data = {
            // 最后修改时间
            lastModified: mtime.getTime(),
            // 页面内容数据
            value: {
              kind: 'PAGE',
              html: fileData,
              pageData,
            },
          }
        }
        // 读取到 data ，存入缓存
        if (data) {
          memoryCache?.set(key, data)
        }
      } catch (_) {
        // 不能从磁盘获取数据
        // unable to get data from disk
      }
    }
    // 读取不到缓存，直接返回 null
    return data || null
  }

  // 设置缓存数据
  public async set(key: string, data: CacheHandlerValue['value']) {
    // 设置缓存
    memoryCache?.set(key, {
      value: data,
      lastModified: Date.now(),
    })
    // 不刷新内容到磁盘直接终止
    if (!this.flushToDisk) return

    // 刷新数据内容到磁盘，data?.kind 这里现在只能获取到 'PAGE' 和 'REDIRECT'
    if (data?.kind === 'PAGE') {
      const isAppPath = typeof data.pageData === 'string'
      const { filePath: htmlPath } = await this.getFsPath({
        pathname: `${key}.html`,
        appDir: isAppPath,
      })
      // 新建目录
      await this.fs.mkdir(path.dirname(htmlPath))
      // 新建 html 文件
      await this.fs.writeFile(htmlPath, data.html)

      // 新建 .json 文件 或者 .rsc 文件（新版本才用rsc）
      await this.fs.writeFile(
        (
          await this.getFsPath({
            pathname: `${key}.${isAppPath ? 'rsc' : 'json'}`,
            appDir: isAppPath,
          })
        ).filePath,
        isAppPath ? data.pageData : JSON.stringify(data.pageData)
      )
    } else if (data?.kind === 'FETCH') {
      // 新版本才进来，当前还不会走到这里来
      const { filePath } = await this.getFsPath({
        pathname: key,
        fetchCache: true,
      })
      await this.fs.mkdir(path.dirname(filePath))
      await this.fs.writeFile(filePath, JSON.stringify(data))
    }
  }

  // 获取需要读取文件的路径
  private async getFsPath({
    pathname,
    appDir,
    fetchCache,
  }: {
    pathname: string
    appDir?: boolean
    fetchCache?: boolean
  }): Promise<{
    filePath: string
    isAppPath: boolean
  }> {
    // fetchCache 为 true时，直接拼接，并返回缓存文件地址
    if (fetchCache) {
      // we store in .next/cache/fetch-cache so it can be persisted
      // across deploys
      return {
        filePath: path.join(
          this.serverDistDir,
          '..',
          'cache',
          'fetch-cache',
          pathname
        ),
        isAppPath: false,
      }
    }
    // 下面是直接读取缓存文件地址
    let isAppPath = false
    // 组装文件路径
    let filePath = path.join(this.serverDistDir, 'pages', pathname)
    if (!this.appDir || appDir === false)
    // 不是 app 目录时
      return {
        filePath,
        isAppPath,
      }
    try {
      // 是 app 目录时，校验文件是否存在
      await this.fs.readFile(filePath)
      // 存在 直接返回
      return {
        filePath,
        isAppPath,
      }
    } catch (err) {
      // 不存在，自己组装返回
      return {
        filePath: path.join(this.serverDistDir, 'app', pathname),
        isAppPath: true,
      }
    }
  }
}
```

`maxMemoryCacheSize` 默认值为 50M ，因此 `memoryCache` 是会默认开启的，需要关闭时，设置 `nextConfig.experimental.isrMemoryCacheSize` 为 `0` 。

内存缓存变量 `memoryCache` 使用的 `LRUCache` 缓存算法，简单介绍一下：

> LRUCache 也是一种缓存算法，LRU 指的是 Least Recently Used，这里就是设置一个缓存内存大小，当超过长度时，删除最近使用最少的缓存对象。

整个 `FileSystemCache` 就三个方法：

- `get` 获取缓存
- `set` 设置缓存，设置上了就
- `getFsPath` 获取缓存资源的文件路径，属于内部私有工具方法。

get 方法注意事项：

- 其实去除兼容代码和试验性的参数 `fetchCache` 后，并没有很复杂的实现
- 读取系统磁盘上的缓存文件后，会缓存到 `memoryCache`，下次获取就会直接读取缓存，而不再读取文件

set 方法注意事项：

- 用于外界写入缓存，请求页面进行增量渲染后，使用此方法进行更新到磁盘缓存。
- 其中参数 `flushToDisk` 默认为 `true` ，也就是默认会写入磁盘，可通过 `nextConfig.experimental.isrFlushToDisk` 配置项设置。

## 总结

`FileSystemCache` 这个类实现功能很简单，但是代码却并不简单，读起来还是要关联 next 上下文代码去阅读才能理解，这样就可以间接的去看更多的源码。

这篇文章算是 `Next.js性能优化之ISR渲染入门和原理探索`(https://juejin.cn/post/7199812069050171452) 的说的缓存方案的一个验证，后续也会再去阅读更多的相关代码，当差不多的时候，再对 整个 `ISR` 原理进行梳理。
