> ***本文正在参加[「金石计划」](https://juejin.cn/post/7207698564641996856/)***

## 前言

最近一个项目需要接入新的字体，该字体总共大小700k左右（每一种字重 100kb 左右），实际上一个页面一般只会用到 2 到 3 重字体，浏览器只会去下载页面用到字重的字体，但就算如此，一个字体也有 100kb 左右，字体加载太快的时候，可能对页面的性能和体验不会有什么变化，但如果刚好使用的字体很大或者用户的网络较差的情况下，那么也将根据页面字体载入的方式来以不同程度影响用户的体验。

本篇文章将通过以下步骤来探索自定义字体性能优化的过程。

- 了解 CSS 自定义字体（常用属性详解）
- 了解可变字体
- 自定义字体使用过程中会遇到的问题和优化方向
- Next.js 项目中自定义字体最佳实践

## 了解 CSS 自定义字体

自定义字体就是指使用 CSS 的 `@font-face` 来定义字体类型，如果我们要引入自定义字体，我们可以去 [Google Fonts](https://fonts.google.com/) 下载需要的字体，这里我下载了一个 `Alegreya` 字体，然后使用 `@font-face` 进行注册字体：

```css
@font-face {
  font-family: "Alegreya";
  src: local("Alegreya"),
    url("./fonts/Alegreya/static/Alegreya-Regular.ttf") format("truetype");
  font-weight: 400;
}

@font-face {
  font-family: "Alegreya";
  src: local("Alegreya"),
    url("./fonts/Alegreya/static/Alegreya-Medium.ttf") format("truetype");
  font-weight: 500;
}

@font-face {
  font-family: "Alegreya";
  src: local("Alegreya"),
    url("./fonts/Alegreya/static/Alegreya-SemiBold.ttf") format("truetype");
  font-weight: 600;
}

@font-face {
  font-family: "Alegreya";
  src: local("Alegreya"),
    url("./fonts/Alegreya/static/Alegreya-Bold.ttf") format("truetype");
  font-weight: 700;
}
```

`@font-face` 中一般常用的其实也就 5 个属性：

- `font-family` 字体家族名称
- `src` 字体文件来源
- `font-display` 字体载入页面方式
- `font-weight` 定义什么字重的时候使用该字体
- `font-style` 定义什么字重的时候使用该字体，和 `font-weight` 基本一致，但用到相对比较少一些，如果需要参考 `font-weight` 即可。

> 注意 `@font-face` 中的 `font-family` 、`font-weight` 、`font-style` 三个属性和 css 常规样式中这三个属性是不一样的，只是有一个对应关系。

还有一些其他辅助属性，这里只简单的说明：

- `line-gap-override` 定义字体的行间距度量，和 line-height 效果类似
- `ascent-override` 定义字体的上升度量，和 padding-top 效果类似。
- `descent-override` 定义字体的下降度量，和 padding-bottom 效果类似。
- `unicode-range` 定义字体中要使用的 Unicode 代码点范围。具体可以去看看[CSS unicode-range特定字符使用font-face自定义字体](https://www.zhangxinxu.com/wordpress/2016/11/css-unicode-range-character-font-face/)
- `size-adjust` 提供字体缩放功能。和 transform 中的 scale 类似，但可以更精细的只控制文字。

上面的属性都是只能在 `@font-face` 中使用，下面两个熟悉不是用在 `@font-face` 中，而是具体 css 样式中：

- `font-stretch` 和 size-adjust 相似，但兼容性更好，但只有特定字体才支持。
- `font-variation-settings` 通过指定要变化的特征的四个字母轴名称及其变化值，允许对 OpenType 或 TrueType 字体变化进行低级控制。具体可以去看看 [CSS font-feature-settings 50+关键字属性值完整介绍](https://www.zhangxinxu.com/wordpress/2018/12/css-font-feature-settings-keyword-value/) 。

下面来详细分析一下具体自定义字体中几个常用的属性的作用。

### font-family

`@font-face` 只是注册了字体，页面如果未进行使用，那么Chrome浏览器就不会去下载该字体文件，且如果使用到了该字体，未使用到的 weight 或者 style 也不会去下载对应样式的字体文件（Safari浏览器只要注册就会去下载），则使用 `font-family` 指定字体家族名称:

```css
.container {
    font-family: "Alegreya" Tahoma;
}
```

这里的 `font-family` 对应 @font-face 中的注册的 `font-family`，如果没有自定义的字体，则使用 `Tahoma` 备用字体，`Tahoma` 也不存在，则使用系统默认字体。

### src

`src` 定义了字体文件来源，`src` 中有几个需要注意的方法：

- `local` 指定本地系统字体
- `url` 指定文件地址，本地地址和网络地址均可，跟图片链接一样。
- `format` 主要是用来帮助浏览器识别字体类型
    - `truetype` —— `.ttf`
    - `opentype` —— `.ttf` 或者 `.otf`
    - `woff` —— `.woff`
    - `woff2` —— `.woff2`

使用示例：

```css
@font-face {
  src: local("Alegreya"),
    url("./fonts/Alegreya/static/Alegreya-Bold.ttf") format("truetype");
}
```

上面的示例的意思是指，优先查找本地系统中是否存在 `Alegreya` 字体，没有再去加载字体文件。

`format` 的作用并不是很大，现代浏览器不使用基本上也不会有问题，就算修改了字体文件的后缀名，且不使用 `format` 指定字体文件类型，也能正常加载并使用。 

`local` 的作用很大，可以用于优化性能和简化代码写法。

### font-display

`font-display` 用于设置字体载入页面的方式，这里的“载入”，指的是字体下载再合成到页面内容上去的过程。

“载入” 分为两个过程：下载、显示。

字体下载本身是一个高优先级的异步下载的过程，也就是下载过程本身并不阻塞浏览器的渲染（不算上网络请求竞争阻塞的情况）。

字体显示则是让浏览器读取到新的字体，然后使用新的字体去渲染页面内容。

这两个过程对应着页面呈现文字内容的三个时期：

- `font block period` 字体块期，如果自定义字体未下载完成，那使用该字体的元素则显示 `不可见` 的后备字体。在此期间，如果字体下载完成，则显示自定义字体。
- `font swap period` 字体交换期，如果自定义字体还没下载完成，则使用备用字体，如果在此期间自定义字体成功加载，则使用自定义字体。
- `font failure period` 字体失效期，如果自定义字体还没下载完成，则放弃使用自定义字体。

显示自定义字体的条件是必须等字体下载完成才行，因此如果没有备用方案，那么字体过大可能就很影响页面显示的时间。`font-display` 的几个属性值就是用于控制自定义字体的 “载入” 在 “三个时期” 中的处理方式：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7d9379dc163a48c6a0f9b206081f21a9~tplv-k3u1fbpfcp-watermark.image?)

具体分析：

- `block` 等自定义字体下载完成后再显示页面内容，3s 后字体还没下载完毕，则显示备用字体（系统字体），等字体下载完后再替换页面字体。
> 问题：字体会直接阻塞页面显示，延长页面显示时间，如果超过3s才显示页面内容，那么字体交换也会导致页面抖动。适合页面性能较好、网速较快的情况。
- `swap` 直接使用备用字体来显示页面内容，等自定义字体下载完后显示自定义字体。页面会出现抖动。
> 问题：字体切换交换时也很可能会导致页面抖动，网速越快抖动效果越不明显。适合需要快速显示页面内容，能容忍字体导致页面轻微抖动的情况。
- `fallback` 等 100ms 毫秒再显示页面内容（这段时间白屏），这时候这段时间内字体字体下载完成，则使用自定义字体，否则使用备用字体来显示页面内容，等自定义字体下载完后再显示自定义字体。
> 问题：除非 100ms 内下载完成了字体，否则页面会出现抖动。适合字体文件小，网速慢的时候可以接受字体导致页面轻微抖动的情况。
- `optional` 等 100ms 毫秒在显示页面内容（这段时间白屏），这时候这段时间内字体字体下载完成，则使用自定义字体，否则使用备用字体来显示页面内容，如果超过 100ms 后自定义字体才下载完，也不进行交互字体。
> 问题：页面性能会差一点，但 100ms 影响较小，且首次也会去下载字体，第二次访问的时候字体有缓存就可以读取缓存，会直接显示自定义字体。适合字体文件小，字体文件大的情况能容忍首次访问页面不显示自定义字体的情况。
- `auto` 默认值，由浏览器决定，一般默认的表现和 `block` 类似。

## 了解可变字体

> 可变字体（Variable fonts）是 OpenType 字体规范上的演进，它允许将同一字体的多个变体统合进单独的字体文件中。从而无需再将不同字宽、字重或不同样式的字体分割成不同的字体文件。你只需通过 CSS 与一行[`@font-face`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/@font-face)引用，即可获取包含在这个单一文件中的各种字体变体。

这是来自于 [MDN 可变字体](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Fonts/Variable_Fonts_Guide)。

也就是说我们可以不再需要根据不同字重等因素去单独引入多个字体文件。只需要直接使用一个字体文件即可，这一个字体文件一般情况下是远远小于多个字体文件子集的和，就以 `Alegreya` 字体来说，它的可变字体文件大小为 270kb ，但是它的一个单个字重的字体文件就有 163kb 。因此可大大减少字体文件的大小，且可以实现更多更全面的样式。去 [Google Fonts](https://fonts.google.com/) 下载的时候也会一并下载下来。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b2307e96e45245a2a436110911ef51ee~tplv-k3u1fbpfcp-watermark.image?)

接入就不需要写那么多 `@font-size` 了，这里有两个可变字体文件，一个是：


```css
// 正常可变字体
@font-face {
  font-family: "Alegreya";
  src: local("Alegreya"),
    url("./fonts/Alegreya/Alegreya-VariableFont_wght.ttf") format("truetype");
}

// 斜体，不需要斜体的不引入即可
@font-face {
  font-family: "Alegreya";
  src: local("Alegreya"),
    url("./fonts/Alegreya/Alegreya-Italic-VariableFont_wght.ttf") format("truetype");
  font-style: italic; // 制定斜体的时候使用该字体文件
}
```

可变字体可以通过 `font-stretch` 和 `font-variation-settings` 来进行控制，只要字体文件支持，就可以对字体样式进行最细粒度的样式调整，对于需要更多风格的字体样式来说，是一个相当不错的方式。不过 `font-variation-settings` 的兼容性很差。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4ac51cf9e7104fd9b36e3bc134220ec4~tplv-k3u1fbpfcp-watermark.image?)

但可变字体库的兼容性不受此属性的的影响，兼容性还是挺好。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2f3173a7ac01467ca72e0eeb721c582d~tplv-k3u1fbpfcp-watermark.image?)

关于可变字体的具体介绍，推荐一下 `web dev` 上的一篇文章：[Introduction to variable fonts on the web](https://web.dev/variable-fonts/)

## 自定义字体使用过程中会遇到的问题和优化方向

每一种字体少则几百 kb ，多则几 M，接入自定义字体多少都会对页面的性能和体验造成一定的影响。最好的方式当然是使用系统自带的字体，但有时候设计师或者产品经理就是要加入新的字体，因此面对这种情况很有必要去了解如何去自定义字体，以及如何减少自定义字体对页面性能和体验的影响。

字体文件影响页面性能和体验的最大原因就是因为它们的体积造成的，因此优化体积是一个关键点，减少字体的方式有两种方向：

- 去除不需要的字体文件的内容
- 在需要使用多个字重、斜体或者更多字体样式控制的情况下考虑使用可变字体

除了优化体积，其他最需要注重的还有两点：

1. 避免加载系统已有的字体，比如如果是做 webview 页面，那么一般 web 页面的字体需要保持和原生 app 内一直，如果原生 app 中注册了字体，那么 web 页面就不需要远程下载字体，这时候使用 `local` 将是一个很好的处理方式。因此，始终使用 `local` 作为本地字体探针也是一个很好的优化方式。
2. 选择合适的字体载入页面的方式，字体的 `font-display` 属性设置也会影响性能和体验，因此可以针对不同的需求，选择使用合适的属性。

## Next.js 项目中自定义字体最佳实践

Next.js 中本身提供了对 `font` 的优化方式：

- 去除不需要的字体文件的内容：指定字体文件的子集，一般字体会兼容全球的字符集，但是很多时候我们不需要显示某些字符集，一般只需要 latin 字符集（拉丁字符集）即可（内部移除不需要的字符集，减少字体体积）。
- 根据字重/是否需要斜体等情况来优化字体包大小
- 使用 `link preload` 进行提前下载字体
- 使用 `gzip` 压缩字体文件

下面将以接入 `Alegreya` 字体为例：

```css
@font-face {
  font-family: "Alegreya";
  src: local("Alegreya") format("truetype");
}
```

此处不进行远程加载字体文件，只读取本地字体，用于当系统字体中存在 `Alegreya` 时，不进行远程下载。

使用 `next/font` 接入 `Alegreya` 字体：

```tsx
import { Alegreya } from "next/font/google";

const alegreya = Alegreya({
  subsets: ["latin"], // 设置需要的字符集
  weight: ["400", "500", "600", "700"], // 设置需要的字重
  style: ["normal", "italic"], // 有 normal 和 italic 可选择
})

function App(props) {
  return (
    <>
      {/* 有本地字体库使用本地字体库，没有则使用 next/font/google 中的字体库 */}
      <style jsx global>{`
        body {
          font-family: "Alegreya", ${Alegreya.style.fontFamily};
        }
      `}</style>
      <Component {...props.pageProps} />
    </>
  );
}
```

`Alegreya.style.fontFamily` 并不是 “Alegreya” 字符串，而是 `__Alegreya_Fallback_xxxx` 这样一个字符串，这样就可以不影响系统可能存在的字体。

使用 `next/font` 后， Next.js 会自动根据传递的配置进行优化字体，默认也会压缩字体文件。我们看一下优化后的字体文件大小对比：

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/72492ce6e0da45298f763921cd753d09~tplv-k3u1fbpfcp-watermark.image?)

字体原文件大小：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f3e44f4784144bc09904155b18d604c4~tplv-k3u1fbpfcp-watermark.image?)

可以看出 gzip 压缩后字体会缩小将近一倍，Next.js 剔除不需要的字体内容后，文件小了好几倍，如果只需要一个字重的情况，字体文件还会小更多。

修改配置为：

```tsx
const alegreya = Alegreya({
  subsets: ["latin"], // 设置需要的字符集
  weight: ["400"], // 设置需要的字重
  style: ["normal", "italic"], // 有 normal 和 italic 可选择
})
```

文件大小数据：

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/23ee1780b0bb4b7d9ffaf4c0920c45b2~tplv-k3u1fbpfcp-watermark.image?)

多个字重和单个字重会采用不同的字体方案，大于等于2个字重才会使用可变字体，因此文件的数量会根据子重和是否需要斜体的情况有所变化。

## 最后

文字作为网站很重要的一部分，如果需要自定义字体的情况，需要关注使用它对性能带来的挑战。

其实字体优化的方式并不算太难，难的是对自定义字体相关概念的了解，否则就很难想到优化方向。

参考：

- [Web 性能优化：使用 CSS font-display 控制字体加载和替换](https://www.cnblogs.com/cangqinglang/p/14692891.html)
- [真正了解CSS3背景下的@font face规则](https://www.zhangxinxu.com/wordpress/2017/03/css3-font-face-src-local/)
- [MDN @font-face](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face)