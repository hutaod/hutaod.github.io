import type { DocsThemeConfig} from 'nextra-theme-docs';
import { useConfig } from 'nextra-theme-docs'
import { useRouter } from 'next/router'
import Image from 'next/image'

const logo = (
  <span>
    <Image style={{ display: "inline-block", marginRight: 4, borderRadius: 24 }} src="/favicon.png" width={24} height={24} alt="" />
    hutao
    <style jsx>{`
      span {
        padding: 0.5rem 0.5rem 0.5rem 0;
        mask-image: linear-gradient(
          60deg,
          black 25%,
          rgba(0, 0, 0, 0.2) 50%,
          black 75%
        );
        mask-size: 400%;
        mask-position: 0%;
      }
      span:hover {
        mask-position: 100%;
        transition: mask-position 1s ease, -webkit-mask-position 1s ease;
      }
    `}</style>
  </span>
)

const config: DocsThemeConfig = {
  project: {
    link: 'https://github.com/hutaod'
  },
  docsRepositoryBase: 'https://github.com/hutaod/hutaod.github.io',
  useNextSeoProps() {
    const { asPath } = useRouter()
    if (asPath !== '/') {
      return {
        titleTemplate: '%s – 前端博客和笔记'
      }
    }
  },
  logo,
  head: function useHead() {
    const { title } = useConfig()

    return (
      <>
        <meta name="msapplication-TileColor" content="#fff" />
        <meta name="theme-color" content="#fff" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Language" content="en" />
        <meta
          name="description"
          content="Make beautiful websites with Next.js & MDX."
        />
        <meta
          name="og:description"
          content="Make beautiful websites with Next.js & MDX."
        />
        <meta
          name="og:title"
          content={title ? title + ' – HUTAO' : 'HUTAO'}
        />
        <meta name="apple-mobile-web-app-title" content="HUTAO" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </>
    )
  },
  // banner: {
  //   key: '2.0-release',
  //   text: (
  //     <a href="https://nextra.site" target="_blank" rel="noreferrer">
  //       🎉 Nextra 2.0 is released. Read more →
  //     </a>
  //   )
  // },
  editLink: {
    text: 'Edit this page on GitHub →'
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback'
  },
  sidebar: {
    titleComponent({ title, type }) {
      if (type === 'separator') {
        return <span className="cursor-default">{title}</span>
      }
      return <>{title}</>
    },
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  footer: {
    text: `MIT 2023 © Hutao.`
  }
}

export default config