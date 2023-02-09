# 搭建一个 github page 个人网站

最近 `又` 重新搭建自己的个人技术网站了，其实之前搭建过好几次，但是每次自己都不太满意，然后 `又` 没怎么去维护，于是最终都废弃了。

其实搭建 github page 过程很简单，不用因为框架原因而退怯。没有使用过 React 或者 next 的也可以很快搭建。也可以选择其他框架搭建，整个流程其实都是类似的。

看完后估计十分钟内就能自己弄好自己的 github page，如果对你有用，可以点个赞或者收藏一下！

## 搭建个人网站经历

先来说一下搭建个人网站简单经历。

2016年到2019年，一直使用的是阿里云 `共享虚拟主机` ，就存放了个人简历网站、和一些自己写的项目或 demo 等等，都是静态的网站，然后也使用 hexo 搭建了个人博客网站，发到了 github page 上，但是一直没去怎么更新内容，现在看起来简直一团糟。

18年1024程序员节的时候，购买了3年的云服务器ECS，主要把个人学习笔记文档网站放在了上面，然后写了一个 webhooks 接口 ，让提交到 github 仓库 master 分支的时候可以让服务器自动拉取代码并部署到线上。

22年还再去购买了3年的云服务器ECS，买来后主要是用来学习用的，网站也就部署了一个简单的网站（还是做来给女朋友作为七夕礼物之一的😄），偶尔会用到，用的不多，但不知道为何，有自己的服务器就是觉得有安全感一些。

## 框架选择

个人网站从最开始使用原始的开发方式， 然后使用 hexo 、`vitePress` 等站点生成框架，用的框架越来越好用，但是却一直不合我意。

近几年的主要技术栈是 React ， Next.js 也是我用的主要应用级框架，因此这次选择 [`nextra`](https://nextra.site) , 里面的功能对于写技术文章来说也很方便，扩展性也很强。

我选择它的原因主要有以下几点：

- 可靠性：基于 `Next.js` ，且作者也是 `vercel` 组织的开发人员，也是 `Next.js` 开发人员。
- 功能完善：`Next.js` 的所有功能都支持，支持自定义页面全部样式，也支持 markdown 和 mdx 格式的文档编写，mdx 还可以直接引入组件进行展示效果等等功能。
- 扩展性好：可以自己新增其他 `React` 第三方库来进行扩展功能。

使用 `nextra` 这段时间，用着还是挺满意的，因此也推荐给大家。

## 创建站点项目

首先在 github 新建仓库，这里我们创建一个文档项目。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/95eee0093cc941438515d9b86257f45c~tplv-k3u1fbpfcp-watermark.image?)

名称必须是 `<user>.github.io`，然后勾选上 `新增 README` 选项，.gitignore 选择 Node 即可。

然后把仓库 clone 到本地，并使用 vscode 打开项目。

我选择的包管理器是 `pnpm` ，如果还不了解他的可以看一下它的[文档](https://pnpm.io/zh/motivation)。

下面我们开始搭建项目。

一、安装相关依赖，`nextra` 默认提供了两种主题，选择其一即可。

```bash
// 安装文档站点相关依赖
pnpm i next react react-dom nextra nextra-theme-docs
// 安装博客站点相关依赖
pnpm i next react react-dom nextra nextra-theme-blog
```

二、在根目录创建 `next.config.js` 文件，写入以下配置：

```jsx
// next.config.js
const withNextra = require('nextra')({
    // 主题包名
    theme: 'nextra-theme-docs',
    // 主题配置文件
    themeConfig: './theme.config.tsx',
    // 给文档中的代码块添加 copy 能力
    defaultShowCopyCode: true,
    // 支持 latex
    latex: true,
    // 支持静态图片
    staticImage: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    // next 工程本身配置内容
    reactStrictMode: true,
}

module.exports = withNextra(nextConfig)
```

三、创建主题配置文件：

```tsx
// theme.config.tsx
import type { DocsThemeConfig} from 'nextra-theme-docs';
import { useRouter } from 'next/router'

const config: DocsThemeConfig = {
  project: {
    // 右上角 Github icon 点击跳转信息
    link: 'https://github.com/hutaod'
  },
  // 文档仓库链接
  docsRepositoryBase: 'https://github.com/hutaod/hutaod.github.io',
  useNextSeoProps() {
    const { asPath } = useRouter()
    if (asPath !== '/') {
      return {
        // 设置浏览器标题
        titleTemplate: '%s – 前端博客和笔记'
      }
    }
  },
  // 发现文档错误时，可点击直接去 GitHub 编辑内容
  editLink: {
    text: 'Edit this page on GitHub →'
  },
  // 问题反馈配置，可以自动跳转到 github issue
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback'
  },
  // 页面底部版权信息
  footer: {
    text: `MIT 2023 © Hutao.`
  }
}

export default config
```

四、编写第一个文档页面，新建 `pages/index.mdx`，写入以下内容：

```tsx
# Welcome to Nextra

Hello, world!
```

五、编写 `scripts` 命令

```tsx
{
  "scripts": {
    "dev": "next dev",
    "build": "next build && next export"
  }
}
```

六、本地启动：

```bash
pnpm dev
```

默认工程并没有支持 typescript ，但启动时 ，next 会自己创建 tsconfig 并下载 `typescript` 依赖包。

打开后可以看到这样一个页面：
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7fe6187d481f4969ad42a6ba612c47cd~tplv-k3u1fbpfcp-watermark.image?)

## 部署

工程搭建完毕，我们把代码推送到 github 后，在 github 上打开 settings ，具体操作如图所示 ：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/faaf4a69c44b4a66818a49bc76e71a75~tplv-k3u1fbpfcp-watermark.image?)

点击 Configure 后，如果包管理器使用的是 npm，直接点击提交：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8cc9c7dda50445fc8648413179711f03~tplv-k3u1fbpfcp-watermark.image?)

如果包管理器使用的是 pnpm ，那么改一下配置再点击提交（注意，减号时需要新增的内容，因为我已经写好了，所以为了对比才还原为默认配置的）：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1f3b56e7dcd54e63b1b12497b23be520~tplv-k3u1fbpfcp-watermark.image?)

具体代码可以直接去复制： [nextjs.yml](https://github.com/hutaod/hutaod.github.io/blob/main/.github/workflows/nextjs.yml)

然后再打开 acition 查看部署状态，一般首次部署可能时间会长一些。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7f0d9abd3287433fb95c002bce614f74~tplv-k3u1fbpfcp-watermark.image?)

如果发布上去后发现之前删除的内容还存在，注意清除缓存（点击进入图中caches页面即可进行清除）。

然后打开的 `<user>.github.io` 网页，即可查看发布上去的网站。

## 结语

这是一篇很基础的教程，希望对只是想要搭建个人文档网站的伙伴们有所帮助。

还有就是如果只是想要搭建这种网站，就没必要去购买啥云服务器，一般来说很可能被闲置。