# 使用 Turborepo 搭建一个自动化发布的React组件库｜记录踩坑事项
## 前言

本篇文章将用于记录搭建组件库的整个过程，以及记录我的踩坑事项。

- 为什么要使用 Turborepo 来搭建组件库？
- 组件库功能介绍
- 初始化组件工程
- 发布 npm 包
- 总结

## 为什么要使用 Turborepo 来搭建组件库？

Turborepo 于 2021 年 12 月出世，是一个针对 JavaScript 和 TypeScript 代码库优化的智能 `构建系统`。它倡导使用 monorepo 的方式来管理你的工程，具体介绍可以去看看[官方文档](https://turbo.build/repo)，官方文档上很详细，社区上也可以不少关于介绍它的文章。

Turborepo 其中提供了一个创建组件库的[模板工程](https://github.com/vercel/turbo/tree/main/examples/design-system)，本篇文章主要就讲解用这个模板工程来创建自己的组件库的过程，模板工程的 Readme 上也有使用说明，不过不是很完善，很多没有说清楚，会踩不少坑。

至于为何要使用 monorepo 的模式来管理组件库，主要是为了以后更好拆分内容，又能使用公共代码，比如说 PC 和 Mobile 的组件需要区分，公共的工具方法也可以在组件之间共用，其实核心就是简化代码、更有效的管理代码。

## 组件库功能介绍

模版本身就提供了以下功能：

- 构建管理工具：`Turborepo`
- 支持组件库类型：`React`
- 支持 `TypeScript` : 使用 [Tsup](https://github.com/egoist/tsup) 来进行编译
- 组件文档方案：`Storybook`
- `Eslint` 代码检查
- `Prettier` 代码格式化
- `Changesets` 管理版本控制和版本日志
- 使用 `Github Actions` 自动发包

后续再补充添加测试工具 和 commit 规范的过程。

## 初始化组件工程

直接使用以下命令克隆模板，然后进入新建的目录，并使用 vscode 打开工程

```bash
npx degit vercel/turbo/examples/design-system 你的仓库名称
cd 你的仓库名称
code .
```

打开 vscode 后全局替换掉 `acme` 字段，我使用的是 `cushily`，这个需要唯一，可以去 [npm](https://www.npmjs.com/org/create) 新建一个组织。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c85720b589ad4d8f82e2cdffd3b75aef~tplv-k3u1fbpfcp-watermark.image?)

并且修改 `packages/*` 文件加上的 `acme` 字段

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fd9bd102dbc3470eadecc32de1d36d81~tplv-k3u1fbpfcp-watermark.image?)

再进行安装依赖和初始化 git

```bash
pnpm install
git init . && git add . && git commit -m "Init"
```

然后在 github 新建仓库，再使用 remote 命令关联你的仓库即可

```bash
git remote add origin git@github.com:用户名/仓库名.git
```

然后运行 `pnpm dev` ，就可以开始进行组件开发了，也会自动打开 storybook 页面，当你修改组件时，将会自动更新。

storybook 页面如下：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d42859d522c4450990d979fb0bcba2f4~tplv-k3u1fbpfcp-watermark.image?)

storybook 既可以用于自测组件，又可以编写组件文档，还是挺好用的。

目录结构说明：

```tree
.
├── .changeset 管理版本控制和版本日志
│   ├── README.md
│   └── config.json
├── .eslintrc.js
├── .github 已默认添加了 Github Actions 配置
│   └── workflows
├── .gitignore
├── .npmrc
├── apps
│   └── docs 组件文档，接入了storybook
├── meta.json 这个没看到有啥用，可以不用管
├── package.json
├── packages
│   ├── cushily-core UI组件库
│   ├── cushily-tsconfig ts配置
│   ├── cushily-utils 工具库
│   └── eslint-config-cushily eslint配置
├── pnpm-lock.yaml
├── pnpm-workspace.yaml 配置包目录
└── turbo.json turbo 配置文件
```

## 发布 npm 包

### 修改包管理工具

前面步骤完成后，我们就可以把工程给推送到 `Github` 上了，这时候会自动触发 `Github Actions`，不过这时候会报错，依赖安装失败

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/57164122755648e580f3075649633b3e~tplv-k3u1fbpfcp-watermark.image?)

我们看一下 Github Actions 配置

<img width="360" src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/514fd5ba006b4a8dae621159684c591c~tplv-k3u1fbpfcp-watermark.image?" />

配置中使用的是 yarn 安装依赖，我们本地使用的是 pnpm ，改成 pnpm 即可（不清楚是不是 Turborepo 都使用的 pnpm，没有去测试 yarn）

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2ca0a3cda0954f3f93ff525882de31e5~tplv-k3u1fbpfcp-watermark.image?)

### 打开仓库的 actions 权限配置

