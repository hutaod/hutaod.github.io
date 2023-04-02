# 探索Next.js静态站点框架Nextra的功能和实现原理

> 首发于掘金：[探索Next.js静态站点框架Nextra的功能和实现原理](https://juejin.cn/post/7209578803160825916)

## 前言

`Nextra` 是 `Next.js` 开发成员之一 [`Shu Ding`](https://github.com/shuding) 实现的一个静态网站生成库，让开发者可以使用 `markdown` 来进行编写页面。 `markdown` 现在流行的有两种写法，一种以 `.md` 结尾的模式写法，还有种以 `.mdx` 结尾的扩展写法，也就是可以直接在 `markdown` 文件中引入组件和编写 `jsx` 代码。

其实 `Next.js` 本身已经提供了 `@next/mdx` 插件来让 `Next.js` 工程可以支持使用上面描述的 `markdown` 的两种写法来进行编写页面内容，但不能直接依靠写 `mdx` 就可以生成一个完整的静态网站，于是就出现了 `Nextra`。在我之前写的一篇文章 [《10分钟搭建一个 github page 个人网站》](https://juejin.cn/post/7196277742123319351) 中就使用了 Nextra 来搭建个人网站，个人觉得还挺好用的。

## Nextra 功能梳理

其实 `Nextra` 本身只是 Next.js 的一个扩展插件而已， Next.js 本身的功能包括其社区的插件，只要不互相冲突，那么都是可以和 `Nextra` 一起使用的。

因此 `Nextra` 拥有 Next.js 本身的所有功能，不太清楚 Next.js 功能的可以去 [《Next.js了解篇｜一文带你梳理清楚Next.js的功能》](https://juejin.cn/post/7206261082452639802) 更详细的了解一下，这里针对 `Nextra` 扩展后的功能再梳理了一下。

Next.js 原有功能列表：

1. 完善的工程化机制
2. 良好的开发和构建性能
3. 智能文件路由系统
4. 多种渲染模式来保证页面性能体验
5. 可扩展配置
6. 提供其他多方面性能优化方案
7. 提供性能数据，让开发者更好的分析性能。
8. 提供的其他常用功能或者扩展。

使用 `Nextra` 后， 除了第 3 点和第 4 点有所区别以外，没有其他区别。

针对第 3 点功能，在 `智能文件路由系统` 功能的基础上，Nextra 进行了扩展，可智能识别 `markdown` 文件类型并进行加入到定义的主题菜单列表中。

针对第 4 点功能，`Nextra` 虽然 是为了搭建静态站点，你不需要写 JavaScript 代码就可以编写页面和导航，但如果中间某个页面不需要导航，完全想自定义，你也可以使用 JavaScript 来编写页面 ，也可以使用各种渲染模式，当然如果使用了 `getServerSideProps` 和 `getStaticPaths`，说明需要动态的 `SSR`（服务端渲染） 和 `ISR`（静态增量再生），那么必须使用 Node 服务启动项目，只是影响你项目最终的部署方式。

现在再来整理一下 `Nextra` 新增的功能：

- 让 Next.js 支持使用 `md` 和 `mdx` 写页面：提供了 `mdx` 文件解析器（loader）和扩展 Next.js 页面文件后缀。
- 支持 `Front Matter`：`nextra` 内置了 `Front Matter`，使用 [gray-matter](https://github.com/jonschlinkert/gray-matter) 进行处理，可以用于控制页面的部分信息，具体格式网上有很多相关稳定，可以点击去hexo文档的 [Front Matter](https://hexo.bootcss.com/docs/front-matter.html) 栏看一下，基本一样。
- 支持搜索功能
- 提供了主题模板：[文档主题 nextra-theme-docs](https://nextra.site/docs/docs-theme/start) 、 [博客主题 nextra-theme-blog](https://nextra.site/docs/blog-theme/start)

前三种的功能都比较明确，下面来看一下主题模板的使用和说明

###  Nextra 主题模板的使用和说明

先下载依赖：

```bash
pnpm i next react react-dom nextra nextra-theme-docs
```

接入到 Next.js 工程：

```js
const withNextra = require('nextra')({
    // 主题名称
    theme: 'nextra-theme-docs',
    // 主题配置，指定主题配置文件
    themeConfig: './theme.config.jsx'
})

const nextConfig = {
    // next 本身配置
}

// withNextra 的作用其实就是添加 next 配置。
module.exports = withNextra(nextConfig);
```

`themeConfig` 是用于配置主题的全局内容或样式，用于指定主题配置文件，文件类型可以是 `js｜jsx｜ts｜tsx`，支持热更新，不同的主题有不同的配置。

#### 文档主题 `nextra-theme-docs`

提供了默认的文档模板，并且都是可以在 `themeConfig` 中进行配置，包含了：

- 文档工程全局配置：文档工程地址、SEO、HEAD标签、主题黑暗模式控制和扩展 [主题模式](https://github.com/pacocoursey/next-themes#themeprovider)，主题主色调颜色控制
- 顶部导航栏：Logo、工程链接、聊天地址、搜索功能、Banner广告
- 侧边导航栏：只能设置侧边导航整体功能，比如默认折叠层级、标题组件、侧边栏切换按钮
- 内容：自定义MDX组件、网站书写方向、主要内容的扩展部分（比如用于扩展评论组件）
- 页面内容的目录导航栏配置
- 页尾配置：控制当前浏览器页面的前后页面的导航、页面创建或修改时间
- 页脚配置：文档主题的页面底部内容。
- 主题切换配置：主题切换选项控制
- 错误页面配置：404、500错误页面自定义。

这里更多的一个梳理和翻译，具体配置可去参考 [官方文档](https://nextra.site/docs/docs-theme/theme-configuration)。

顶部导航栏内容（不在这里配置）、

其中侧边导航的默认样式可通过 `themeConfig` 进行配置，扩展了导航的具体列表的 [配置方式](https://nextra.site/docs/docs-theme/page-configuration)：

> 可以读取 mdx 或者 md 文件名称作为菜单名称，如果文件名不是你想要显示的名称，或者导航列表的默认顺序不是你想要的排序，那么也可以在页面目录下使用 `pages/**/*._meta.json` 来配置导航栏上每个页面显示的名称和调整导航列表顺序，当然也可以使用 `Front Matter` 中的 title 修改页面的导航名称，使用 date 调整页面顺序（倒序）。

文档主题已经很稳定了，可以放心使用。

#### 博客主题 `nextra-theme-blog` 

还在建设中，不是很完善，但也可以使用 `Front Matter` ，简单使用可以去参考一下官方提供的一个 [例子](https://github.com/vercel/nextjs-portfolio-starter) ，比较久没有升级了，如果你有兴趣也可以参考一下自己去写一个博客主题也不错。


## Nextra 实现原理探索

Nextra 官方仓库包含了 3 个包：

```tree
./packages
├── nextra 核心库
├── nextra-theme-blog 博客主题
└── nextra-theme-docs 文档主题
```

其中主题库主要是提供了一套 UI 组件，以及提供对样式模板进行配置的方式也就是 `themeConfig` 和给开发者使用的一些组件或 hook。

具体来看一下 `nextra-theme-docs` 的入口文件的 export 内容：

```ts
// packages/nextra-theme-docs/src/index.tsx

// 提供给 Nextra 核心库使用的布局组件
export default function Layout({
  children,
  ...context
}: NextraThemeLayoutProps): ReactElement {
  return (
    <ConfigProvider value={context}>
      <InnerLayout {...context.pageOpts}>{children}</InnerLayout>
    </ConfigProvider>
  )
}

// 提供给开发者使用的hook，用于获取主题的配置信息和页面的FrontMatter信息
export { useConfig, PartialDocsThemeConfig as DocsThemeConfig }
// 提供给开发者使用的hook，就是 @mdx-js/react 中的组件，Nextra 核心库会使用，但并不依赖主题库中的导出。
export { useMDXComponents } from 'nextra/mdx'
// 提供给开发者使用的hook，内部主题色系就是使用的 next-themes
export { useTheme } from 'next-themes'
// 提供给开发者使用的组件，部分组件在布局组件中都有用到，不是提供给 Nextra 核心库
export {
  Bleed,
  Callout,
  Collapse,
  NotFoundPage,
  ServerSideErrorPage,
  Steps,
  Tabs,
  Tab,
  Cards,
  Card,
  FileTree,
  Navbar,
  SkipNavContent,
  SkipNavLink,
  ThemeSwitch
} from './components'
```

可以看到提供给 Nextra 核心库的只有一个默认导出的 `Layout` 组件，在 `Nextra` 的核心实现中将会用到主题库导出的 Layout 组件。

下面我们来看一下 `Nextra` 的入口文件（只留下核心代码）：

```js
// packages/nextra/src/index.js
// 默认页面文件后缀
const DEFAULT_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx']

const nextra = (themeOrNextraConfig, themeConfig) =>
  function withNextra(nextConfig = {}) {
    // 主题文件可通过两个参数传入，或者一个参数传入
    const nextraConfig = {
      ...DEFAULT_CONFIG,
      ...(typeof themeOrNextraConfig === 'string'
        ? { theme: themeOrNextraConfig, themeConfig }
        : themeOrNextraConfig)
    }
    
    // 下面两行是处理多语言的逻辑
    const locales = nextConfig.i18n?.locales || DEFAULT_LOCALES
    const nextraPlugin = new NextraPlugin({ ...nextraConfig, locales })
    
    // 添加 rewrites 来护理 _meta 文件的解析
    const rewrites = async () => {
      const rules = [
        {
          source: '/:path*/_meta',
          destination: '/404'
        }
      ]
      // 兼容外部的 rewrites
      if (nextConfig.rewrites) {
        const originalRewrites = await nextConfig.rewrites()
        if (Array.isArray(originalRewrites)) {
          return [...originalRewrites, ...rules]
        }
        return {
          ...originalRewrites,
          beforeFiles: [...(originalRewrites.beforeFiles || []), ...rules]
        }
      }

      return rules
    }
    
    // 这里即将验证前面说的 nextra 本身就是 Next.js 的一个插件，用于处理 markdown 文件，加载新的文件格式就需要注入新的 loader，这里就是 loader 的配置参数
    const nextraLoaderOptions = {
      ...nextraConfig,
      // ...其他配置省略，不影响主流程
    }
    
    // 返回处理后的 next config 配置
    return {
      ...nextConfig,
      rewrites,
      // 扩展页面文件后缀
      pageExtensions: [
        ...(nextConfig.pageExtensions || DEFAULT_EXTENSIONS),
        ...MARKDOWN_EXTENSIONS // ['md', 'mdx']
      ],
      webpack(config, options) {
        // 此处处理 plugin，现在有多语言plugin和搜索plugin
        if (options.nextRuntime !== 'edge' && options.isServer) {
          config.plugins ||= []
          config.plugins.push(nextraPlugin)
          // 搜索功能实现就于此处有关
          if (nextraConfig.flexsearch) {
            const nextraSearchPlugin = new NextraSearchPlugin({})
            config.plugins.push(nextraSearchPlugin)
          }
        }
        
        config.module.rules.push(
          {
            // 匹配非页面的 Markdown，也就是可以把 Markdown 当成组件使用，但我试了一下会报错
            test: MARKDOWN_EXTENSION_REGEX, // /\.mdx?$/
            issuer: request => !!request || request === null,
            use: [
              options.defaultLoaders.babel,
              {
                loader: 'nextra/loader',
                options: nextraLoaderOptions
              }
            ]
          },
          {
            // 匹配 Markdown 编写的页面
            test: MARKDOWN_EXTENSION_REGEX, // /\.mdx?$/
            issuer: request => request === '',
            use: [
              options.defaultLoaders.babel,
              {
                loader: 'nextra/loader',
                options: {
                  ...nextraLoaderOptions,
                  isPageImport: true // 有这个标志的才会显示 Layout
                }
              }
            ]
          },
          {
            // 匹配 _meta 文件，也就是不仅支持 json ，还支持使用js的方式进行使用，因为 json 不需要 loader，因此这里不匹配 json
            test: /_meta(\.[a-z]{2}-[A-Z]{2})?\.js$/,
            issuer: request => !request,
            use: [
              options.defaultLoaders.babel,
              {
                loader: 'nextra/loader',
                options: {
                  isMetaImport: true
                }
              }
            ]
          }
        )

        return nextConfig.webpack?.(config, options) || config
      }
    }
  }

module.exports = nextra
```

从代码中可以看出，入口文件其实也就做了几件事：

- 添加 webpack plugin 处理多语言和搜索功能
- 扩展页面文件后缀 `mdx/md`
- 添加 webpack loader 解析 `mdx/md`

其中最核心就是 loader 了，下面我们到 `loader` 中去看看到底做了什么（代码太多，这里主要使用注释列出代码逻辑的顺序）。

```ts
// packages/nextra/src/loader.ts

// 全局部分代码有一些编译前的文件检查

// 核心
async function loader(
  context: LoaderContext<LoaderOptions>,
  source: string
): Promise<string> {
  const {
    isMetaImport = false,
    isPageImport = false,
    theme,
    themeConfig,
    locales,
    flexsearch,
    // ...
  } = context.getOptions()

  // 不解析 _meta.js，_meta.js 后面动态解析
  if (isMetaImport) {
    return 'export default () => null'
  }

  // ...省略掉一些文件过滤和文件依赖处理事项
  
  // 这里是最核心的代码编译部分，匹配到的文件都将使用 compileMdx 去进行编译处理，并返回组装页面需要的内容
  const {
    result,
    headings,
    title,
    frontMatter,
    structurizedData,
    searchIndexKey,
    hasJsxInH1,
    readingTime
  } = await compileMdx(
    source,
    {
      mdxOptions: {
        ...mdxOptions,
        jsx: true,
        outputFormat: 'program',
        format: 'detect'
      },
      readingTime: _readingTime,
      defaultShowCopyCode,
      staticImage,
      flexsearch,
      latex,
      codeHighlight,
      route: pageNextRoute,
      locale
    },
    {
      filePath: mdxPath,
      useCachedCompiler: false, // TODO: produce hydration errors or error - Create a new processor first, by calling it: use `processor()` instead of `processor`.
      isPageImport
    }
  )

  // 不是页面级组件，则直接返回, 不需要添加到 layout。
  if (!isPageImport) {
    return result
  }
  
  // 后面的的部分就是使用编译得到的内容，进行拼接成一个编译后的页面级别的 js 代码
  // 其中涉及到了多语言/frontMatter/layout/路由/页面标题等等
}
```

代码太多了，就不全部贴出来讲解，loader 做的事情，整体处理流程大致如下：

1. 编译前置事项：文件过滤和文件依赖处理事项
    1. 过滤掉 `_meta.js`
    2. 过滤掉 `/pages/api/` 下的文件
    3. 页面文件收集
    4. 页面文件路由处理
    5. 本地主题依赖处理
    6. 把前面收集的文件和主题配置文件添加到 webpack context 依赖中
2. 使用 `compileMdx` 编译 markdown 代码：
    1. 使用 `grayMatter` 解析 `Front Matter`
    2. 使用 `github-slugger` 支持结构化内容搜索
    3. 使用 `@mdx-js/mdx` 解析 `.mdx` 或者 `.md` 文件
3. 编译后事项：组装页面内容
    1. 不是页面级组件，则直接返回, 不需要显示 `Layout`
    2. 页面级组件需要处理搜索、路由、文件修改时间戳、布局组件组装等等事项

原理部分就梳理到这里了，我们可以看出 Nextra 并没有使用 `@next/mdx` ，而是自己写了一个 loader 来支持 `markdown`，因为其中涉及到了其他功能的支持，而 `@next/mdx` 是不支持 `Front Matter` 和搜索功能的，`@next/mdx` 源码很简单，感兴趣的可以去看看。

## 总结

之前使用过 `hexo` 以及 `vuepress` 来搭建过博客或者个人网站，它们都是搭建静态站点的一个不错选择，也很多人选择，不过个人还是更喜欢 `Nextra`，可以完全使用 Next.js 的所有功能。

这类型的静态站点实现的功能都很类似，主要的功能就是：

- 基础：完整的工程化能力
- 功能：支持 `markdown` 编写页面，甚至扩展成 `mdx` ，让在页面可以动态插入代码运行，更容易演示代码
- 功能：扩展 `Front Matter`
- 功能：文档内容搜索功能
- 主题：至少实现默认的一套UI样式模板

基础实现起来是最难的，`Nextra` 要不是 Next.js 提供了大部分的功能，实现起来也不容易，功能基本上也都是封装好的现成品，可以直接下载对应的包进行扩展，主题就需要自己开发一整套组件了。

其实本篇文章过程中，不去看源码，很多功能就不清楚是在 Nextra 中实现的还是在主题中实现的，梳理清楚主要源码结果后，可以清晰的知道其中的职责划分，对定位问题也更好的定位，也能学习到很多知识。
