# Next.js自定义Server的问题

## 前言

`Next.js` 本身提供的 server 其实基本上已经够用了，`官方文档上` 也极其不推荐去自定义 Server，并说明了自定义Server 将删除重要的性能优化，例如 `无服务器功能` 和 [自动静态优化](https://nextjs.org/docs/advanced-features/automatic-static-optimization)功能。

虽然不推荐去自定义 Server，如果我们真的需要的时候也可以去了解一下怎么才能更好的自定义 Server 。

本文就利用 给 next.config.js 扩展 port 参数来实现自定义 server

## 实现

我们对[官方的例子](https://nextjs.org/docs/advanced-features/custom-server)进行一个简单的改造。

```js
import loadConfig from "next/dist/server/config";
import constants from "next/dist/shared/lib/constants";

const { createServer } = require("http");
const { parse } = require("url");

const next = require("next");

async function startServer() {
  // 获取命令执行目录
  const dir = process.cwd();
  // 环境获取
  const dev = process.env.NODE_ENV !== "production";

  // 使用 next 的内部方法，读取配置文件。不要尝试直接 require 配置文件，官方提供的 loadConfig 函数可以获取到默认配置，这样保证读取到的内容和next启动时内部读取的内容一致。
  const nextConfig = await loadConfig(
    dev ? constants.PHASE_DEVELOPMENT_SERVER : constants.PHASE_PRODUCTION_SERVER,
    dir
  );
  const { serverRuntimeConfig, basePath } = nextConfig;

  const hostname = "localhost";
  const port = serverRuntimeConfig?.server.port || 3000;
  // when using middleware `hostname` and `port` must be provided below
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}${basePath}`);
    });
  });
}

startServer();
```

上面代码中对官方的示例代码只做了两件事，`去除无用代码`和 `新增了配置读取功能`。配置读取功能也是使用 `next` 自己内部函数 `loadConfig` 去完成的。

这里顺便完成了前一篇文章[扩展 `next.config.js` 配置项](https://juejin.cn/post/7197053918572412989) 中的自定义 `端口` 配置功能：

```js
// next.config.js
const nextConfig = withConfig({
    server: {
        port: 3333
    }
})

module.exports = nextConfig;
```

前面官方说的 `无服务器功能` 其实也就是 `next export` 功能，不过 `next export` 本身就不需要 server，如果项目中页面都没有使用到 `getServerSideProps` 、 `getInitialProps` 、 `ISG` 或者动态路由，那么才能是使用 `next export` 功能，因此，我觉得并没有啥影响。

官方说的另外一个问题，会影响 [自动静态优化](https://nextjs.org/docs/advanced-features/automatic-static-optimization) 。我尝试了使用自定义 `server` 打包，结果并没有出现 `影响自动静态优化` 的结果。

至于其他的影响的地方，我也暂时还没有遇到过，后面有遇到再同步到此篇文章。


## 总结

总结一下 可以自定义 server 场景：

1. 不需要 export 的场景
2. `next.js` 集成路由器不能满足情况时（如果 `next.js` 的 `middleware` 功能可以实现就不需要自定义server，不过 `middleware` 会让工程不能 `export`）
3. 需要在启动 `node.js` 服务的时候进行性能监控时

其他基本上大多可以使用 `next.js` 提供的 [middleware](https://nextjs.org/docs/advanced-features/middleware) 功能去实现。