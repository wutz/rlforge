import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'RLforge — 单卡 5090 上的强化学习锻造场' },
      {
        name: 'description',
        content:
          '面向新手的 LLM 强化学习动手路径：在一张 RTX 5090 上从零手写 GRPO 并跑通训练，再上 TRL 框架，对照 slime 与 Miles 的工业级设计。含显存账本、优势演示与时间估算三个交互计算器。',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' },
      /* 正文与代码两套字面：Geist 走叙述，Geist Mono 走技术标签。中文回落到系统字体 */
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap',
      },
    ],
  }),
  component: RootLayout,
})

const navLink =
  'shrink-0 rounded-full px-3 py-1.5 text-body transition hover:bg-soft-2 hover:text-ink'

function RootLayout() {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-soft font-sans text-ink antialiased">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
            <Link to="/" className="flex shrink-0 items-center gap-2.5">
              <img src="/logo.svg" alt="" width={26} height={26} className="h-6.5 w-6.5 shrink-0" />
              <span className="text-[15px] font-semibold tracking-[-0.02em]">RLforge</span>
              <span className="hidden border-l border-line pl-2.5 text-xs text-mute sm:inline">
                单卡 5090 的 RL 锻造场
              </span>
            </Link>
            <nav className="-mr-1 flex items-center gap-0.5 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-soft-2 text-ink' }}
                className={navLink}
              >
                路径
              </Link>
              <Link to="/labs" activeProps={{ className: 'bg-soft-2 text-ink' }} className={navLink}>
                实验与闯关
              </Link>
              <a href="https://wutz.dev/" target="_blank" rel="noreferrer" className={navLink}>
                wutz.dev ↗
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <Outlet />
        </main>

        <footer className="mt-16 border-t border-line bg-canvas sm:mt-24">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="eyebrow">RLforge</div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-body">
              单卡 5090 上的强化学习锻造场。所有实验以单张 RTX 5090（32GB）为基准校准；
              框架部分实跑 TRL + vLLM，架构对照参考{' '}
              <a
                href="https://thudm.github.io/slime/"
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 hover:underline"
              >
                slime
              </a>{' '}
              与{' '}
              <a
                href="https://miles.radixark.com/docs"
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 hover:underline"
              >
                Miles
              </a>
              。
            </p>
            <p className="mt-2 text-sm text-mute">学习进度保存在本地浏览器，换设备不同步。</p>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  )
}
