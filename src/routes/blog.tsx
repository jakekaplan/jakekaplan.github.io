import { createFileRoute, Outlet } from '@tanstack/react-router'

function BlogLayout() {
  return <Outlet />
}

export const Route = createFileRoute('/blog')({
  component: BlogLayout,
})
