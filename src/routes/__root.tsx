import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
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
          '面向新手的 LLM 强化学习动手路径:在一张 RTX 5090 上从零手写 GRPO 并跑通训练,再上 TRL 框架,对照 slime 与 Miles 的工业级设计。含显存账本、优势演示与时间估算三个交互计算器。',
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
      <body className="min-h-screen bg-canvas-soft font-sans text-ink antialiased">
        {/* 顶栏:64px 白底 + 发丝线,导航链接是 ghost 胶囊,悬浮才显形 */}
        <header className="sticky top-0 z-20 border-b border-hairline bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <img src="/logo.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
              <span className="text-base font-semibold tracking-tight">RLforge</span>
              <span className="hidden font-mono text-xs text-gray-400 sm:inline">
                单卡 5090 的 RL 锻造场
              </span>
            </Link>
            <nav className="-mr-2 flex items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-canvas-soft-2 text-ink' }}
                className="shrink-0 rounded-full px-3 py-1.5 text-gray-500 transition hover:bg-canvas-soft-2 hover:text-ink"
              >
                路径
              </Link>
              <Link
                to="/labs"
                activeProps={{ className: 'bg-canvas-soft-2 text-ink' }}
                className="shrink-0 rounded-full px-3 py-1.5 text-gray-500 transition hover:bg-canvas-soft-2 hover:text-ink"
              >
                实验与闯关
              </Link>
              <a
                href="https://wutz.dev/"
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-full px-3 py-1.5 text-gray-500 transition hover:bg-canvas-soft-2 hover:text-ink"
              >
                wutz.dev ↗
              </a>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <Outlet />
        </main>

        <footer className="mt-16 border-t border-hairline bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="font-mono text-xs uppercase tracking-wide text-gray-400">RLforge</div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-500">
              面向新手的 LLM 强化学习动手路径。所有实验以单张 RTX 5090(32GB)为基准校准;
              框架部分实跑 TRL + vLLM,架构对照参考{' '}
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
            <p className="mt-2 font-mono text-xs text-gray-400">
              学习进度保存在本地浏览器,换设备不同步。
            </p>
          </div>
        </footer>

        <Scripts />
      </body>
    </html>
  )
}
