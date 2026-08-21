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
      { name: 'theme-color', content: '#fafafa' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' },
    ],
  }),
  component: RootLayout,
})

/* 导航是界面尺度：6px 圆角、14px 字，不跟内容卡片的 8/12px 混用 */
const navLink =
  'shrink-0 rounded-ui px-2.5 py-1.5 text-sm text-body transition-colors hover:bg-canvas-soft-2 hover:text-ink sm:px-3'

function RootLayout() {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-canvas-soft font-sans text-ink antialiased">
        <header className="sticky top-0 z-20 border-b border-hairline bg-canvas/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-2.5">
              <img
                src="/logo.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">
                RLforge
              </span>
              <span className="eyebrow hidden whitespace-nowrap sm:inline">
                单卡 5090 · RL 锻造场
              </span>
            </Link>

            <nav className="-mr-1 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-brand-50! font-medium text-brand-700!' }}
                className={navLink}
              >
                路径
              </Link>
              <Link
                to="/labs"
                activeProps={{ className: 'bg-brand-50! font-medium text-brand-700!' }}
                className={navLink}
              >
                实验与闯关
              </Link>
              <a
                href="https://wutz.dev/"
                target="_blank"
                rel="noreferrer"
                className="ml-1 hidden shrink-0 rounded-ui border border-hairline px-2.5 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-canvas-soft-2 sm:inline-block"
              >
                wutz.dev ↗
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Outlet />
        </main>

        <footer className="mt-20 border-t border-hairline bg-canvas sm:mt-28">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="eyebrow">关于本站</div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-body">
              RLforge · 面向新手的 LLM 强化学习动手路径。所有实验以单张 RTX 5090（32GB）为基准校准；
              框架部分实跑 TRL + vLLM，架构对照参考{' '}
              <a
                href="https://thudm.github.io/slime/"
                target="_blank"
                rel="noreferrer"
                className="text-ink underline decoration-hairline-strong underline-offset-3 transition-colors hover:decoration-current"
              >
                slime
              </a>{' '}
              与{' '}
              <a
                href="https://miles.radixark.com/docs"
                target="_blank"
                rel="noreferrer"
                className="text-ink underline decoration-hairline-strong underline-offset-3 transition-colors hover:decoration-current"
              >
                Miles
              </a>
              。
            </p>
            <p className="mt-2 text-sm text-mute">学习进度保存在本地浏览器，换设备不同步。</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-6 text-sm text-mute">
              <a href="https://wutz.dev/" target="_blank" rel="noreferrer" className="hover:text-ink">
                wutz.dev
              </a>
              <a
                href="https://storpath.wutz.dev/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                storpath
              </a>
              <a
                href="https://netpath.wutz.dev/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                netpath
              </a>
            </div>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  )
}
