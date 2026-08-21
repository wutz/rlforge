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
    ],
  }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
            <Link to="/" className="group flex shrink-0 items-center gap-2">
              <img
                src="/logo.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              <span className="text-base font-bold tracking-tight text-brand-700">RLforge</span>
              <span className="hidden text-xs text-gray-400 sm:inline">单卡 5090 的 RL 锻造场</span>
            </Link>
            <nav className="-mr-1 flex items-center gap-0.5 overflow-x-auto text-sm [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-brand-50 font-medium text-brand-700' }}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-gray-600 transition hover:bg-brand-50/70 hover:text-brand-700 sm:px-3"
              >
                路径
              </Link>
              <Link
                to="/labs"
                activeProps={{ className: 'bg-brand-50 font-medium text-brand-700' }}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-gray-600 transition hover:bg-brand-50/70 hover:text-brand-700 sm:px-3"
              >
                实验与闯关
              </Link>
              <a
                href="https://wutz.dev/"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-gray-600 transition hover:bg-brand-50/70 hover:text-brand-700 sm:px-3"
              >
                wutz.dev ↗
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
          <Outlet />
        </main>

        <footer className="mt-12 border-t border-gray-200 bg-white sm:mt-16">
          <div className="mx-auto max-w-6xl px-3 py-6 text-xs text-gray-400 sm:px-4">
            <p>
              RLforge · 面向新手的 LLM 强化学习动手路径。所有实验以单张 RTX 5090（32GB）为基准校准；
              框架部分实跑 TRL + vLLM，架构对照参考{' '}
              <a href="https://thudm.github.io/slime/" target="_blank" rel="noreferrer" className="hover:text-gray-600">
                slime
              </a>{' '}
              与{' '}
              <a href="https://miles.radixark.com/docs" target="_blank" rel="noreferrer" className="hover:text-gray-600">
                Miles
              </a>
              。
            </p>
            <p className="mt-1">学习进度保存在本地浏览器，换设备不同步。</p>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  )
}