没开打之前提交代码到远程仓库后，自动触发 action 构建会报错，如图所示。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1edc0691903f43b580edd5cac2371ad0~tplv-k3u1fbpfcp-watermark.image?)

可以看出构建都成功了，但是在最后推送 tags 时报错了，是因为仓库默认的 Actions 没有推送权限，按照下图打开即可

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/146119e1398448fb85e703ca3715d900~tplv-k3u1fbpfcp-watermark.image?)

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/41cf250dd37641c1a3babd908a5facc3~tplv-k3u1fbpfcp-watermark.image?)

### 修改变量和关联npm账号

Github Actions 配置有几个变量需要注意一下：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/81010d036c184d6ca6dc16d7281b89c0~tplv-k3u1fbpfcp-watermark.image?)

- `GITHUB_TOKEN` 这个变量不用管，GitHub Actions 会自己生成注入
- `GITHUB_REPOSITORY` 这个变量直接去掉，换成你的仓库名即可
- `NPM_TOKEN` 这个需要去 `npm` 获取一个 Access Token ，然后配置搭到 Github 仓库。

`NPM_TOKEN` 设置过程如下：

先去 [npm](https://www.npmjs.com/) 登录账号，然后进入 `Access Tokens` 页面：

<img width="200" src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/36c6b446eaa64146b9402fa9735afd51~tplv-k3u1fbpfcp-watermark.image?" />

页面右侧有新增按钮，打开选择第二个即可

<img width="260" src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3233f6e3dfe44bbd8e48e5098fcdda33~tplv-k3u1fbpfcp-watermark.image?" />

在新增页面不用写名称，类型选择 `Automation` 。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/65d98b8cd649420bae9edaf59c63390a~tplv-k3u1fbpfcp-watermark.image?)

新增成功后复制一下，然后到 GitHub 仓库，进入设置页，进行设置（我就是设置成上面的一直没生效，后面尝试下面的才可以了😂）。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4e2048584c254e08a6f2e3dcf1c1d143~tplv-k3u1fbpfcp-watermark.image?)

### changesets 配置调整

`changeset` 默认是 master，现在 github仓 库默认是 main 分支，因此需要改一下 `.changeset/config.json` 

```
{
    // 添加 changeset 分支说明，否则运行 changeset 会报错
    "baseBranch": "main"
}
```

### 首次发布

配置内容都已经就绪，现在把改动的代码提交到远端，就可以触发 action 自动构建发布了。然后可以看到包都发到了 npm 上去了。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/80262f7ea0664a9bb86f63e4d9d80b51~tplv-k3u1fbpfcp-watermark.image?)

### 发布新版本

下面我们修改一下 `packages/cushily-core/src/Button.tsx` 组件代码，并提交。

```diff
- export interface ButtonProps {
+ export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

- export function Button(props: ButtonProps) {
-   return <button>{props.children}</button>;
+ export function Button({ children, ...rest }: ButtonProps) {
+   return <button {...rest}>{children}</button>;
}
```

这时候会触发 action 执行成功，但是不会发布新版本。

我们还需要分别执行以下操作：

- `pnpm changeset` 选择需要发布的包
- `pnpm version` 修改版本
- `pnpm install` 版本更新后需要重新安装依赖来更新修改 lock 文件，否则会导致 action 构建失败。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/148fbeaff39a431890c74bed063de02b~tplv-k3u1fbpfcp-watermark.image?)

这就是忘了重新 `pnpm install` 的后果，不过可以修改一下配置文件，把 `pnpm install` 改成 `pnpm install --no-frozen-lockfile`，这样本地可以少执行一个发包动作。

然后我们再把本地提交推送到远端后，这时候action就可以正常构建了，我们可以在 Github 仓库看到发布的版本：

<img width="360" src="https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/acfcffe7be6348f1a5055ab005d56e78~tplv-k3u1fbpfcp-watermark.image?" />

`npm` 上也更新了：

<img width="360" src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/469dbac77b894e9684c9e14e7b9ca005~tplv-k3u1fbpfcp-watermark.image?" />

## 总结

本篇文章从介绍 Turborepo 到使用官方提供的模板搭建了一个 React 组件库，然后再把它发到了 npm 上去，中间其实还遇到了不少问题，不过总算都解决了。

有个感想，带着写文章的想法去学习，真的很有动力，相当于立了一个超短期的 flag ，然后就要通过自己去学习研究才能实现这个 flag ，而且中间有意识的去记录每一个可能遇到的问题点。

最后再说一下我对这个组件模板的看法吧，整个体系来说我觉得挺好的，但是不太喜欢 `changeset` 的版本控制，更喜欢 lerna 的版本控制，可以自动判断哪些包需要发包，当然可能我对它了解太少了，后面再花时间去多学学。

> 最后欢迎👏大家关注➕点赞👍➕收藏✨支持一下，有问题欢迎评论区提出，感谢纠错！
