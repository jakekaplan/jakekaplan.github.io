import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Background } from '@/components/Background'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import '@/index.css'

export const Route = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <Background />
      <div className="app">
        <Header />
        <main className="main">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  ),
})
